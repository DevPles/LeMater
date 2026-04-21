import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Gestão MãeDigital" },
      { name: "description", content: "Painel administrativo restrito." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  ssr: false,
  component: AdminGate,
});

const ADMIN_USER = "admin";
const ADMIN_PASS = "unaerp2026";
const ADMIN_KEY = "maedigital_admin_auth";

function AdminGate() {
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(ADMIN_KEY) === "1") {
      setAuthed(true);
    }
  }, []);

  if (authed) {
    return (
      <div>
        <div className="bg-[#1a1557] text-white px-4 py-2 flex items-center justify-between text-sm sticky top-0 z-40">
          <span className="font-semibold">Painel Administrativo</span>
          <button
            onClick={() => {
              sessionStorage.removeItem(ADMIN_KEY);
              setAuthed(false);
              setUser("");
              setPass("");
            }}
            className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-xs"
          >
            Sair
          </button>
        </div>
        <GestaoPage />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-[#1a4ba8] p-6">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={(e) => {
          e.preventDefault();
          if (user === ADMIN_USER && pass === ADMIN_PASS) {
            sessionStorage.setItem(ADMIN_KEY, "1");
            setAuthed(true);
            setErro("");
          } else {
            setErro("Credenciais inválidas");
          }
        }}
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8 space-y-4"
      >
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold text-[#1a1557] font-display">Acesso Administrativo</h1>
          <p className="text-sm text-gray-500 mt-1">Restrito à equipe MãeDigital</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Usuário</label>
          <input
            type="text"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a1557]"
            placeholder="admin"
            autoFocus
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Senha</label>
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a1557]"
            placeholder="••••••••"
          />
        </div>
        {erro && <p className="text-sm text-red-600 text-center">{erro}</p>}
        <button
          type="submit"
          className="w-full bg-[#f0c040] hover:bg-[#e5b535] text-[#1a1557] font-bold py-3 rounded-full transition-colors"
        >
          Entrar
        </button>
        <p className="text-[10px] text-gray-400 text-center mt-2">
          Demonstração: admin / unaerp2026
        </p>
      </motion.form>
    </div>
  );
}


/* ============ Tipos ============ */
type RiscoNivel = "baixo" | "medio" | "alto";

interface Gestante {
  id: number;
  nome: string;
  idade: number;
  semanas: number;
  dpp: string; // dd/mm/yyyy
  cidade: string;
  exames: string[]; // realizados
  examesPendentes: string[];
  vacinas: string[]; // tomadas
  vacinasPendentes: string[];
  sinaisClinicos: string[]; // alertas observados
  condicoes: string[]; // diagnósticos prévios
  risco: RiscoNivel;
}

const CONDICOES_ALTO_RISCO = [
  "Hipertensão crônica",
  "Diabetes prévia",
  "Cardiopatia",
  "Pré-eclâmpsia anterior",
  "Insuficiência renal",
  "Lúpus",
  "HIV",
];

const SINAIS_CRITICOS = [
  "Sangramento",
  "Pressão alta",
  "Cefaleia intensa",
  "Edema severo",
  "Ausência de movimentos fetais",
  "Glicemia elevada",
];

const EXAMES_LISTA = [
  "Ultrassom morfológico",
  "Hemograma",
  "Glicemia em jejum",
  "Teste de tolerância à glicose",
  "Sorologias (HIV/Sífilis/Hepatite)",
  "Urina tipo I",
];

const VACINAS_LISTA = ["Hepatite B", "dTpa", "Influenza", "COVID-19"];

/* ============ Mock data ============ */
const gestantesMock: Gestante[] = [
  {
    id: 1, nome: "Maria Silva", idade: 28, semanas: 24, dpp: "15/07/2026", cidade: "Ribeirão Preto",
    exames: ["Ultrassom morfológico", "Hemograma", "Sorologias (HIV/Sífilis/Hepatite)"],
    examesPendentes: ["Teste de tolerância à glicose"],
    vacinas: ["Hepatite B", "dTpa"], vacinasPendentes: ["Influenza"],
    sinaisClinicos: [], condicoes: [], risco: "baixo",
  },
  {
    id: 2, nome: "Ana Souza", idade: 34, semanas: 30, dpp: "02/06/2026", cidade: "Ribeirão Preto",
    exames: ["Ultrassom morfológico", "Hemograma"],
    examesPendentes: ["Glicemia em jejum"],
    vacinas: ["dTpa"], vacinasPendentes: ["Influenza", "Hepatite B"],
    sinaisClinicos: ["Pressão alta"], condicoes: ["Hipertensão crônica"], risco: "alto",
  },
  {
    id: 3, nome: "Júlia Pereira", idade: 22, semanas: 16, dpp: "20/10/2026", cidade: "Sertãozinho",
    exames: ["Hemograma"], examesPendentes: ["Ultrassom morfológico"],
    vacinas: ["Hepatite B"], vacinasPendentes: ["dTpa", "Influenza"],
    sinaisClinicos: [], condicoes: [], risco: "baixo",
  },
  {
    id: 4, nome: "Patrícia Lopes", idade: 38, semanas: 28, dpp: "10/06/2026", cidade: "Ribeirão Preto",
    exames: ["Ultrassom morfológico", "Hemograma", "Glicemia em jejum"],
    examesPendentes: ["Teste de tolerância à glicose"],
    vacinas: ["Hepatite B", "dTpa", "Influenza"], vacinasPendentes: [],
    sinaisClinicos: ["Glicemia elevada"], condicoes: ["Diabetes prévia"], risco: "alto",
  },
  {
    id: 5, nome: "Carla Mendes", idade: 26, semanas: 20, dpp: "05/09/2026", cidade: "Cravinhos",
    exames: ["Ultrassom morfológico", "Hemograma"], examesPendentes: ["Sorologias (HIV/Sífilis/Hepatite)"],
    vacinas: ["dTpa"], vacinasPendentes: ["Influenza"],
    sinaisClinicos: ["Cefaleia intensa"], condicoes: [], risco: "medio",
  },
  {
    id: 6, nome: "Beatriz Rocha", idade: 31, semanas: 36, dpp: "08/05/2026", cidade: "Ribeirão Preto",
    exames: ["Ultrassom morfológico", "Hemograma", "Glicemia em jejum", "Urina tipo I"],
    examesPendentes: [],
    vacinas: ["Hepatite B", "dTpa", "Influenza"], vacinasPendentes: [],
    sinaisClinicos: [], condicoes: [], risco: "baixo",
  },
  {
    id: 7, nome: "Larissa Dias", idade: 41, semanas: 18, dpp: "12/10/2026", cidade: "Ribeirão Preto",
    exames: ["Hemograma"], examesPendentes: ["Ultrassom morfológico"],
    vacinas: [], vacinasPendentes: ["Hepatite B", "dTpa", "Influenza"],
    sinaisClinicos: ["Sangramento"], condicoes: ["Cardiopatia"], risco: "alto",
  },
  {
    id: 8, nome: "Fernanda Costa", idade: 25, semanas: 12, dpp: "20/11/2026", cidade: "Sertãozinho",
    exames: [], examesPendentes: ["Ultrassom morfológico", "Hemograma", "Sorologias (HIV/Sífilis/Hepatite)"],
    vacinas: [], vacinasPendentes: ["Hepatite B", "dTpa"],
    sinaisClinicos: [], condicoes: [], risco: "baixo",
  },
];

/* ============ Helpers ============ */
function parseDpp(dpp: string): Date {
  const [d, m, y] = dpp.split("/").map(Number);
  return new Date(y, m - 1, d);
}

const riscoStyles: Record<RiscoNivel, string> = {
  baixo: "bg-green-100 text-green-700 border-green-300",
  medio: "bg-amber-100 text-amber-700 border-amber-300",
  alto: "bg-red-100 text-red-700 border-red-300",
};

/* ============ Page ============ */
function GestaoPage() {
  const [busca, setBusca] = useState("");
  const [filtroRisco, setFiltroRisco] = useState<"todos" | RiscoNivel>("todos");
  const [filtroExame, setFiltroExame] = useState<"todos" | "pendente" | "realizado">("todos");
  const [examesSelecionados, setExamesSelecionados] = useState<string[]>([]);
  const [vacinasSelecionadas, setVacinasSelecionadas] = useState<string[]>([]);
  const [sinaisSelecionados, setSinaisSelecionados] = useState<string[]>([]);
  const [condicoesSelecionadas, setCondicoesSelecionadas] = useState<string[]>([]);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [excluirAltoRisco, setExcluirAltoRisco] = useState(true);
  const [showFiltros, setShowFiltros] = useState(true);
  const [selecionada, setSelecionada] = useState<Gestante | null>(null);

  const toggle = (arr: string[], value: string, setter: (v: string[]) => void) => {
    setter(arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]);
  };

  const gestantesFiltradas = useMemo(() => {
    return gestantesMock.filter(g => {
      if (busca && !g.nome.toLowerCase().includes(busca.toLowerCase())) return false;
      if (excluirAltoRisco && g.risco === "alto") return false;
      if (filtroRisco !== "todos" && g.risco !== filtroRisco) return false;

      if (examesSelecionados.length > 0) {
        const ok = examesSelecionados.every(e => {
          if (filtroExame === "pendente") return g.examesPendentes.includes(e);
          if (filtroExame === "realizado") return g.exames.includes(e);
          return g.exames.includes(e) || g.examesPendentes.includes(e);
        });
        if (!ok) return false;
      }

      if (vacinasSelecionadas.length > 0) {
        const ok = vacinasSelecionadas.every(v => g.vacinas.includes(v) || g.vacinasPendentes.includes(v));
        if (!ok) return false;
      }

      if (sinaisSelecionados.length > 0) {
        const ok = sinaisSelecionados.some(s => g.sinaisClinicos.includes(s));
        if (!ok) return false;
      }

      if (condicoesSelecionadas.length > 0) {
        const ok = condicoesSelecionadas.some(c => g.condicoes.includes(c));
        if (!ok) return false;
      }

      if (dataInicio) {
        if (parseDpp(g.dpp) < new Date(dataInicio)) return false;
      }
      if (dataFim) {
        if (parseDpp(g.dpp) > new Date(dataFim)) return false;
      }

      return true;
    });
  }, [busca, filtroRisco, filtroExame, examesSelecionados, vacinasSelecionadas,
      sinaisSelecionados, condicoesSelecionadas, dataInicio, dataFim, excluirAltoRisco]);

  const stats = useMemo(() => ({
    total: gestantesFiltradas.length,
    altoRisco: gestantesFiltradas.filter(g => g.risco === "alto").length,
    pendentes: gestantesFiltradas.filter(g => g.examesPendentes.length > 0 || g.vacinasPendentes.length > 0).length,
    comSinais: gestantesFiltradas.filter(g => g.sinaisClinicos.length > 0).length,
  }), [gestantesFiltradas]);

  const limparFiltros = () => {
    setBusca(""); setFiltroRisco("todos"); setFiltroExame("todos");
    setExamesSelecionados([]); setVacinasSelecionadas([]);
    setSinaisSelecionados([]); setCondicoesSelecionadas([]);
    setDataInicio(""); setDataFim("");
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-1">
          Gestão de Gestantes
        </h1>
        <p className="text-sm text-muted-foreground mb-4">
          Triagem e acompanhamento — não aceitamos gestantes de alto risco
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard label="Total filtrado" value={stats.total} color="bg-coral-light" />
        <StatCard label="Alto risco" value={stats.altoRisco} color="bg-red-100" />
        <StatCard label="Com pendências" value={stats.pendentes} color="bg-warm" />
        <StatCard label="Com sinais críticos" value={stats.comSinais} color="bg-blush" />
      </div>

      {/* Toggle filtros */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setShowFiltros(!showFiltros)}
          className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground"
        >
          {showFiltros ? "Ocultar filtros" : "Mostrar filtros"}
        </button>
        <button
          onClick={limparFiltros}
          className="px-3 py-1.5 rounded-full text-xs font-semibold border border-border text-muted-foreground hover:text-foreground"
        >
          Limpar filtros
        </button>
      </div>

      {showFiltros && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-card rounded-2xl p-4 shadow-sm border border-border mb-4 space-y-4"
        >
          {/* Busca + risco */}
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Buscar gestante</label>
              <input
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Nome..."
                className="w-full h-9 text-sm rounded-xl border border-border bg-background px-3"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nível de risco</label>
              <select
                value={filtroRisco}
                onChange={e => setFiltroRisco(e.target.value as "todos" | RiscoNivel)}
                className="w-full h-9 text-sm rounded-xl border border-border bg-background px-3"
              >
                <option value="todos">Todos</option>
                <option value="baixo">Baixo</option>
                <option value="medio">Médio</option>
                <option value="alto">Alto</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Status do exame</label>
              <select
                value={filtroExame}
                onChange={e => setFiltroExame(e.target.value as "todos" | "pendente" | "realizado")}
                className="w-full h-9 text-sm rounded-xl border border-border bg-background px-3"
              >
                <option value="todos">Todos</option>
                <option value="pendente">Pendentes</option>
                <option value="realizado">Realizados</option>
              </select>
            </div>
          </div>

          {/* Datas DPP */}
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">DPP de</label>
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
                className="w-full h-9 text-sm rounded-xl border border-border bg-background px-3" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">DPP até</label>
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
                className="w-full h-9 text-sm rounded-xl border border-border bg-background px-3" />
            </div>
          </div>

          <ChipGroup label="Exames" options={EXAMES_LISTA} selected={examesSelecionados}
            onToggle={v => toggle(examesSelecionados, v, setExamesSelecionados)} />
          <ChipGroup label="Vacinas" options={VACINAS_LISTA} selected={vacinasSelecionadas}
            onToggle={v => toggle(vacinasSelecionadas, v, setVacinasSelecionadas)} />
          <ChipGroup label="Sinais clínicos críticos" options={SINAIS_CRITICOS} selected={sinaisSelecionados}
            onToggle={v => toggle(sinaisSelecionados, v, setSinaisSelecionados)} accent="red" />
          <ChipGroup label="Condições já diagnosticadas" options={CONDICOES_ALTO_RISCO}
            selected={condicoesSelecionadas}
            onToggle={v => toggle(condicoesSelecionadas, v, setCondicoesSelecionadas)} accent="red" />

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={excluirAltoRisco}
              onChange={e => setExcluirAltoRisco(e.target.checked)} />
            <span className="text-foreground font-medium">
              Excluir automaticamente gestantes de alto risco
            </span>
          </label>
        </motion.div>
      )}

      {/* Lista */}
      <div className="space-y-3">
        {gestantesFiltradas.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 text-center border border-border">
            <p className="text-muted-foreground">Nenhuma gestante encontrada com os filtros aplicados.</p>
          </div>
        ) : (
          gestantesFiltradas.map((g, i) => (
            <motion.button
              key={g.id}
              onClick={() => setSelecionada(g)}
              className="w-full text-left bg-card rounded-2xl p-4 shadow-sm border border-border hover:border-primary/50 transition-colors"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-foreground">{g.nome}</h3>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${riscoStyles[g.risco]}`}>
                      Risco {g.risco}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {g.idade} anos • {g.semanas} semanas • DPP {g.dpp} • {g.cidade}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {g.examesPendentes.length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        {g.examesPendentes.length} exame(s) pendente(s)
                      </span>
                    )}
                    {g.vacinasPendentes.length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        {g.vacinasPendentes.length} vacina(s) pendente(s)
                      </span>
                    )}
                    {g.sinaisClinicos.map(s => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                        {s}
                      </span>
                    ))}
                    {g.condicoes.map(c => (
                      <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-300">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-xs text-primary font-semibold whitespace-nowrap">Ver mais →</span>
              </div>
            </motion.button>
          ))
        )}
      </div>

      {/* Detalhes modal */}
      {selecionada && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setSelecionada(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={e => e.stopPropagation()}
            className="bg-card rounded-2xl p-5 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-xl border border-border"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="font-display font-bold text-xl text-foreground">{selecionada.nome}</h2>
                <p className="text-xs text-muted-foreground">
                  {selecionada.idade} anos • {selecionada.semanas} semanas • DPP {selecionada.dpp}
                </p>
              </div>
              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${riscoStyles[selecionada.risco]}`}>
                Risco {selecionada.risco}
              </span>
            </div>

            {selecionada.risco === "alto" && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
                <p className="text-xs font-semibold text-red-700">
                  Gestante de alto risco — não elegível para acompanhamento neste programa.
                  Encaminhar para referência hospitalar especializada.
                </p>
              </div>
            )}

            <DetailSection title="Exames realizados" items={selecionada.exames} color="green" />
            <DetailSection title="Exames pendentes" items={selecionada.examesPendentes} color="amber" />
            <DetailSection title="Vacinas tomadas" items={selecionada.vacinas} color="green" />
            <DetailSection title="Vacinas pendentes" items={selecionada.vacinasPendentes} color="blue" />
            <DetailSection title="Sinais clínicos" items={selecionada.sinaisClinicos} color="red" />
            <DetailSection title="Condições diagnosticadas" items={selecionada.condicoes} color="red" />

            <button
              onClick={() => setSelecionada(null)}
              className="mt-4 w-full py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
            >
              Fechar
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

/* ============ Sub-components ============ */
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-card rounded-2xl p-3 border border-border shadow-sm">
      <div className={`w-8 h-2 rounded-full ${color} mb-2`} />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold font-display text-foreground">{value}</p>
    </div>
  );
}

function ChipGroup({
  label, options, selected, onToggle, accent = "primary",
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  accent?: "primary" | "red";
}) {
  const activeClass = accent === "red"
    ? "bg-red-500 text-white border-red-500"
    : "bg-primary text-primary-foreground border-primary";
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-2 block">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const isActive = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                isActive ? activeClass : "bg-background text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DetailSection({ title, items, color }: {
  title: string; items: string[]; color: "green" | "amber" | "blue" | "red";
}) {
  const colorMap = {
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-700",
  };
  return (
    <div className="mb-3">
      <p className="text-xs font-semibold text-foreground mb-1.5">{title}</p>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">Nenhum registro.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map(i => (
            <span key={i} className={`text-[11px] px-2 py-0.5 rounded-full ${colorMap[color]}`}>{i}</span>
          ))}
        </div>
      )}
    </div>
  );
}
