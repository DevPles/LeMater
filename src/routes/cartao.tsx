import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState, useRef, useMemo } from "react";
import { LiquidCard } from "@/components/LiquidCard";
import { useScreenContent } from "@/hooks/useScreenContent";
import { CARTAO_DEFAULT } from "@/components/admin/TelasTab";
import { useGestanteProfile } from "@/hooks/useGestanteProfile";
import jsPDF from "jspdf";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from "recharts";

/** Paleta baseada no sexo do bebê — usado também no PDF. */
function paletaPorSexo(sexo: string | null | undefined) {
  if (sexo === "masculino") {
    return {
      primary: "#2563eb",      // azul
      primaryLight: "#dbeafe",
      accent: "#0ea5e9",
      label: "Menino",
    };
  }
  if (sexo === "feminino") {
    return {
      primary: "#db2777",      // rosa
      primaryLight: "#fce7f3",
      accent: "#f472b6",
      label: "Menina",
    };
  }
  return {
    primary: "#7c3aed",        // roxo neutro
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
  component: CartaoPage,
});

// Defaults — sobrescritos via /admin → Telas do App → Cartão da Gestante
const patientInfoDefault = {
  name: CARTAO_DEFAULT.patientName,
  age: CARTAO_DEFAULT.patientAge,
  bloodType: CARTAO_DEFAULT.bloodType,
  dum: CARTAO_DEFAULT.dum,
  dpp: CARTAO_DEFAULT.dpp,
  weeks: CARTAO_DEFAULT.weeks,
};

// Helpers para data/semana
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
  return Math.max(1, Math.min(42, semanas));
}


// --- Resumo data ---
const vitalColors = ["bg-coral-light", "bg-mint-light", "bg-warm", "bg-blush"];

// --- Timeline entries (shared state) ---
export interface TimelineEntry {
  id: number;
  week: number;
  date: string;
  event: string;
  notes: string;
  status: "done" | "upcoming";
  type: "consulta" | "vacina" | "exame";
  anexoUrl?: string;
  anexoNome?: string;
}

const timelineIniciais: TimelineEntry[] = [
  { id: 1, week: 24, date: "10/04/2026", event: "Consulta pré-natal", notes: "Peso e pressão normais. Ultrassom sem alterações.", status: "done", type: "consulta" },
  { id: 2, week: 22, date: "27/03/2026", event: "Ultrassom morfológico", notes: "Desenvolvimento normal. Peso fetal 500g.", status: "done", type: "exame" },
  { id: 3, week: 20, date: "13/03/2026", event: "Consulta pré-natal", notes: "Hemograma e glicemia em jejum solicitados.", status: "done", type: "consulta" },
  { id: 4, week: 20, date: "13/03/2026", event: "Vacina dTpa", notes: "Vacina dTpa aplicada na UBS Central.", status: "done", type: "vacina" },
  { id: 5, week: 16, date: "13/02/2026", event: "Consulta pré-natal", notes: "Início da suplementação de ferro.", status: "done", type: "consulta" },
  { id: 6, week: 12, date: "16/01/2026", event: "1º Ultrassom", notes: "Batimento cardíaco confirmado. Translucência nucal normal.", status: "done", type: "exame" },
  { id: 7, week: 12, date: "16/01/2026", event: "Vacina Hepatite B (1ª dose)", notes: "Aplicada na UBS Central.", status: "done", type: "vacina" },
  { id: 8, week: 28, date: "08/05/2026", event: "Próxima consulta", notes: "Teste de tolerância à glicose agendado.", status: "upcoming", type: "consulta" },
  { id: 9, week: 28, date: "08/05/2026", event: "Vacina Influenza", notes: "Vacina contra gripe recomendada.", status: "upcoming", type: "vacina" },
  { id: 10, week: 30, date: "22/05/2026", event: "Ultrassom obstétrico", notes: "Verificar crescimento fetal.", status: "upcoming", type: "exame" },
];

// --- Lançamentos data ---
interface Lancamento {
  id: number;
  semana: number;
  data: string;
  peso: string;
  pressaoSis: string;
  pressaoDia: string;
  alturaUterina: string;
  bcf: string;
  edema: string;
  observacoes: string;
}

const lancamentosIniciais: Lancamento[] = [
  { id: 1, semana: 12, data: "16/01/2026", peso: "63,0", pressaoSis: "110", pressaoDia: "70", alturaUterina: "12", bcf: "150", edema: "Ausente", observacoes: "Primeira consulta. Translucência nucal normal." },
  { id: 2, semana: 16, data: "13/02/2026", peso: "64,2", pressaoSis: "120", pressaoDia: "80", alturaUterina: "16", bcf: "148", edema: "Ausente", observacoes: "Suplementação de ferro iniciada." },
  { id: 3, semana: 20, data: "13/03/2026", peso: "65,8", pressaoSis: "110", pressaoDia: "70", alturaUterina: "20", bcf: "145", edema: "Ausente", observacoes: "Hemograma solicitado." },
  { id: 4, semana: 22, data: "27/03/2026", peso: "67,0", pressaoSis: "115", pressaoDia: "75", alturaUterina: "22", bcf: "140", edema: "Ausente", observacoes: "Ultrassom morfológico normal." },
  { id: 5, semana: 24, data: "10/04/2026", peso: "68,5", pressaoSis: "110", pressaoDia: "70", alturaUterina: "24", bcf: "142", edema: "Ausente", observacoes: "Consulta de rotina." },
];

// --- Vacinas/Exames data ---
export interface VacinaExame {
  id: number;
  tipo: "vacina" | "exame";
  nome: string;
  data: string;
  semana: number;
  status: "realizado" | "pendente" | "agendado";
  resultado?: string;
  observacoes?: string;
  anexoUrl?: string;
  anexoNome?: string;
}

const vacinasExamesIniciais: VacinaExame[] = [
  { id: 1, tipo: "vacina", nome: "Hepatite B (1ª dose)", data: "16/01/2026", semana: 12, status: "realizado", observacoes: "Aplicada na UBS Central." },
  { id: 2, tipo: "vacina", nome: "dTpa", data: "13/03/2026", semana: 20, status: "realizado", observacoes: "Aplicada na UBS Central." },
  { id: 3, tipo: "exame", nome: "Ultrassom morfológico", data: "27/03/2026", semana: 22, status: "realizado", resultado: "Normal. Peso fetal 500g.", anexoNome: "ultrassom_22sem.pdf" },
  { id: 4, tipo: "exame", nome: "Hemograma completo", data: "20/03/2026", semana: 20, status: "realizado", resultado: "Dentro dos parâmetros normais.", anexoNome: "hemograma.pdf" },
  { id: 5, tipo: "vacina", nome: "Influenza", data: "08/05/2026", semana: 28, status: "agendado", observacoes: "Vacina contra gripe recomendada." },
  { id: 6, tipo: "exame", nome: "Teste de tolerância à glicose", data: "08/05/2026", semana: 28, status: "pendente", observacoes: "Deve ser realizado até a semana 28." },
  { id: 7, tipo: "exame", nome: "Ultrassom obstétrico", data: "22/05/2026", semana: 30, status: "agendado", observacoes: "Verificar crescimento fetal." },
];

// --- Gráficos data ---
const pesoData = [
  { semana: 8, peso: 61 },
  { semana: 12, peso: 63 },
  { semana: 16, peso: 64.2 },
  { semana: 20, peso: 65.8 },
  { semana: 24, peso: 68.5 },
];

const pressaoData = [
  { semana: 8, sistolica: 110, diastolica: 70 },
  { semana: 12, sistolica: 110, diastolica: 70 },
  { semana: 16, sistolica: 120, diastolica: 80 },
  { semana: 20, sistolica: 110, diastolica: 70 },
  { semana: 24, sistolica: 110, diastolica: 70 },
];

const alturaUterinaData = [
  { semana: 12, altura: 12 },
  { semana: 16, altura: 16 },
  { semana: 20, altura: 20 },
  { semana: 22, altura: 22 },
  { semana: 24, altura: 24 },
];

const bcfData = [
  { semana: 12, bcf: 150 },
  { semana: 16, bcf: 148 },
  { semana: 20, bcf: 145 },
  { semana: 22, bcf: 140 },
  { semana: 24, bcf: 142 },
];

type Tab = "resumo" | "lancamentos" | "vacinas" | "graficos";

function CartaoPage() {
  const [tab, setTab] = useState<Tab>("resumo");
  const [lancamentos, setLancamentos] = useState<Lancamento[]>(lancamentosIniciais);
  const [showForm, setShowForm] = useState(false);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>(timelineIniciais);
  const [vacinasExames, setVacinasExames] = useState<VacinaExame[]>(vacinasExamesIniciais);

  const { content: cartaoContent } = useScreenContent("cartao", CARTAO_DEFAULT);
  const { profile } = useGestanteProfile();
  const bebeSexo = profile?.bebe_sexo ?? null;
  const palette = paletaPorSexo(bebeSexo);
  const patientInfo = {
    name: cartaoContent.patientName,
    age: cartaoContent.patientAge,
    bloodType: cartaoContent.bloodType,
    dum: cartaoContent.dum,
    dpp: cartaoContent.dpp,
    weeks: cartaoContent.weeks,
  };
  const vitals = (cartaoContent.vitals ?? []).map((v, i) => ({
    ...v,
    color: vitalColors[i % vitalColors.length],
  }));

  const hojeBR = formatBR(new Date());
  const semanaHoje = String(semanaGestacional(hojeBR, patientInfo.dum));

  const [form, setForm] = useState({
    semana: semanaHoje, data: hojeBR, peso: "", pressaoSis: "", pressaoDia: "",
    alturaUterina: "", bcf: "", edema: "Ausente", observacoes: "",
  });

  const handleAddLancamento = () => {
    if (!form.semana || !form.data) return;
    const novo: Lancamento = {
      id: lancamentos.length + 1,
      semana: Number(form.semana),
      data: form.data,
      peso: form.peso,
      pressaoSis: form.pressaoSis,
      pressaoDia: form.pressaoDia,
      alturaUterina: form.alturaUterina,
      bcf: form.bcf,
      edema: form.edema,
      observacoes: form.observacoes,
    };
    setLancamentos([novo, ...lancamentos]);
    // Add to timeline
    setTimelineEntries(prev => [{
      id: Date.now(),
      week: Number(form.semana),
      date: form.data,
      event: "Consulta pré-natal",
      notes: form.observacoes || `Peso: ${form.peso}kg, PA: ${form.pressaoSis}/${form.pressaoDia}, BCF: ${form.bcf}bpm`,
      status: "done",
      type: "consulta",
    }, ...prev]);
    setForm({ semana: semanaHoje, data: hojeBR, peso: "", pressaoSis: "", pressaoDia: "", alturaUterina: "", bcf: "", edema: "Ausente", observacoes: "" });
    setShowForm(false);
  };

  const handleAddVacinaExame = (item: VacinaExame) => {
    setVacinasExames(prev => [item, ...prev]);
    // Add to timeline
    setTimelineEntries(prev => [{
      id: Date.now(),
      week: item.semana,
      date: item.data,
      event: item.nome,
      notes: item.observacoes || item.resultado || "",
      status: item.status === "realizado" ? "done" : "upcoming",
      type: item.tipo,
      anexoUrl: item.anexoUrl,
      anexoNome: item.anexoNome,
    }, ...prev]);
  };

  const exportarPDF = () => {
    // Mescla dados reais do perfil logado com defaults de tela
    const realInfo = {
      name: profile?.nome || patientInfo.name,
      age: patientInfo.age,
      bloodType: patientInfo.bloodType,
      dum: profile?.dum
        ? formatBR(new Date(profile.dum + "T00:00:00"))
        : patientInfo.dum,
      dpp: patientInfo.dpp,
      weeks: profile?.dum
        ? String(semanaGestacional(hojeBR, formatBR(new Date(profile.dum + "T00:00:00"))))
        : patientInfo.weeks,
      email: profile?.email ?? null,
      telefone: profile?.telefone ?? null,
    };
    gerarPDFCartao({
      patientInfo: realInfo,
      vitals,
      lancamentos,
      vacinasExames,
      timelineEntries,
      palette,
      charts: {
        peso: pesoData,
        pressao: pressaoData,
        altura: alturaUterinaData,
        bcf: bcfData,
      },
    });
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "resumo", label: "Resumo" },
    { key: "lancamentos", label: "Lançamentos" },
    { key: "vacinas", label: "Vacinas/Exames" },
    { key: "graficos", label: "Gráficos" },
  ];

  const inputClass = "w-full h-9 text-sm rounded-xl border border-border bg-background px-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">
        <div className="relative mb-1">
          <h1 className="text-2xl font-bold font-display text-foreground text-center">Cartão Digital da Gestante</h1>
          <button
            onClick={exportarPDF}
            className="absolute right-0 top-9 shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border-2 text-primary-foreground bg-primary transition-all hover:opacity-90"
            style={{ backgroundColor: palette.primary, borderColor: palette.primary, color: "#fff" }}
          >
            Exportar PDF
          </button>
        </div>
        <p className="text-sm text-muted-foreground text-center">Evolução da gestação</p>
      </motion.div>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-2 py-2 rounded-full text-[10px] font-semibold leading-tight whitespace-nowrap transition-all ${
              tab === t.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Patient Card */}
      <motion.div
        className="mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <LiquidCard className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-full bg-coral-light flex items-center justify-center">
            <span className="text-sm font-bold text-primary">MS</span>
          </div>
          <div>
            <h2 className="font-semibold text-foreground text-sm">{patientInfo.name}</h2>
            <p className="text-xs text-muted-foreground">{patientInfo.age} anos • Tipo sanguíneo: {patientInfo.bloodType}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="bg-muted rounded-xl px-3 py-2 flex-1 text-center">
            <p className="text-[10px] text-muted-foreground">Semana</p>
            <p className="font-bold text-foreground">{patientInfo.weeks}</p>
          </div>
          <div className="bg-muted rounded-xl px-3 py-2 flex-1 text-center">
            <p className="text-[10px] text-muted-foreground">DPP</p>
            <p className="font-bold text-foreground text-sm">{patientInfo.dpp}</p>
          </div>
        </div>
        </LiquidCard>
      </motion.div>

      {tab === "resumo" && <ResumoTab timelineEntries={timelineEntries} vitals={vitals} />}
      {tab === "lancamentos" && (
        <LancamentosTab
          lancamentos={lancamentos}
          showForm={showForm}
          setShowForm={setShowForm}
          form={form}
          setForm={setForm}
          onAdd={handleAddLancamento}
          inputClass={inputClass}
          dum={patientInfo.dum}
        />
      )}
      {tab === "vacinas" && (
        <VacinasExamesTab
          items={vacinasExames}
          onAdd={handleAddVacinaExame}
          inputClass={inputClass}
        />
      )}
      {tab === "graficos" && <GraficosTab palette={palette} dum={patientInfo.dum} />}
    </div>
  );
}

/* ========== RESUMO TAB ========== */
function ResumoTab({ timelineEntries, vitals }: { timelineEntries: TimelineEntry[]; vitals: { label: string; value: string; change: string; color: string }[] }) {
  const sorted = [...timelineEntries].sort((a, b) => b.week - a.week);

  const typeColors: Record<string, string> = {
    consulta: "bg-border",
    vacina: "bg-green-400",
    exame: "bg-blue-400",
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h3 className="font-display font-semibold text-lg text-foreground mb-3">Sinais vitais</h3>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {vitals.map((v, i) => (
          <motion.div
            key={v.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
          >
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
      <div className="flex gap-3 mb-3">
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><span className="w-2 h-2 rounded-full bg-border inline-block" /> Consulta</span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Vacina</span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Exame</span>
      </div>
      <div className="relative">
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />
        <div className="space-y-4">
          {sorted.map((item, i) => (
            <motion.div
              key={item.id}
              className="relative pl-10"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <div className={`absolute left-1.5 w-3 h-3 rounded-full ${item.status === "upcoming" ? "bg-primary ring-2 ring-primary/30" : typeColors[item.type] || "bg-border"}`} />
              <div className={`bg-card rounded-xl p-3 shadow-sm border ${item.status === "upcoming" ? "border-primary/30" : "border-border"}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-primary">Semana {item.week}</span>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                      item.type === "vacina" ? "bg-green-100 text-green-700" :
                      item.type === "exame" ? "bg-blue-100 text-blue-700" :
                      "bg-muted text-muted-foreground"
                    }`}>{item.type}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.date}</span>
                </div>
                <h4 className="font-medium text-sm text-foreground">{item.event}</h4>
                <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                {item.anexoNome && (
                  <button
                    onClick={() => item.anexoUrl && window.open(item.anexoUrl, "_blank")}
                    className="mt-2 text-xs text-primary font-semibold underline"
                  >
                    {item.anexoNome}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ========== LANÇAMENTOS TAB ========== */
function LancamentosTab({
  lancamentos, showForm, setShowForm, form, setForm, onAdd, inputClass, dum,
}: {
  lancamentos: Lancamento[];
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  form: { semana: string; data: string; peso: string; pressaoSis: string; pressaoDia: string; alturaUterina: string; bcf: string; edema: string; observacoes: string };
  setForm: React.Dispatch<React.SetStateAction<{ semana: string; data: string; peso: string; pressaoSis: string; pressaoDia: string; alturaUterina: string; bcf: string; edema: string; observacoes: string }>>;
  onAdd: () => void;
  inputClass: string;
  dum: string;
}) {
  const update = (field: string, value: string) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      // Quando a data muda, recalcula automaticamente a semana gestacional
      if (field === "data") {
        const semana = semanaGestacional(value, dum);
        if (semana > 0) next.semana = String(semana);
      }
      return next;
    });
  };

  // Converte yyyy-mm-dd (input date) <-> dd/mm/yyyy (formato BR usado no estado)
  const dataParaInput = (br: string) => {
    const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
  };
  const dataDoInput = (iso: string) => {
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-lg text-foreground">Dados Clínicos</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground"
        >
          {showForm ? "Cancelar" : "Novo Lançamento"}
        </button>
      </div>

      {showForm && (
        <motion.div
          className="bg-card rounded-2xl p-4 shadow-sm border border-border mb-4 space-y-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Data da consulta</label>
              <input
                className={inputClass}
                type="date"
                value={dataParaInput(form.data)}
                onChange={e => update("data", dataDoInput(e.target.value))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Semana</label>
              <div className={`${inputClass} flex items-center bg-muted/50`}>
                <span className="font-semibold text-foreground">{form.semana || "—"}ª semana</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Peso (kg)</label>
              <input className={inputClass} type="text" placeholder="Ex: 68,5" value={form.peso} onChange={e => update("peso", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Altura Uterina (cm)</label>
              <input className={inputClass} type="text" placeholder="Ex: 24" value={form.alturaUterina} onChange={e => update("alturaUterina", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">PA Sistólica</label>
              <input className={inputClass} type="text" placeholder="Ex: 110" value={form.pressaoSis} onChange={e => update("pressaoSis", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">PA Diastólica</label>
              <input className={inputClass} type="text" placeholder="Ex: 70" value={form.pressaoDia} onChange={e => update("pressaoDia", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">BCF (bpm)</label>
              <input className={inputClass} type="text" placeholder="Ex: 142" value={form.bcf} onChange={e => update("bcf", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Edema</label>
              <select className={inputClass} value={form.edema} onChange={e => update("edema", e.target.value)}>
                <option>Ausente</option>
                <option>+ (leve)</option>
                <option>++ (moderado)</option>
                <option>+++ (grave)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Observações</label>
            <textarea
              className={`${inputClass} h-16 resize-none`}
              placeholder="Observações da consulta..."
              value={form.observacoes}
              onChange={e => update("observacoes", e.target.value)}
            />
          </div>
          <button
            onClick={onAdd}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
          >
            Salvar Lançamento
          </button>
        </motion.div>
      )}

      <div className="space-y-3">
        {lancamentos.map((l, i) => (
          <motion.div
            key={l.id}
            className="bg-card rounded-2xl p-4 shadow-sm border border-border"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-primary">Semana {l.semana}</span>
              <span className="text-xs text-muted-foreground">{l.data}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div>
                <p className="text-[10px] text-muted-foreground">Peso</p>
                <p className="text-xs font-semibold text-foreground">{l.peso} kg</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">PA</p>
                <p className="text-xs font-semibold text-foreground">{l.pressaoSis}/{l.pressaoDia}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">BCF</p>
                <p className="text-xs font-semibold text-foreground">{l.bcf} bpm</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <p className="text-[10px] text-muted-foreground">Alt. Uterina</p>
                <p className="text-xs font-semibold text-foreground">{l.alturaUterina} cm</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Edema</p>
                <p className="text-xs font-semibold text-foreground">{l.edema}</p>
              </div>
            </div>
            {l.observacoes && (
              <p className="text-xs text-muted-foreground mt-1 border-t border-border pt-2">{l.observacoes}</p>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ========== VACINAS/EXAMES TAB ========== */
function VacinasExamesTab({
  items, onAdd, inputClass,
}: {
  items: VacinaExame[];
  onAdd: (item: VacinaExame) => void;
  inputClass: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [filtro, setFiltro] = useState<"todos" | "vacina" | "exame">("todos");
  const fileRef = useRef<HTMLInputElement>(null);
  const [anexo, setAnexo] = useState<{ url: string; nome: string } | null>(null);

  const [form, setForm] = useState({
    tipo: "vacina" as "vacina" | "exame",
    nome: "",
    data: "",
    semana: "",
    status: "realizado" as "realizado" | "pendente" | "agendado",
    resultado: "",
    observacoes: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAnexo({ url, nome: file.name });
  };

  const handleSubmit = () => {
    if (!form.nome || !form.data || !form.semana) return;
    const novo: VacinaExame = {
      id: Date.now(),
      tipo: form.tipo,
      nome: form.nome,
      data: form.data,
      semana: Number(form.semana),
      status: form.status,
      resultado: form.resultado || undefined,
      observacoes: form.observacoes || undefined,
      anexoUrl: anexo?.url,
      anexoNome: anexo?.nome,
    };
    onAdd(novo);
    setForm({ tipo: "vacina", nome: "", data: "", semana: "", status: "realizado", resultado: "", observacoes: "" });
    setAnexo(null);
    setShowForm(false);
  };

  const filtered = filtro === "todos" ? items : items.filter(i => i.tipo === filtro);
  const realizados = filtered.filter(i => i.status === "realizado");
  const pendentes = filtered.filter(i => i.status !== "realizado");

  const statusStyle: Record<string, string> = {
    realizado: "bg-green-100 text-green-700",
    pendente: "bg-yellow-100 text-yellow-700",
    agendado: "bg-blue-100 text-blue-700",
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-lg text-foreground">Vacinas e Exames</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground"
        >
          {showForm ? "Cancelar" : "Novo Registro"}
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {(["todos", "vacina", "exame"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              filtro === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {f === "todos" ? "Todos" : f === "vacina" ? "Vacinas" : "Exames"}
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <motion.div
          className="bg-card rounded-2xl p-4 shadow-sm border border-border mb-4 space-y-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo</label>
              <select className={inputClass} value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value as "vacina" | "exame" }))}>
                <option value="vacina">Vacina</option>
                <option value="exame">Exame</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
              <select className={inputClass} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as "realizado" | "pendente" | "agendado" }))}>
                <option value="realizado">Realizado</option>
                <option value="pendente">Pendente</option>
                <option value="agendado">Agendado</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome</label>
            <input className={inputClass} placeholder="Ex: Ultrassom morfológico" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Data</label>
              <input className={inputClass} placeholder="DD/MM/AAAA" value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Semana</label>
              <input className={inputClass} type="number" placeholder="Ex: 24" value={form.semana} onChange={e => setForm(p => ({ ...p, semana: e.target.value }))} />
            </div>
          </div>
          {form.tipo === "exame" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Resultado</label>
              <input className={inputClass} placeholder="Ex: Normal" value={form.resultado} onChange={e => setForm(p => ({ ...p, resultado: e.target.value }))} />
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Observações</label>
            <textarea
              className={`${inputClass} h-14 resize-none`}
              placeholder="Observações..."
              value={form.observacoes}
              onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))}
            />
          </div>
          {/* Anexo */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Anexo (PDF, imagem)</label>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFileChange} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={`${inputClass} text-left ${anexo ? "text-primary font-semibold" : "text-muted-foreground"}`}
            >
              {anexo ? anexo.nome : "Selecionar arquivo..."}
            </button>
          </div>
          <button
            onClick={handleSubmit}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
          >
            Salvar Registro
          </button>
        </motion.div>
      )}

      {/* Pendentes / Agendados */}
      {pendentes.length > 0 && (
        <div className="mb-5">
          <h4 className="font-semibold text-sm text-foreground mb-2 uppercase tracking-wide">Pendentes / Agendados</h4>
          <div className="space-y-3">
            {pendentes.map((item, i) => (
              <motion.div
                key={item.id}
                className="bg-card rounded-2xl p-4 shadow-sm border-2 border-primary/20"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${item.tipo === "vacina" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                      {item.tipo}
                    </span>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${statusStyle[item.status]}`}>
                      {item.status}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">Sem. {item.semana}</span>
                </div>
                <h4 className="font-semibold text-sm text-foreground mt-1">{item.nome}</h4>
                <p className="text-xs text-muted-foreground">{item.data}</p>
                {item.observacoes && <p className="text-xs text-muted-foreground mt-1">{item.observacoes}</p>}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Realizados */}
      {realizados.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-foreground mb-2 uppercase tracking-wide">Realizados</h4>
          <div className="space-y-3">
            {realizados.map((item, i) => (
              <motion.div
                key={item.id}
                className="bg-card rounded-2xl p-4 shadow-sm border border-border"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${item.tipo === "vacina" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                      {item.tipo}
                    </span>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${statusStyle[item.status]}`}>
                      {item.status}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">Sem. {item.semana}</span>
                </div>
                <h4 className="font-semibold text-sm text-foreground mt-1">{item.nome}</h4>
                <p className="text-xs text-muted-foreground">{item.data}</p>
                {item.resultado && <p className="text-xs text-foreground mt-1">Resultado: {item.resultado}</p>}
                {item.observacoes && <p className="text-xs text-muted-foreground mt-1">{item.observacoes}</p>}
                {item.anexoNome && (
                  <button
                    onClick={() => item.anexoUrl && window.open(item.anexoUrl, "_blank")}
                    className="mt-2 text-xs text-primary font-semibold underline"
                  >
                    Ver/Baixar: {item.anexoNome}
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ========== GRÁFICOS TAB ========== */
type Palette = ReturnType<typeof paletaPorSexo>;

type Periodo = "todos" | "1tri" | "2tri" | "3tri" | "custom";

function GraficosTab({ palette, dum }: { palette: Palette; dum: string }) {
  const chartCard = "bg-card rounded-2xl p-4 shadow-sm border border-border";
  const chartTitle = "font-display font-semibold text-sm text-foreground mb-3";

  const [periodo, setPeriodo] = useState<Periodo>("todos");
  // Para "custom" — calendário por data (DUM ⇒ semana)
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");

  // Converte data ISO (yyyy-mm-dd) → semana gestacional
  const dataParaSemana = (iso: string): number | null => {
    if (!iso) return null;
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const br = `${m[3]}/${m[2]}/${m[1]}`;
    const s = semanaGestacional(br, dum);
    return s > 0 ? s : null;
  };

  const range = useMemo(() => {
    if (periodo === "1tri") return { min: 1, max: 13 };
    if (periodo === "2tri") return { min: 14, max: 27 };
    if (periodo === "3tri") return { min: 28, max: 42 };
    if (periodo === "custom") {
      const min = dataParaSemana(dataInicio) ?? 1;
      const max = dataParaSemana(dataFim) ?? 42;
      return { min: Math.min(min, max), max: Math.max(min, max) };
    }
    return { min: 0, max: 42 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo, dataInicio, dataFim]);

  const filtrar = <T extends { semana: number }>(arr: T[]) =>
    arr.filter(d => d.semana >= range.min && d.semana <= range.max);

  const pesoFiltrado = filtrar(pesoData);
  const pressaoFiltrada = filtrar(pressaoData);
  const auFiltrada = filtrar(alturaUterinaData);
  const bcfFiltrado = filtrar(bcfData);

  const filtros: { key: Periodo; label: string }[] = [
    { key: "todos", label: "Evolução Total" },
    { key: "1tri", label: "1º Trim." },
    { key: "2tri", label: "2º Trim." },
    { key: "3tri", label: "3º Trim." },
    { key: "custom", label: "Calendário" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Filtros inteligentes */}
      <div className="bg-card rounded-2xl p-3 shadow-sm border border-border">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Filtrar período</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {filtros.map(f => {
            const ativo = periodo === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setPeriodo(f.key)}
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
        </div>
        {periodo === "custom" && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Início</label>
              <input
                type="date"
                value={dataInicio}
                onChange={e => setDataInicio(e.target.value)}
                className="w-full h-9 text-xs rounded-xl border border-border bg-background px-2"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Fim</label>
              <input
                type="date"
                value={dataFim}
                onChange={e => setDataFim(e.target.value)}
                className="w-full h-9 text-xs rounded-xl border border-border bg-background px-2"
              />
            </div>
          </div>
        )}
        <p className="text-[10px] text-muted-foreground mt-2">
          Mostrando semana {range.min} → {range.max}
        </p>
      </div>

      <div className={chartCard}>
        <h4 className={chartTitle}>Curva de Peso (kg)</h4>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={pesoFiltrado}>
            <defs>
              <linearGradient id="pesoGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={palette.primary} stopOpacity={0.3} />
                <stop offset="100%" stopColor={palette.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="semana" tick={{ fontSize: 10 }} label={{ value: "Semana", position: "insideBottomRight", offset: -5, fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} domain={["dataMin - 2", "dataMax + 2"]} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
            <Area type="monotone" dataKey="peso" stroke={palette.primary} fill="url(#pesoGrad)" strokeWidth={2} dot={{ r: 4, fill: palette.primary }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className={chartCard}>
        <h4 className={chartTitle}>Pressão Arterial (mmHg)</h4>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={pressaoFiltrada}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="semana" tick={{ fontSize: 10 }} label={{ value: "Semana", position: "insideBottomRight", offset: -5, fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} domain={[50, 140]} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
            <Line type="monotone" dataKey="sistolica" name="Sistólica" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="diastolica" name="Diastólica" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className={chartCard}>
        <h4 className={chartTitle}>Altura Uterina (cm)</h4>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={auFiltrada}>
            <defs>
              <linearGradient id="auGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={palette.accent} stopOpacity={0.3} />
                <stop offset="100%" stopColor={palette.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="semana" tick={{ fontSize: 10 }} label={{ value: "Semana", position: "insideBottomRight", offset: -5, fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} domain={[0, 40]} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
            <Area type="monotone" dataKey="altura" stroke={palette.accent} fill="url(#auGrad)" strokeWidth={2} dot={{ r: 4, fill: palette.accent }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className={chartCard}>
        <h4 className={chartTitle}>Batimentos Cardíacos Fetais (bpm)</h4>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={bcfFiltrado}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="semana" tick={{ fontSize: 10 }} label={{ value: "Semana", position: "insideBottomRight", offset: -5, fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} domain={[100, 180]} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
            <Line type="monotone" dataKey="bcf" name="BCF" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: "#10b981" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

/* ========== Geração de PDF ========== */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function gerarPDFCartao(args: {
  patientInfo: { name: string; age: string | number; bloodType: string; dum: string; dpp: string; weeks: string | number };
  vitals: { label: string; value: string; change: string }[];
  lancamentos: Lancamento[];
  vacinasExames: VacinaExame[];
  timelineEntries: TimelineEntry[];
  palette: Palette;
}) {
  const { patientInfo, vitals, lancamentos, vacinasExames, timelineEntries, palette } = args;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 0;

  const [pr, pg, pb] = hexToRgb(palette.primary);
  const [lr, lg, lb] = hexToRgb(palette.primaryLight);

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const sectionHeader = (title: string) => {
    ensureSpace(12);
    doc.setFillColor(pr, pg, pb);
    doc.rect(margin, y, pageW - margin * 2, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title, margin + 3, y + 5);
    y += 10;
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  };

  const linhaTexto = (texto: string, opts: { bold?: boolean; size?: number } = {}) => {
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(opts.size ?? 10);
    const lines = doc.splitTextToSize(texto, pageW - margin * 2);
    ensureSpace(lines.length * 5 + 1);
    doc.text(lines, margin, y);
    y += lines.length * 5;
  };

  // ===== CAPA / Cabeçalho colorido =====
  doc.setFillColor(pr, pg, pb);
  doc.rect(0, 0, pageW, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Cartão Digital da Gestante", pageW / 2, 16, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Sexo do bebê: ${palette.label}`, pageW / 2, 24, { align: "center" });
  doc.setFontSize(9);
  doc.text(`Emitido em ${formatBR(new Date())}`, pageW / 2, 31, { align: "center" });
  y = 46;

  // ===== Dados da gestante =====
  doc.setFillColor(lr, lg, lb);
  doc.rect(margin, y, pageW - margin * 2, 28, "F");
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(patientInfo.name, margin + 4, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`${patientInfo.age} anos  •  Tipo sanguíneo: ${patientInfo.bloodType}`, margin + 4, y + 13);
  doc.text(`DUM: ${patientInfo.dum}`, margin + 4, y + 19);
  doc.text(`DPP: ${patientInfo.dpp}`, margin + 4, y + 25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(pr, pg, pb);
  doc.text(`${patientInfo.weeks}ª`, pageW - margin - 18, y + 17, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("semana", pageW - margin - 18, y + 23, { align: "center" });
  y += 34;

  // ===== Sinais vitais =====
  if (vitals.length) {
    sectionHeader("Sinais vitais");
    vitals.forEach(v => {
      linhaTexto(`• ${v.label}: ${v.value}  (${v.change})`);
    });
    y += 2;
  }

  // ===== Dados clínicos =====
  if (lancamentos.length) {
    sectionHeader("Dados clínicos / Lançamentos");
    lancamentos.forEach(l => {
      ensureSpace(20);
      doc.setDrawColor(pr, pg, pb);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageW - margin, y);
      y += 3;
      linhaTexto(`Semana ${l.semana}  —  ${l.data}`, { bold: true });
      linhaTexto(`Peso: ${l.peso} kg  |  PA: ${l.pressaoSis}/${l.pressaoDia} mmHg  |  BCF: ${l.bcf} bpm`);
      linhaTexto(`Alt. Uterina: ${l.alturaUterina} cm  |  Edema: ${l.edema}`);
      if (l.observacoes) linhaTexto(`Obs: ${l.observacoes}`);
      y += 2;
    });
  }

  // ===== Vacinas =====
  const vacinas = vacinasExames.filter(v => v.tipo === "vacina");
  if (vacinas.length) {
    sectionHeader("Vacinas");
    vacinas.forEach(v => {
      ensureSpace(10);
      linhaTexto(`• ${v.nome}  —  Sem. ${v.semana}  —  ${v.data}  [${v.status}]`, { bold: true });
      if (v.observacoes) linhaTexto(`  ${v.observacoes}`);
    });
    y += 2;
  }

  // ===== Exames =====
  const exames = vacinasExames.filter(v => v.tipo === "exame");
  if (exames.length) {
    sectionHeader("Exames");
    exames.forEach(ex => {
      ensureSpace(12);
      linhaTexto(`• ${ex.nome}  —  Sem. ${ex.semana}  —  ${ex.data}  [${ex.status}]`, { bold: true });
      if (ex.resultado) linhaTexto(`  Resultado: ${ex.resultado}`);
      if (ex.observacoes) linhaTexto(`  Obs: ${ex.observacoes}`);
      if (ex.anexoNome) linhaTexto(`  Anexo: ${ex.anexoNome}`);
    });
    y += 2;
  }

  // ===== Consultas / Linha do tempo =====
  if (timelineEntries.length) {
    sectionHeader("Linha do tempo / Consultas");
    [...timelineEntries].sort((a, b) => b.week - a.week).forEach(t => {
      ensureSpace(10);
      linhaTexto(`• Semana ${t.week} (${t.date}) — ${t.event}  [${t.type}]`, { bold: true });
      if (t.notes) linhaTexto(`  ${t.notes}`);
    });
    y += 2;
  }

  // ===== Gráficos (resumo de dados) =====
  sectionHeader("Evolução — dados dos gráficos");
  const drawDataset = (titulo: string, dados: { semana: number; valor: string }[]) => {
    if (!dados.length) return;
    ensureSpace(10);
    linhaTexto(titulo, { bold: true });
    const txt = dados.map(d => `Sem ${d.semana}: ${d.valor}`).join("  •  ");
    linhaTexto(txt);
    y += 1;
  };
  drawDataset("Peso (kg)", pesoData.map(d => ({ semana: d.semana, valor: String(d.peso) })));
  drawDataset("Pressão Arterial (mmHg)", pressaoData.map(d => ({ semana: d.semana, valor: `${d.sistolica}/${d.diastolica}` })));
  drawDataset("Altura Uterina (cm)", alturaUterinaData.map(d => ({ semana: d.semana, valor: String(d.altura) })));
  drawDataset("BCF (bpm)", bcfData.map(d => ({ semana: d.semana, valor: String(d.bcf) })));

  // Rodapé em todas as páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(pr, pg, pb);
    doc.rect(0, pageH - 8, pageW, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Cartão da Gestante — ${patientInfo.name}`, margin, pageH - 3);
    doc.text(`${i} / ${totalPages}`, pageW - margin, pageH - 3, { align: "right" });
  }

  const safeName = patientInfo.name.replace(/\s+/g, "_");
  doc.save(`cartao_gestante_${safeName}.pdf`);
}
