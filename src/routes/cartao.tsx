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
}

interface VacinaReal {
  id: string;
  vacina: string;
  data: string; // BR
  observacao?: string;
}

interface ExameReal {
  id: string;
  tipo_exame: string;
  data: string; // BR
  status: string;
  resultado?: string;
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
  const [lancamentoOpen, setLancamentoOpen] = useState(false);

  const carregarDados = useCallback(async () => {
    if (isShared) return; // dados vêm do snapshot público
    if (!session?.user?.id) return;
    const uid = session.user.id;
    const [mRes, vRes, eRes] = await Promise.all([
      supabase.from("clinical_measurements")
        .select("id,parametro,valor,semana_gestacional,data_medicao")
        .eq("gestante_id", uid)
        .order("data_medicao", { ascending: true }),
      supabase.from("vaccinations")
        .select("id,vacina,data_aplicacao,observacao")
        .eq("gestante_id", uid)
        .order("data_aplicacao", { ascending: false }),
      supabase.from("exam_results")
        .select("id,tipo_exame,data_exame,status,resultado")
        .eq("gestante_id", uid)
        .order("data_exame", { ascending: false }),
    ]);
    if (mRes.data) {
      setMedicoes(mRes.data.map((r: any) => ({
        id: r.id,
        data: formatBR(new Date(r.data_medicao + "T00:00:00")),
        parametro: r.parametro,
        valor: Number(r.valor),
        semana: r.semana_gestacional ?? 0,
      })));
    }
    if (vRes.data) {
      setVacinas(vRes.data.map((r: any) => ({
        id: r.id,
        vacina: r.vacina,
        data: formatBR(new Date(r.data_aplicacao + "T00:00:00")),
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
    })));
    setVacinas((publicSnap.vacinas ?? []).map((r: any) => ({
      id: r.id,
      vacina: r.vacina,
      data: formatBR(new Date(r.data_aplicacao + "T00:00:00")),
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
  series: Series;
  ganhoPeso: number | null;
  imc: number | null;
  imcInfo: { label: string; color: string } | null;
  altura: number | undefined;
  palette: Palette;
  cartaoUrl: string;
}) {
  const { patientInfo, vitals, medicoes, vacinas, exames, series, ganhoPeso, imc, imcInfo, altura, palette, cartaoUrl } = args;
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true, orientation: "landscape" });
  let pageW = doc.internal.pageSize.getWidth();
  let pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 0;

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

  const drawFoldLine = () => {
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    doc.setDrawColor(180, 180, 190);
    doc.setLineDashPattern([2, 2], 0);
    doc.setLineWidth(0.2);
    doc.line(w / 2, 6, w / 2, h - 12);
    doc.setLineDashPattern([], 0);
    doc.setFontSize(6);
    doc.setTextColor(160, 160, 170);
    doc.text("DOBRE AQUI", w / 2, 4, { align: "center" });
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - margin - 12) {
      doc.addPage("a4", "landscape");
      pageW = doc.internal.pageSize.getWidth();
      pageH = doc.internal.pageSize.getHeight();
      y = margin + 4;
      drawFoldLine();
    }
  };

  const sectionHeader = (title: string) => {
    ensureSpace(14);
    doc.setFillColor(pr, pg, pb);
    doc.roundedRect(margin, y, pageW - margin * 2, 8, 1.5, 1.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title, margin + 4, y + 5.6);
    y += 12;
    doc.setTextColor(...dark);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
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

  // Helper: desenha estrutura base da pagina (fundos + linha de dobra)
  const drawFolderPage = (opts?: { leftBg?: [number, number, number]; rightBg?: [number, number, number] }) => {
    const lb = opts?.leftBg ?? [252, 252, 254];
    const rb = opts?.rightBg ?? [252, 252, 254];
    doc.setFillColor(lb[0], lb[1], lb[2]);
    doc.rect(0, 0, halfW, pageH, "F");
    doc.setFillColor(rb[0], rb[1], rb[2]);
    doc.rect(halfW, 0, halfW, pageH, "F");
    // linha de dobra
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

  // Helper: cabecalho de painel (titulo dentro de uma metade)
  const panelHeader = (title: string, x: number, w: number, py: number, color: [number, number, number] = [pr, pg, pb]) => {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(x, py, w, 7, 1.5, 1.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(title, x + 3, py + 4.8);
  };

  // =============================================================
  // PAGINA 1 - CAPA EXTERNA
  // Esquerda = contracapa (acesso/QR)  |  Direita = capa frontal (identidade)
  // =============================================================
  // Fundo da capa frontal (direita) - cor primaria
  doc.setFillColor(252, 252, 254);
  doc.rect(0, 0, halfW, pageH, "F");
  doc.setFillColor(pr, pg, pb);
  doc.rect(halfW, 0, halfW, pageH, "F");
  doc.setFillColor(ar, ag, ab);
  doc.ellipse(pageW - 6, pageH - 6, 60, 28, "F");
  doc.setFillColor(lr, lg, lb);
  doc.ellipse(halfW + 12, 6, 50, 18, "F");
  // Linha de dobra
  doc.setDrawColor(180, 180, 190);
  doc.setLineDashPattern([2, 2], 0);
  doc.setLineWidth(0.4);
  doc.line(halfW, 6, halfW, pageH - 6);
  doc.setLineDashPattern([], 0);
  doc.setTextColor(160, 160, 170);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.text("DOBRE AQUI", halfW, pageH / 2, { align: "center", angle: 90 });

  // CAPA FRONTAL (DIREITA)
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("MAEDIGITAL  -  UNAERP", halfW + 16, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Cartao Digital da Gestante", halfW + 16, 24);

  const photoSize = 46;
  const photoX = halfW + (halfW - photoSize) / 2;
  const photoY = 42;
  if (fotoData) {
    try {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(photoX - 1.5, photoY - 1.5, photoSize + 3, photoSize + 3, 4, 4, "F");
      doc.addImage(fotoData, "JPEG", photoX, photoY, photoSize, photoSize, undefined, "FAST");
    } catch { /* ignore */ }
  } else {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(photoX, photoY, photoSize, photoSize, 4, 4, "F");
    doc.setTextColor(pr, pg, pb);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    const ini = patientInfo.name.split(" ").map(n => n[0]).slice(0, 2).join("");
    doc.text(ini, photoX + photoSize / 2, photoY + photoSize / 2 + 6, { align: "center" });
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text(patientInfo.name, halfW + halfW / 2, photoY + photoSize + 12, { align: "center", maxWidth: halfW - 20 });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`${patientInfo.age} anos  -  Sangue ${patientInfo.bloodType}`, halfW + halfW / 2, photoY + photoSize + 19, { align: "center" });
  doc.setFontSize(9);
  doc.text(`Bebe: ${palette.label}`, halfW + halfW / 2, photoY + photoSize + 24, { align: "center" });

  // KPIs principais na capa
  const capaKpis = [
    { l: "SEMANAS", v: `${patientInfo.weeks}` },
    { l: "DPP", v: patientInfo.dpp },
  ];
  let cky = photoY + photoSize + 32;
  capaKpis.forEach((k) => {
    doc.setFillColor(255, 255, 255, 0.15 as never);
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.3);
    doc.roundedRect(halfW + 18, cky, halfW - 36, 11, 1.5, 1.5, "S");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(230, 230, 240);
    doc.text(k.l, halfW + 22, cky + 4.5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(k.v, halfW + halfW - 22, cky + 7.5, { align: "right" });
    cky += 13;
  });

  // CONTRACAPA (ESQUERDA) - QR e acesso digital
  const ccX = 16;
  const ccW = halfW - 32;
  doc.setTextColor(pr, pg, pb);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("ACESSO DIGITAL", ccX, 22);
  doc.setDrawColor(pr, pg, pb);
  doc.setLineWidth(0.5);
  doc.line(ccX, 25, ccX + ccW, 25);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...dark);
  const ccTxt = doc.splitTextToSize(
    "Escaneie o QR Code abaixo para acessar o cartao digital sempre atualizado, com novos exames, vacinas e medicoes em tempo real.",
    ccW,
  );
  doc.text(ccTxt, ccX, 33);

  const qrCapa = 50;
  const qrCapaX = ccX + (ccW - qrCapa) / 2;
  const qrCapaY = 56;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(225, 225, 230);
  doc.roundedRect(qrCapaX - 2, qrCapaY - 2, qrCapa + 4, qrCapa + 4, 2, 2, "FD");
  try { doc.addImage(qrData, "PNG", qrCapaX, qrCapaY, qrCapa, qrCapa); } catch { /* ignore */ }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(pr, pg, pb);
  const linkLines0 = doc.splitTextToSize(cartaoUrl, ccW);
  doc.text(linkLines0, ccX + ccW / 2, qrCapaY + qrCapa + 8, { align: "center" });

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(...muted);
  doc.text(`Emitido em ${formatBR(new Date())}`, ccX, pageH - 14);

  // =============================================================
  // PAGINA 2 - FOLHA 1 (Dados gestacionais + Sinais vitais/Vacinas)
  // =============================================================
  doc.addPage("a4", "landscape");
  doc.setFillColor(252, 252, 254);
  doc.rect(0, 0, pageW, pageH, "F");
  // dobra
  doc.setDrawColor(180, 180, 190);
  doc.setLineDashPattern([2, 2], 0);
  doc.setLineWidth(0.4);
  doc.line(halfW, 6, halfW, pageH - 6);
  doc.setLineDashPattern([], 0);
  doc.setTextColor(160, 160, 170);
  doc.setFontSize(6);
  doc.text("DOBRE AQUI", halfW, pageH / 2, { align: "center", angle: 90 });

  // METADE ESQUERDA: Dados gestacionais
  const lX = 14;
  const lW = halfW - 28;
  doc.setTextColor(pr, pg, pb);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("DADOS GESTACIONAIS", lX, 18);
  doc.setDrawColor(pr, pg, pb);
  doc.setLineWidth(0.5);
  doc.line(lX, 21, lX + lW, 21);

  let iy = 28;
  const kpis = [
    { label: "SEMANA GESTACIONAL", value: `${patientInfo.weeks}a`, sub: "atual" },
    { label: "DUM", value: patientInfo.dum, sub: "ultima menstruacao" },
    { label: "DPP", value: patientInfo.dpp, sub: "data provavel do parto" },
  ];
  kpis.forEach((k) => {
    doc.setFillColor(lr, lg, lb);
    doc.roundedRect(lX, iy, lW, 16, 2, 2, "F");
    doc.setTextColor(...muted);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(k.label, lX + 4, iy + 5);
    doc.setTextColor(pr, pg, pb);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(k.value, lX + 4, iy + 12);
    doc.setTextColor(...muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(k.sub, lX + lW - 4, iy + 12, { align: "right" });
    iy += 19;
  });

  // IMC
  iy += 2;
  doc.setFillColor(248, 248, 252);
  doc.setDrawColor(225, 225, 230);
  doc.roundedRect(lX, iy, lW, 22, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...muted);
  doc.text("IMC E GANHO DE PESO", lX + 3, iy + 5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...dark);
  if (imc && imcInfo) {
    doc.text(`IMC ${imc.toFixed(1)}`, lX + 3, iy + 13);
    const [cr, cg, cb] = hexToRgb(imcInfo.color);
    doc.setTextColor(cr, cg, cb);
    doc.setFontSize(8.5);
    doc.text(imcInfo.label, lX + 3, iy + 19);
  } else {
    doc.setFontSize(9);
    doc.setTextColor(...muted);
    doc.text("Informe altura para calculo", lX + 3, iy + 13);
  }
  if (ganhoPeso !== null) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(pr, pg, pb);
    doc.text(`${ganhoPeso > 0 ? "+" : ""}${ganhoPeso.toFixed(1)} kg`, lX + lW - 3, iy + 12, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...muted);
    doc.text("ganho atual", lX + lW - 3, iy + 17, { align: "right" });
  }
  iy += 26;

  // Antecedentes
  doc.setFillColor(248, 248, 252);
  doc.setDrawColor(225, 225, 230);
  doc.roundedRect(lX, iy, lW, 18, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...muted);
  doc.text("ANTECEDENTES OBSTETRICOS", lX + 3, iy + 5);
  const obs = [
    { l: "Gestacoes", v: String(patientInfo.gestacoes ?? 0) },
    { l: "Partos", v: String(patientInfo.partos ?? 0) },
    { l: "Abortos", v: String(patientInfo.abortos ?? 0) },
  ];
  obs.forEach((o, i) => {
    const ox = lX + 3 + i * ((lW - 6) / 3);
    doc.setTextColor(pr, pg, pb);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(o.v, ox, iy + 13);
    doc.setTextColor(...muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(o.l, ox + 8, iy + 13);
  });
  iy += 22;

  // Contato
  const linhasContato = [
    patientInfo.telefone ? `Tel: ${patientInfo.telefone}` : null,
    patientInfo.email ? `Email: ${patientInfo.email}` : null,
    patientInfo.unidadeSaude ? `UBS: ${patientInfo.unidadeSaude}` : null,
    patientInfo.bairro || patientInfo.cidade ? `${patientInfo.bairro ?? ""}${patientInfo.bairro && patientInfo.cidade ? " - " : ""}${patientInfo.cidade ?? ""}` : null,
  ].filter(Boolean) as string[];
  if (linhasContato.length) {
    const altC = 6 + linhasContato.length * 4 + 2;
    doc.setDrawColor(220, 220, 225);
    doc.roundedRect(lX, iy, lW, altC, 2, 2);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...muted);
    doc.text("CONTATO E REFERENCIA", lX + 3, iy + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...dark);
    linhasContato.forEach((l, i) => doc.text(l, lX + 3, iy + 8 + i * 4));
  }

  // METADE DIREITA: Sinais vitais + Vacinas
  const rX = halfW + 14;
  const rW = halfW - 28;
  let ry = 18;

  doc.setTextColor(pr, pg, pb);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("SINAIS VITAIS", rX, ry);
  doc.setDrawColor(pr, pg, pb);
  doc.setLineWidth(0.5);
  doc.line(rX, ry + 3, rX + rW, ry + 3);
  ry += 10;

  if (vitals.length) {
    const cellW = (rW - (vitals.length - 1) * 3) / vitals.length;
    vitals.forEach((v, i) => {
      const x = rX + i * (cellW + 3);
      doc.setFillColor(248, 248, 252);
      doc.roundedRect(x, ry, cellW, 22, 2, 2, "F");
      doc.setFillColor(pr, pg, pb);
      doc.roundedRect(x, ry, cellW, 2.5, 1, 1, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...muted);
      doc.text(v.label, x + 2.5, ry + 7);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...dark);
      doc.text(v.value, x + 2.5, ry + 14);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(pr, pg, pb);
      doc.text(v.change, x + 2.5, ry + 19);
    });
    ry += 27;
  } else {
    doc.setFontSize(9);
    doc.setTextColor(...muted);
    doc.setFont("helvetica", "italic");
    doc.text("Sem registros.", rX, ry);
    ry += 8;
  }

  doc.setTextColor(pr, pg, pb);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("VACINAS APLICADAS", rX, ry);
  doc.setDrawColor(pr, pg, pb);
  doc.setLineWidth(0.5);
  doc.line(rX, ry + 3, rX + rW, ry + 3);
  ry += 8;

  const maxRy = pageH - 18;
  if (vacinas.length) {
    for (const v of vacinas) {
      if (ry + 11 > maxRy) break;
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(rX, ry, rW, 8, 1.5, 1.5, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(22, 101, 52);
      doc.text(v.vacina, rX + 3, ry + 5.4);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...muted);
      doc.text(v.data, rX + rW - 3, ry + 5.4, { align: "right" });
      ry += 10;
    }
  } else {
    doc.setFontSize(9);
    doc.setTextColor(...muted);
    doc.setFont("helvetica", "italic");
    doc.text("Nenhuma vacina registrada.", rX, ry + 4);
  }

  // ================================================================
  // PAGINAS 3 e 4 - GRAFICOS (4 graficos por pagina, 2 por metade)
  // ================================================================
  // Helper: desenha um grafico em uma "caixa" (x, y, w, h)
  const drawChartBox = (
    bx: number, by: number, bw: number, bh: number,
    title: string,
    serie: { color: [number, number, number]; values: { x: number; y: number }[]; fill?: boolean; name?: string }[],
    refRange?: { min: number; max: number; label?: string },
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
    const minY = Math.min(...allY, refRange?.min ?? Infinity);
    const maxY = Math.max(...allY, refRange?.max ?? -Infinity);
    const padY = (maxY - minY) * 0.2 || 1;
    const yLo = minY - padY;
    const yHi = maxY + padY;

    const sx = (v: number) => plotX + ((v - minX) / Math.max(1, maxX - minX)) * plotW;
    const sy = (v: number) => plotY + plotH - ((v - yLo) / Math.max(0.0001, yHi - yLo)) * plotH;

    if (refRange) {
      doc.setFillColor(220, 252, 231);
      const yT = sy(refRange.max);
      const yB = sy(refRange.min);
      doc.rect(plotX, yT, plotW, yB - yT, "F");
    }

    doc.setDrawColor(235, 235, 240);
    doc.setLineWidth(0.15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(...muted);
    for (let i = 0; i <= 4; i++) {
      const yy = plotY + (plotH / 4) * i;
      doc.line(plotX, yy, plotX + plotW, yy);
      const val = yHi - ((yHi - yLo) / 4) * i;
      doc.text(val.toFixed(0), plotX - 1, yy + 1.3, { align: "right" });
    }

    const xs = Array.from(new Set(allX)).sort((a, b) => a - b);
    xs.forEach(x => {
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
      sorted.forEach((p, i) => {
        const px = sx(p.x);
        const py = sy(p.y);
        const acima = i % 2 === 0;
        const ty = acima ? py - 1.8 : py + 3.5;
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
        doc.text(refRange.label, lx2 + 4, ly2);
      }
    }
  };

  // PAGINA 3 - Folha 2: 4 graficos
  doc.addPage("a4", "landscape");
  doc.setFillColor(252, 252, 254);
  doc.rect(0, 0, pageW, pageH, "F");
  doc.setDrawColor(180, 180, 190);
  doc.setLineDashPattern([2, 2], 0);
  doc.setLineWidth(0.4);
  doc.line(halfW, 6, halfW, pageH - 6);
  doc.setLineDashPattern([], 0);
  doc.setTextColor(160, 160, 170);
  doc.setFontSize(6);
  doc.text("DOBRE AQUI", halfW, pageH / 2, { align: "center", angle: 90 });

  // Titulo
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(pr, pg, pb);
  doc.text("EVOLUCAO CLINICA - GRAFICOS (1/2)", margin, 14);

  const chartW = halfW - margin - 6;
  const chartH = (pageH - 28) / 2 - 4;
  // Esquerda topo: Peso
  drawChartBox(margin, 18, chartW, chartH,
    "Curva de Ganho de Peso (kg)",
    [{ color: [pr, pg, pb], values: series.peso.map(d => ({ x: d.semana, y: d.peso })), fill: true, name: "Peso" }]);
  // Esquerda baixo: Pressao
  drawChartBox(margin, 18 + chartH + 6, chartW, chartH,
    "Curva Pressorica (mmHg)",
    [
      { color: [239, 68, 68], values: series.pressao.filter(p => p.sistolica !== undefined).map(d => ({ x: d.semana, y: d.sistolica! })), name: "Sistolica" },
      { color: [59, 130, 246], values: series.pressao.filter(p => p.diastolica !== undefined).map(d => ({ x: d.semana, y: d.diastolica! })), name: "Diastolica" },
    ],
    { min: 60, max: 140, label: "normal" });
  // Direita topo: Glicemia x Peso
  drawChartBox(halfW + 6, 18, chartW, chartH,
    "Glicemia x Peso",
    [
      { color: [245, 158, 11], values: series.glicemia.map(d => ({ x: d.semana, y: d.glicemia })), name: "Glicemia" },
      { color: [pr, pg, pb], values: series.peso.map(d => ({ x: d.semana, y: d.peso })), name: "Peso" },
    ],
    { min: 70, max: 95, label: "normal" });
  // Direita baixo: AU x Peso
  drawChartBox(halfW + 6, 18 + chartH + 6, chartW, chartH,
    "Altura Uterina x Peso",
    [
      { color: [124, 58, 237], values: series.au.map(d => ({ x: d.semana, y: d.altura })), name: "AU", fill: true },
      { color: [pr, pg, pb], values: series.peso.map(d => ({ x: d.semana, y: d.peso })), name: "Peso" },
    ]);

  // PAGINA 4 - Folha 3: BCF + PAM (esquerda) | Medicoes + Exames (direita)
  doc.addPage("a4", "landscape");
  doc.setFillColor(252, 252, 254);
  doc.rect(0, 0, pageW, pageH, "F");
  doc.setDrawColor(180, 180, 190);
  doc.setLineDashPattern([2, 2], 0);
  doc.setLineWidth(0.4);
  doc.line(halfW, 6, halfW, pageH - 6);
  doc.setLineDashPattern([], 0);
  doc.setTextColor(160, 160, 170);
  doc.setFontSize(6);
  doc.text("DOBRE AQUI", halfW, pageH / 2, { align: "center", angle: 90 });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(pr, pg, pb);
  doc.text("EVOLUCAO CLINICA - GRAFICOS (2/2)", margin, 14);

  // Esquerda: 2 graficos (BCF + PAM)
  drawChartBox(margin, 18, chartW, chartH,
    "Batimentos Cardiacos Fetais (bpm)",
    [{ color: [16, 185, 129], values: series.bcf.map(d => ({ x: d.semana, y: d.bcf })), name: "BCF" }],
    { min: 110, max: 160, label: "normal" });
  const pamSerie = series.pressao
    .filter(p => p.sistolica !== undefined && p.diastolica !== undefined)
    .map(p => ({ x: p.semana, y: (p.sistolica! + 2 * p.diastolica!) / 3 }));
  drawChartBox(margin, 18 + chartH + 6, chartW, chartH,
    "PAM x Peso (analise combinada)",
    [
      { color: [pr, pg, pb], values: series.peso.map(d => ({ x: d.semana, y: d.peso })), name: "Peso", fill: true },
      { color: [239, 68, 68], values: pamSerie, name: "PAM" },
    ]);

  // Direita: Medicoes + Exames
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(pr, pg, pb);
  doc.text("REGISTROS CLINICOS", halfW + 14, 22);
  doc.setDrawColor(pr, pg, pb);
  doc.setLineWidth(0.5);
  doc.line(halfW + 14, 25, pageW - 14, 25);

  let dy = 30;
  const dMaxY = pageH - 18;
  const drW = halfW - 28;
  const drX = halfW + 14;

  // Medicoes agrupadas por data (compactas)
  if (medicoes.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...dark);
    doc.text("MEDICOES POR DATA", drX, dy);
    dy += 4;
    const map = new Map<string, MedicaoReal[]>();
    medicoes.forEach(m => {
      if (!map.has(m.data)) map.set(m.data, []);
      map.get(m.data)!.push(m);
    });
    const grupos = Array.from(map.entries()).sort((a, b) => {
      const da = parseBR(a[0]); const db = parseBR(b[0]);
      return (db?.getTime() ?? 0) - (da?.getTime() ?? 0);
    });
    for (const [data, items] of grupos) {
      const linhas = Math.ceil(items.length / 2);
      const blockH = 7 + linhas * 4;
      if (dy + blockH > dMaxY - 30) break;
      doc.setFillColor(250, 250, 253);
      doc.setDrawColor(230, 230, 235);
      doc.roundedRect(drX, dy, drW, blockH, 1.5, 1.5, "FD");
      doc.setFillColor(pr, pg, pb);
      doc.roundedRect(drX + 2, dy + 1.5, 22, 4.5, 0.8, 0.8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text(`SEM ${items[0].semana}`, drX + 13, dy + 4.8, { align: "center" });
      doc.setTextColor(...muted);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(data, drX + drW - 2, dy + 4.8, { align: "right" });
      const colW = (drW - 4) / 2;
      items.forEach((m, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const cx = drX + 2 + col * colW;
        const cy = dy + 9 + row * 4;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(...muted);
        doc.text(`${m.parametro}:`, cx, cy);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...dark);
        doc.text(String(m.valor), cx + doc.getTextWidth(`${m.parametro}: `), cy);
      });
      dy += blockH + 1.5;
    }
  }

  // Exames
  if (dy < dMaxY - 20) {
    dy += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...dark);
    doc.text("EXAMES", drX, dy);
    dy += 3;
    if (exames.length) {
      for (const e of exames) {
        if (dy + 8 > dMaxY) break;
        doc.setFillColor(239, 246, 255);
        doc.setDrawColor(191, 219, 254);
        doc.roundedRect(drX, dy, drW, 7, 1.2, 1.2, "FD");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(30, 64, 175);
        doc.text(e.tipo_exame, drX + 2, dy + 4.6);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(...muted);
        doc.text(`${e.data} - ${e.status}`, drX + drW - 2, dy + 4.6, { align: "right" });
        dy += 8;
      }
    } else {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(...muted);
      doc.text("Nenhum exame registrado.", drX, dy + 4);
    }
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
