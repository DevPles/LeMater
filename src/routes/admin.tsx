import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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

const ADMIN_KEY = "maedigital_admin_auth";

function AdminGate() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ok = sessionStorage.getItem(ADMIN_KEY) === "1";
      setAuthed(ok);
      setReady(true);
      if (!ok) navigate({ to: "/" });
    }
  }, [navigate]);

  if (!ready) return null;
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-sm text-gray-600">Redirecionando para o login...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-[#1a1557] text-white px-4 py-2 flex items-center justify-between text-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span className="font-semibold">Painel Administrativo MãeDigital</span>
          <span className="text-white/50 hidden sm:inline">UNAERP</span>
        </div>
        <button
          onClick={() => {
            sessionStorage.removeItem(ADMIN_KEY);
            navigate({ to: "/" });
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

/* ============ Tipos ============ */
type RiscoNivel = "baixo" | "medio" | "alto";
type MatchMode = "qualquer" | "todos";

interface Gestante {
  id: number;
  nome: string;
  idade: number;
  semanas: number;
  dpp: string; // dd/mm/yyyy
  cidade: string;
  exames: string[];
  examesPendentes: string[];
  vacinas: string[];
  vacinasPendentes: string[];
  sinaisClinicos: string[];
  condicoes: string[];
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
  { id: 1, nome: "Maria Silva", idade: 28, semanas: 24, dpp: "15/07/2026", cidade: "Ribeirão Preto",
    exames: ["Ultrassom morfológico", "Hemograma", "Sorologias (HIV/Sífilis/Hepatite)"],
    examesPendentes: ["Teste de tolerância à glicose"],
    vacinas: ["Hepatite B", "dTpa"], vacinasPendentes: ["Influenza"],
    sinaisClinicos: [], condicoes: [], risco: "baixo" },
  { id: 2, nome: "Ana Souza", idade: 34, semanas: 30, dpp: "02/06/2026", cidade: "Ribeirão Preto",
    exames: ["Ultrassom morfológico", "Hemograma"], examesPendentes: ["Glicemia em jejum"],
    vacinas: ["dTpa"], vacinasPendentes: ["Influenza", "Hepatite B"],
    sinaisClinicos: ["Pressão alta"], condicoes: ["Hipertensão crônica"], risco: "alto" },
  { id: 3, nome: "Júlia Pereira", idade: 22, semanas: 16, dpp: "20/10/2026", cidade: "Sertãozinho",
    exames: ["Hemograma"], examesPendentes: ["Ultrassom morfológico"],
    vacinas: ["Hepatite B"], vacinasPendentes: ["dTpa", "Influenza"],
    sinaisClinicos: [], condicoes: [], risco: "baixo" },
  { id: 4, nome: "Patrícia Lopes", idade: 38, semanas: 28, dpp: "10/06/2026", cidade: "Ribeirão Preto",
    exames: ["Ultrassom morfológico", "Hemograma", "Glicemia em jejum"],
    examesPendentes: ["Teste de tolerância à glicose"],
    vacinas: ["Hepatite B", "dTpa", "Influenza"], vacinasPendentes: [],
    sinaisClinicos: ["Glicemia elevada"], condicoes: ["Diabetes prévia"], risco: "alto" },
  { id: 5, nome: "Carla Mendes", idade: 26, semanas: 20, dpp: "05/09/2026", cidade: "Cravinhos",
    exames: ["Ultrassom morfológico", "Hemograma"], examesPendentes: ["Sorologias (HIV/Sífilis/Hepatite)"],
    vacinas: ["dTpa"], vacinasPendentes: ["Influenza"],
    sinaisClinicos: ["Cefaleia intensa"], condicoes: [], risco: "medio" },
  { id: 6, nome: "Beatriz Rocha", idade: 31, semanas: 36, dpp: "08/05/2026", cidade: "Ribeirão Preto",
    exames: ["Ultrassom morfológico", "Hemograma", "Glicemia em jejum", "Urina tipo I"],
    examesPendentes: [],
    vacinas: ["Hepatite B", "dTpa", "Influenza"], vacinasPendentes: [],
    sinaisClinicos: [], condicoes: [], risco: "baixo" },
  { id: 7, nome: "Larissa Dias", idade: 41, semanas: 18, dpp: "12/10/2026", cidade: "Ribeirão Preto",
    exames: ["Hemograma"], examesPendentes: ["Ultrassom morfológico"],
    vacinas: [], vacinasPendentes: ["Hepatite B", "dTpa", "Influenza"],
    sinaisClinicos: ["Sangramento"], condicoes: ["Cardiopatia"], risco: "alto" },
  { id: 8, nome: "Fernanda Costa", idade: 25, semanas: 12, dpp: "20/11/2026", cidade: "Sertãozinho",
    exames: [], examesPendentes: ["Ultrassom morfológico", "Hemograma", "Sorologias (HIV/Sífilis/Hepatite)"],
    vacinas: [], vacinasPendentes: ["Hepatite B", "dTpa"],
    sinaisClinicos: [], condicoes: [], risco: "baixo" },
  { id: 9, nome: "Isabela Martins", idade: 16, semanas: 22, dpp: "18/08/2026", cidade: "Ribeirão Preto",
    exames: ["Hemograma"], examesPendentes: ["Ultrassom morfológico", "Glicemia em jejum"],
    vacinas: ["Hepatite B"], vacinasPendentes: ["dTpa", "Influenza"],
    sinaisClinicos: [], condicoes: [], risco: "medio" },
  { id: 10, nome: "Sophia Oliveira", idade: 17, semanas: 14, dpp: "05/11/2026", cidade: "Sertãozinho",
    exames: [], examesPendentes: ["Ultrassom morfológico", "Hemograma"],
    vacinas: [], vacinasPendentes: ["Hepatite B", "dTpa", "Influenza"],
    sinaisClinicos: ["Pressão alta"], condicoes: [], risco: "medio" },
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

const riscoLabel: Record<RiscoNivel, string> = {
  baixo: "Baixo",
  medio: "Médio",
  alto: "Alto",
};

const CIDADES = Array.from(new Set(gestantesMock.map((g) => g.cidade))).sort();

/* ============ Page ============ */
function GestaoPage() {
  const [busca, setBusca] = useState("");
  const [filtroRisco, setFiltroRisco] = useState<"todos" | RiscoNivel>("todos");
  const [filtroCidade, setFiltroCidade] = useState<string>("todas");

  const [filtroExame, setFiltroExame] = useState<"todos" | "pendente" | "realizado">("todos");
  const [filtroVacina, setFiltroVacina] = useState<"todos" | "pendente" | "realizado">("todos");

  const [examesSelecionados, setExamesSelecionados] = useState<string[]>([]);
  const [vacinasSelecionadas, setVacinasSelecionadas] = useState<string[]>([]);
  const [sinaisSelecionados, setSinaisSelecionados] = useState<string[]>([]);
  const [condicoesSelecionadas, setCondicoesSelecionadas] = useState<string[]>([]);

  const [modoSinais, setModoSinais] = useState<MatchMode>("qualquer");
  const [modoCondicoes, setModoCondicoes] = useState<MatchMode>("qualquer");

  const [dataInicio, setDataInicio] = useState<Date | undefined>(undefined);
  const [dataFim, setDataFim] = useState<Date | undefined>(undefined);

  const [idadeMin, setIdadeMin] = useState<string>("");
  const [idadeMax, setIdadeMax] = useState<string>("");
  const [semanasMin, setSemanasMin] = useState<string>("");
  const [semanasMax, setSemanasMax] = useState<string>("");

  const [excluirAltoRisco, setExcluirAltoRisco] = useState(false);
  const [apenasMenorIdade, setApenasMenorIdade] = useState(false);
  const [apenasComSinais, setApenasComSinais] = useState(false);
  const [apenasComPendencias, setApenasComPendencias] = useState(false);

  const [showFiltros, setShowFiltros] = useState(true);
  const [sortKey, setSortKey] = useState<keyof Gestante>("nome");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const toggle = (arr: string[], value: string, setter: (v: string[]) => void) => {
    setter(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  };

  const gestantesFiltradas = useMemo(() => {
    const buscaLower = busca.trim().toLowerCase();

    const lista = gestantesMock.filter((g) => {
      if (buscaLower) {
        const blob = `${g.nome} ${g.cidade}`.toLowerCase();
        if (!blob.includes(buscaLower)) return false;
      }
      if (excluirAltoRisco && g.risco === "alto") return false;
      if (apenasMenorIdade && g.idade >= 18) return false;
      if (apenasComSinais && g.sinaisClinicos.length === 0) return false;
      if (apenasComPendencias && g.examesPendentes.length === 0 && g.vacinasPendentes.length === 0) return false;

      if (filtroRisco !== "todos" && g.risco !== filtroRisco) return false;
      if (filtroCidade !== "todas" && g.cidade !== filtroCidade) return false;

      const idadeMinN = idadeMin ? Number(idadeMin) : null;
      const idadeMaxN = idadeMax ? Number(idadeMax) : null;
      if (idadeMinN !== null && g.idade < idadeMinN) return false;
      if (idadeMaxN !== null && g.idade > idadeMaxN) return false;

      const semMinN = semanasMin ? Number(semanasMin) : null;
      const semMaxN = semanasMax ? Number(semanasMax) : null;
      if (semMinN !== null && g.semanas < semMinN) return false;
      if (semMaxN !== null && g.semanas > semMaxN) return false;

      if (examesSelecionados.length > 0) {
        const ok = examesSelecionados.every((e) => {
          if (filtroExame === "pendente") return g.examesPendentes.includes(e);
          if (filtroExame === "realizado") return g.exames.includes(e);
          return g.exames.includes(e) || g.examesPendentes.includes(e);
        });
        if (!ok) return false;
      }

      if (vacinasSelecionadas.length > 0) {
        const ok = vacinasSelecionadas.every((v) => {
          if (filtroVacina === "pendente") return g.vacinasPendentes.includes(v);
          if (filtroVacina === "realizado") return g.vacinas.includes(v);
          return g.vacinas.includes(v) || g.vacinasPendentes.includes(v);
        });
        if (!ok) return false;
      }

      if (sinaisSelecionados.length > 0) {
        const fn = modoSinais === "todos" ? "every" : "some";
        const ok = sinaisSelecionados[fn]((s) => g.sinaisClinicos.includes(s));
        if (!ok) return false;
      }

      if (condicoesSelecionadas.length > 0) {
        const fn = modoCondicoes === "todos" ? "every" : "some";
        const ok = condicoesSelecionadas[fn]((c) => g.condicoes.includes(c));
        if (!ok) return false;
      }

      if (dataInicio) {
        const d = parseDpp(g.dpp);
        if (d < new Date(dataInicio.getFullYear(), dataInicio.getMonth(), dataInicio.getDate())) return false;
      }
      if (dataFim) {
        const d = parseDpp(g.dpp);
        if (d > new Date(dataFim.getFullYear(), dataFim.getMonth(), dataFim.getDate(), 23, 59, 59)) return false;
      }

      return true;
    });

    const sorted = [...lista].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      let cmp = 0;
      if (sortKey === "dpp") cmp = parseDpp(a.dpp).getTime() - parseDpp(b.dpp).getTime();
      else if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv), "pt-BR");
      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [busca, filtroRisco, filtroCidade, filtroExame, filtroVacina,
      examesSelecionados, vacinasSelecionadas, sinaisSelecionados, condicoesSelecionadas,
      modoSinais, modoCondicoes, dataInicio, dataFim,
      idadeMin, idadeMax, semanasMin, semanasMax,
      excluirAltoRisco, apenasMenorIdade, apenasComSinais, apenasComPendencias,
      sortKey, sortDir]);

  const filtrosAtivos = useMemo(() => {
    let n = 0;
    if (busca) n++;
    if (filtroRisco !== "todos") n++;
    if (filtroCidade !== "todas") n++;
    if (filtroExame !== "todos") n++;
    if (filtroVacina !== "todos") n++;
    if (examesSelecionados.length) n++;
    if (vacinasSelecionadas.length) n++;
    if (sinaisSelecionados.length) n++;
    if (condicoesSelecionadas.length) n++;
    if (dataInicio) n++;
    if (dataFim) n++;
    if (idadeMin || idadeMax) n++;
    if (semanasMin || semanasMax) n++;
    if (excluirAltoRisco) n++;
    if (apenasMenorIdade) n++;
    if (apenasComSinais) n++;
    if (apenasComPendencias) n++;
    return n;
  }, [busca, filtroRisco, filtroCidade, filtroExame, filtroVacina,
      examesSelecionados, vacinasSelecionadas, sinaisSelecionados, condicoesSelecionadas,
      dataInicio, dataFim, idadeMin, idadeMax, semanasMin, semanasMax,
      excluirAltoRisco, apenasMenorIdade, apenasComSinais, apenasComPendencias]);

  const analise = useMemo(() => {
    const total = gestantesFiltradas.length;
    const altoRisco = gestantesFiltradas.filter((g) => g.risco === "alto").length;
    const medioRisco = gestantesFiltradas.filter((g) => g.risco === "medio").length;
    const baixoRisco = gestantesFiltradas.filter((g) => g.risco === "baixo").length;
    const comSinais = gestantesFiltradas.filter((g) => g.sinaisClinicos.length > 0).length;
    const comPendencias = gestantesFiltradas.filter(
      (g) => g.examesPendentes.length > 0 || g.vacinasPendentes.length > 0,
    ).length;
    const idadeMedia = total ? Math.round(gestantesFiltradas.reduce((s, g) => s + g.idade, 0) / total) : 0;
    const semanasMedia = total ? Math.round(gestantesFiltradas.reduce((s, g) => s + g.semanas, 0) / total) : 0;
    const idadeAvancada = gestantesFiltradas.filter((g) => g.idade >= 35).length;
    const menorIdade = gestantesFiltradas.filter((g) => g.idade < 18).length;
    const terceiroTrim = gestantesFiltradas.filter((g) => g.semanas >= 28).length;

    const examesPendCount: Record<string, number> = {};
    EXAMES_LISTA.forEach((e) => (examesPendCount[e] = 0));
    gestantesFiltradas.forEach((g) =>
      g.examesPendentes.forEach((e) => (examesPendCount[e] = (examesPendCount[e] || 0) + 1)),
    );

    const vacinasPendCount: Record<string, number> = {};
    VACINAS_LISTA.forEach((v) => (vacinasPendCount[v] = 0));
    gestantesFiltradas.forEach((g) =>
      g.vacinasPendentes.forEach((v) => (vacinasPendCount[v] = (vacinasPendCount[v] || 0) + 1)),
    );

    const sinaisCount: Record<string, number> = {};
    SINAIS_CRITICOS.forEach((s) => (sinaisCount[s] = 0));
    gestantesFiltradas.forEach((g) =>
      g.sinaisClinicos.forEach((s) => (sinaisCount[s] = (sinaisCount[s] || 0) + 1)),
    );

    const condicoesCount: Record<string, number> = {};
    CONDICOES_ALTO_RISCO.forEach((c) => (condicoesCount[c] = 0));
    gestantesFiltradas.forEach((g) =>
      g.condicoes.forEach((c) => (condicoesCount[c] = (condicoesCount[c] || 0) + 1)),
    );

    const cidadesCount: Record<string, number> = {};
    gestantesFiltradas.forEach((g) => (cidadesCount[g.cidade] = (cidadesCount[g.cidade] || 0) + 1));

    return {
      total, altoRisco, medioRisco, baixoRisco, comSinais, comPendencias,
      idadeMedia, semanasMedia, idadeAvancada, menorIdade, terceiroTrim,
      examesPendCount, vacinasPendCount, sinaisCount, condicoesCount, cidadesCount,
    };
  }, [gestantesFiltradas]);

  const limparFiltros = () => {
    setBusca(""); setFiltroRisco("todos"); setFiltroCidade("todas");
    setFiltroExame("todos"); setFiltroVacina("todos");
    setExamesSelecionados([]); setVacinasSelecionadas([]);
    setSinaisSelecionados([]); setCondicoesSelecionadas([]);
    setModoSinais("qualquer"); setModoCondicoes("qualquer");
    setDataInicio(undefined); setDataFim(undefined);
    setIdadeMin(""); setIdadeMax(""); setSemanasMin(""); setSemanasMax("");
    setExcluirAltoRisco(false); setApenasMenorIdade(false);
    setApenasComSinais(false); setApenasComPendencias(false);
  };

  const handleSort = (key: keyof Gestante) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  /* ============ Exportações ============ */
  const downloadWorkbook = (wb: XLSX.WorkBook, filename: string) => {
    try {
      // Caminho principal: writeFile injeta o download no browser.
      XLSX.writeFile(wb, filename, { bookType: "xlsx", compression: true });
    } catch (err) {
      console.warn("writeFile falhou, usando fallback Blob:", err);
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
      const blob = new Blob([wbout], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
  };

  const exportarExcelTabela = () => {
    try {
      if (gestantesFiltradas.length === 0) {
        alert("Não há gestantes para exportar com os filtros atuais.");
        return;
      }
      const rows = gestantesFiltradas.map((g) => ({
        ID: g.id,
        Nome: g.nome,
        Idade: g.idade,
        "Menor de idade": g.idade < 18 ? "Sim" : "Não",
        "Semanas gestacionais": g.semanas,
        DPP: g.dpp,
        Cidade: g.cidade,
        Risco: riscoLabel[g.risco],
        "Exames realizados": g.exames.join("; "),
        "Exames pendentes": g.examesPendentes.join("; "),
        "Vacinas tomadas": g.vacinas.join("; "),
        "Vacinas pendentes": g.vacinasPendentes.join("; "),
        "Sinais clínicos": g.sinaisClinicos.join("; "),
        "Condições prévias": g.condicoes.join("; "),
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [
        { wch: 4 }, { wch: 22 }, { wch: 6 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 16 },
        { wch: 8 }, { wch: 38 }, { wch: 32 }, { wch: 26 }, { wch: 26 }, { wch: 26 }, { wch: 26 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Gestantes");
      downloadWorkbook(wb, `maedigital-gestantes-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error("Falha ao exportar tabela:", err);
      alert("Erro ao gerar Excel. Veja o console para detalhes.");
    }
  };

  const gerarRelatorioExcel = () => {
    try {
      if (gestantesFiltradas.length === 0) {
        alert("Não há gestantes para gerar relatório com os filtros atuais.");
        return;
      }
      const wb = XLSX.utils.book_new();

      const filtrosResumo: (string | number)[][] = [
        ["Filtros aplicados"],
        ["Busca", busca || "—"],
        ["Risco", filtroRisco],
        ["Cidade", filtroCidade],
        ["Status exames", filtroExame],
        ["Status vacinas", filtroVacina],
        ["Exames selecionados", examesSelecionados.join("; ") || "—"],
        ["Vacinas selecionadas", vacinasSelecionadas.join("; ") || "—"],
        ["Sinais selecionados", `${sinaisSelecionados.join("; ") || "—"} (${modoSinais})`],
        ["Condições selecionadas", `${condicoesSelecionadas.join("; ") || "—"} (${modoCondicoes})`],
        ["DPP de", dataInicio ? format(dataInicio, "dd/MM/yyyy") : "—"],
        ["DPP até", dataFim ? format(dataFim, "dd/MM/yyyy") : "—"],
        ["Idade", `${idadeMin || "?"} a ${idadeMax || "?"}`],
        ["Semanas", `${semanasMin || "?"} a ${semanasMax || "?"}`],
        ["Excluir alto risco", excluirAltoRisco ? "Sim" : "Não"],
        ["Apenas menor de idade", apenasMenorIdade ? "Sim" : "Não"],
        ["Apenas com sinais", apenasComSinais ? "Sim" : "Não"],
        ["Apenas com pendências", apenasComPendencias ? "Sim" : "Não"],
      ];

      const resumo: (string | number)[][] = [
        ["Relatório MãeDigital — UNAERP"],
        ["Gerado em", new Date().toLocaleString("pt-BR")],
        [],
        ["Indicador", "Valor"],
        ["Total de gestantes (filtradas)", analise.total],
        ["Alto risco", analise.altoRisco],
        ["Médio risco", analise.medioRisco],
        ["Baixo risco", analise.baixoRisco],
        ["Com sinais clínicos críticos", analise.comSinais],
        ["Com pendências (exames/vacinas)", analise.comPendencias],
        ["Menor de idade (<18 anos)", analise.menorIdade],
        ["Idade ≥35 anos (avançada)", analise.idadeAvancada],
        ["Idade média", analise.idadeMedia],
        ["Semanas gestacionais (média)", analise.semanasMedia],
        ["3º trimestre (≥28 semanas)", analise.terceiroTrim],
        [],
        ...filtrosResumo,
      ];
      const wsResumo = XLSX.utils.aoa_to_sheet(resumo);
      wsResumo["!cols"] = [{ wch: 40 }, { wch: 40 }];
      XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");

      const rows = gestantesFiltradas.map((g) => ({
        ID: g.id, Nome: g.nome, Idade: g.idade,
        "Menor de idade": g.idade < 18 ? "Sim" : "Não",
        Semanas: g.semanas, DPP: g.dpp, Cidade: g.cidade,
        Risco: riscoLabel[g.risco],
        "Exames realizados": g.exames.join("; "),
        "Exames pendentes": g.examesPendentes.join("; "),
        "Vacinas tomadas": g.vacinas.join("; "),
        "Vacinas pendentes": g.vacinasPendentes.join("; "),
        "Sinais clínicos": g.sinaisClinicos.join("; "),
        "Condições prévias": g.condicoes.join("; "),
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Gestantes");

      const toSheet = (title: string, dict: Record<string, number>) => {
        const data = [["Item", "Quantidade"], ...Object.entries(dict).sort((a, b) => b[1] - a[1])];
        const ws = XLSX.utils.aoa_to_sheet(data);
        ws["!cols"] = [{ wch: 38 }, { wch: 14 }];
        XLSX.utils.book_append_sheet(wb, ws, title);
      };
      toSheet("Exames pendentes", analise.examesPendCount);
      toSheet("Vacinas pendentes", analise.vacinasPendCount);
      toSheet("Sinais clínicos", analise.sinaisCount);
      toSheet("Condições prévias", analise.condicoesCount);
      toSheet("Por cidade", analise.cidadesCount);

      downloadWorkbook(wb, `maedigital-relatorio-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error("Falha ao gerar relatório:", err);
      alert("Erro ao gerar relatório. Veja o console para detalhes.");
    }
  };

  return (
    <div className="min-h-screen pb-16 px-4 pt-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-1">
            Gestão de Gestantes
          </h1>
          <p className="text-sm text-muted-foreground">
            Análise inteligente dos dados cadastrados — exportações respeitam os filtros aplicados.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportarExcelTabela}
            className="px-4 py-2 rounded-full text-xs font-bold bg-[#1a1557] text-white hover:bg-[#241e7a] transition-colors"
          >
            Exportar tabela (Excel)
          </button>
          <button
            type="button"
            onClick={gerarRelatorioExcel}
            className="px-4 py-2 rounded-full text-xs font-bold bg-[#f0c040] text-[#1a1557] hover:bg-[#e5b535] transition-colors"
          >
            Gerar relatório completo
          </button>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
        <Kpi label="Total" value={analise.total} />
        <Kpi label="Alto risco" value={analise.altoRisco} tone="danger" />
        <Kpi label="Médio risco" value={analise.medioRisco} tone="warn" />
        <Kpi label="Baixo risco" value={analise.baixoRisco} tone="ok" />
        <Kpi label="Sinais críticos" value={analise.comSinais} tone="danger" />
        <Kpi label="Com pendências" value={analise.comPendencias} tone="warn" />
        <Kpi label="Menor de idade" value={analise.menorIdade} tone="danger" />
        <Kpi label="≥35 anos" value={analise.idadeAvancada} tone="warn" />
        <Kpi label="Idade média" value={`${analise.idadeMedia}a`} />
        <Kpi label="Sem. média" value={analise.semanasMedia} />
        <Kpi label="3º trimestre" value={analise.terceiroTrim} />
      </div>

      {/* Toggle filtros */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFiltros(!showFiltros)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground"
          >
            {showFiltros ? "Ocultar filtros" : "Mostrar filtros"}
          </button>
          {filtrosAtivos > 0 && (
            <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-[#f0c040] text-[#1a1557]">
              {filtrosAtivos} filtro(s) ativo(s)
            </span>
          )}
        </div>
        <button
          onClick={limparFiltros}
          className="px-3 py-1.5 rounded-full text-xs font-semibold border border-border text-muted-foreground hover:text-foreground"
        >
          Limpar filtros
        </button>
      </div>

      {showFiltros && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-card rounded-2xl p-4 shadow-sm border border-border mb-4 space-y-4"
        >
          {/* linha 1 */}
          <div className="grid md:grid-cols-3 gap-3">
            <Field label="Buscar (nome ou cidade)">
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Ex: Maria, Ribeirão..."
                className="w-full h-9 text-sm rounded-xl border border-border bg-background px-3" />
            </Field>
            <Field label="Nível de risco">
              <select value={filtroRisco} onChange={(e) => setFiltroRisco(e.target.value as "todos" | RiscoNivel)}
                className="w-full h-9 text-sm rounded-xl border border-border bg-background px-3">
                <option value="todos">Todos</option>
                <option value="baixo">Baixo</option>
                <option value="medio">Médio</option>
                <option value="alto">Alto</option>
              </select>
            </Field>
            <Field label="Cidade">
              <select value={filtroCidade} onChange={(e) => setFiltroCidade(e.target.value)}
                className="w-full h-9 text-sm rounded-xl border border-border bg-background px-3">
                <option value="todas">Todas</option>
                {CIDADES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          {/* linha 2 - status exames/vacinas */}
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Status do exame (aplica aos selecionados)">
              <select value={filtroExame} onChange={(e) => setFiltroExame(e.target.value as "todos" | "pendente" | "realizado")}
                className="w-full h-9 text-sm rounded-xl border border-border bg-background px-3">
                <option value="todos">Qualquer</option>
                <option value="pendente">Pendentes</option>
                <option value="realizado">Realizados</option>
              </select>
            </Field>
            <Field label="Status da vacina (aplica às selecionadas)">
              <select value={filtroVacina} onChange={(e) => setFiltroVacina(e.target.value as "todos" | "pendente" | "realizado")}
                className="w-full h-9 text-sm rounded-xl border border-border bg-background px-3">
                <option value="todos">Qualquer</option>
                <option value="pendente">Pendentes</option>
                <option value="realizado">Realizados</option>
              </select>
            </Field>
          </div>

          {/* linha 3 - DPP por calendário */}
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="DPP de">
              <DateField date={dataInicio} setDate={setDataInicio} placeholder="Selecionar data inicial" />
            </Field>
            <Field label="DPP até">
              <DateField date={dataFim} setDate={setDataFim} placeholder="Selecionar data final" />
            </Field>
          </div>

          {/* linha 4 - faixas */}
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Idade (faixa)">
              <div className="flex gap-2">
                <input type="number" value={idadeMin} onChange={(e) => setIdadeMin(e.target.value)} placeholder="Mín"
                  className="w-full h-9 text-sm rounded-xl border border-border bg-background px-3" />
                <input type="number" value={idadeMax} onChange={(e) => setIdadeMax(e.target.value)} placeholder="Máx"
                  className="w-full h-9 text-sm rounded-xl border border-border bg-background px-3" />
              </div>
            </Field>
            <Field label="Semanas gestacionais (faixa)">
              <div className="flex gap-2">
                <input type="number" value={semanasMin} onChange={(e) => setSemanasMin(e.target.value)} placeholder="Mín"
                  className="w-full h-9 text-sm rounded-xl border border-border bg-background px-3" />
                <input type="number" value={semanasMax} onChange={(e) => setSemanasMax(e.target.value)} placeholder="Máx"
                  className="w-full h-9 text-sm rounded-xl border border-border bg-background px-3" />
              </div>
            </Field>
          </div>

          <ChipGroup label="Exames" options={EXAMES_LISTA} selected={examesSelecionados}
            onToggle={(v) => toggle(examesSelecionados, v, setExamesSelecionados)} />
          <ChipGroup label="Vacinas" options={VACINAS_LISTA} selected={vacinasSelecionadas}
            onToggle={(v) => toggle(vacinasSelecionadas, v, setVacinasSelecionadas)} />

          <div>
            <ChipGroup label="Sinais clínicos críticos" options={SINAIS_CRITICOS} selected={sinaisSelecionados}
              onToggle={(v) => toggle(sinaisSelecionados, v, setSinaisSelecionados)} accent="red" />
            <ModeToggle mode={modoSinais} setMode={setModoSinais} />
          </div>
          <div>
            <ChipGroup label="Condições já diagnosticadas" options={CONDICOES_ALTO_RISCO}
              selected={condicoesSelecionadas}
              onToggle={(v) => toggle(condicoesSelecionadas, v, setCondicoesSelecionadas)} accent="red" />
            <ModeToggle mode={modoCondicoes} setMode={setModoCondicoes} />
          </div>

          <div className="flex flex-wrap gap-4 pt-2 border-t border-border">
            <CheckOption label="Excluir alto risco" checked={excluirAltoRisco} onChange={setExcluirAltoRisco} />
            <CheckOption label="Apenas menores de idade" checked={apenasMenorIdade} onChange={setApenasMenorIdade} />
            <CheckOption label="Apenas com sinais clínicos" checked={apenasComSinais} onChange={setApenasComSinais} />
            <CheckOption label="Apenas com pendências" checked={apenasComPendencias} onChange={setApenasComPendencias} />
          </div>
        </motion.div>
      )}

      {/* Tabela */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#1a1557] text-white text-xs uppercase tracking-wide">
              <tr>
                <Th onClick={() => handleSort("nome")} active={sortKey === "nome"} dir={sortDir}>Nome</Th>
                <Th onClick={() => handleSort("idade")} active={sortKey === "idade"} dir={sortDir}>Idade</Th>
                <Th onClick={() => handleSort("semanas")} active={sortKey === "semanas"} dir={sortDir}>Semanas</Th>
                <Th onClick={() => handleSort("dpp")} active={sortKey === "dpp"} dir={sortDir}>DPP</Th>
                <Th onClick={() => handleSort("cidade")} active={sortKey === "cidade"} dir={sortDir}>Cidade</Th>
                <Th onClick={() => handleSort("risco")} active={sortKey === "risco"} dir={sortDir}>Risco</Th>
                <th className="text-left px-3 py-2 font-semibold">Exames pendentes</th>
                <th className="text-left px-3 py-2 font-semibold">Vacinas pendentes</th>
                <th className="text-left px-3 py-2 font-semibold">Sinais</th>
                <th className="text-left px-3 py-2 font-semibold">Condições</th>
              </tr>
            </thead>
            <tbody>
              {gestantesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-muted-foreground">
                    Nenhuma gestante encontrada com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                gestantesFiltradas.map((g, i) => (
                  <tr key={g.id} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                    <td className="px-3 py-2 font-semibold text-foreground whitespace-nowrap">{g.nome}</td>
                    <td className="px-3 py-2">
                      {g.idade}
                      {g.idade < 18 && <span className="ml-1 text-[9px] font-bold text-red-700">MENOR</span>}
                    </td>
                    <td className="px-3 py-2">{g.semanas}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{g.dpp}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{g.cidade}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${riscoStyles[g.risco]}`}>
                        {riscoLabel[g.risco]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {g.examesPendentes.length ? g.examesPendentes.join(", ") : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {g.vacinasPendentes.length ? g.vacinasPendentes.join(", ") : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {g.sinaisClinicos.length ? (
                        <span className="text-red-700">{g.sinaisClinicos.join(", ")}</span>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {g.condicoes.length ? (
                        <span className="text-red-700">{g.condicoes.join(", ")}</span>
                      ) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border bg-muted/20">
          {gestantesFiltradas.length} registro(s) exibido(s)
        </div>
      </div>

      {/* Tabelas analíticas */}
      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <RankingTable title="Exames mais pendentes" data={analise.examesPendCount} />
        <RankingTable title="Vacinas mais pendentes" data={analise.vacinasPendCount} />
        <RankingTable title="Sinais clínicos observados" data={analise.sinaisCount} accent="red" />
        <RankingTable title="Condições prévias diagnosticadas" data={analise.condicoesCount} accent="red" />
        <RankingTable title="Distribuição por cidade" data={analise.cidadesCount} />
      </div>
    </div>
  );
}

/* ============ Subcomponentes ============ */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      {children}
    </div>
  );
}

function DateField({ date, setDate, placeholder }: { date?: Date; setDate: (d?: Date) => void; placeholder: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full h-9 text-sm rounded-xl border border-border bg-background px-3 text-left flex items-center justify-between",
            !date && "text-muted-foreground",
          )}
        >
          <span>{date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : placeholder}</span>
          {date && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); setDate(undefined); }}
              className="text-xs text-muted-foreground hover:text-foreground ml-2"
            >
              limpar
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          locale={ptBR}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}

function CheckOption({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-foreground font-medium">{label}</span>
    </label>
  );
}

function ModeToggle({ mode, setMode }: { mode: MatchMode; setMode: (m: MatchMode) => void }) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">Modo:</span>
      {(["qualquer", "todos"] as MatchMode[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          className={cn(
            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border transition-colors",
            mode === m
              ? "bg-[#1a1557] text-white border-[#1a1557]"
              : "bg-background text-muted-foreground border-border hover:border-[#1a1557]/50",
          )}
        >
          {m === "qualquer" ? "Qualquer um" : "Todos"}
        </button>
      ))}
    </div>
  );
}

function Kpi({ label, value, tone = "default" }: { label: string; value: number | string; tone?: "default" | "danger" | "warn" | "ok" }) {
  const tones = {
    default: "bg-card border-border text-foreground",
    danger: "bg-red-50 border-red-200 text-red-700",
    warn: "bg-amber-50 border-amber-200 text-amber-700",
    ok: "bg-green-50 border-green-200 text-green-700",
  };
  return (
    <div className={`rounded-2xl border p-3 ${tones[tone]}`}>
      <p className="text-[10px] uppercase tracking-wide font-semibold opacity-70">{label}</p>
      <p className="text-2xl font-bold font-display mt-0.5">{value}</p>
    </div>
  );
}

function Th({ children, onClick, active, dir }: { children: React.ReactNode; onClick: () => void; active: boolean; dir: "asc" | "desc" }) {
  return (
    <th onClick={onClick} className="text-left px-3 py-2 font-semibold cursor-pointer select-none whitespace-nowrap hover:bg-white/10">
      {children}{active ? (dir === "asc" ? " ↑" : " ↓") : ""}
    </th>
  );
}

function ChipGroup({ label, options, selected, onToggle, accent }: {
  label: string; options: string[]; selected: string[]; onToggle: (v: string) => void; accent?: "red";
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const sel = selected.includes(opt);
          const base = sel
            ? accent === "red"
              ? "bg-red-600 text-white border-red-600"
              : "bg-[#1a1557] text-white border-[#1a1557]"
            : "bg-background text-muted-foreground border-border hover:border-[#1a1557]/50";
          return (
            <button key={opt} type="button" onClick={() => onToggle(opt)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${base}`}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RankingTable({ title, data, accent }: { title: string; data: Record<string, number>; accent?: "red" }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, v]) => v));
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="px-4 py-2 bg-muted/40 border-b border-border">
        <p className="text-xs font-bold uppercase tracking-wide text-foreground">{title}</p>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {entries.length === 0 ? (
            <tr><td className="px-4 py-3 text-muted-foreground text-xs">Sem dados</td></tr>
          ) : entries.map(([k, v]) => (
            <tr key={k} className="border-t border-border/50">
              <td className="px-4 py-2 text-xs">{k}</td>
              <td className="px-4 py-2 w-1/2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full ${accent === "red" ? "bg-red-500" : "bg-[#1a1557]"}`}
                      style={{ width: `${(v / max) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold w-6 text-right">{v}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
