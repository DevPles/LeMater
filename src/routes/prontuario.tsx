import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from "recharts";

export const Route = createFileRoute("/prontuario")({
  head: () => ({
    meta: [
      { title: "Cartão Digital da Gestante — MãeDigital" },
      { name: "description", content: "Acompanhe o cartão digital da gestação e evolução do parto." },
    ],
  }),
  ssr: false,
  component: ProntuarioPage,
});

const patientInfo = {
  name: "Maria Silva",
  age: 28,
  bloodType: "O+",
  dpp: "15/07/2026",
  weeks: 24,
};

// --- Resumo data ---
const vitals = [
  { label: "Peso", value: "68,5 kg", change: "+2,1 kg", color: "bg-coral-light" },
  { label: "Pressão", value: "110/70", change: "Normal", color: "bg-mint-light" },
  { label: "Glicemia", value: "85 mg/dL", change: "Normal", color: "bg-warm" },
  { label: "BCF", value: "142 bpm", change: "Normal", color: "bg-blush" },
];

const timeline = [
  { week: 24, date: "10/04/2026", event: "Consulta pré-natal", notes: "Peso e pressão normais. Ultrassom sem alterações.", status: "done" },
  { week: 22, date: "27/03/2026", event: "Ultrassom morfológico", notes: "Desenvolvimento normal. Peso fetal 500g.", status: "done" },
  { week: 20, date: "13/03/2026", event: "Consulta pré-natal", notes: "Hemograma e glicemia em jejum solicitados.", status: "done" },
  { week: 16, date: "13/02/2026", event: "Consulta pré-natal", notes: "Início da suplementação de ferro.", status: "done" },
  { week: 12, date: "16/01/2026", event: "1º Ultrassom", notes: "Batimento cardíaco confirmado. Translucência nucal normal.", status: "done" },
  { week: 28, date: "08/05/2026", event: "Próxima consulta", notes: "Teste de tolerância à glicose agendado.", status: "upcoming" },
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

type Tab = "resumo" | "lancamentos" | "graficos";

function ProntuarioPage() {
  const [tab, setTab] = useState<Tab>("resumo");
  const [lancamentos, setLancamentos] = useState<Lancamento[]>(lancamentosIniciais);
  const [showForm, setShowForm] = useState(false);

  // New entry form state
  const [form, setForm] = useState({
    semana: "", data: "", peso: "", pressaoSis: "", pressaoDia: "",
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
    setForm({ semana: "", data: "", peso: "", pressaoSis: "", pressaoDia: "", alturaUterina: "", bcf: "", edema: "Ausente", observacoes: "" });
    setShowForm(false);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "resumo", label: "Resumo" },
    { key: "lancamentos", label: "Lançamentos" },
    { key: "graficos", label: "Gráficos" },
  ];

  const inputClass = "w-full h-9 text-sm rounded-xl border border-border bg-background px-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold font-display text-foreground mb-1">Cartão Digital da Gestante</h1>
        <p className="text-sm text-muted-foreground mb-4">Evolução da gestação</p>
      </motion.div>

      {/* Patient Card */}
      <motion.div
        className="bg-card rounded-2xl p-4 shadow-sm border border-border mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
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
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              tab === t.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "resumo" && <ResumoTab />}
      {tab === "lancamentos" && (
        <LancamentosTab
          lancamentos={lancamentos}
          showForm={showForm}
          setShowForm={setShowForm}
          form={form}
          setForm={setForm}
          onAdd={handleAddLancamento}
          inputClass={inputClass}
        />
      )}
      {tab === "graficos" && <GraficosTab />}
    </div>
  );
}

/* ========== RESUMO TAB ========== */
function ResumoTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h3 className="font-display font-semibold text-lg text-foreground mb-3">Sinais vitais</h3>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {vitals.map((v, i) => (
          <motion.div
            key={v.label}
            className="bg-card rounded-2xl p-4 shadow-sm border border-border"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
          >
            <div className={`w-8 h-2 rounded-full ${v.color} mb-3`} />
            <p className="text-xs text-muted-foreground">{v.label}</p>
            <p className="font-bold text-foreground">{v.value}</p>
            <p className="text-xs text-accent-foreground font-medium">{v.change}</p>
          </motion.div>
        ))}
      </div>

      <h3 className="font-display font-semibold text-lg text-foreground mb-3">Linha do tempo</h3>
      <div className="relative">
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />
        <div className="space-y-4">
          {timeline.map((item, i) => (
            <motion.div
              key={i}
              className="relative pl-10"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className={`absolute left-1.5 w-3 h-3 rounded-full ${item.status === "upcoming" ? "bg-primary" : "bg-border"}`} />
              <div className="bg-card rounded-xl p-3 shadow-sm border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-primary">Semana {item.week}</span>
                  <span className="text-xs text-muted-foreground">{item.date}</span>
                </div>
                <h4 className="font-medium text-sm text-foreground">{item.event}</h4>
                <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
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
  lancamentos, showForm, setShowForm, form, setForm, onAdd, inputClass,
}: {
  lancamentos: Lancamento[];
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  form: { semana: string; data: string; peso: string; pressaoSis: string; pressaoDia: string; alturaUterina: string; bcf: string; edema: string; observacoes: string };
  setForm: React.Dispatch<React.SetStateAction<{ semana: string; data: string; peso: string; pressaoSis: string; pressaoDia: string; alturaUterina: string; bcf: string; edema: string; observacoes: string }>>;
  onAdd: () => void;
  inputClass: string;
}) {
  const update = (field: string, value: string) => setForm({ ...form, [field]: value });

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
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Semana</label>
              <input className={inputClass} type="number" placeholder="Ex: 24" value={form.semana} onChange={e => update("semana", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Data</label>
              <input className={inputClass} type="text" placeholder="DD/MM/AAAA" value={form.data} onChange={e => update("data", e.target.value)} />
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

      {/* Lista de lançamentos */}
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

/* ========== GRÁFICOS TAB ========== */
function GraficosTab() {
  const chartCard = "bg-card rounded-2xl p-4 shadow-sm border border-border";
  const chartTitle = "font-display font-semibold text-sm text-foreground mb-3";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Peso */}
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

      {/* Pressão Arterial */}
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

      {/* Altura Uterina */}
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

      {/* BCF */}
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
