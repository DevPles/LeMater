import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { LiquidCard } from "@/components/LiquidCard";
import { useScreenContent } from "@/hooks/useScreenContent";
import { CARTAO_DEFAULT } from "@/components/admin/TelasTab";
import { useGestanteProfile } from "@/hooks/useGestanteProfile";
import { supabase } from "@/integrations/supabase/client";
import { LancamentoModal } from "@/components/LancamentoModal";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, ComposedChart, ReferenceArea, Legend, ReferenceLine,
} from "recharts";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/** Paleta baseada no sexo do bebê — usado também no PDF. */
function paletaPorSexo(sexo: string | null | undefined) {
  if (sexo === "masculino") {
    return {
      primary: "#1d4ed8",
      primaryLight: "#dbeafe",
      accent: "#0ea5e9",
      label: "Menino",
    };
  }
  if (sexo === "feminino") {
    return {
      primary: "#be185d",
      primaryLight: "#fce7f3",
      accent: "#f472b6",
      label: "Menina",
    };
  }
  return {
    primary: "#6d28d9",
    primaryLight: "#ede9fe",
    accent: "#a78bfa",
    label: "A descobrir",
  };
}

export const Route = createFileRoute("/cartao")({
  head: () => ({
    meta: [
      { title: "Cartão Digital da Gestante — MãeDigital" },
      { name: "description", content: "Acompanhe o cartão digital da gestação e evolução do parto." },
    ],
  }),
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { u?: string } => {
    return typeof search.u === "string" && search.u ? { u: search.u } : {};
  },
  component: CartaoPage,
});

// ============= Helpers ===================
function parseBR(dateStr: string): Date | null {
  const m = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return isNaN(d.getTime()) ? null : d;
}

function formatBR(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function semanaGestacional(dataConsultaBR: string, dumBR: string): number {
  const consulta = parseBR(dataConsultaBR);
  const dum = parseBR(dumBR);
  if (!consulta || !dum) return 0;
  const diffMs = consulta.getTime() - dum.getTime();
  const semanas = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
  return Math.max(0, Math.min(42, semanas));
}

function calcularDPP(dumBR: string): string {
  const dum = parseBR(dumBR);
  if (!dum) return "—";
  // Regra de Naegele: DUM + 280 dias
  const dpp = new Date(dum);
  dpp.setDate(dpp.getDate() + 280);
  return formatBR(dpp);
}

function idade(dataNascISO: string | null | undefined): number | null {
  if (!dataNascISO) return null;
  const d = new Date(dataNascISO);
  if (isNaN(d.getTime())) return null;
  const hoje = new Date();
  let anos = hoje.getFullYear() - d.getFullYear();
  const m = hoje.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < d.getDate())) anos--;
  return anos;
}

function classificarIMC(imc: number): { label: string; color: string } {
  if (imc < 18.5) return { label: "Baixo peso", color: "#3b82f6" };
  if (imc < 25) return { label: "Peso adequado", color: "#22c55e" };
  if (imc < 30) return { label: "Sobrepeso", color: "#f59e0b" };
  return { label: "Obesidade", color: "#ef4444" };
}

const vitalColors = ["bg-coral-light", "bg-mint-light", "bg-warm", "bg-blush"];

// ============= Tipos de dados ===================
interface MedicaoReal {
  id: string;
  data: string; // BR
  parametro: string;
  valor: number;
  semana: number;
  observacao?: string;
}

interface VacinaReal {
  id: string;
  vacina: string;
  data: string; // BR
  lote?: string;
  fabricante?: string;
  observacao?: string;
}

interface ExameReal {
  id: string;
  tipo_exame: string;
  data: string; // BR
  status: string;
  resultado?: string;
}

interface ConsultaReal {
  id: string;
  data: string; // BR
  hora: string; // HH:MM
  titulo?: string;
  tipo?: string;
  status: string;
  observacao?: string;
}

type Tab = "resumo" | "lancamentos" | "vacinas" | "graficos";
type Palette = ReturnType<typeof paletaPorSexo>;
type Periodo = "todos" | "1tri" | "2tri" | "3tri" | "custom";

function CartaoPage() {
  const [tab, setTab] = useState<Tab>("resumo");
  const { content: cartaoContent } = useScreenContent("cartao", CARTAO_DEFAULT);
  const { profile: ownProfile, session } = useGestanteProfile();
  const { u: shareUserId } = Route.useSearch();

  // Quando vem com ?u=<id>, carrega snapshot público (read-only)
  const [publicSnap, setPublicSnap] = useState<{
    profile: any; medicoes: any[]; vacinas: any[]; exames: any[];
  } | null>(null);
  const isShared = !!shareUserId;

  useEffect(() => {
    if (!shareUserId) { setPublicSnap(null); return; }
    let active = true;
    (async () => {
      const { data, error } = await supabase.rpc("get_cartao_publico" as any, { _user_id: shareUserId });
      if (!active) return;
      if (!error && data) setPublicSnap(data as any);
    })();
    return () => { active = false; };
  }, [shareUserId]);

  const profile: any = isShared ? publicSnap?.profile : ownProfile;
  const bebeSexo = profile?.bebe_sexo ?? null;
  const palette = paletaPorSexo(bebeSexo);

  // ====== Dados clínicos REAIS do banco ======
  const [medicoes, setMedicoes] = useState<MedicaoReal[]>([]);
  const [vacinas, setVacinas] = useState<VacinaReal[]>([]);
  const [exames, setExames] = useState<ExameReal[]>([]);
  const [consultas, setConsultas] = useState<ConsultaReal[]>([]);
  const [lancamentoOpen, setLancamentoOpen] = useState(false);

  const carregarDados = useCallback(async () => {
    if (isShared) return; // dados vêm do snapshot público
    if (!session?.user?.id) return;
    const uid = session.user.id;
    const [mRes, vRes, eRes, cRes] = await Promise.all([
      supabase.from("clinical_measurements")
        .select("id,parametro,valor,semana_gestacional,data_medicao,observacao")
        .eq("gestante_id", uid)
        .order("data_medicao", { ascending: true }),
      supabase.from("vaccinations")
        .select("id,vacina,data_aplicacao,observacao,lote,fabricante")
        .eq("gestante_id", uid)
        .order("data_aplicacao", { ascending: false }),
      supabase.from("exam_results")
        .select("id,tipo_exame,data_exame,status,resultado")
        .eq("gestante_id", uid)
        .order("data_exame", { ascending: false }),
      supabase.from("appointment_slots")
        .select("id,data_hora,titulo,tipo_atendimento,status,observacao")
        .eq("gestante_id", uid)
        .in("status", ["reservado", "realizado"])
        .order("data_hora", { ascending: false }),
    ]);
    if (mRes.data) {
      setMedicoes(mRes.data.map((r: any) => ({
        id: r.id,
        data: formatBR(new Date(r.data_medicao + "T00:00:00")),
        parametro: r.parametro,
        valor: Number(r.valor),
        semana: r.semana_gestacional ?? 0,
        observacao: r.observacao ?? undefined,
      })));
    }
    if (vRes.data) {
      setVacinas(vRes.data.map((r: any) => ({
        id: r.id,
        vacina: r.vacina,
        data: formatBR(new Date(r.data_aplicacao + "T00:00:00")),
        lote: r.lote ?? undefined,
        fabricante: r.fabricante ?? undefined,
        observacao: r.observacao ?? undefined,
      })));
    }
    if (eRes.data) {
      setExames(eRes.data.map((r: any) => ({
        id: r.id,
        tipo_exame: r.tipo_exame,
        data: formatBR(new Date(r.data_exame + "T00:00:00")),
        status: r.status,
        resultado: r.resultado ?? undefined,
      })));
    }
    if (cRes.data) {
      setConsultas(cRes.data.map((r: any) => {
        const dt = new Date(r.data_hora);
        return {
          id: r.id,
          data: formatBR(dt),
          hora: `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`,
          titulo: r.titulo ?? undefined,
          tipo: r.tipo_atendimento ?? undefined,
          status: r.status,
          observacao: r.observacao ?? undefined,
        };
      }));
    }
  }, [session?.user?.id, isShared]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  // Quando temos snapshot público, popula medicoes/vacinas/exames a partir dele
  useEffect(() => {
    if (!isShared || !publicSnap) return;
    setMedicoes((publicSnap.medicoes ?? []).map((r: any) => ({
      id: r.id,
      data: formatBR(new Date(r.data_medicao + "T00:00:00")),
      parametro: r.parametro,
      valor: Number(r.valor),
      semana: r.semana_gestacional ?? 0,
      observacao: r.observacao ?? undefined,
    })));
    setVacinas((publicSnap.vacinas ?? []).map((r: any) => ({
      id: r.id,
      vacina: r.vacina,
      data: formatBR(new Date(r.data_aplicacao + "T00:00:00")),
      lote: r.lote ?? undefined,
      fabricante: r.fabricante ?? undefined,
      observacao: r.observacao ?? undefined,
    })));
    setExames((publicSnap.exames ?? []).map((r: any) => ({
      id: r.id,
      tipo_exame: r.tipo_exame,
      data: formatBR(new Date(r.data_exame + "T00:00:00")),
      status: r.status,
      resultado: r.resultado ?? undefined,
    })));
  }, [isShared, publicSnap]);

  // ====== Info da paciente derivada do banco ======
  const dumBR = profile?.dum
    ? formatBR(new Date(profile.dum + "T00:00:00"))
    : cartaoContent.dum;
  const dppBR = profile?.dum ? calcularDPP(dumBR) : cartaoContent.dpp;
  const hojeBR = formatBR(new Date());
  const semanasAtual = semanaGestacional(hojeBR, dumBR);
  const idadePaciente = idade(profile?.data_nascimento) ?? cartaoContent.patientAge;

  const patientInfo = {
    name: (profile?.nome as string | undefined) || cartaoContent.patientName,
    age: idadePaciente,
    bloodType: cartaoContent.bloodType,
    dum: dumBR,
    dpp: dppBR,
    weeks: String(semanasAtual),
  };

  // ====== Séries derivadas das medições reais ======
  const series = useMemo(() => {
    const peso = medicoes.filter(m => m.parametro.toLowerCase().startsWith("peso"))
      .map(m => ({ semana: m.semana, peso: m.valor, data: m.data }));
    const sis = medicoes.filter(m => m.parametro.toLowerCase().includes("sist"))
      .map(m => ({ semana: m.semana, valor: m.valor, data: m.data }));
    const dia = medicoes.filter(m => m.parametro.toLowerCase().includes("diast"))
      .map(m => ({ semana: m.semana, valor: m.valor, data: m.data }));
    const au = medicoes.filter(m => {
      const p = m.parametro.toLowerCase();
      return p.includes("altura uterina") || p === "au";
    }).map(m => ({ semana: m.semana, altura: m.valor, data: m.data }));
    const bcf = medicoes.filter(m => m.parametro.toLowerCase().includes("bcf") || m.parametro.toLowerCase().includes("batim"))
      .map(m => ({ semana: m.semana, bcf: m.valor, data: m.data }));
    const glicemia = medicoes.filter(m => m.parametro.toLowerCase().includes("glic"))
      .map(m => ({ semana: m.semana, glicemia: m.valor, data: m.data }));

    const semanasSet = new Set([...sis, ...dia].map(p => p.semana));
    const pressao = Array.from(semanasSet).sort((a, b) => a - b).map(s => ({
      semana: s,
      sistolica: sis.find(p => p.semana === s)?.valor,
      diastolica: dia.find(p => p.semana === s)?.valor,
    }));

    return { peso, pressao, au, bcf, glicemia };
  }, [medicoes]);

  // ====== IMC e ganho de peso ======
  const altura = medicoes.find(m => {
    const p = m.parametro.toLowerCase();
    return p === "altura_pessoa" || p === "estatura" || p.startsWith("estatura");
  })?.valor;
  const pesoInicial = series.peso[0]?.peso;
  const pesoAtual = series.peso[series.peso.length - 1]?.peso;
  const ganhoPeso = (pesoInicial && pesoAtual) ? pesoAtual - pesoInicial : null;
  const imc = (altura && pesoInicial) ? pesoInicial / (altura * altura) : null;
  const imcInfo = imc ? classificarIMC(imc) : null;

  const vitals = (cartaoContent.vitals ?? []).map((v, i) => ({
    ...v,
    color: vitalColors[i % vitalColors.length],
  }));

  // ====== URL pública do cartão (para QR) — sempre aponta para o id da gestante exibida ======
  const ownerUserId = isShared ? shareUserId : session?.user?.id;
  const cartaoUrl = typeof window !== "undefined"
    ? `${window.location.origin}/cartao?u=${ownerUserId ?? ""}`
    : "";

  const exportarPDF = async () => {
    await gerarPDFCartao({
      patientInfo: {
        ...patientInfo,
        email: profile?.email ?? null,
        telefone: profile?.telefone ?? null,
        cidade: profile?.cidade ?? null,
        bairro: profile?.bairro ?? null,
        unidadeSaude: profile?.unidade_saude ?? null,
        gestacoes: profile?.numero_gestacoes ?? null,
        partos: profile?.numero_partos ?? null,
        abortos: profile?.numero_abortos ?? null,
        fotoUrl: profile?.foto_url ?? null,
      },
      vitals,
      medicoes,
      vacinas,
      exames,
      consultas,
      series,
      ganhoPeso,
      imc,
      imcInfo,
      altura,
      palette,
      cartaoUrl,
    });
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "resumo", label: "Resumo" },
    { key: "lancamentos", label: "Lançamentos" },
    { key: "vacinas", label: "Vacinas/Exames" },
    { key: "graficos", label: "Gráficos" },
  ];

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">
        <div className="relative mb-1">
          <h1 className="text-2xl font-bold font-display text-foreground text-center">Cartão Digital da Gestante</h1>
          <button
            onClick={exportarPDF}
            className="absolute right-0 top-9 shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:opacity-90"
            style={{ backgroundColor: palette.primary, color: "#fff" }}
          >
            Exportar PDF
          </button>
        </div>
        <p className="text-sm text-muted-foreground text-center">Evolução da gestação</p>
      </motion.div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-2 py-2 rounded-full text-[10px] font-semibold leading-tight whitespace-nowrap transition-all ${
              tab === t.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Patient Card */}
      <motion.div className="mb-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <LiquidCard className="p-4">
          <div className="flex items-center gap-3 mb-3">
            {profile?.foto_url ? (
              <img src={profile.foto_url} alt={patientInfo.name} className="w-12 h-12 rounded-full object-cover border-2" style={{ borderColor: palette.primary }} />
            ) : (
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: palette.primary }}>
                {patientInfo.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
              </div>
            )}
            <div>
              <h2 className="font-semibold text-foreground text-sm">{patientInfo.name}</h2>
              <p className="text-xs text-muted-foreground">{patientInfo.age} anos {profile?.unidade_saude ? `• ${profile.unidade_saude}` : ""}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-muted rounded-xl px-2 py-2 text-center">
              <p className="text-[10px] text-muted-foreground">Semana</p>
              <p className="font-bold text-foreground">{patientInfo.weeks}ª</p>
            </div>
            <div className="bg-muted rounded-xl px-2 py-2 text-center">
              <p className="text-[10px] text-muted-foreground">DUM</p>
              <p className="font-bold text-foreground text-xs">{patientInfo.dum}</p>
            </div>
            <div className="bg-muted rounded-xl px-2 py-2 text-center">
              <p className="text-[10px] text-muted-foreground">DPP</p>
              <p className="font-bold text-foreground text-xs">{patientInfo.dpp}</p>
            </div>
          </div>
          {imcInfo && (
            <div className="mt-3 flex items-center justify-between rounded-xl px-3 py-2" style={{ backgroundColor: palette.primaryLight }}>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">IMC pré-gestacional</p>
                <p className="text-sm font-bold" style={{ color: palette.primary }}>{imc!.toFixed(1)} — {imcInfo.label}</p>
              </div>
              {ganhoPeso !== null && (
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Ganho</p>
                  <p className="text-sm font-bold" style={{ color: palette.primary }}>
                    {ganhoPeso > 0 ? "+" : ""}{ganhoPeso.toFixed(1)} kg
                  </p>
                </div>
              )}
            </div>
          )}
        </LiquidCard>
      </motion.div>

      {/* Botão de novo lançamento - visível em todas as abas exceto "resumo" */}
      {(tab === "lancamentos" || tab === "vacinas") && session?.user?.id && (
        <div className="mb-3 flex justify-end">
          <button
            onClick={() => setLancamentoOpen(true)}
            className="px-4 py-2 rounded-full text-xs font-bold transition-all hover:opacity-90 shadow-sm"
            style={{ backgroundColor: palette.primary, color: "#fff" }}
          >
            + Novo lançamento
          </button>
        </div>
      )}

      {tab === "resumo" && <ResumoTab medicoes={medicoes} vacinas={vacinas} exames={exames} vitals={vitals} />}
      {tab === "lancamentos" && <LancamentosTab medicoes={medicoes} />}
      {tab === "vacinas" && <VacinasExamesTab vacinas={vacinas} exames={exames} />}
      {tab === "graficos" && <GraficosTab palette={palette} dum={patientInfo.dum} series={series} />}

      {session?.user?.id && (
        <LancamentoModal
          open={lancamentoOpen}
          onClose={() => setLancamentoOpen(false)}
          gestanteId={session.user.id}
          semanaAtual={semanasAtual > 0 ? semanasAtual : null}
          initialTab={tab === "vacinas" ? "vacina" : "med"}
          onSaved={carregarDados}
        />
      )}
    </div>
  );
}

/* ========== RESUMO TAB ========== */
function ResumoTab({ medicoes, vacinas, exames, vitals }: {
  medicoes: MedicaoReal[];
  vacinas: VacinaReal[];
  exames: ExameReal[];
  vitals: { label: string; value: string; change: string; color: string }[];
}) {
  // Linha do tempo unificada
  type Item = { id: string; data: string; titulo: string; tipo: "consulta" | "vacina" | "exame"; semana?: number; nota?: string };
  const itens: Item[] = [
    ...medicoes.reduce<Item[]>((acc, m) => {
      // Agrupa por data
      const existing = acc.find(a => a.data === m.data && a.tipo === "consulta");
      if (!existing) acc.push({ id: m.id, data: m.data, titulo: "Registro clínico", tipo: "consulta", semana: m.semana, nota: `${m.parametro}: ${m.valor}` });
      else existing.nota = (existing.nota ?? "") + ` • ${m.parametro}: ${m.valor}`;
      return acc;
    }, []),
    ...vacinas.map<Item>(v => ({ id: v.id, data: v.data, titulo: `Vacina: ${v.vacina}`, tipo: "vacina", nota: v.observacao })),
    ...exames.map<Item>(e => ({ id: e.id, data: e.data, titulo: `Exame: ${e.tipo_exame}`, tipo: "exame", nota: e.resultado })),
  ].sort((a, b) => {
    const da = parseBR(a.data); const db = parseBR(b.data);
    return (db?.getTime() ?? 0) - (da?.getTime() ?? 0);
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h3 className="font-display font-semibold text-lg text-foreground mb-3">Sinais vitais</h3>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {vitals.map((v, i) => (
          <motion.div key={v.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}>
            <LiquidCard className="p-4">
              <div className={`w-8 h-2 rounded-full ${v.color} mb-3`} />
              <p className="text-xs text-muted-foreground">{v.label}</p>
              <p className="font-bold text-foreground">{v.value}</p>
              <p className="text-xs text-accent-foreground font-medium">{v.change}</p>
            </LiquidCard>
          </motion.div>
        ))}
      </div>

      <h3 className="font-display font-semibold text-lg text-foreground mb-2">Linha do tempo</h3>
      {itens.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Nenhum registro ainda. Os profissionais inserem suas medições, vacinas e exames durante o pré-natal.</p>
      ) : (
        <div className="space-y-3">
          {itens.map((t, i) => {
            const cor = t.tipo === "vacina" ? "bg-green-500" : t.tipo === "exame" ? "bg-blue-500" : "bg-primary";
            return (
              <motion.div key={t.id} className="bg-card rounded-xl p-3 shadow-sm border border-border" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${cor}`} />
                    {t.semana ? <span className="text-xs font-semibold text-primary">Semana {t.semana}</span> : null}
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{t.tipo}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{t.data}</span>
                </div>
                <h4 className="font-medium text-sm text-foreground">{t.titulo}</h4>
                {t.nota && <p className="text-xs text-muted-foreground mt-1">{t.nota}</p>}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

/* ========== LANÇAMENTOS TAB ========== */
function LancamentosTab({ medicoes }: { medicoes: MedicaoReal[] }) {
  // Agrupa por data
  const grupos = useMemo(() => {
    const map = new Map<string, MedicaoReal[]>();
    medicoes.forEach(m => {
      if (!map.has(m.data)) map.set(m.data, []);
      map.get(m.data)!.push(m);
    });
    return Array.from(map.entries()).sort((a, b) => {
      const da = parseBR(a[0]); const db = parseBR(b[0]);
      return (db?.getTime() ?? 0) - (da?.getTime() ?? 0);
    });
  }, [medicoes]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h3 className="font-display font-semibold text-lg text-foreground mb-4">Dados Clínicos</h3>
      {grupos.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Nenhuma medição registrada. As medições são lançadas pelos profissionais nas consultas de pré-natal.</p>
      ) : (
        <div className="space-y-3">
          {grupos.map(([data, items], i) => (
            <motion.div key={data} className="bg-card rounded-2xl p-4 shadow-sm border border-border" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-primary">Semana {items[0].semana}</span>
                <span className="text-xs text-muted-foreground">{data}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {items.map(m => (
                  <div key={m.id} className="bg-muted rounded-lg px-2 py-1.5">
                    <p className="text-[10px] text-muted-foreground">{m.parametro}</p>
                    <p className="text-sm font-semibold text-foreground">{m.valor}</p>
                    {m.observacao && (
                      <p className="text-[10px] text-muted-foreground mt-1 italic">{m.observacao}</p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ========== VACINAS / EXAMES ========== */
function VacinasExamesTab({ vacinas, exames }: { vacinas: VacinaReal[]; exames: ExameReal[] }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h3 className="font-display font-semibold text-lg text-foreground mb-3">Vacinas</h3>
      {vacinas.length === 0 ? (
        <p className="text-sm text-muted-foreground italic mb-6">Nenhuma vacina registrada.</p>
      ) : (
        <div className="space-y-2 mb-6">
          {vacinas.map(v => (
            <div key={v.id} className="bg-green-50 border border-green-200 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm text-green-900">{v.vacina}</p>
                <span className="text-xs text-green-700">{v.data}</span>
              </div>
              {(v.lote || v.fabricante) && (
                <p className="text-xs text-green-800 mt-1">
                  {[v.lote ? `Lote: ${v.lote}` : null, v.fabricante ? `Fabricante: ${v.fabricante}` : null].filter(Boolean).join(" • ")}
                </p>
              )}
              {v.observacao && <p className="text-xs text-green-700 mt-1">{v.observacao}</p>}
            </div>
          ))}
        </div>
      )}

      <h3 className="font-display font-semibold text-lg text-foreground mb-3">Exames</h3>
      {exames.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Nenhum exame registrado.</p>
      ) : (
        <div className="space-y-2">
          {exames.map(e => (
            <div key={e.id} className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm text-blue-900">{e.tipo_exame}</p>
                <span className="text-xs text-blue-700">{e.data}</span>
              </div>
              <p className="text-xs text-blue-700 mt-1">Status: {e.status}</p>
              {e.resultado && <p className="text-xs text-blue-800 mt-1">Resultado: {e.resultado}</p>}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ========== GRÁFICOS TAB ========== */
type Series = {
  peso: { semana: number; peso: number; data: string }[];
  pressao: { semana: number; sistolica?: number; diastolica?: number }[];
  au: { semana: number; altura: number; data: string }[];
  bcf: { semana: number; bcf: number; data: string }[];
  glicemia: { semana: number; glicemia: number; data: string }[];
};

function GraficosTab({ palette, dum, series }: { palette: Palette; dum: string; series: Series }) {
  const chartCard = "bg-card rounded-2xl p-4 shadow-sm border border-border";
  const chartTitle = "font-display font-semibold text-sm text-foreground mb-3";

  const [periodo, setPeriodo] = useState<Periodo>("todos");
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const dateToSemana = (d: Date | undefined): number | null => {
    if (!d) return null;
    const s = semanaGestacional(formatBR(d), dum);
    return s > 0 ? s : null;
  };

  const semanaRange = useMemo(() => {
    if (periodo === "1tri") return { min: 1, max: 13 };
    if (periodo === "2tri") return { min: 14, max: 27 };
    if (periodo === "3tri") return { min: 28, max: 42 };
    if (periodo === "custom") {
      const min = dateToSemana(range?.from) ?? 1;
      const max = dateToSemana(range?.to) ?? 42;
      return { min: Math.min(min, max), max: Math.max(min, max) };
    }
    return { min: 0, max: 42 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo, range]);

  const filtrar = <T extends { semana: number }>(arr: T[]) =>
    arr.filter(d => d.semana >= semanaRange.min && d.semana <= semanaRange.max);

  const pesoF = filtrar(series.peso);
  const pressaoF = filtrar(series.pressao);
  const auF = filtrar(series.au);
  const bcfF = filtrar(series.bcf);
  const glicemiaF = filtrar(series.glicemia);

  // Combinado: peso + PAM (pressão arterial média)
  const combinado = pressaoF.map(p => {
    const pam = (p.sistolica && p.diastolica) ? (p.sistolica + 2 * p.diastolica) / 3 : null;
    const peso = pesoF.find(x => x.semana === p.semana)?.peso ?? null;
    return { semana: p.semana, pam, peso };
  });

  // Cruzamento: Glicemia x Peso (alerta para resistência insulínica/DMG)
  const semanasGP = Array.from(new Set([...glicemiaF, ...pesoF].map(d => d.semana))).sort((a, b) => a - b);
  const glicemiaPeso = semanasGP.map(s => ({
    semana: s,
    glicemia: glicemiaF.find(g => g.semana === s)?.glicemia ?? null,
    peso: pesoF.find(p => p.semana === s)?.peso ?? null,
  })).filter(d => d.glicemia !== null || d.peso !== null);

  // Cruzamento: Altura uterina x Peso (proporcionalidade do crescimento)
  const semanasAP = Array.from(new Set([...auF, ...pesoF].map(d => d.semana))).sort((a, b) => a - b);
  const auPeso = semanasAP.map(s => ({
    semana: s,
    altura: auF.find(a => a.semana === s)?.altura ?? null,
    peso: pesoF.find(p => p.semana === s)?.peso ?? null,
  })).filter(d => d.altura !== null || d.peso !== null);

  const filtros: { key: Exclude<Periodo, "custom">; label: string }[] = [
    { key: "todos", label: "Evolução Total" },
    { key: "1tri", label: "1º Trim." },
    { key: "2tri", label: "2º Trim." },
    { key: "3tri", label: "3º Trim." },
  ];

  const calendarioAtivo = periodo === "custom";
  const labelCalendario = range?.from && range?.to
    ? `${format(range.from, "dd/MM", { locale: ptBR })} → ${format(range.to, "dd/MM", { locale: ptBR })}`
    : range?.from ? format(range.from, "dd/MM/yyyy", { locale: ptBR }) : null;

  const Vazio = ({ texto }: { texto: string }) => (
    <p className="text-xs text-muted-foreground italic text-center py-8">{texto}</p>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="bg-card rounded-2xl p-3 shadow-sm border border-border">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Filtrar período</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {filtros.map(f => {
            const ativo = periodo === f.key;
            return (
              <button
                key={f.key}
                onClick={() => { setPeriodo(f.key); setRange(undefined); }}
                className="px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all border"
                style={{
                  backgroundColor: ativo ? palette.primary : "transparent",
                  color: ativo ? "#fff" : palette.primary,
                  borderColor: palette.primary,
                }}
              >
                {f.label}
              </button>
            );
          })}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                onClick={() => setPeriodo("custom")}
                aria-label="Selecionar período no calendário"
                title="Calendário"
                className="rounded-full text-[11px] font-semibold transition-all border inline-flex items-center justify-center gap-1.5"
                style={{
                  backgroundColor: calendarioAtivo ? palette.primary : "transparent",
                  color: calendarioAtivo ? "#fff" : palette.primary,
                  borderColor: palette.primary,
                  width: labelCalendario ? "auto" : "30px",
                  height: "30px",
                  padding: labelCalendario ? "0 10px" : "0",
                }}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                {labelCalendario}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 pointer-events-auto" align="end" sideOffset={6}>
              <Calendar
                mode="range"
                selected={range}
                onSelect={(r) => { setRange(r); setPeriodo("custom"); if (r?.from && r?.to) setCalendarOpen(false); }}
                numberOfMonths={2}
                locale={ptBR}
                defaultMonth={range?.from ?? (parseBR(dum) ?? new Date())}
                className="p-3 pointer-events-auto"
              />
              <div className="flex items-center justify-between gap-2 p-2 border-t border-border">
                <button onClick={() => { setRange(undefined); setPeriodo("todos"); setCalendarOpen(false); }} className="text-[11px] font-semibold text-muted-foreground hover:text-foreground px-2 py-1">Limpar</button>
                <button onClick={() => setCalendarOpen(false)} className="text-[11px] font-semibold px-3 py-1 rounded-full text-white" style={{ backgroundColor: palette.primary }}>Aplicar</button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">Mostrando semana {semanaRange.min} → {semanaRange.max}</p>
      </div>

      {/* CURVA DE PESO */}
      <div className={chartCard}>
        <h4 className={chartTitle}>Curva de Ganho de Peso (kg)</h4>
        {pesoF.length === 0 ? <Vazio texto="Sem registros de peso no período." /> : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={pesoF} margin={{ top: 18, right: 12, left: 4, bottom: 18 }}>
              <defs>
                <linearGradient id="pesoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={palette.primary} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={palette.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="semana" tick={{ fontSize: 10 }} label={{ value: "Semana gestacional", position: "insideBottom", offset: -2, fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} domain={["dataMin - 2", "dataMax + 2"]} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
              <Area type="monotone" dataKey="peso" stroke={palette.primary} fill="url(#pesoGrad)" strokeWidth={2} dot={{ r: 4, fill: palette.primary }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* PRESSÃO ARTERIAL com faixa normal */}
      <div className={chartCard}>
        <h4 className={chartTitle}>Curva Pressórica (mmHg) — referência: 90-140 / 60-90</h4>
        {pressaoF.length === 0 ? <Vazio texto="Sem registros pressóricos no período." /> : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={pressaoF} margin={{ top: 18, right: 12, left: 4, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="semana" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} domain={[50, 160]} />
              <ReferenceArea y1={90} y2={140} fill="#22c55e" fillOpacity={0.05} />
              <ReferenceArea y1={60} y2={90} fill="#22c55e" fillOpacity={0.05} />
              <ReferenceLine y={140} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Sist. máx (140)", position: "insideTopRight", fontSize: 9, fill: "#ef4444" }} />
              <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Sist. mín / Diast. máx (90)", position: "insideTopRight", fontSize: 9, fill: "#ef4444" }} />
              <ReferenceLine y={60} stroke="#3b82f6" strokeDasharray="4 4" label={{ value: "Diast. mín (60)", position: "insideBottomRight", fontSize: 9, fill: "#3b82f6" }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="sistolica" name="Sistólica" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="diastolica" name="Diastólica" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* COMBINADO peso x PAM */}
      <div className={chartCard}>
        <h4 className={chartTitle}>Peso × Pressão Arterial Média</h4>
        <p className="text-[10px] text-muted-foreground mb-2">Cruzamento útil para monitorar pré-eclâmpsia: ganho rápido de peso + PAM crescente é sinal de alerta.</p>
        {combinado.filter(c => c.peso && c.pam).length === 0 ? <Vazio texto="Necessário ter peso e pressão registrados." /> : (
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={combinado} margin={{ top: 18, right: 12, left: 4, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="semana" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} label={{ value: "Peso (kg)", angle: -90, position: "insideLeft", fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} label={{ value: "PAM (mmHg)", angle: 90, position: "insideRight", fontSize: 10 }} />
              <ReferenceLine yAxisId="right" y={105} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "PAM crítica", position: "right", fontSize: 9, fill: "#ef4444" }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area yAxisId="left" type="monotone" dataKey="peso" name="Peso" fill={palette.primary} stroke={palette.primary} fillOpacity={0.2} />
              <Line yAxisId="right" type="monotone" dataKey="pam" name="PAM" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* CRUZAMENTO INTELIGENTE: Glicemia × Peso */}
      <div className={chartCard}>
        <h4 className={chartTitle}>Glicemia × Peso — risco de DMG</h4>
        <p className="text-[10px] text-muted-foreground mb-2">Eleva­ções simultâneas de glicemia capilar e peso podem indicar resistência insulínica ou diabetes gestacional. Faixa normal: glicemia &lt; 95 mg/dL em jejum.</p>
        {glicemiaPeso.filter(d => d.glicemia !== null).length === 0 ? <Vazio texto="Sem registros de glicemia no período." /> : (
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={glicemiaPeso} margin={{ top: 18, right: 12, left: 4, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="semana" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} domain={[60, 140]} label={{ value: "Glicemia (mg/dL)", angle: -90, position: "insideLeft", fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} label={{ value: "Peso (kg)", angle: 90, position: "insideRight", fontSize: 10 }} />
              <ReferenceArea yAxisId="left" y1={70} y2={95} fill="#22c55e" fillOpacity={0.07} />
              <ReferenceLine yAxisId="left" y={95} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "Limite jejum 95", position: "right", fontSize: 9, fill: "#f59e0b" }} />
              <ReferenceLine yAxisId="left" y={126} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "DMG 126", position: "right", fontSize: 9, fill: "#ef4444" }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line yAxisId="left" type="monotone" dataKey="glicemia" name="Glicemia" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} connectNulls />
              <Line yAxisId="right" type="monotone" dataKey="peso" name="Peso" stroke={palette.primary} strokeWidth={2} dot={{ r: 4 }} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* CRUZAMENTO INTELIGENTE: Altura uterina × Peso */}
      <div className={chartCard}>
        <h4 className={chartTitle}>Altura Uterina × Peso — proporcionalidade do crescimento</h4>
        <p className="text-[10px] text-muted-foreground mb-2">A altura uterina deve crescer junto com o ganho de peso materno. Discrepâncias podem indicar restrição ou macrossomia fetal.</p>
        {auPeso.filter(d => d.altura !== null && d.peso !== null).length === 0 ? <Vazio texto="Necessário ter AU e peso registrados." /> : (
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={auPeso} margin={{ top: 18, right: 12, left: 4, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="semana" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} label={{ value: "AU (cm)", angle: -90, position: "insideLeft", fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} label={{ value: "Peso (kg)", angle: 90, position: "insideRight", fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area yAxisId="left" type="monotone" dataKey="altura" name="Altura uterina" stroke={palette.accent} fill={palette.accent} fillOpacity={0.2} connectNulls />
              <Line yAxisId="right" type="monotone" dataKey="peso" name="Peso" stroke={palette.primary} strokeWidth={2} dot={{ r: 4 }} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ALTURA UTERINA */}
      <div className={chartCard}>
        <h4 className={chartTitle}>Altura Uterina (cm) — referência MS</h4>
        {auF.length === 0 ? <Vazio texto="Sem registros de altura uterina no período." /> : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={auF} margin={{ top: 18, right: 12, left: 4, bottom: 8 }}>
              <defs>
                <linearGradient id="auGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={palette.accent} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={palette.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="semana" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} domain={[0, 40]} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="altura" stroke={palette.accent} fill="url(#auGrad)" strokeWidth={2} dot={{ r: 4, fill: palette.accent }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* BCF */}
      <div className={chartCard}>
        <h4 className={chartTitle}>BCF (bpm) — normal: 110-160</h4>
        {bcfF.length === 0 ? <Vazio texto="Sem registros de BCF no período." /> : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={bcfF} margin={{ top: 18, right: 12, left: 4, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="semana" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} domain={[80, 180]} />
              <ReferenceArea y1={110} y2={160} fill="#22c55e" fillOpacity={0.07} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="bcf" name="BCF" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: "#10b981" }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}

/* ============================================================
   GERAÇÃO DE PDF — Cartão profissional
   ============================================================ */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

async function imageToDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

async function gerarPDFCartao(args: {
  patientInfo: {
    name: string; age: string | number; bloodType: string;
    dum: string; dpp: string; weeks: string | number;
    email?: string | null; telefone?: string | null;
    cidade?: string | null; bairro?: string | null;
    unidadeSaude?: string | null;
    gestacoes?: number | null; partos?: number | null; abortos?: number | null;
    fotoUrl?: string | null;
  };
  vitals: { label: string; value: string; change: string }[];
  medicoes: MedicaoReal[];
  vacinas: VacinaReal[];
  exames: ExameReal[];
  consultas: ConsultaReal[];
  series: Series;
  ganhoPeso: number | null;
  imc: number | null;
  imcInfo: { label: string; color: string } | null;
  altura: number | undefined;
  palette: Palette;
  cartaoUrl: string;
}) {
  const { patientInfo, vitals, medicoes, vacinas, exames, consultas, series, ganhoPeso, imc, imcInfo, altura, palette, cartaoUrl } = args;
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true, orientation: "landscape" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;

  const [pr, pg, pb] = hexToRgb(palette.primary);
  const [ar, ag, ab] = hexToRgb(palette.accent);
  const [lr, lg, lb] = hexToRgb(palette.primaryLight);
  const muted: [number, number, number] = [110, 110, 120];
  const dark: [number, number, number] = [32, 32, 40];

  doc.setFont("helvetica", "normal");

  // ======== Footer ========
  const drawFooter = (pageNum: number, totalPages: number) => {
    doc.setFillColor(pr, pg, pb);
    doc.rect(0, pageH - 9, pageW, 9, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("MaeDigital - Cartao Digital da Gestante", margin, pageH - 3.5);
    doc.setFont("helvetica", "normal");
    doc.text(`Pag. ${pageNum} de ${totalPages}`, pageW - margin, pageH - 3.5, { align: "right" });
  };

  // ======== Carregar foto + QR Code em paralelo ========
  const [fotoData, qrData] = await Promise.all([
    patientInfo.fotoUrl ? imageToDataUrl(patientInfo.fotoUrl) : Promise.resolve(null),
    QRCode.toDataURL(cartaoUrl || "https://maedigital.app", { width: 240, margin: 1, color: { dark: palette.primary, light: "#ffffff" } }),
  ]);

  // ============================================================
  // FOLDER - 4 paginas paisagem (Capa + 3 folhas internas)
  // Cada pagina dobrada ao meio: metade esquerda + metade direita
  // ============================================================
  const halfW = pageW / 2;

  // Helper genérico de fundo + linha de dobra ============
  const drawBaseFolderPage = () => {
    doc.setFillColor(252, 252, 254);
    doc.rect(0, 0, pageW, pageH, "F");
    doc.setDrawColor(180, 180, 190);
    doc.setLineDashPattern([2, 2], 0);
    doc.setLineWidth(0.4);
    doc.line(halfW, 6, halfW, pageH - 6);
    doc.setLineDashPattern([], 0);
    doc.setTextColor(160, 160, 170);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.text("DOBRE AQUI", halfW, pageH / 2, { align: "center", angle: 90 });
  };

  // =============================================================
  // PAGINA 1 - CAPA DO FOLDER (dividida em 2 faces)
  // Esquerda  = CONTRACAPA (institucional sobrio)
  // Direita   = CAPA FRONTAL (titulo + nome + data)
  // =============================================================
  drawBaseFolderPage();

  // ===== METADE DIREITA: CAPA FRONTAL =====
  // Fundo navy somente na capa frontal
  doc.setFillColor(pr, pg, pb);
  doc.rect(halfW, 0, halfW, pageH, "F");
  // Faixa gold superior (marca)
  doc.setFillColor(ar, ag, ab);
  doc.rect(halfW, 0, halfW, 6, "F");
  // Faixa gold inferior
  doc.rect(halfW, pageH - 6, halfW, 6, "F");

  // Selo institucional pequeno no topo
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(ar, ag, ab);
  doc.text("UNAERP", halfW + halfW / 2, 16, { align: "center" });

  // Bloco branco central elegante com titulo
  const coverBandY = pageH / 2 - 32;
  const coverBandH = 64;
  doc.setFillColor(255, 255, 255);
  doc.rect(halfW + 10, coverBandY, halfW - 20, coverBandH, "F");
  doc.setFillColor(ar, ag, ab);
  doc.rect(halfW + 10, coverBandY, halfW - 20, 1.5, "F");
  doc.rect(halfW + 10, coverBandY + coverBandH - 1.5, halfW - 20, 1.5, "F");

  // Titulo principal
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...muted);
  doc.text("CARTAO DIGITAL DA", halfW + halfW / 2, coverBandY + 16, { align: "center" });
  doc.setFontSize(30);
  doc.setTextColor(pr, pg, pb);
  doc.text("GESTANTE", halfW + halfW / 2, coverBandY + 34, { align: "center" });
  // Linha gold curta
  const cLineLen = 28;
  doc.setFillColor(ar, ag, ab);
  doc.rect(halfW + halfW / 2 - cLineLen / 2, coverBandY + 40, cLineLen, 1, "F");
  // Subtitulo
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text("Acompanhamento Pre-Natal", halfW + halfW / 2, coverBandY + 50, { align: "center" });
  doc.text("Sistema MaeDigital", halfW + halfW / 2, coverBandY + 56, { align: "center" });

  // Nome da gestante (em destaque na parte inferior da capa)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(patientInfo.name.toUpperCase(), halfW + halfW / 2, pageH - 22, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(ar, ag, ab);
  doc.text(`EMITIDO EM ${formatBR(new Date()).toUpperCase()}`, halfW + halfW / 2, pageH - 14, { align: "center" });

  // ===== METADE ESQUERDA: CONTRACAPA (sobria, sem QR/links) =====
  // Fundo branco neutro, info institucional no rodape
  doc.setTextColor(...muted);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("UNAERP", 14, pageH - 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Universidade de Ribeirao Preto", 14, pageH - 13);

  // Pequena marca decorativa centralizada
  doc.setFillColor(pr, pg, pb);
  doc.rect(14, 14, 28, 1.5, "F");
  doc.setFillColor(ar, ag, ab);
  doc.rect(14, 16, 14, 1.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(pr, pg, pb);
  doc.text("DOCUMENTO DE ACOMPANHAMENTO PRE-NATAL", 14, 24);

  // Bloco central da contracapa: ficha de identificacao discreta
  const idY = pageH / 2 - 32;
  const idW = halfW - 28;
  doc.setDrawColor(220, 220, 230);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, idY, idW, 64, 2, 2, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(pr, pg, pb);
  doc.text("IDENTIFICACAO DA GESTANTE", 18, idY + 7);
  doc.setDrawColor(pr, pg, pb);
  doc.setLineWidth(0.3);
  doc.line(18, idY + 9, 14 + idW - 4, idY + 9);

  // Foto da gestante (canto direito da ficha)
  const photoSize = 28;
  const photoX = 14 + idW - photoSize - 5;
  const photoY = idY + 13;
  if (fotoData) {
    doc.setFillColor(245, 245, 250);
    doc.roundedRect(photoX - 1, photoY - 1, photoSize + 2, photoSize + 2, 2, 2, "F");
    try {
      doc.addImage(fotoData, "JPEG", photoX, photoY, photoSize, photoSize);
    } catch {
      doc.addImage(fotoData, "PNG", photoX, photoY, photoSize, photoSize);
    }
    doc.setDrawColor(pr, pg, pb);
    doc.setLineWidth(0.4);
    doc.roundedRect(photoX, photoY, photoSize, photoSize, 2, 2, "S");
  } else {
    // Placeholder caso nao haja foto
    doc.setFillColor(245, 245, 250);
    doc.setDrawColor(220, 220, 230);
    doc.setLineWidth(0.3);
    doc.roundedRect(photoX, photoY, photoSize, photoSize, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...muted);
    doc.text("sem foto", photoX + photoSize / 2, photoY + photoSize / 2 + 1, { align: "center" });
  }

  const idFields = [
    { l: "Nome", v: patientInfo.name },
    { l: "Idade", v: `${patientInfo.age} anos` },
    { l: "Tipo sanguineo", v: patientInfo.bloodType || "-" },
    { l: "Cidade / Bairro", v: `${patientInfo.cidade ?? "-"} / ${patientInfo.bairro ?? "-"}` },
    { l: "Unidade de saude", v: patientInfo.unidadeSaude ?? "-" },
  ];
  const fieldsW = idW - photoSize - 14; // largura util dos campos (deixa espaco p/ foto)
  let idFy = idY + 16;
  idFields.forEach((f) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...muted);
    doc.text(f.l.toUpperCase(), 18, idFy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...dark);
    const v = doc.splitTextToSize(f.v, fieldsW)[0];
    doc.text(v, 18, idFy + 4);
    idFy += 9.5;
  });

  // ===== QR CODE + LINK do cartao digital online =====
  const qrSize = 32;
  const qrY = idY + 64 + 8;
  const qrBoxW = idW;
  const qrBoxH = qrSize + 10;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(220, 220, 230);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, qrY, qrBoxW, qrBoxH, 2, 2, "FD");
  // QR a esquerda
  doc.addImage(qrData, "PNG", 14 + 5, qrY + 5, qrSize, qrSize);
  // Texto a direita
  const tX = 14 + 5 + qrSize + 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(pr, pg, pb);
  doc.text("ACESSE O CARTAO DIGITAL", tX, qrY + 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(...muted);
  const desc = doc.splitTextToSize(
    "Aponte a camera do celular para o QR Code ou abra o link abaixo para visualizar o cartao online sempre atualizado.",
    qrBoxW - qrSize - 18,
  );
  desc.forEach((ln: string, i: number) => doc.text(ln, tX, qrY + 14 + i * 3.2));
  // Link
  const linkY = qrY + qrBoxH - 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(pr, pg, pb);
  const linkUrl = cartaoUrl || "https://maedigital.app";
  const linkLines = doc.splitTextToSize(linkUrl, qrBoxW - qrSize - 18);
  doc.text(linkLines[0], tX, linkY);
  doc.link(tX, linkY - 3, doc.getTextWidth(linkLines[0]), 4, { url: linkUrl });


  // =============================================================
  // PAGINA 2 - FOLHA 1 (Dados gestacionais + Sinais vitais + Vacinas + Exames)
  // =============================================================
  doc.addPage("a4", "landscape");
  drawBaseFolderPage();

  // METADE ESQUERDA: Dados gestacionais + IMC + Antecedentes
  const lX = 14;
  const lW = halfW - 28;
  doc.setTextColor(pr, pg, pb);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("DADOS GESTACIONAIS", lX, 18);
  doc.setDrawColor(pr, pg, pb);
  doc.setLineWidth(0.5);
  doc.line(lX, 21, lX + lW, 21);

  // KPIs gestacionais em GRADE 3 colunas (compactos)
  const kpis3 = [
    { label: "SEMANA", value: `${patientInfo.weeks}a`, sub: "atual" },
    { label: "DUM", value: patientInfo.dum, sub: "ult. menstr." },
    { label: "DPP", value: patientInfo.dpp, sub: "data parto" },
  ];
  const kpiW = (lW - 6) / 3;
  const kpiH = 17;
  kpis3.forEach((k, i) => {
    const x = lX + i * (kpiW + 3);
    doc.setFillColor(lr, lg, lb);
    doc.roundedRect(x, 25, kpiW, kpiH, 2, 2, "F");
    doc.setTextColor(...muted);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text(k.label, x + 3, 29.5);
    doc.setTextColor(pr, pg, pb);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.text(k.value, x + 3, 36.5);
    doc.setTextColor(...muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.text(k.sub, x + 3, 40.5);
  });

  // IMC + Antecedentes em UMA UNICA LINHA lado a lado (otimiza espaco)
  let iy = 45;
  const imcW = lW * 0.55;
  const antW = lW - imcW - 3;

  // IMC
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(225, 225, 230);
  doc.roundedRect(lX, iy, imcW, 20, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(...muted);
  doc.text("IMC E GANHO DE PESO", lX + 3, iy + 4.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...dark);
  if (imc && imcInfo) {
    doc.text(`IMC ${imc.toFixed(1)}`, lX + 3, iy + 12);
    const [cr, cg, cb] = hexToRgb(imcInfo.color);
    doc.setTextColor(cr, cg, cb);
    doc.setFontSize(7.5);
    doc.text(imcInfo.label, lX + 3, iy + 17);
  } else {
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.text("Informe altura para calculo", lX + 3, iy + 12);
  }
  if (ganhoPeso !== null) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(pr, pg, pb);
    doc.text(`${ganhoPeso > 0 ? "+" : ""}${ganhoPeso.toFixed(1)} kg`, lX + imcW - 3, iy + 12, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...muted);
    doc.text("ganho atual", lX + imcW - 3, iy + 17, { align: "right" });
  }

  // Antecedentes ao lado do IMC
  const antX = lX + imcW + 3;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(225, 225, 230);
  doc.roundedRect(antX, iy, antW, 20, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...muted);
  doc.text("ANTECEDENTES", antX + 3, iy + 4.5);
  const obs = [
    { l: "Gest", v: String(patientInfo.gestacoes ?? 0) },
    { l: "Part", v: String(patientInfo.partos ?? 0) },
    { l: "Abor", v: String(patientInfo.abortos ?? 0) },
  ];
  const obsColW = antW / 3;
  obs.forEach((o, i) => {
    const ox = antX + i * obsColW;
    doc.setTextColor(pr, pg, pb);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(o.v, ox + obsColW / 2, iy + 13.5, { align: "center" });
    doc.setTextColor(...muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.2);
    doc.text(o.l, ox + obsColW / 2, iy + 17.5, { align: "center" });
  });
  iy += 24;

  // SINAIS VITAIS na esquerda (grade compacta)
  doc.setTextColor(pr, pg, pb);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("SINAIS VITAIS ATUAIS", lX, iy + 3);
  doc.setDrawColor(pr, pg, pb);
  doc.setLineWidth(0.4);
  doc.line(lX, iy + 5, lX + lW, iy + 5);
  iy += 8;
  if (vitals.length) {
    const vCols = vitals.length;
    const vW = (lW - (vCols - 1) * 3) / vCols;
    const vH = 18;
    vitals.forEach((v, i) => {
      const x = lX + i * (vW + 3);
      doc.setFillColor(248, 248, 252);
      doc.roundedRect(x, iy, vW, vH, 2, 2, "F");
      doc.setFillColor(pr, pg, pb);
      doc.roundedRect(x, iy, vW, 2, 1, 1, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(...muted);
      doc.text(v.label, x + 2.5, iy + 6);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...dark);
      doc.text(v.value, x + 2.5, iy + 11.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(pr, pg, pb);
      doc.text(v.change, x + 2.5, iy + 16);
    });
    iy += vH + 4;
  }

  // (bloco "PROXIMOS PASSOS E ORIENTACOES" removido a pedido do usuario)

  // VACINAS e EXAMES agora ficam na MESMA face (metade esquerda),
  // logo abaixo de SINAIS VITAIS, aproveitando o espaco livre.
  const rX = lX;
  const rW = lW;
  let ry = iy + 2;

  doc.setTextColor(pr, pg, pb);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("VACINAS APLICADAS", rX, ry);
  doc.setDrawColor(pr, pg, pb);
  doc.setLineWidth(0.5);
  doc.line(rX, ry + 3, rX + rW, ry + 3);
  ry += 7;

  // Helper: tabela simples reutilizavel
  const drawSimpleTable = (
    x: number, y: number, w: number,
    headers: { label: string; widthPct: number; align?: "left" | "center" | "right" }[],
    rows: string[][],
    accentColor: [number, number, number],
    maxY: number,
  ): number => {
    const headerH = 6;
    const lineH = 3.6;
    const padV = 1.6;
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(x, y, w, headerH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    let cx = x;
    headers.forEach((h) => {
      const cw = (w * h.widthPct) / 100;
      const align = h.align ?? "left";
      const tx = align === "right" ? cx + cw - 2 : align === "center" ? cx + cw / 2 : cx + 2;
      doc.text(h.label, tx, y + 4, { align });
      cx += cw;
    });
    let cy = y + headerH;
    let drawnRows = 0;
    for (let ri = 0; ri < rows.length; ri++) {
      const row = rows[ri];
      // Pre-calcula a altura desta linha (maior numero de linhas entre as celulas)
      doc.setFontSize(7);
      let maxLines = 1;
      const cellLines: string[][] = headers.map((h, ci) => {
        const cw = (w * h.widthPct) / 100;
        const lines = doc.splitTextToSize(row[ci] ?? "-", cw - 3) as string[];
        if (lines.length > maxLines) maxLines = lines.length;
        return lines;
      });
      const rowH = maxLines * lineH + padV * 2;
      if (cy + rowH > maxY) break;
      if (ri % 2 === 0) {
        doc.setFillColor(248, 248, 252);
        doc.rect(x, cy, w, rowH, "F");
      }
      let cxr = x;
      headers.forEach((h, ci) => {
        const cw = (w * h.widthPct) / 100;
        const align = h.align ?? "left";
        const tx = align === "right" ? cxr + cw - 2 : align === "center" ? cxr + cw / 2 : cxr + 2;
        doc.setFont("helvetica", ci === 0 ? "bold" : "normal");
        doc.setFontSize(7);
        doc.setTextColor(...dark);
        cellLines[ci].forEach((ln, li) => {
          doc.text(ln, tx, cy + padV + 2.5 + li * lineH, { align });
        });
        cxr += cw;
      });
      cy += rowH;
      drawnRows++;
    }
    if (rows.length > drawnRows) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(6);
      doc.setTextColor(...muted);
      doc.text(`+ ${rows.length - drawnRows} datas anteriores`, x + w / 2, cy + 3, { align: "center" });
      cy += 4;
    }
    doc.setDrawColor(225, 225, 230);
    doc.setLineWidth(0.2);
    doc.rect(x, y, w, cy - y, "S");
    return cy;
  };

  // Helper: agrupa itens por data (mais recente primeiro) -> "data | tipos concatenados"
  const agruparPorData = <T,>(itens: T[], getData: (i: T) => string, getTipo: (i: T) => string): string[][] => {
    const map = new Map<string, string[]>();
    itens.forEach((it) => {
      const d = getData(it);
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(getTipo(it));
    });
    return Array.from(map.entries())
      .sort((a, b) => {
        const da = parseBR(a[0]); const db = parseBR(b[0]);
        return (db?.getTime() ?? 0) - (da?.getTime() ?? 0);
      })
      .map(([data, tipos]) => [data, tipos.join(", ")]);
  };

  if (vacinas.length) {
    const vacRows = vacinas
      .slice()
      .sort((a, b) => (parseBR(b.data)?.getTime() ?? 0) - (parseBR(a.data)?.getTime() ?? 0))
      .map((v) => [v.data, v.vacina, v.lote || "-", v.fabricante || "-"]);
    const halfMaxY = ry + Math.max(40, (pageH - 14 - ry) * 0.45);
    ry = drawSimpleTable(rX, ry, rW,
      [
        { label: "DATA", widthPct: 18 },
        { label: "VACINA", widthPct: 36 },
        { label: "LOTE", widthPct: 18 },
        { label: "FABRICANTE", widthPct: 28 },
      ],
      vacRows, [pr, pg, pb], halfMaxY) + 4;
  } else {
    doc.setFillColor(248, 248, 252);
    doc.rect(rX, ry, rW, 10, "F");
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.setFont("helvetica", "italic");
    doc.text("Nenhuma vacina registrada.", rX + 3, ry + 6.5);
    ry += 14;
  }

  // EXAMES como tabela
  doc.setTextColor(pr, pg, pb);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("EXAMES REALIZADOS", rX, ry + 4);
  doc.setDrawColor(pr, pg, pb);
  doc.setLineWidth(0.5);
  doc.line(rX, ry + 7, rX + rW, ry + 7);
  ry += 11;

  if (exames.length) {
    const exRows = agruparPorData(exames, (e) => e.data, (e) => e.tipo_exame);
    drawSimpleTable(rX, ry, rW,
      [
        { label: "DATA", widthPct: 22 },
        { label: "EXAMES REALIZADOS", widthPct: 78 },
      ],
      exRows, [pr, pg, pb], pageH - 14);
  } else {
    doc.setFillColor(248, 248, 252);
    doc.rect(rX, ry, rW, 10, "F");
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.setFont("helvetica", "italic");
    doc.text("Nenhum exame registrado.", rX + 3, ry + 6.5);
  }

  // =============================================================
  // METADE DIREITA DA PAGINA 2: Consultas (quantidade, datas e observacoes)
  // =============================================================
  const rgX = halfW + 14;
  const rgW = halfW - 28;
  let rgY = 18;

  const totalConsultas = consultas.length;
  const realizadas = consultas.filter(c => c.status === "realizado").length;
  const agendadas = consultas.filter(c => c.status === "reservado").length;

  // Titulo
  doc.setTextColor(pr, pg, pb);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("CONSULTAS DE PRE-NATAL", rgX, rgY);
  doc.setDrawColor(pr, pg, pb);
  doc.setLineWidth(0.5);
  doc.line(rgX, rgY + 3, rgX + rgW, rgY + 3);
  rgY += 7;

  // Bloco de resumo (3 stats)
  const statW = (rgW - 4) / 3;
  const statH = 13;
  const stats = [
    { label: "TOTAL", value: String(totalConsultas) },
    { label: "REALIZADAS", value: String(realizadas) },
    { label: "AGENDADAS", value: String(agendadas) },
  ];
  stats.forEach((s, i) => {
    const x = rgX + i * (statW + 2);
    doc.setFillColor(lr, lg, lb);
    doc.roundedRect(x, rgY, statW, statH, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(pr, pg, pb);
    doc.text(s.value, x + statW / 2, rgY + 7, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...muted);
    doc.text(s.label, x + statW / 2, rgY + 11, { align: "center" });
  });
  rgY += statH + 4;

  // Subtitulo lista
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(pr, pg, pb);
  doc.text("HISTORICO E OBSERVACOES CLINICAS", rgX, rgY);
  doc.setDrawColor(220, 220, 230);
  doc.setLineWidth(0.2);
  doc.line(rgX, rgY + 1.5, rgX + rgW, rgY + 1.5);
  rgY += 4;

  // Lista de consultas (ordenadas mais recentes primeiro)
  const consultasOrd = [...consultas].sort((a, b) => {
    const da = parseBR(a.data); const db = parseBR(b.data);
    return (db?.getTime() ?? 0) - (da?.getTime() ?? 0);
  });

  const limiteY = pageH - 26; // espaco para rodape de contatos
  if (consultasOrd.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.text("Nenhuma consulta registrada.", rgX + 2, rgY + 5);
  } else {
    consultasOrd.forEach((c) => {
      if (rgY > limiteY - 6) return;
      // Linha header da consulta
      doc.setFillColor(248, 248, 252);
      doc.roundedRect(rgX, rgY, rgW, 5.5, 1, 1, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(pr, pg, pb);
      doc.text(`${c.data}  ${c.hora}`, rgX + 2, rgY + 3.7);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...dark);
      const tituloC = c.titulo || c.tipo || "Consulta";
      const statusTxt = c.status === "realizado" ? "REALIZADA" : "AGENDADA";
      doc.text(tituloC, rgX + 26, rgY + 3.7);
      doc.setTextColor(...muted);
      doc.text(statusTxt, rgX + rgW - 2, rgY + 3.7, { align: "right" });
      rgY += 6;

      // Observacao
      if (c.observacao && c.observacao.trim()) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(...dark);
        const lines = doc.splitTextToSize(c.observacao.trim(), rgW - 4) as string[];
        for (const ln of lines) {
          if (rgY > limiteY - 3) break;
          doc.text(ln, rgX + 3, rgY + 2.5);
          rgY += 3;
        }
        rgY += 1.5;
      } else {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(6);
        doc.setTextColor(190, 190, 200);
        doc.text("Sem observacao registrada.", rgX + 3, rgY + 2);
        rgY += 4;
      }
    });

    // Indicador "+N" se truncou
    const restante = consultasOrd.findIndex(() => false);
    if (rgY > limiteY - 6 && restante !== -1) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(6.5);
      doc.setTextColor(...muted);
      doc.text("(+ consultas adicionais nao exibidas)", rgX + 2, limiteY);
    }
  }

  // Rodape da face direita: contatos uteis
  const contatosY = pageH - 22;
  doc.setFillColor(lr, lg, lb);
  doc.roundedRect(rgX, contatosY, rgW, 14, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(pr, pg, pb);
  doc.text("CONTATOS UTEIS", rgX + 3, contatosY + 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...dark);
  doc.text("SAMU 192   -   Bombeiros 193   -   Disque Saude 136", rgX + 3, contatosY + 8.5);
  doc.setFontSize(6.5);
  doc.setTextColor(...muted);
  doc.text("Em caso de emergencia, dirija-se a unidade de saude mais proxima.", rgX + 3, contatosY + 12);

  // ================================================================
  // PAGINAS 3 e 4 - GRAFICOS INTERCALADOS + DADOS CLINICOS EM GRADE
  // ================================================================
  const drawChartBox = (
    bx: number, by: number, bw: number, bh: number,
    title: string,
    serie: { color: [number, number, number]; values: { x: number; y: number }[]; fill?: boolean; name?: string }[],
    refRange?: { min: number; max: number; label?: string },
    extraRefs?: { min: number; max: number; label?: string; color?: [number, number, number] }[],
  ) => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(225, 225, 230);
    doc.setLineWidth(0.2);
    doc.roundedRect(bx, by, bw, bh, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...dark);
    doc.text(title, bx + 3, by + 5.5);

    const plotX = bx + 12;
    const plotY = by + 9;
    const plotW = bw - 16;
    const plotH = bh - 22;

    const allX = serie.flatMap(s => s.values.map(v => v.x));
    const allY = serie.flatMap(s => s.values.map(v => v.y));
    if (allX.length === 0) {
      doc.setFontSize(8);
      doc.setTextColor(...muted);
      doc.text("Sem dados registrados.", bx + bw / 2, by + bh / 2, { align: "center" });
      return;
    }
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX, minX + 1);
    const dataMinY = Math.min(...allY);
    const dataMaxY = Math.max(...allY);
    // Janela Y centrada nos dados; refRange so amplia se nao deixar band ocupar tudo
    let yLo: number;
    let yHi: number;
    {
      const padBase = Math.max((dataMaxY - dataMinY) * 0.35, dataMaxY * 0.05, 4);
      yLo = dataMinY - padBase;
      yHi = dataMaxY + padBase;
      if (refRange) {
        // Inclui band somente se ela cabe sem ocupar mais de ~50% do grafico
        const totalSpan = yHi - yLo;
        const bandSpan = refRange.max - refRange.min;
        if (bandSpan <= totalSpan * 0.6) {
          yLo = Math.min(yLo, refRange.min - padBase * 0.3);
          yHi = Math.max(yHi, refRange.max + padBase * 0.3);
        }
      }
      if (extraRefs && extraRefs.length) {
        extraRefs.forEach(r => {
          yLo = Math.min(yLo, r.min - padBase * 0.2);
          yHi = Math.max(yHi, r.max + padBase * 0.2);
        });
      }
      // Arredonda para escala "bonita"
      const niceStep = (range: number): number => {
        const raw = range / 4;
        const pow = Math.pow(10, Math.floor(Math.log10(raw)));
        const n = raw / pow;
        const step = n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10;
        return step * pow;
      };
      const step = niceStep(yHi - yLo);
      yLo = Math.floor(yLo / step) * step;
      yHi = Math.ceil(yHi / step) * step;
    }

    const sx = (v: number) => plotX + ((v - minX) / Math.max(1, maxX - minX)) * plotW;
    const sy = (v: number) => plotY + plotH - ((v - yLo) / Math.max(0.0001, yHi - yLo)) * plotH;

    // Faixa normal (so se intersecta a janela visivel)
    if (refRange) {
      const visMin = Math.max(refRange.min, yLo);
      const visMax = Math.min(refRange.max, yHi);
      if (visMax > visMin) {
        doc.setFillColor(220, 252, 231);
        const yT = sy(visMax);
        const yB = sy(visMin);
        doc.rect(plotX, yT, plotW, yB - yT, "F");
      }
    }

    // Linhas tracejadas de referencia adicionais (ex.: limites sistolica/diastolica)
    if (extraRefs && extraRefs.length) {
      extraRefs.forEach(r => {
        const col = r.color ?? [120, 120, 130];
        doc.setDrawColor(col[0], col[1], col[2]);
        doc.setLineWidth(0.25);
        doc.setLineDashPattern([1.2, 1.2], 0);
        [r.min, r.max].forEach(v => {
          if (v >= yLo && v <= yHi) {
            const yy = sy(v);
            doc.line(plotX, yy, plotX + plotW, yy);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(5);
            doc.setTextColor(col[0], col[1], col[2]);
            doc.text(`${v}`, plotX + plotW - 0.5, yy - 0.6, { align: "right" });
          }
        });
        doc.setLineDashPattern([], 0);
      });
    }

    // Gridlines em escala "bonita"
    doc.setDrawColor(235, 235, 240);
    doc.setLineWidth(0.15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(...muted);
    const yTicks = 4;
    for (let i = 0; i <= yTicks; i++) {
      const val = yLo + ((yHi - yLo) / yTicks) * i;
      const yy = sy(val);
      doc.line(plotX, yy, plotX + plotW, yy);
      doc.text(val.toFixed(0), plotX - 1, yy + 1.3, { align: "right" });
    }

    // Eixo X: distribui ticks uniformemente (max 6) para evitar sobreposicao
    const xs = Array.from(new Set(allX)).sort((a, b) => a - b);
    const xTickCount = Math.min(xs.length, 6);
    const xTicks: number[] = [];
    if (xs.length <= xTickCount) {
      xTicks.push(...xs);
    } else {
      for (let i = 0; i < xTickCount; i++) {
        const idx = Math.round((xs.length - 1) * (i / (xTickCount - 1)));
        xTicks.push(xs[idx]);
      }
    }
    xTicks.forEach(x => {
      doc.text(`${x}`, sx(x), plotY + plotH + 3, { align: "center" });
    });
    doc.setFontSize(6);
    doc.text("semana", plotX + plotW / 2, plotY + plotH + 6, { align: "center" });

    serie.forEach(s => {
      if (s.values.length === 0) return;
      const sorted = [...s.values].sort((a, b) => a.x - b.x);
      if (s.fill && sorted.length > 1) {
        const lr2 = Math.min(255, s.color[0] + (255 - s.color[0]) * 0.7);
        const lg2 = Math.min(255, s.color[1] + (255 - s.color[1]) * 0.7);
        const lb2 = Math.min(255, s.color[2] + (255 - s.color[2]) * 0.7);
        doc.setFillColor(lr2, lg2, lb2);
        for (let i = 0; i < sorted.length - 1; i++) {
          const p1 = sorted[i], p2 = sorted[i + 1];
          const x1 = sx(p1.x), y1 = sy(p1.y);
          const x2 = sx(p2.x), y2 = sy(p2.y);
          const baseY = plotY + plotH;
          doc.triangle(x1, y1, x2, y2, x1, baseY, "F");
          doc.triangle(x2, y2, x2, baseY, x1, baseY, "F");
        }
      }
      doc.setDrawColor(s.color[0], s.color[1], s.color[2]);
      doc.setLineWidth(0.5);
      for (let i = 0; i < sorted.length - 1; i++) {
        doc.line(sx(sorted[i].x), sy(sorted[i].y), sx(sorted[i + 1].x), sy(sorted[i + 1].y));
      }
      doc.setFillColor(s.color[0], s.color[1], s.color[2]);
      sorted.forEach(p => doc.circle(sx(p.x), sy(p.y), 0.9, "F"));

      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.setTextColor(s.color[0], s.color[1], s.color[2]);
      sorted.forEach((p) => {
        const px = sx(p.x);
        const py = sy(p.y);
        // Coloca o rotulo abaixo se o ponto estiver perto do topo do plot, senao acima
        const nearTop = py - plotY < 4;
        const ty = nearTop ? py + 3.2 : py - 1.8;
        const txt = Number.isInteger(p.y) ? String(p.y) : p.y.toFixed(1);
        doc.text(txt, px, ty, { align: "center" });
      });
    });

    if (serie.some(s => s.name) || refRange?.label) {
      let lx2 = plotX;
      const ly2 = by + bh - 3;
      serie.forEach(s => {
        if (!s.name) return;
        doc.setFillColor(s.color[0], s.color[1], s.color[2]);
        doc.circle(lx2 + 1, ly2 - 1, 0.9, "F");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        doc.setTextColor(...dark);
        doc.text(s.name, lx2 + 3, ly2);
        lx2 += doc.getTextWidth(s.name) + 8;
      });
      if (refRange?.label) {
        doc.setFillColor(34, 197, 94);
        doc.rect(lx2, ly2 - 2, 3, 2, "F");
        doc.setTextColor(...dark);
        doc.text(`${refRange.label} (${refRange.min}-${refRange.max})`, lx2 + 4, ly2);
      }
    }
  };

  // ================================================================
  // PAGINAS DE EVOLUCAO CLINICA: por parametro -> GRAFICO | TABELA lado a lado
  // ================================================================

  // Agrupa por parametro
  // Normaliza nome do parametro (case-insensitive, remove acento, espacos extras e unidades entre parenteses)
  const normParam = (p: string): string => {
    return p
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\([^)]*\)/g, "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  };
  const porParametro = new Map<string, MedicaoReal[]>();
  const labelByKey = new Map<string, string>();
  // Unifica sistolica + diastolica num unico parametro "Pressao Arterial"
  const isPressao = (p: string): "sis" | "dia" | null => {
    const lp = normParam(p);
    if (lp.includes("press") && lp.includes("sist")) return "sis";
    if (lp.includes("press") && lp.includes("diast")) return "dia";
    return null;
  };
  const PRESSAO_KEY = "pressao arterial";
  // "Estatura" / "altura_pessoa" eh dado fixo da gestante (usado no IMC) -> nao entra na evolucao
  const ehEstatura = (p: string) => {
    const lp = normParam(p);
    return lp === "estatura" || lp.startsWith("estatura") || lp === "altura pessoa" || lp === "altura";
  };
  // Temperatura removida da evolucao clinica a pedido do usuario
  const ehTemperatura = (p: string) => {
    const lp = normParam(p);
    return lp === "temperatura" || lp.startsWith("temperatura") || lp === "temp" || lp.includes("termic");
  };
  medicoes.forEach(m => {
    if (ehEstatura(m.parametro)) return;
    if (ehTemperatura(m.parametro)) return;
    const tipo = isPressao(m.parametro);
    const key = tipo ? PRESSAO_KEY : normParam(m.parametro);
    if (!porParametro.has(key)) {
      porParametro.set(key, []);
      const pretty = tipo ? "Pressao Arterial (mmHg)" : m.parametro.trim();
      labelByKey.set(key, tipo ? pretty : pretty.charAt(0).toUpperCase() + pretty.slice(1));
    }
    porParametro.get(key)!.push(m);
  });
  porParametro.forEach((arr) => {
    arr.sort((a, b) => {
      const da = parseBR(a.data); const db = parseBR(b.data);
      return (db?.getTime() ?? 0) - (da?.getTime() ?? 0);
    });
  });
  const parametros = Array.from(porParametro.keys()).sort((a, b) =>
    (labelByKey.get(a) ?? a).localeCompare(labelByKey.get(b) ?? b)
  );

  // Helper: detecta valor numerico (lida com "120/80")
  const numFromValor = (v: string | number): number | null => {
    if (typeof v === "number") return v;
    const s = String(v).trim();
    const m = s.match(/-?\d+([.,]\d+)?/);
    return m ? parseFloat(m[0].replace(",", ".")) : null;
  };

  // Mapeia parametro -> serie + cor + range
  const paramConfig = (param: string): {
    color: [number, number, number];
    refRange?: { min: number; max: number; label?: string };
    extraRefs?: { min: number; max: number; label?: string; color?: [number, number, number] }[];
    series: { color: [number, number, number]; values: { x: number; y: number }[]; fill?: boolean; name?: string }[];
  } | null => {
    const lp = param.toLowerCase();
    if (lp.includes("peso")) {
      return {
        color: [pr, pg, pb],
        series: [{ color: [pr, pg, pb], values: series.peso.map(d => ({ x: d.semana, y: d.peso })), fill: true, name: "Peso (kg)" }],
      };
    }
    if (lp.includes("uterina") || lp === "au") {
      return {
        color: [124, 58, 237],
        series: [{ color: [124, 58, 237], values: series.au.map(d => ({ x: d.semana, y: d.altura })), fill: true, name: "AU (cm)" }],
      };
    }
    if (lp.includes("bcf") || lp.includes("batimento")) {
      return {
        color: [16, 185, 129],
        refRange: { min: 110, max: 160, label: "normal" },
        series: [{ color: [16, 185, 129], values: series.bcf.map(d => ({ x: d.semana, y: d.bcf })), name: "BCF (bpm)" }],
      };
    }
    if (param === "pressao arterial" || (lp.includes("press") && (lp.includes("sist") || lp.includes("diast") || lp.includes("arter")))) {
      return {
        color: [239, 68, 68],
        // Em vez de uma banda unica, mostramos linhas tracejadas para os limites
        // normais da sistolica (90-140) e da diastolica (60-90), cada uma na cor da curva.
        extraRefs: [
          { min: 90, max: 140, label: "Sistolica normal", color: [239, 68, 68] },
          { min: 60, max: 90, label: "Diastolica normal", color: [59, 130, 246] },
        ],
        series: [
          { color: [239, 68, 68], values: series.pressao.filter(p => p.sistolica !== undefined).map(d => ({ x: d.semana, y: d.sistolica! })), name: "Sistolica (mmHg)" },
          { color: [59, 130, 246], values: series.pressao.filter(p => p.diastolica !== undefined).map(d => ({ x: d.semana, y: d.diastolica! })), name: "Diastolica (mmHg)" },
        ],
      };
    }
    if (lp.includes("glic")) {
      return {
        color: [245, 158, 11],
        refRange: { min: 70, max: 95, label: "normal" },
        series: [{ color: [245, 158, 11], values: series.glicemia.map(d => ({ x: d.semana, y: d.glicemia })), name: "Glicemia (mg/dL)" }],
      };
    }
    // Generico: cria serie a partir das medicoes
    const items = porParametro.get(param) ?? [];
    const vals = items
      .map(it => ({ x: it.semana, y: numFromValor(it.valor) }))
      .filter((it): it is { x: number; y: number } => it.y !== null)
      .sort((a, b) => a.x - b.x);
    if (vals.length < 2) return null;
    return {
      color: [pr, pg, pb],
      series: [{ color: [pr, pg, pb], values: vals, name: param }],
    };
  };

  // Layout do FOLDER: cada pagina A4 landscape tem DUAS FACES (esquerda/direita).
  // Em cada face fica 1 GRAFICO (em cima) + 1 TABELA (embaixo) do mesmo parametro.
  // Logo, 2 parametros por pagina (um em cada face).
  const blocksPerPage = 2;
  const faceW = halfW - margin - 5;       // largura util de uma face
  const faceH = pageH - 26;               // altura util de uma face
  const chartH = Math.round(faceH * 0.55); // grafico = 55% da altura da face
  const tableH = faceH - chartH - 4;       // tabela = restante

  const drawTableBox = (
    bx: number, by: number, bw: number, bh: number,
    title: string,
    items: MedicaoReal[],
    accent: [number, number, number],
  ) => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(225, 225, 230);
    doc.setLineWidth(0.3);
    doc.roundedRect(bx, by, bw, bh, 2, 2, "FD");
    // Titulo
    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.rect(bx, by, bw, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(title.toUpperCase(), bx + 3, by + 5);
    doc.setFontSize(7);
    doc.text(`${items.length} registro${items.length !== 1 ? "s" : ""}`, bx + bw - 3, by + 5, { align: "right" });
    // Header colunas
    const headerY = by + 7;
    const headerHt = 5.5;
    doc.setFillColor(245, 245, 250);
    doc.rect(bx, headerY, bw, headerHt, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...muted);
    const cDataW = bw * 0.22;
    const cSemW = bw * 0.10;
    const cValW = bw * 0.18;
    const cObsW = bw - cDataW - cSemW - cValW - 2;
    doc.text("DATA", bx + 3, headerY + 3.8);
    doc.text("SEM", bx + 3 + cDataW, headerY + 3.8);
    doc.text("VALOR", bx + 3 + cDataW + cSemW, headerY + 3.8);
    doc.text("OBSERVACAO", bx + 3 + cDataW + cSemW + cValW, headerY + 3.8);
    // Rows
    const rowsStartY = headerY + headerHt;
    const rowsH = bh - (rowsStartY - by) - 2;
    const rowHt = 4.5;
    const maxRows = Math.floor(rowsH / rowHt);
    const visible = items.slice(0, maxRows);
    visible.forEach((m, ri) => {
      const ry5 = rowsStartY + ri * rowHt;
      if (ri % 2 === 0) {
        doc.setFillColor(252, 252, 254);
        doc.rect(bx, ry5, bw, rowHt, "F");
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...dark);
      doc.text(m.data, bx + 3, ry5 + 3.2);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(accent[0], accent[1], accent[2]);
      doc.text(`${m.semana}`, bx + 3 + cDataW, ry5 + 3.2);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...dark);
      doc.text(String(m.valor), bx + 3 + cDataW + cSemW, ry5 + 3.2);
      // Observacao (truncada para caber)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...muted);
      const obsTxt = (m.observacao ?? "").trim();
      if (obsTxt) {
        const lines = doc.splitTextToSize(obsTxt, cObsW - 2);
        doc.text(String(lines[0] ?? ""), bx + 3 + cDataW + cSemW + cValW, ry5 + 3.2);
      } else {
        doc.text("-", bx + 3 + cDataW + cSemW + cValW, ry5 + 3.2);
      }
    });
    if (items.length > maxRows) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(6);
      doc.setTextColor(...muted);
      doc.text(`+ ${items.length - maxRows} registros anteriores`, bx + bw / 2, by + bh - 1.2, { align: "center" });
    }
  };

  // Inicia a primeira pagina de evolucao
  if (parametros.length) {
    let pageIndex = 0;
    let posInPage = 0;

    const startNewPage = (titulo: string) => {
      doc.addPage("a4", "landscape");
      drawBaseFolderPage();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(pr, pg, pb);
      doc.text(titulo, margin, 13);
      doc.setDrawColor(pr, pg, pb);
      doc.setLineWidth(0.5);
      doc.line(margin, 15, pageW - margin, 15);
    };

    parametros.forEach((param) => {
      if (posInPage === 0) {
        pageIndex += 1;
        startNewPage(`EVOLUCAO CLINICA POR PARAMETRO  -  PAGINA ${pageIndex}`);
      }
      const paramLabel = labelByKey.get(param) ?? param;
      const cfg = paramConfig(param);
      let items = porParametro.get(param)!;
      // Para pressao arterial: consolida sis+dia em "120/80" por (data, semana)
      if (param === "pressao arterial") {
        const grupos = new Map<string, { data: string; semana: number; sis?: number; dia?: number }>();
        items.forEach((m) => {
          const k = `${m.data}|${m.semana}`;
          if (!grupos.has(k)) grupos.set(k, { data: m.data, semana: m.semana });
          const g = grupos.get(k)!;
          const lp = m.parametro.toLowerCase();
          const v = numFromValor(m.valor);
          if (v === null) return;
          if (lp.includes("sist")) g.sis = v;
          else if (lp.includes("diast")) g.dia = v;
        });
        items = Array.from(grupos.values())
          .sort((a, b) => {
            const da = parseBR(a.data); const db = parseBR(b.data);
            return (db?.getTime() ?? 0) - (da?.getTime() ?? 0);
          })
          .map((g, idx) => ({
            id: `pa-${idx}`,
            parametro: "Pressao Arterial",
            data: g.data,
            semana: g.semana,
            valor: `${g.sis ?? "-"}/${g.dia ?? "-"}`,
          })) as unknown as MedicaoReal[];
      }
      const accent: [number, number, number] = cfg?.color ?? [pr, pg, pb];
      // Cada face: esquerda (posInPage=0) inicia em x=margin, direita em x=halfW+5
      const xFace = posInPage === 0 ? margin : halfW + 5;
      const yChart = 18;
      const yTable = yChart + chartH + 4;

      const totalPts = cfg ? cfg.series.reduce((acc, s) => acc + s.values.length, 0) : 0;
      if (cfg && totalPts >= 2) {
        drawChartBox(xFace, yChart, faceW, chartH,
          `Curva: ${paramLabel}`,
          cfg.series,
          cfg.refRange,
          cfg.extraRefs);
      } else {
        doc.setFillColor(248, 248, 252);
        doc.setDrawColor(225, 225, 230);
        doc.setLineWidth(0.3);
        doc.roundedRect(xFace, yChart, faceW, chartH, 2, 2, "FD");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...dark);
        doc.text(paramLabel.toUpperCase(), xFace + 4, yChart + 8);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(...muted);
        doc.text("Necessario ao menos 2 medicoes para gerar grafico.", xFace + 4, yChart + 14);
        const ult = items[0];
        if (ult) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(...muted);
          doc.text("ULTIMA LEITURA", xFace + 4, yChart + 22);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(20);
          doc.setTextColor(accent[0], accent[1], accent[2]);
          doc.text(String(ult.valor), xFace + 4, yChart + 32);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(...muted);
          doc.text(`em ${ult.data}  -  semana ${ult.semana}`, xFace + 4, yChart + 36);
        }
      }

      // TABELA logo abaixo do grafico, dentro da mesma face
      drawTableBox(xFace, yTable, faceW, tableH, paramLabel, items, accent);

      posInPage = (posInPage + 1) % blocksPerPage;
    });
  } else {
    // Pagina vazia explicativa
    doc.addPage("a4", "landscape");
    drawBaseFolderPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(pr, pg, pb);
    doc.text("EVOLUCAO CLINICA POR PARAMETRO", margin, 13);
    doc.setDrawColor(pr, pg, pb);
    doc.setLineWidth(0.5);
    doc.line(margin, 15, pageW - margin, 15);
    doc.setFillColor(248, 248, 252);
    doc.roundedRect(margin, pageH / 2 - 10, pageW - margin * 2, 20, 2, 2, "F");
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(...muted);
    doc.text("Nenhum dado clinico registrado.", pageW / 2, pageH / 2 + 2, { align: "center" });
  }

  // =============================================================
  // MATRIZ CRUZADA (datas x parametros) - tabela compacta em UMA face do folder
  // =============================================================
  if (medicoes.length) {
    doc.addPage("a4", "landscape");
    drawBaseFolderPage();

    const faceX = margin;
    const faceWCompact = halfW - margin * 2;
    const faceRightEdge = halfW - margin;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(pr, pg, pb);
    doc.text("MATRIZ CRUZADA - EVOLUCAO POR CONSULTA", faceX, 13);
    doc.setDrawColor(pr, pg, pb);
    doc.setLineWidth(0.5);
    doc.line(faceX, 15, faceRightEdge, 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...muted);
    doc.text("Linhas = data da consulta  |  Colunas = parametro clinico", faceX, 19);

    // Datas (mais recentes primeiro)
    const medicoesMatriz = medicoes.filter(m => !ehEstatura(m.parametro) && !ehTemperatura(m.parametro));
    const datasSet = new Set<string>();
    medicoesMatriz.forEach(m => datasSet.add(m.data));
    const datas = Array.from(datasSet).sort((a, b) => {
      const da = parseBR(a); const db = parseBR(b);
      return (db?.getTime() ?? 0) - (da?.getTime() ?? 0);
    });
    const matY = 23;
    const matMaxY = pageH - 14;
    const matHeaderH = 13;
    const maxRowsMatriz = Math.max(1, Math.floor((matMaxY - matY - matHeaderH) / 3.6));
    const datasMatriz = datas.slice(0, maxRowsMatriz);
    const matrix = new Map<string, Map<string, string | number>>();
    datasMatriz.forEach(d => matrix.set(d, new Map()));
    const pressaoPorData = new Map<string, { sis?: number; dia?: number }>();
    medicoesMatriz.forEach(m => {
      const tipo = isPressao(m.parametro);
      if (tipo) {
          if (!matrix.has(m.data)) return;
          if (!pressaoPorData.has(m.data)) pressaoPorData.set(m.data, {});
        const alvo = pressaoPorData.get(m.data)!;
        if (tipo === "sis") alvo.sis = Number(m.valor);
        if (tipo === "dia") alvo.dia = Number(m.valor);
        return;
      }
      matrix.get(m.data)?.set(normParam(m.parametro), m.valor);
    });
    pressaoPorData.forEach((v, d) => matrix.get(d)?.set(PRESSAO_KEY, `${v.sis ?? "-"}/${v.dia ?? "-"}`));
    const semanaPorData = new Map<string, number>();
    medicoesMatriz.forEach(m => { if (matrix.has(m.data)) semanaPorData.set(m.data, m.semana); });

    const compactLabel = (p: string): string => {
      const label = labelByKey.get(p) ?? p;
      const l = label.toLowerCase();
      if (p === PRESSAO_KEY || l.includes("press")) return "PA\n(mmHg)";
      if (l.includes("uterina")) return "AU\n(cm)";
      if (l.includes("glic")) return "Glic.\ncapilar";
      if (l.includes("pre") && l.includes("gest")) return "Peso\npre-gest.";
      if (l.includes("peso")) return "Peso\n(kg)";
      if (l.includes("bcf") || l.includes("batimento")) return "BCF\n(bpm)";
      return label.replace(/\s*\(([^)]*)\)/g, "\n($1)");
    };

    // Layout para caber tudo dentro da face esquerda do folder
    const fixedColW = 16;
    const semColW = 8;
    const matTotalW = Math.min(faceWCompact, faceRightEdge - faceX);
    const parametrosMatriz = parametros.slice(0, Math.max(1, Math.min(parametros.length, 9)));
    const restW = matTotalW - fixedColW - semColW;
    const dataColW = restW / Math.max(1, parametrosMatriz.length);

    // Calcula altura de header e linha para encaixar todas as datas
    const availH = matMaxY - matY;
    const rowH = Math.max(3.6, Math.min(6.2, (availH - matHeaderH) / Math.max(1, datasMatriz.length)));
    const fontRow = rowH >= 5.4 ? 5.9 : rowH >= 4.5 ? 5.2 : 4.6;

    // Header
    doc.setFillColor(pr, pg, pb);
    doc.rect(faceX, matY, matTotalW, matHeaderH, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.2);
    doc.text("DATA", faceX + 2, matY + matHeaderH / 2 + 1.2);
    doc.text("SEM", faceX + fixedColW + 1.5, matY + matHeaderH / 2 + 1.2);
    doc.setFontSize(dataColW < 10 ? 4.1 : 4.8);
    parametrosMatriz.forEach((p, i) => {
      const cx = faceX + fixedColW + semColW + i * dataColW;
      const lines = compactLabel(p).split("\n").flatMap(ln => doc.splitTextToSize(ln, dataColW - 1) as string[]);
      const lineH = 2.3;
      const visibleLines = lines.slice(0, 3);
      const startY = matY + matHeaderH / 2 - ((visibleLines.length - 1) * lineH) / 2;
      visibleLines.forEach((ln: string, li: number) => {
        doc.text(ln, cx + dataColW / 2, startY + li * lineH, { align: "center" });
      });
    });

    // Rows - tabela limpa, sem cor de fundo nas celulas
    datas.forEach((d, ri) => {
      const ry4 = matY + matHeaderH + ri * rowH;
      if (ri % 2 === 0) {
        doc.setFillColor(246, 247, 252);
        doc.rect(faceX, ry4, matTotalW, rowH, "F");
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(fontRow);
      doc.setTextColor(pr, pg, pb);
      doc.text(d, faceX + 1.5, ry4 + rowH / 2 + 1.1);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...muted);
      doc.text(`${semanaPorData.get(d) ?? "-"}`, faceX + fixedColW + 2, ry4 + rowH / 2 + 1.1);

      const linhaMatrix = matrix.get(d)!;
      parametrosMatriz.forEach((p, i) => {
        const cx = faceX + fixedColW + semColW + i * dataColW;
        const v = linhaMatrix.get(p);
        if (v !== undefined && v !== null) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(fontRow);
          doc.setTextColor(...dark);
          doc.text(String(v), cx + dataColW / 2, ry4 + rowH / 2 + 1.1, { align: "center" });
        } else {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(fontRow - 0.5);
          doc.setTextColor(210, 210, 215);
          doc.text("-", cx + dataColW / 2, ry4 + rowH / 2 + 1.1, { align: "center" });
        }
      });
    });

    // Bordas
    const totalH = matHeaderH + datas.length * rowH;
    doc.setDrawColor(pr, pg, pb);
    doc.setLineWidth(0.3);
    doc.rect(faceX, matY, matTotalW, totalH, "S");
    doc.setDrawColor(220, 222, 230);
    doc.setLineWidth(0.1);
    // Linhas horizontais entre rows
    for (let r = 1; r < datas.length; r++) {
      const y = matY + matHeaderH + r * rowH;
      doc.line(faceX, y, faceX + matTotalW, y);
    }
    // Linhas verticais
    doc.line(faceX + fixedColW, matY, faceX + fixedColW, matY + totalH);
    doc.line(faceX + fixedColW + semColW, matY, faceX + fixedColW + semColW, matY + totalH);
    parametrosMatriz.forEach((_p, i) => {
      const cx = faceX + fixedColW + semColW + (i + 1) * dataColW;
      doc.line(cx, matY, cx, matY + totalH);
    });
    // Linha separando header
    doc.setDrawColor(pr, pg, pb);
    doc.setLineWidth(0.2);
    doc.line(faceX, matY + matHeaderH, faceX + matTotalW, matY + matHeaderH);
  }

  // ============ Footer em todas as páginas ============
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }

  const safeName = patientInfo.name.replace(/\s+/g, "_");
  doc.save(`cartao_gestante_${safeName}.pdf`);
}
