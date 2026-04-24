import type { AdminFilters } from "@/contexts/AdminFiltersContext";

export type AdminProfile = {
  user_id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  cidade: string | null;
  bairro: string | null;
  unidade_saude: string | null;
  data_nascimento: string | null;
  dum: string | null;
  numero_gestacoes: number | null;
  numero_partos: number | null;
  numero_abortos: number | null;
};

export type AdminAlert = {
  id: string;
  origem: string;
  severidade: string;
  titulo: string;
  mensagem: string;
  data: string;
  gestante_id: string;
};

export function calcAge(dn: string | null): number | null {
  if (!dn) return null;
  const diff = Date.now() - new Date(dn).getTime();
  if (isNaN(diff)) return null;
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export function calcWeeks(dum: string | null): number | null {
  if (!dum) return null;
  const diff = Date.now() - new Date(dum).getTime();
  if (isNaN(diff)) return null;
  const w = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
  return w < 0 ? 0 : w > 42 ? 42 : w;
}

export function trimestreOf(weeks: number | null): "1" | "2" | "3" | "—" {
  if (weeks === null) return "—";
  if (weeks < 14) return "1";
  if (weeks < 28) return "2";
  return "3";
}

export function faixaEtariaOf(idade: number | null): "<18" | "18-34" | "≥35" | "—" {
  if (idade === null) return "—";
  if (idade < 18) return "<18";
  if (idade < 35) return "18-34";
  return "≥35";
}

export function applyFilters(
  profiles: AdminProfile[],
  alerts: AdminAlert[],
  filters: AdminFilters,
): AdminProfile[] {
  // index alertas por gestante
  const alertsByGestante = new Map<string, AdminAlert[]>();
  alerts.forEach((a) => {
    const arr = alertsByGestante.get(a.gestante_id) ?? [];
    arr.push(a);
    alertsByGestante.set(a.gestante_id, arr);
  });

  const buscaLower = filters.busca.trim().toLowerCase();
  const inicio = filters.periodoInicio ? new Date(filters.periodoInicio) : null;
  const fim = filters.periodoFim ? new Date(filters.periodoFim) : null;

  return profiles.filter((p) => {
    if (buscaLower) {
      const blob = `${p.nome ?? ""} ${p.email ?? ""} ${p.cidade ?? ""}`.toLowerCase();
      if (!blob.includes(buscaLower)) return false;
    }
    if (filters.cidades.length > 0 && (!p.cidade || !filters.cidades.includes(p.cidade)))
      return false;
    if (filters.bairro !== "todos" && p.bairro !== filters.bairro) return false;
    if (filters.ubs !== "todas" && p.unidade_saude !== filters.ubs) return false;

    const idade = calcAge(p.data_nascimento);
    if (filters.faixa !== "todas" && faixaEtariaOf(idade) !== filters.faixa) return false;

    const weeks = calcWeeks(p.dum);
    if (filters.trimestre !== "todos" && trimestreOf(weeks) !== filters.trimestre) return false;

    if (filters.temWhatsapp === "sim" && !p.telefone) return false;
    if (filters.temWhatsapp === "nao" && !!p.telefone) return false;

    if (inicio && p.dum) {
      const d = new Date(p.dum);
      if (d < inicio) return false;
    }
    if (fim && p.dum) {
      const d = new Date(p.dum);
      if (d > fim) return false;
    }

    const myAlerts = alertsByGestante.get(p.user_id) ?? [];

    if (filters.origemAlerta !== "todas") {
      if (!myAlerts.some((a) => a.origem === filters.origemAlerta)) return false;
    }
    if (filters.severidade !== "todas") {
      if (!myAlerts.some((a) => a.severidade === filters.severidade)) return false;
    }
    if (filters.condicao !== "todas") {
      // condição = parametro/exame específico que deflagrou alerta
      const cond = filters.condicao.toLowerCase();
      if (!myAlerts.some((a) => a.titulo.toLowerCase().includes(cond))) return false;
    }

    return true;
  });
}

/** Severidade máxima de uma gestante: urgente > atencao > nenhum */
export function maxSeveridade(alerts: AdminAlert[]): "urgente" | "atencao" | null {
  if (alerts.some((a) => a.severidade === "urgente")) return "urgente";
  if (alerts.some((a) => a.severidade === "atencao")) return "atencao";
  return null;
}

export function normalizarTelefone(tel: string): string {
  const digits = tel.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  return `55${digits}`;
}

export function abrirWhatsApp(tel: string, mensagem: string) {
  const numero = normalizarTelefone(tel);
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

/** Substitui variáveis de template: {{primeiro_nome}}, {{semanas}}, {{ubs}} etc. */
export function aplicarTemplate(
  template: string,
  p: AdminProfile,
  alerts: AdminAlert[],
): string {
  const primeiroNome = (p.nome ?? "").split(" ")[0] || "gestante";
  const weeks = calcWeeks(p.dum);
  const examePend = alerts.find((a) => a.origem === "exame" || a.origem === "imagem");
  const vacPend = alerts.find((a) => a.origem === "vacina");

  return template
    .replace(/\{\{\s*primeiro_nome\s*\}\}/gi, primeiroNome)
    .replace(/\{\{\s*nome\s*\}\}/gi, p.nome ?? primeiroNome)
    .replace(/\{\{\s*semanas\s*\}\}/gi, weeks !== null ? String(weeks) : "—")
    .replace(/\{\{\s*ubs\s*\}\}/gi, p.unidade_saude ?? "sua unidade de saúde")
    .replace(/\{\{\s*cidade\s*\}\}/gi, p.cidade ?? "")
    .replace(/\{\{\s*exame_pendente\s*\}\}/gi, examePend?.titulo ?? "exame pendente")
    .replace(/\{\{\s*vacina_pendente\s*\}\}/gi, vacPend?.titulo ?? "vacina pendente");
}
