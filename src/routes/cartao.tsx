import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { LiquidCard } from "@/components/LiquidCard";
import { useScreenContent } from "@/hooks/useScreenContent";
import { CARTAO_DEFAULT } from "@/components/admin/TelasTab";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from "recharts";

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
            onClick={() => window.print()}
            className="absolute right-0 top-9 shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border border-primary text-primary bg-background transition-all hover:bg-primary hover:text-primary-foreground"
          >
            Exportar
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
      {tab === "graficos" && <GraficosTab />}
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
function GraficosTab() {
  const chartCard = "bg-card rounded-2xl p-4 shadow-sm border border-border";
  const chartTitle = "font-display font-semibold text-sm text-foreground mb-3";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className={chartCard}>
        <h4 className={chartTitle}>Curva de Peso (kg)</h4>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={pesoData}>
            <defs>
              <linearGradient id="pesoGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="semana" tick={{ fontSize: 10 }} label={{ value: "Semana", position: "insideBottomRight", offset: -5, fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} domain={["dataMin - 2", "dataMax + 2"]} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
            <Area type="monotone" dataKey="peso" stroke="var(--primary)" fill="url(#pesoGrad)" strokeWidth={2} dot={{ r: 4, fill: "var(--primary)" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className={chartCard}>
        <h4 className={chartTitle}>Pressão Arterial (mmHg)</h4>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={pressaoData}>
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
          <AreaChart data={alturaUterinaData}>
            <defs>
              <linearGradient id="auGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="semana" tick={{ fontSize: 10 }} label={{ value: "Semana", position: "insideBottomRight", offset: -5, fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} domain={[0, 40]} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
            <Area type="monotone" dataKey="altura" stroke="#f59e0b" fill="url(#auGrad)" strokeWidth={2} dot={{ r: 4, fill: "#f59e0b" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className={chartCard}>
        <h4 className={chartTitle}>Batimentos Cardíacos Fetais (bpm)</h4>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={bcfData}>
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
