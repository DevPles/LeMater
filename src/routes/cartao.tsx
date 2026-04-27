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
  // Para "custom" — calendário inteligente com range
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const dateToSemana = (d: Date | undefined): number | null => {
    if (!d) return null;
    const br = formatBR(d);
    const s = semanaGestacional(br, dum);
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

  const pesoFiltrado = filtrar(pesoData);
  const pressaoFiltrada = filtrar(pressaoData);
  const auFiltrada = filtrar(alturaUterinaData);
  const bcfFiltrado = filtrar(bcfData);

  const filtros: { key: Exclude<Periodo, "custom">; label: string }[] = [
    { key: "todos", label: "Evolução Total" },
    { key: "1tri", label: "1º Trim." },
    { key: "2tri", label: "2º Trim." },
    { key: "3tri", label: "3º Trim." },
  ];

  const calendarioAtivo = periodo === "custom";
  const labelCalendario = range?.from && range?.to
    ? `${format(range.from, "dd/MM", { locale: ptBR })} → ${format(range.to, "dd/MM", { locale: ptBR })}`
    : range?.from
      ? format(range.from, "dd/MM/yyyy", { locale: ptBR })
      : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Filtros inteligentes */}
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

          {/* Botão de calendário (ícone) */}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                onClick={() => setPeriodo("custom")}
                className="px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all border inline-flex items-center gap-1.5"
                style={{
                  backgroundColor: calendarioAtivo ? palette.primary : "transparent",
                  color: calendarioAtivo ? "#fff" : palette.primary,
                  borderColor: palette.primary,
                }}
                aria-label="Selecionar intervalo no calendário"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                {labelCalendario ?? "Calendário"}
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 pointer-events-auto"
              align="start"
              sideOffset={6}
            >
              <Calendar
                mode="range"
                selected={range}
                onSelect={(r) => {
                  setRange(r);
                  setPeriodo("custom");
                  if (r?.from && r?.to) setCalendarOpen(false);
                }}
                numberOfMonths={2}
                locale={ptBR}
                defaultMonth={range?.from ?? (parseBR(dum) ?? new Date())}
                className="p-3 pointer-events-auto"
              />
              <div className="flex items-center justify-between gap-2 p-2 border-t border-border">
                <button
                  onClick={() => { setRange(undefined); setPeriodo("todos"); setCalendarOpen(false); }}
                  className="text-[11px] font-semibold text-muted-foreground hover:text-foreground px-2 py-1"
                >
                  Limpar
                </button>
                <button
                  onClick={() => setCalendarOpen(false)}
                  className="text-[11px] font-semibold px-3 py-1 rounded-full text-white"
                  style={{ backgroundColor: palette.primary }}
                >
                  Aplicar
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Mostrando semana {semanaRange.min} → {semanaRange.max}
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
  patientInfo: {
    name: string; age: string | number; bloodType: string;
    dum: string; dpp: string; weeks: string | number;
    email?: string | null; telefone?: string | null;
  };
  vitals: { label: string; value: string; change: string }[];
  lancamentos: Lancamento[];
  vacinasExames: VacinaExame[];
  timelineEntries: TimelineEntry[];
  palette: Palette;
  charts: {
    peso: { semana: number; peso: number }[];
    pressao: { semana: number; sistolica: number; diastolica: number }[];
    altura: { semana: number; altura: number }[];
    bcf: { semana: number; bcf: number }[];
  };
}) {
  const { patientInfo, vitals, lancamentos, vacinasExames, timelineEntries, palette, charts } = args;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 0;

  const [pr, pg, pb] = hexToRgb(palette.primary);
  const [lr, lg, lb] = hexToRgb(palette.primaryLight);
  const [ar, ag, ab] = hexToRgb(palette.accent);
  const muted: [number, number, number] = [110, 110, 120];
  const dark: [number, number, number] = [32, 32, 40];

  const drawFooter = (pageNum: number, totalPages: number) => {
    doc.setFillColor(pr, pg, pb);
    doc.rect(0, pageH - 9, pageW, 9, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("MãeDigital — Cartão Digital da Gestante", margin, pageH - 3.5);
    doc.setFont("helvetica", "normal");
    doc.text(`Pág. ${pageNum} de ${totalPages}`, pageW - margin, pageH - 3.5, { align: "right" });
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - margin - 10) {
      doc.addPage();
      y = margin + 4;
    }
  };

  const sectionHeader = (title: string) => {
    ensureSpace(14);
    // Barra colorida + ponto de destaque
    doc.setFillColor(pr, pg, pb);
    doc.roundedRect(margin, y, pageW - margin * 2, 8, 1.5, 1.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title.toUpperCase(), margin + 4, y + 5.6);
    y += 12;
    doc.setTextColor(...dark);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  };

  const linhaTexto = (texto: string, opts: { bold?: boolean; size?: number; color?: [number, number, number] } = {}) => {
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(opts.size ?? 9.5);
    doc.setTextColor(...(opts.color ?? dark));
    const lines = doc.splitTextToSize(texto, pageW - margin * 2 - 4);
    ensureSpace(lines.length * 4.6 + 1);
    doc.text(lines, margin + 2, y + 3.2);
    y += lines.length * 4.6 + 0.5;
  };

  // ==================== CAPA ====================
  // Banner colorido com curva
  doc.setFillColor(pr, pg, pb);
  doc.rect(0, 0, pageW, 55, "F");
  // Onda decorativa
  doc.setFillColor(lr, lg, lb);
  doc.ellipse(pageW + 10, 55, 80, 18, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("MÃEDIGITAL", margin, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Cartão Digital da Gestante", margin, 19);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(patientInfo.name, margin, 35);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`${patientInfo.age} anos  •  Sangue ${patientInfo.bloodType}  •  Bebê: ${palette.label}`, margin, 42);
  doc.setFontSize(9);
  doc.text(`Emitido em ${formatBR(new Date())}`, margin, 48);

  y = 64;

  // ==================== KPIs principais ====================
  const kpiW = (pageW - margin * 2 - 6) / 3;
  const kpis = [
    { label: "SEMANA GESTACIONAL", value: `${patientInfo.weeks}ª`, sub: "atual" },
    { label: "DUM", value: patientInfo.dum, sub: "última menstruação" },
    { label: "DPP", value: patientInfo.dpp, sub: "data provável do parto" },
  ];
  kpis.forEach((k, i) => {
    const x = margin + i * (kpiW + 3);
    doc.setFillColor(lr, lg, lb);
    doc.roundedRect(x, y, kpiW, 22, 2.5, 2.5, "F");
    doc.setTextColor(...muted);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(k.label, x + 3, y + 5);
    doc.setTextColor(pr, pg, pb);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(k.value, x + 3, y + 13);
    doc.setTextColor(...muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(k.sub, x + 3, y + 18);
  });
  y += 28;

  // ==================== Contato ====================
  if (patientInfo.email || patientInfo.telefone) {
    doc.setDrawColor(220, 220, 225);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, y, pageW - margin * 2, 12, 2, 2);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.text("CONTATO", margin + 3, y + 4.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...dark);
    const contato = [
      patientInfo.telefone ? `Tel: ${patientInfo.telefone}` : null,
      patientInfo.email ? `E-mail: ${patientInfo.email}` : null,
    ].filter(Boolean).join("    •    ");
    doc.text(contato, margin + 3, y + 9.5);
    y += 16;
  }

  // ==================== Sinais vitais ====================
  if (vitals.length) {
    sectionHeader("Sinais vitais");
    const cellW = (pageW - margin * 2 - (vitals.length - 1) * 3) / vitals.length;
    vitals.forEach((v, i) => {
      const x = margin + i * (cellW + 3);
      doc.setFillColor(248, 248, 252);
      doc.roundedRect(x, y, cellW, 22, 2, 2, "F");
      // barrinha colorida no topo
      doc.setFillColor(ar, ag, ab);
      doc.roundedRect(x, y, cellW, 2.5, 1, 1, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...muted);
      doc.text(v.label.toUpperCase(), x + 2.5, y + 7);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...dark);
      doc.text(v.value, x + 2.5, y + 14);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(pr, pg, pb);
      doc.text(v.change, x + 2.5, y + 19);
    });
    y += 27;
  }

  // ==================== GRÁFICOS NATIVOS ====================
  sectionHeader("Evolução clínica — gráficos");

  /** Desenha um line/area chart simples no PDF. */
  const drawChart = (
    title: string,
    series: { color: [number, number, number]; values: { x: number; y: number }[]; fill?: boolean; name?: string }[],
    yLabel: string,
  ) => {
    const chartH = 50;
    const chartW = pageW - margin * 2;
    ensureSpace(chartH + 14);

    // Card
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(225, 225, 230);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, y, chartW, chartH + 12, 2, 2, "FD");

    // Título
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...dark);
    doc.text(title, margin + 4, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...muted);
    doc.text(yLabel, pageW - margin - 4, y + 6, { align: "right" });

    // Área de plotagem
    const plotX = margin + 12;
    const plotY = y + 10;
    const plotW = chartW - 16;
    const plotH = chartH - 4;

    // Coleta limites
    const allX = series.flatMap(s => s.values.map(v => v.x));
    const allY = series.flatMap(s => s.values.map(v => v.y));
    if (allX.length === 0) { y += chartH + 14; return; }
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY);
    const padY = (maxY - minY) * 0.15 || 1;
    const yLo = minY - padY;
    const yHi = maxY + padY;

    const sx = (v: number) => plotX + ((v - minX) / Math.max(1, maxX - minX)) * plotW;
    const sy = (v: number) => plotY + plotH - ((v - yLo) / Math.max(0.0001, yHi - yLo)) * plotH;

    // Grid horizontal (4 linhas) + labels Y
    doc.setDrawColor(235, 235, 240);
    doc.setLineWidth(0.15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...muted);
    for (let i = 0; i <= 4; i++) {
      const yy = plotY + (plotH / 4) * i;
      doc.line(plotX, yy, plotX + plotW, yy);
      const val = yHi - ((yHi - yLo) / 4) * i;
      doc.text(val.toFixed(0), plotX - 1.5, yy + 1, { align: "right" });
    }
    // Eixo X labels (semanas)
    series[0].values.forEach(p => {
      doc.text(`${p.x}`, sx(p.x), plotY + plotH + 4, { align: "center" });
    });
    doc.setFontSize(6.5);
    doc.text("Semana", plotX + plotW / 2, plotY + plotH + 7.5, { align: "center" });

    // Desenhar séries
    series.forEach(s => {
      if (s.values.length === 0) return;
      // Área (preenchimento sob a linha)
      if (s.fill) {
        doc.setFillColor(s.color[0], s.color[1], s.color[2]);
        // simulando opacidade baixa via cor mais clara
        const lightR = Math.min(255, s.color[0] + (255 - s.color[0]) * 0.75);
        const lightG = Math.min(255, s.color[1] + (255 - s.color[1]) * 0.75);
        const lightB = Math.min(255, s.color[2] + (255 - s.color[2]) * 0.75);
        doc.setFillColor(lightR, lightG, lightB);
        // Polígono manual: pontos + base
        for (let i = 0; i < s.values.length - 1; i++) {
          const p1 = s.values[i];
          const p2 = s.values[i + 1];
          const x1 = sx(p1.x), y1 = sy(p1.y);
          const x2 = sx(p2.x), y2 = sy(p2.y);
          const baseY = plotY + plotH;
          doc.triangle(x1, y1, x2, y2, x1, baseY, "F");
          doc.triangle(x2, y2, x2, baseY, x1, baseY, "F");
        }
      }
      // Linha
      doc.setDrawColor(s.color[0], s.color[1], s.color[2]);
      doc.setLineWidth(0.6);
      for (let i = 0; i < s.values.length - 1; i++) {
        doc.line(sx(s.values[i].x), sy(s.values[i].y), sx(s.values[i + 1].x), sy(s.values[i + 1].y));
      }
      // Pontos
      doc.setFillColor(s.color[0], s.color[1], s.color[2]);
      s.values.forEach(p => doc.circle(sx(p.x), sy(p.y), 0.9, "F"));
    });

    // Legenda
    if (series.some(s => s.name)) {
      let lx = plotX;
      const ly = y + chartH + 9;
      series.forEach(s => {
        if (!s.name) return;
        doc.setFillColor(s.color[0], s.color[1], s.color[2]);
        doc.circle(lx + 1, ly - 1, 1, "F");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...dark);
        doc.text(s.name, lx + 3.5, ly);
        lx += doc.getTextWidth(s.name) + 10;
      });
    }

    y += chartH + 14;
  };

  drawChart("Curva de Peso",
    [{ color: [pr, pg, pb], values: charts.peso.map(d => ({ x: d.semana, y: d.peso })), fill: true, name: "Peso (kg)" }],
    "kg");

  drawChart("Pressão Arterial",
    [
      { color: [239, 68, 68], values: charts.pressao.map(d => ({ x: d.semana, y: d.sistolica })), name: "Sistólica" },
      { color: [59, 130, 246], values: charts.pressao.map(d => ({ x: d.semana, y: d.diastolica })), name: "Diastólica" },
    ],
    "mmHg");

  drawChart("Altura Uterina",
    [{ color: [ar, ag, ab], values: charts.altura.map(d => ({ x: d.semana, y: d.altura })), fill: true, name: "Altura (cm)" }],
    "cm");

  drawChart("Batimentos Cardíacos Fetais",
    [{ color: [16, 185, 129], values: charts.bcf.map(d => ({ x: d.semana, y: d.bcf })), name: "BCF" }],
    "bpm");

  // ==================== Lançamentos clínicos ====================
  if (lancamentos.length) {
    sectionHeader("Dados clínicos / Lançamentos");
    lancamentos.forEach(l => {
      ensureSpace(22);
      // Card
      doc.setFillColor(250, 250, 253);
      doc.setDrawColor(230, 230, 235);
      doc.roundedRect(margin, y, pageW - margin * 2, 20, 2, 2, "FD");
      // Etiqueta semana
      doc.setFillColor(pr, pg, pb);
      doc.roundedRect(margin + 3, y + 3, 22, 6, 1, 1, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(`SEM ${l.semana}`, margin + 14, y + 7, { align: "center" });
      // Data
      doc.setTextColor(...muted);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(l.data, pageW - margin - 4, y + 7, { align: "right" });
      // Métricas em linha
      doc.setTextColor(...dark);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      const cols = [
        `Peso: ${l.peso} kg`,
        `PA: ${l.pressaoSis}/${l.pressaoDia}`,
        `BCF: ${l.bcf} bpm`,
        `AU: ${l.alturaUterina} cm`,
        `Edema: ${l.edema}`,
      ];
      const colW = (pageW - margin * 2 - 6) / cols.length;
      cols.forEach((c, i) => {
        doc.text(c, margin + 3 + i * colW, y + 14);
      });
      if (l.observacoes) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.5);
        doc.setTextColor(...muted);
        const obs = doc.splitTextToSize(`Obs: ${l.observacoes}`, pageW - margin * 2 - 6);
        doc.text(obs[0] ?? "", margin + 3, y + 18);
      }
      y += 23;
    });
  }

  // ==================== Vacinas ====================
  const vacinas = vacinasExames.filter(v => v.tipo === "vacina");
  if (vacinas.length) {
    sectionHeader("Vacinas");
    vacinas.forEach(v => {
      ensureSpace(11);
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(margin, y, pageW - margin * 2, 9, 1.5, 1.5, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(22, 101, 52);
      doc.text(v.nome, margin + 3, y + 5.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...muted);
      doc.text(`Sem ${v.semana}  •  ${v.data}  •  ${v.status.toUpperCase()}`, pageW - margin - 3, y + 5.5, { align: "right" });
      y += 11;
      if (v.observacoes) linhaTexto(`  ${v.observacoes}`, { color: muted, size: 8 });
    });
  }

  // ==================== Exames ====================
  const exames = vacinasExames.filter(v => v.tipo === "exame");
  if (exames.length) {
    sectionHeader("Exames");
    exames.forEach(ex => {
      ensureSpace(13);
      doc.setFillColor(239, 246, 255);
      doc.setDrawColor(191, 219, 254);
      doc.roundedRect(margin, y, pageW - margin * 2, 9, 1.5, 1.5, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(30, 64, 175);
      doc.text(ex.nome, margin + 3, y + 5.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...muted);
      doc.text(`Sem ${ex.semana}  •  ${ex.data}  •  ${ex.status.toUpperCase()}`, pageW - margin - 3, y + 5.5, { align: "right" });
      y += 11;
      if (ex.resultado) linhaTexto(`  Resultado: ${ex.resultado}`, { size: 8 });
      if (ex.observacoes) linhaTexto(`  Obs: ${ex.observacoes}`, { color: muted, size: 8 });
    });
  }

  // ==================== Linha do tempo ====================
  if (timelineEntries.length) {
    sectionHeader("Linha do tempo / Consultas");
    [...timelineEntries].sort((a, b) => b.week - a.week).forEach(t => {
      ensureSpace(11);
      // Bullet colorido
      const cor: [number, number, number] = t.type === "vacina" ? [34, 197, 94]
        : t.type === "exame" ? [59, 130, 246]
        : [pr, pg, pb];
      doc.setFillColor(...cor);
      doc.circle(margin + 2.5, y + 3, 1.6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...dark);
      doc.text(`Semana ${t.week} — ${t.event}`, margin + 7, y + 4);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...muted);
      doc.text(`${t.date} • ${t.type}`, pageW - margin - 3, y + 4, { align: "right" });
      y += 5;
      if (t.notes) {
        const lines = doc.splitTextToSize(t.notes, pageW - margin * 2 - 10);
        doc.setFontSize(8);
        doc.setTextColor(...muted);
        doc.text(lines, margin + 7, y + 3);
        y += lines.length * 4 + 1;
      }
      y += 2;
    });
  }

  // Rodapé em todas as páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }

  const safeName = patientInfo.name.replace(/\s+/g, "_");
  doc.save(`cartao_gestante_${safeName}.pdf`);
}
