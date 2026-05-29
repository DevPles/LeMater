// Marcos do pré-natal e regras de "concluído" cruzando registros do prontuário.
// Cada marco define como casar com exam_results / image_exam_results / vaccinations / appointment_slots.

export type MilestoneSource =
  | "exam"
  | "image"
  | "vaccine"
  | "appointment"
  | "derived";

export type Milestone = {
  week: number;
  title: string;
  detail: string;
  /** janela [min,max] de semanas em que o registro conta como cumprindo o marco */
  janelaSemanas: [number, number];
  source: MilestoneSource;
  /** termos (normalizados, sem acento) que devem aparecer em tipo_exame/vacina */
  matchAny?: string[];
  /** termos adicionais — qualquer um já basta (sinônimos) */
};

export const MILESTONES: Milestone[] = [
  {
    week: 6,
    title: "1ª consulta de pré-natal",
    detail: "Confirmação, exames iniciais e BHCG",
    janelaSemanas: [0, 12],
    source: "appointment",
  },
  {
    week: 8,
    title: "USG de datação",
    detail: "Confirma IG e batimentos cardíacos",
    janelaSemanas: [5, 13],
    source: "image",
    matchAny: ["datac", "primeiro trimestre", "1 trimestre", "transvaginal"],
  },
  {
    week: 12,
    title: "Translucência nucal",
    detail: "Rastreio cromossômico do 1º trimestre",
    janelaSemanas: [11, 14],
    source: "image",
    matchAny: ["transluc", "nucal"],
  },
  {
    week: 16,
    title: "Exames do 2º trimestre",
    detail: "Hemograma, urina, glicemia",
    janelaSemanas: [13, 22],
    source: "exam",
    matchAny: ["hemograma", "glicemia", "urina", "eas"],
  },
  {
    week: 20,
    title: "USG morfológica",
    detail: "Avaliação detalhada da anatomia fetal",
    janelaSemanas: [18, 24],
    source: "image",
    matchAny: ["morfo"],
  },
  {
    week: 24,
    title: "Teste de tolerância à glicose",
    detail: "Rastreio de diabetes gestacional",
    janelaSemanas: [24, 30],
    source: "exam",
    matchAny: ["totg", "tolerancia", "ttog", "ttg"],
  },
  {
    week: 28,
    title: "Vacina dTpa",
    detail: "Início do 3º trimestre, consultas quinzenais",
    janelaSemanas: [20, 40],
    source: "vaccine",
    matchAny: ["dtpa", "tdap"],
  },
  {
    week: 32,
    title: "USG de crescimento",
    detail: "Avalia peso e líquido amniótico",
    janelaSemanas: [30, 37],
    source: "image",
    matchAny: ["crescimento", "biom", "obstetric"],
  },
  {
    week: 36,
    title: "Streptococcus B",
    detail: "Coleta vaginal e retal",
    janelaSemanas: [35, 38],
    source: "exam",
    matchAny: ["estrept", "strepto", "gbs", "estreptococ"],
  },
  {
    week: 37,
    title: "Termo precoce",
    detail: "Bebê considerado a termo",
    janelaSemanas: [37, 42],
    source: "derived",
  },
  {
    week: 40,
    title: "Data provável do parto",
    detail: "DPP estimada pela DUM",
    janelaSemanas: [40, 42],
    source: "derived",
  },
];

export function normalize(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export type ProntuarioRecord = {
  tipo: string;
  semana: number | null;
  data: string; // ISO date
  source: MilestoneSource;
  registrado_por_nome?: string | null;
};

export type MilestoneStatus =
  | { kind: "concluido"; data: string; por?: string | null }
  | { kind: "atrasado" }
  | { kind: "agora" }
  | { kind: "futuro" };

export function classifyMilestone(
  m: Milestone,
  semanaAtual: number,
  registros: ProntuarioRecord[]
): MilestoneStatus {
  // Marcos derivados — concluem só pela semana corrente.
  if (m.source === "derived") {
    if (semanaAtual >= m.week) return { kind: "concluido", data: "" };
    return { kind: "futuro" };
  }

  const [min, max] = m.janelaSemanas;
  const match = registros.find((r) => {
    if (r.source !== m.source) return false;
    if (r.semana !== null && (r.semana < min - 1 || r.semana > max + 1)) return false;
    if (!m.matchAny || m.matchAny.length === 0) return true;
    const t = normalize(r.tipo);
    return m.matchAny.some((term) => t.includes(term));
  });

  if (match) {
    return { kind: "concluido", data: match.data, por: match.registrado_por_nome ?? null };
  }

  // Sem registro: avalia janela vs semana atual.
  if (semanaAtual > max) return { kind: "atrasado" };
  if (semanaAtual >= m.week) return { kind: "agora" };
  return { kind: "futuro" };
}
