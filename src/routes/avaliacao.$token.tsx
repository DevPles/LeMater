import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { LiquidCard } from "@/components/LiquidCard";
import { LoadingMessage } from "@/components/LoadingMessage";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, ReferenceLine, Legend,
} from "recharts";

export const Route = createFileRoute("/avaliacao/$token")({
  head: () => ({
    meta: [
      { title: "Avaliação Profissional — MãeDigital" },
      { name: "description", content: "Preencha a avaliação clínica solicitada pela gestante." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  ssr: false,
  component: AvaliacaoPublicaPage,
});

type Especialidade = "medico" | "nutricionista" | "psicologo";

type AlertaPublico = {
  id: string;
  origem: string;
  severidade: string;
  titulo: string;
  mensagem: string;
  data: string | null;
};

type Cartao = {
  profile: Record<string, unknown> | null;
  medicoes: Array<Record<string, unknown>>;
  vacinas: Array<Record<string, unknown>>;
  exames: Array<Record<string, unknown>>;
  imagens: Array<Record<string, unknown>>;
  alertas?: AlertaPublico[];
};

type Info = {
  especialidade: Especialidade;
  status: "pendente" | "respondida" | "expirada";
  expira_em: string;
  gestante_nome: string;
  cartao: Cartao;
};

const ESP_LABEL: Record<Especialidade, string> = {
  medico: "Médico",
  nutricionista: "Nutricionista",
  psicologo: "Psicólogo",
};

const REG_POR_ESP: Record<Especialidade, "CRM" | "CRN" | "CRP"> = {
  medico: "CRM",
  nutricionista: "CRN",
  psicologo: "CRP",
};

type Campo = {
  key: string;
  label: string;
  type: "text" | "number" | "textarea" | "select" | "date";
  options?: string[];
  full?: boolean;
  hint?: string;
};

type Secao = { titulo: string; campos: Campo[] };

/**
 * Formulários focados APENAS na consulta do dia. Dados já registrados no
 * cartão (idade, G/P/A, comorbidades, hábitos, alergias, antecedentes, IMC
 * pré-gestacional etc.) aparecem como contexto somente leitura no topo.
 */
const SECOES: Record<Especialidade, Secao[]> = {
  medico: [
    {
      titulo: "Acompanhamento da gestação (hoje)",
      campos: [
        { key: "como_se_sente", label: "Como a gestante está se sentindo? (relato subjetivo)", type: "textarea", full: true },
        { key: "queixas_desconfortos", label: "Queixas e desconfortos do período", type: "textarea", full: true, hint: "Náuseas, azia, lombalgia, edema, contrações, sangramento, perdas, redução de movimentos fetais, etc." },
        { key: "intercorrencias_periodo", label: "Intercorrências desde a última consulta", type: "textarea", full: true },
      ],
    },
    {
      titulo: "Sinais vitais e antropometria (hoje)",
      campos: [
        { key: "pa_sistolica", label: "PA sistólica (mmHg)", type: "number" },
        { key: "pa_diastolica", label: "PA diastólica (mmHg)", type: "number" },
        { key: "frequencia_cardiaca", label: "FC materna (bpm)", type: "number" },
        { key: "frequencia_respiratoria", label: "FR (irpm)", type: "number" },
        { key: "temperatura", label: "Temperatura (°C)", type: "number" },
        { key: "saturacao_o2", label: "SatO₂ (%)", type: "number" },
        { key: "peso_kg", label: "Peso de hoje (kg)", type: "number", hint: "Ganho ponderal acumulado aparece no resumo do cartão acima." },
      ],
    },
    {
      titulo: "Avaliação obstétrica (hoje)",
      campos: [
        { key: "altura_uterina_cm", label: "Altura uterina (cm)", type: "number" },
        { key: "bcf", label: "BCF (bpm)", type: "number" },
        { key: "movimentos_fetais", label: "Movimentos fetais", type: "select", options: ["Presentes", "Diminuídos", "Ausentes", "Ainda não percebe"] },
        { key: "apresentacao", label: "Apresentação fetal", type: "select", options: ["Cefálica", "Pélvica", "Córmica", "Não definida"] },
        { key: "edema", label: "Edema", type: "select", options: ["Ausente", "MMII +/4", "MMII ++/4", "MMII +++/4", "Anasarca"] },
        { key: "dinamica_uterina", label: "Dinâmica uterina", type: "text" },
        { key: "perdas_vaginais", label: "Perdas vaginais", type: "text" },
        { key: "toque_vaginal", label: "Toque vaginal (se indicado)", type: "text" },
      ],
    },
    {
      titulo: "Exame físico geral",
      campos: [
        { key: "exame_fisico_geral", label: "Achados do exame físico geral", type: "textarea", full: true, hint: "Estado geral, mucosas, ausculta cardiopulmonar, mamas, MMII, etc." },
      ],
    },
    {
      titulo: "Análise do cartão e exames",
      campos: [
        { key: "analise_laboratoriais", label: "Avaliação dos exames laboratoriais", type: "textarea", full: true, hint: "Consulte os exames no cartão completo." },
        { key: "analise_imagem", label: "Avaliação dos exames de imagem / ultrassonografias", type: "textarea", full: true },
        { key: "situacao_vacinal", label: "Situação vacinal", type: "select", options: ["Em dia", "Pendências", "Esquema desconhecido"] },
        { key: "classificacao_risco", label: "Classificação de risco gestacional hoje", type: "select", options: ["Habitual", "Risco intermediário", "Alto risco"] },
        { key: "justificativa_risco", label: "Justificativa da classificação", type: "textarea", full: true },
      ],
    },
    {
      titulo: "Plano de cuidado",
      campos: [
        { key: "conduta", label: "Conduta e orientações da consulta", type: "textarea", full: true },
        { key: "exames_solicitados", label: "Exames solicitados", type: "textarea", full: true },
        { key: "prescricoes", label: "Prescrições e suplementação", type: "textarea", full: true, hint: "Ácido fólico, ferro, cálcio, DHA, etc." },
        { key: "encaminhamentos", label: "Encaminhamentos", type: "textarea", full: true, hint: "Alto risco, especialidades, serviço social, etc." },
        { key: "sinais_alarme_orientados", label: "Sinais de alarme reforçados", type: "textarea", full: true, hint: "Sangramento, cefaleia, edema súbito, redução de movimentação fetal, etc." },
        { key: "data_retorno", label: "Próxima consulta sugerida", type: "date" },
      ],
    },
  ],
  nutricionista: [
    {
      titulo: "Consulta do dia",
      campos: [
        { key: "queixa_principal", label: "Queixa principal", type: "textarea", full: true },
        { key: "peso_atual_kg", label: "Peso de hoje (kg)", type: "number" },
        { key: "circunferencia_braco", label: "Circunferência do braço (cm)", type: "number" },
        { key: "classificacao_nutricional", label: "Classificação nutricional atual", type: "select", options: ["Baixo peso","Eutrofia","Sobrepeso","Obesidade"] },
      ],
    },
    {
      titulo: "Anamnese alimentar",
      campos: [
        { key: "habito_intestinal", label: "Hábito intestinal", type: "select", options: ["Normal", "Constipado", "Diarreico", "Alternado"] },
        { key: "ingestao_hidrica_l", label: "Ingestão hídrica (L/dia)", type: "number" },
        { key: "numero_refeicoes", label: "Nº de refeições/dia", type: "number" },
        { key: "apetite", label: "Apetite", type: "select", options: ["Normal", "Aumentado", "Diminuído"] },
        { key: "nauseas_vomitos", label: "Náuseas / vômitos", type: "text" },
        { key: "pirose_refluxo", label: "Pirose / refluxo", type: "select", options: ["Não","Leve","Moderado","Intenso"] },
        { key: "intolerancias_alergias", label: "Intolerâncias e alergias alimentares", type: "textarea", full: true },
        { key: "aversoes_desejos", label: "Aversões e desejos", type: "textarea", full: true },
        { key: "padrao_alimentar", label: "Padrão alimentar (onívora, vegetariana, vegana...)", type: "text" },
        { key: "consumo_ultraprocessados", label: "Consumo de ultraprocessados", type: "select", options: ["Baixo","Moderado","Alto"] },
        { key: "atividade_fisica", label: "Atividade física (tipo e frequência)", type: "text" },
      ],
    },
    {
      titulo: "Recordatório 24h",
      campos: [
        { key: "rec_cafe", label: "Café da manhã", type: "textarea", full: true },
        { key: "rec_lanche_manha", label: "Lanche da manhã", type: "textarea", full: true },
        { key: "rec_almoco", label: "Almoço", type: "textarea", full: true },
        { key: "rec_lanche_tarde", label: "Lanche da tarde", type: "textarea", full: true },
        { key: "rec_jantar", label: "Jantar", type: "textarea", full: true },
        { key: "rec_ceia", label: "Ceia", type: "textarea", full: true },
      ],
    },
    {
      titulo: "Análise bioquímica",
      campos: [
        { key: "exames_bioquimicos", label: "Análise dos laboratoriais (Hb, Ht, ferritina, glicemia, TOTG, vit D...)", type: "textarea", full: true, hint: "Veja o resumo de exames acima." },
        { key: "deficiencias_identificadas", label: "Deficiências identificadas", type: "textarea", full: true },
      ],
    },
    {
      titulo: "Conduta nutricional",
      campos: [
        { key: "diagnostico_nutricional", label: "Avaliação nutricional", type: "textarea", full: true },
        { key: "necessidades_caloricas", label: "Necessidades calóricas (kcal/dia)", type: "number" },
        { key: "distribuicao_macros", label: "Distribuição de macronutrientes (CHO/PTN/LIP %)", type: "text" },
        { key: "suplementacao", label: "Suplementação (ácido fólico, ferro, cálcio, DHA...)", type: "textarea", full: true },
        { key: "plano_alimentar", label: "Plano alimentar prescrito", type: "textarea", full: true },
        { key: "orientacoes", label: "Orientações gerais", type: "textarea", full: true },
        { key: "metas", label: "Metas para o próximo retorno", type: "textarea", full: true },
        { key: "data_retorno", label: "Data sugerida de retorno", type: "date" },
      ],
    },
  ],
  psicologo: [
    {
      titulo: "Consulta do dia",
      campos: [
        { key: "queixa_principal", label: "Queixa principal", type: "textarea", full: true },
        { key: "gestacao_planejada", label: "Gestação planejada", type: "select", options: ["Sim", "Não", "Parcialmente"] },
        { key: "gestacao_desejada", label: "Gestação desejada", type: "select", options: ["Sim", "Não", "Ambivalente"] },
        { key: "lutos_perdas", label: "Lutos / perdas gestacionais anteriores", type: "textarea", full: true },
      ],
    },
    {
      titulo: "Estado emocional atual",
      campos: [
        { key: "humor_1a10", label: "Humor (1 a 10)", type: "number" },
        { key: "ansiedade_1a10", label: "Ansiedade (1 a 10)", type: "number" },
        { key: "estresse_1a10", label: "Estresse (1 a 10)", type: "number" },
        { key: "sono_qualidade", label: "Qualidade do sono", type: "select", options: ["Boa", "Regular", "Ruim", "Muito ruim"] },
        { key: "sono_horas", label: "Horas de sono/noite", type: "number" },
        { key: "apetite", label: "Apetite", type: "select", options: ["Normal", "Aumentado", "Diminuído"] },
        { key: "libido", label: "Libido", type: "select", options: ["Normal", "Aumentada", "Diminuída"] },
        { key: "ideacao_suicida", label: "Ideação suicida / autolesão", type: "select", options: ["Negada", "Presente — leve", "Presente — moderada", "Presente — grave"] },
        { key: "sintomas_dissociativos", label: "Sintomas dissociativos / pânico", type: "text" },
      ],
    },
    {
      titulo: "Rede de apoio e vínculo",
      campos: [
        { key: "suporte_parceiro", label: "Suporte do parceiro", type: "select", options: ["Excelente", "Bom", "Regular", "Ruim", "Ausente"] },
        { key: "suporte_familiar", label: "Suporte familiar", type: "select", options: ["Excelente", "Bom", "Regular", "Ruim", "Ausente"] },
        { key: "rede_apoio", label: "Rede de apoio (amigos, comunidade)", type: "textarea", full: true },
        { key: "vinculo_bebe", label: "Vínculo com o bebê", type: "textarea", full: true },
        { key: "expectativa_parto", label: "Expectativa em relação ao parto", type: "textarea", full: true },
        { key: "violencia", label: "Indícios de violência (psicológica, física, sexual)", type: "textarea", full: true, hint: "Em caso positivo, encaminhar conforme protocolo." },
      ],
    },
    {
      titulo: "Triagem e conduta",
      campos: [
        { key: "phq2", label: "PHQ-2 (sintomas depressivos)", type: "textarea", full: true },
        { key: "epds", label: "EPDS — Escala de Edimburgo (pontuação e itens)", type: "textarea", full: true },
        { key: "gad7", label: "GAD-7 (ansiedade)", type: "textarea", full: true },
        { key: "impressao_diagnostica", label: "Impressão diagnóstica", type: "textarea", full: true },
        { key: "conduta", label: "Conduta", type: "textarea", full: true },
        { key: "encaminhamentos", label: "Encaminhamentos", type: "textarea", full: true },
        { key: "frequencia_acompanhamento", label: "Frequência sugerida de acompanhamento", type: "text" },
        { key: "data_retorno", label: "Data sugerida de retorno", type: "date" },
      ],
    },
  ],
};

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

// Mapas de label legível para os checklists guardados em partos_classificacao
const LABEL_ANT_CLINICO: Record<string, string> = {
  diabetes: "Diabetes",
  infeccao_urinaria: "Infecção urinária",
  infertilidade: "Infertilidade",
  cardiopatia: "Cardiopatia",
  tromboembolismo: "Tromboembolismo",
  hipertensao: "Hipertensão arterial",
  criterios_pelvicos: "Critérios pélvicos uterinos",
  cirurgia: "Cirurgia",
};
const LABEL_ANT_FAM: Record<string, string> = {
  diabetes: "Diabetes",
  hipertensao: "Hipertensão",
  gemelar: "Gemelar",
};
const LABEL_GEST_ATUAL: Record<string, string> = {
  tabagismo: "Tabagismo",
  etilismo: "Etilismo",
  outras_drogas: "Outras drogas",
  violencia_domestica: "Violência doméstica",
  hiv: "HIV",
  sifilis: "Sífilis",
  toxoplasmose: "Toxoplasmose",
  infeccao_urinaria: "Infecção urinária",
  anemia: "Anemia",
  insuf_istimocervical: "Insuficiência istimocervical",
  ameaca_parto_prematuro: "Ameaça de parto prematuro",
  hemograma_1t: "Hemograma 1º Trim.",
  hemograma_2t: "Hemograma 2º Trim.",
  hemograma_3t: "Hemograma 3º Trim.",
  isoimunizacao_rh: "Isoimunização Rh",
  oligo_polidramnio: "Oligo / polidrâmnio",
  rotura_prematura: "Rotura prematura de membranas",
  ciur: "CIUR",
  febre: "Febre",
  hipertensao: "Hipertensão arterial",
  pre_eclampsia: "Pré-eclâmpsia",
  eclampsia: "Eclâmpsia",
  cardiopatia: "Cardiopatia",
  diabetes_gestacional: "Diabetes gestacional",
  uso_insulina: "Uso de insulina",
  exantema: "Exantema / rash cutâneo",
};

function semanas(dum: string | null | undefined): number | null {
  if (!dum) return null;
  const d = new Date(dum);
  if (isNaN(d.getTime())) return null;
  const w = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 7));
  return w < 0 ? 0 : w > 42 ? 42 : w;
}

function dpp(dum: string | null | undefined): string | null {
  if (!dum) return null;
  const d = new Date(dum);
  if (isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + 280);
  return d.toISOString().slice(0, 10);
}

function fmtData(s: unknown): string {
  if (!s) return "—";
  const d = new Date(String(s));
  if (isNaN(d.getTime())) return String(s);
  return d.toLocaleDateString("pt-BR");
}

function idadeAnos(nascimento: unknown): number | null {
  if (!nascimento) return null;
  const d = new Date(String(nascimento));
  if (isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function ultimaMedicao(medicoes: Array<Record<string, unknown>>, termos: string[]): string | null {
  const norm = (s: string) => s.toLowerCase();
  const matched = medicoes.find((m) => {
    const p = norm(String(m.parametro ?? ""));
    return termos.some((t) => p.includes(norm(t)));
  });
  return matched ? String(matched.valor ?? "") : null;
}

type ResumoCartao = {
  // Identificação
  idade: number | null;
  ig: number | null;
  dpp: string | null;
  dum: string | null;
  unidade: string | null;
  // Obstétrico
  gpa: string;
  tipoGestacao: string | null;
  risco: string | null;
  dppEco: string | null;
  // Antropometria
  pesoAnterior: number | null;
  altura: number | null;
  imcAnterior: number | null;
  pesoAtual: number | null;
  imcAtual: number | null;
  ganhoPeso: number | null;
  // Listas legíveis
  comorbidades: string[];
  familiares: string[];
  habitos: string[];
  intercorrencias: string[];
  // Vitais mais recentes (para chips)
  ultimaPA: { sis: number; dia: number; semana?: number; data?: string } | null;
  ultimoBCF: { valor: number; semana?: number; data?: string } | null;
  ultimaFC: { valor: number; data?: string } | null;
  ultimaAU: { valor: number; semana?: number; data?: string } | null;
};

/** Pega o último evento por (categoria, key) — array é cumulativo. */
function reduzirChecklist(
  eventos: Array<Record<string, unknown>>,
  categoria: string,
  labels: Record<string, string>,
): string[] {
  const map = new Map<string, string>();
  for (const ev of eventos) {
    if (String(ev.categoria ?? "") !== categoria) continue;
    const key = String(ev.key ?? "");
    if (!key) continue;
    map.set(key, String(ev.valor ?? ""));
  }
  const out: string[] = [];
  for (const [key, valor] of map.entries()) {
    if (valor === "sim" && labels[key]) out.push(labels[key]);
  }
  return out;
}

/** Pega o último valor para um tipo dentro da categoria "geral" do histórico. */
function ultimoGeral(eventos: Array<Record<string, unknown>>, tipo: string): string | null {
  let valor: string | null = null;
  for (const ev of eventos) {
    if (String(ev.tipo ?? "") === tipo) {
      const v = ev.valor;
      if (v != null && String(v) !== "") valor = String(v);
    }
  }
  return valor;
}

function montarResumo(cartao: Cartao): ResumoCartao {
  const profile = (cartao.profile ?? {}) as Record<string, unknown>;
  const medicoes = cartao.medicoes ?? [];
  const eventos = Array.isArray(profile.partos_classificacao)
    ? (profile.partos_classificacao as Array<Record<string, unknown>>)
    : [];

  const idade = idadeAnos(profile.data_nascimento);
  const ig = semanas(profile.dum as string | null | undefined);
  const dum = (profile.dum as string | null | undefined) ?? null;

  // Geral (último valor de cada tipo no histórico)
  const risco = ultimoGeral(eventos, "risco");
  const tipoGestacao = ultimoGeral(eventos, "tipo_gestacao");
  const dppEco = ultimoGeral(eventos, "dpp_eco");
  const pesoAnteriorStr = ultimoGeral(eventos, "peso_anterior");
  const alturaStr = ultimoGeral(eventos, "altura");
  const imcAntStr = ultimoGeral(eventos, "imc_anterior");

  const pesoAnterior = pesoAnteriorStr ? Number(pesoAnteriorStr) : null;
  const altura = alturaStr ? Number(alturaStr) : null;
  const imcAnterior = imcAntStr ? Number(imcAntStr) : null;

  const pesoAtualStr = ultimaMedicao(medicoes, ["peso"]);
  const pesoAtual = pesoAtualStr ? Number(pesoAtualStr) : null;

  let imcAtual: number | null = null;
  if (pesoAtual && altura) {
    const aM = altura > 3 ? altura / 100 : altura; // aceita cm ou m
    if (aM > 0) imcAtual = Number((pesoAtual / (aM * aM)).toFixed(1));
  }
  const ganhoPeso = pesoAtual != null && pesoAnterior != null
    ? Number((pesoAtual - pesoAnterior).toFixed(1))
    : null;

  // Vitais mais recentes
  const findLast = (
    pred: (parametro: string) => boolean,
  ): { valor: number; semana?: number; data?: string } | null => {
    for (const m of medicoes) {
      const p = String(m.parametro ?? "").toLowerCase();
      if (pred(p)) {
        return {
          valor: Number(m.valor),
          semana: (m.semana_gestacional as number | null) ?? undefined,
          data: m.data_medicao as string | undefined,
        };
      }
    }
    return null;
  };
  const sis = findLast((p) => p.includes("sist"));
  const dia = findLast((p) => p.includes("diast"));
  const bcf = findLast((p) => p.includes("bcf") || p.includes("batim"));
  const fc = findLast((p) => p.includes("frequência cardíaca") || p.includes("frequencia cardiaca") || p === "fc");
  const au = findLast((p) => p.includes("altura uterina"));

  return {
    idade,
    ig,
    dpp: dpp(dum),
    dum,
    unidade: (profile.unidade_saude as string | null) ?? null,
    gpa: `G${profile.numero_gestacoes ?? 0} P${profile.numero_partos ?? 0} A${profile.numero_abortos ?? 0}`,
    tipoGestacao,
    risco,
    dppEco,
    pesoAnterior,
    altura,
    imcAnterior,
    pesoAtual,
    imcAtual,
    ganhoPeso,
    comorbidades: reduzirChecklist(eventos, "ant_clinico", LABEL_ANT_CLINICO),
    familiares: reduzirChecklist(eventos, "ant_fam", LABEL_ANT_FAM),
    habitos: reduzirChecklist(eventos, "gest_atual", {
      tabagismo: "Tabagismo",
      etilismo: "Etilismo",
      outras_drogas: "Outras drogas",
    }),
    intercorrencias: reduzirChecklist(eventos, "gest_atual", LABEL_GEST_ATUAL)
      .filter((l) => !["Tabagismo", "Etilismo", "Outras drogas"].includes(l)),
    ultimaPA: sis && dia ? { sis: sis.valor, dia: dia.valor, semana: sis.semana, data: sis.data } : null,
    ultimoBCF: bcf,
    ultimaFC: fc ? { valor: fc.valor, data: fc.data } : null,
    ultimaAU: au,
  };
}

/** Prefill apenas dos campos que fazem sentido ressalvar no formulário do dia. */
function montarPrefill(cartao: Cartao): { valores: Record<string, string>; preenchidos: Set<string> } {
  const valores: Record<string, string> = {};
  const medicoes = cartao.medicoes ?? [];

  const map: Array<[string, string[]]> = [
    ["pa_sistolica", ["sistólica", "sistolica"]],
    ["pa_diastolica", ["diastólica", "diastolica"]],
    ["frequencia_cardiaca", ["frequência cardíaca", "frequencia cardiaca", "fc"]],
    ["bcf", ["bcf", "batiment"]],
    ["temperatura", ["temperatura"]],
    ["saturacao_o2", ["satura"]],
    ["peso_kg", ["peso"]],
    ["peso_atual_kg", ["peso"]],
    ["altura_uterina_cm", ["altura uterina"]],
  ];
  for (const [k, termos] of map) {
    const v = ultimaMedicao(medicoes, termos);
    if (v != null && v !== "") valores[k] = v;
  }
  return { valores, preenchidos: new Set(Object.keys(valores)) };
}

// ============= Séries para os gráficos =============
type Ponto = { semana: number } & Record<string, number | undefined>;

function buildSeries(medicoes: Array<Record<string, unknown>>) {
  const filtrar = (pred: (p: string) => boolean) =>
    medicoes
      .filter((m) => pred(String(m.parametro ?? "").toLowerCase()))
      .map((m) => ({
        semana: (m.semana_gestacional as number | null) ?? 0,
        valor: Number(m.valor),
      }))
      .sort((a, b) => a.semana - b.semana);

  const sis = filtrar((p) => p.includes("sist"));
  const dia = filtrar((p) => p.includes("diast"));
  const semSet = new Set<number>([...sis.map((s) => s.semana), ...dia.map((d) => d.semana)]);
  const pressao: Ponto[] = Array.from(semSet)
    .sort((a, b) => a - b)
    .map((s) => ({
      semana: s,
      sistolica: sis.find((x) => x.semana === s)?.valor,
      diastolica: dia.find((x) => x.semana === s)?.valor,
    }));

  const peso = filtrar((p) => p.includes("peso")).map((m) => ({ semana: m.semana, peso: m.valor }));
  const au = filtrar((p) => p.includes("altura uterina")).map((m) => ({ semana: m.semana, au: m.valor }));
  const bcf = filtrar((p) => p.includes("bcf") || p.includes("batim")).map((m) => ({ semana: m.semana, bcf: m.valor }));
  const glic = filtrar((p) => p.includes("glic")).map((m) => ({ semana: m.semana, glicemia: m.valor }));

  return { pressao, peso, au, bcf, glic };
}

// ============= Componente principal =============
function AvaliacaoPublicaPage() {
  const { token } = Route.useParams();
  const [info, setInfo] = useState<Info | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [etapa, setEtapa] = useState<"identificacao" | "formulario" | "sucesso">("identificacao");
  const [nome, setNome] = useState("");
  const [registroNumero, setRegistroNumero] = useState("");
  const [registroUf, setRegistroUf] = useState("SP");
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [preenchidos, setPreenchidos] = useState<Set<string>>(new Set());
  const [evidencias, setEvidencias] = useState<Array<{ path: string; nome: string }>>([]);
  const [uploadando, setUploadando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [cartaoAberto, setCartaoAberto] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("get_evaluation_request_public", { _token: token });
      if (error || !data) setErro("Link inválido ou não encontrado.");
      else setInfo(data as unknown as Info);
      setLoading(false);
    })();
  }, [token]);

  const prefill = useMemo(() => (info ? montarPrefill(info.cartao) : null), [info]);
  const resumo = useMemo(() => (info ? montarResumo(info.cartao) : null), [info]);
  const series = useMemo(() => (info ? buildSeries(info.cartao.medicoes) : null), [info]);

  const irParaFormulario = () => {
    if (prefill) {
      setRespostas((prev) => ({ ...prefill.valores, ...prev }));
      setPreenchidos(prefill.preenchidos);
    }
    setEtapa("formulario");
  };

  const uploadEvidencia = async (file: File) => {
    setUploadando(true);
    setErro(null);
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${token}/${Date.now()}_${safe}`;
    const { error } = await supabase.storage.from("evaluation-evidence").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    setUploadando(false);
    if (error) {
      setErro("Erro ao enviar arquivo: " + error.message);
      return;
    }
    setEvidencias((prev) => [...prev, { path, nome: file.name }]);
  };

  const removerEvidencia = async (path: string) => {
    await supabase.storage.from("evaluation-evidence").remove([path]);
    setEvidencias((prev) => prev.filter((e) => e.path !== path));
  };

  const enviar = async () => {
    if (!info) return;
    setEnviando(true);
    setErro(null);
    const payload = { ...respostas, _evidencias: evidencias };
    const { data, error } = await supabase.rpc("submit_evaluation_response", {
      _token: token,
      _nome: nome.trim(),
      _registro_tipo: REG_POR_ESP[info.especialidade],
      _registro_numero: registroNumero.trim(),
      _registro_uf: registroUf.trim().toUpperCase(),
      _respostas: payload,
    });
    setEnviando(false);
    if (error) {
      setErro("Erro ao enviar: " + error.message);
      return;
    }
    const result = data as unknown as { success: boolean; message?: string };
    if (!result?.success) {
      setErro(result?.message ?? "Não foi possível enviar.");
      return;
    }
    setEtapa("sucesso");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingMessage />
      </div>
    );
  }

  if (erro && !info) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <LiquidCard className="p-6 max-w-md text-center">
          <h1 className="text-xl font-bold font-display text-foreground mb-2">Não foi possível abrir</h1>
          <p className="text-sm text-muted-foreground">{erro}</p>
        </LiquidCard>
      </div>
    );
  }

  if (!info) return null;

  if (info.status === "respondida") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <LiquidCard className="p-6 max-w-md text-center">
          <h1 className="text-xl font-bold font-display text-foreground mb-2">Avaliação já preenchida</h1>
          <p className="text-sm text-muted-foreground">
            Esta avaliação já foi respondida e enviada para a gestante.
          </p>
        </LiquidCard>
      </div>
    );
  }

  if (info.status === "expirada" || new Date(info.expira_em).getTime() < Date.now()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <LiquidCard className="p-6 max-w-md text-center">
          <h1 className="text-xl font-bold font-display text-foreground mb-2">Link expirado</h1>
          <p className="text-sm text-muted-foreground">
            Solicite à gestante a geração de um novo link de avaliação.
          </p>
        </LiquidCard>
      </div>
    );
  }

  if (etapa === "sucesso") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <LiquidCard className="p-6 max-w-md text-center">
          <h1 className="text-xl font-bold font-display text-foreground mb-2">Avaliação enviada</h1>
          <p className="text-sm text-muted-foreground">
            Obrigado, {nome.split(" ")[0]}! Os dados foram registrados na consulta de {info.gestante_nome}.
          </p>
        </LiquidCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold font-display text-foreground">
          Avaliação — {ESP_LABEL[info.especialidade]}
        </h1>
        <p className="text-sm text-muted-foreground mb-5">
          Gestante: <span className="font-semibold text-foreground">{info.gestante_nome}</span>
        </p>

        {erro && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs">{erro}</div>
        )}

        {etapa === "identificacao" && (
          <LiquidCard className="p-5 space-y-3">
            <h2 className="text-base font-bold font-display text-foreground">Identificação profissional</h2>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Nome completo</label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background"
                placeholder="Seu nome"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Registro</label>
                <div className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-muted text-muted-foreground text-center">
                  {REG_POR_ESP[info.especialidade]}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Número</label>
                <input
                  value={registroNumero}
                  onChange={(e) => setRegistroNumero(e.target.value)}
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background"
                  placeholder="000000"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">UF</label>
                <select
                  value={registroUf}
                  onChange={(e) => setRegistroUf(e.target.value)}
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background"
                >
                  {UFS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={() => {
                if (nome.trim().length < 3 || registroNumero.trim().length < 3) {
                  setErro("Preencha nome completo e número de registro.");
                  return;
                }
                setErro(null);
                irParaFormulario();
              }}
              className="w-full bg-primary text-primary-foreground text-sm font-bold py-2.5 rounded-full hover:opacity-90"
            >
              Continuar
            </button>
          </LiquidCard>
        )}

        {etapa === "formulario" && resumo && series && (
          <div className="space-y-4">
            <ResumoCartaoBlock
              resumo={resumo}
              alertas={info.cartao.alertas ?? []}
              series={series}
              onAbrirCartao={() => setCartaoAberto(true)}
            />

            {preenchidos.size > 0 && (
              <div className="px-3 py-2 rounded-lg bg-mint-light text-foreground text-[11px]">
                Campos marcados com <strong>"do cartão"</strong> foram pré-preenchidos com a última medição registrada. Confirme ou ajuste se necessário.
              </div>
            )}

            {SECOES[info.especialidade].map((sec) => (
              <LiquidCard key={sec.titulo} className="p-5 space-y-3">
                <h2 className="text-base font-bold font-display text-foreground">{sec.titulo}</h2>
                <div className="grid grid-cols-2 gap-3">
                  {sec.campos.map((c) => {
                    const isPrefilled = preenchidos.has(c.key) && (respostas[c.key] ?? "") !== "";
                    return (
                      <div key={c.key} className={c.full || c.type === "textarea" ? "col-span-2" : ""}>
                        <label className="text-xs font-semibold text-foreground flex items-center justify-between gap-2 mb-1">
                          <span>{c.label}</span>
                          {isPrefilled && (
                            <span className="text-[9px] font-bold uppercase tracking-wide bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                              do cartão
                            </span>
                          )}
                        </label>
                        {c.type === "textarea" ? (
                          <textarea
                            value={respostas[c.key] ?? ""}
                            onChange={(e) => setRespostas({ ...respostas, [c.key]: e.target.value })}
                            rows={3}
                            className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background"
                          />
                        ) : c.type === "select" ? (
                          <select
                            value={respostas[c.key] ?? ""}
                            onChange={(e) => setRespostas({ ...respostas, [c.key]: e.target.value })}
                            className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background"
                          >
                            <option value="">Selecione</option>
                            {c.options!.map((o) => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={c.type}
                            value={respostas[c.key] ?? ""}
                            onChange={(e) => setRespostas({ ...respostas, [c.key]: e.target.value })}
                            className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background"
                          />
                        )}
                        {c.hint && (
                          <p className="text-[10px] text-muted-foreground mt-1">{c.hint}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </LiquidCard>
            ))}

            <LiquidCard className="p-5 space-y-3">
              <div>
                <h2 className="text-base font-bold font-display text-foreground">Evidências e anexos</h2>
                <p className="text-xs text-muted-foreground">
                  Anexe receitas, laudos, fotos de exames ou outras evidências (PDF, imagem).
                </p>
              </div>

              <label className="block">
                <span className="sr-only">Anexar arquivo</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadEvidencia(f);
                    e.target.value = "";
                  }}
                  disabled={uploadando}
                  className="block w-full text-xs text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary file:text-primary-foreground hover:file:opacity-90"
                />
              </label>
              {uploadando && <p className="text-xs text-muted-foreground">Enviando arquivo...</p>}

              {evidencias.length > 0 && (
                <ul className="space-y-1">
                  {evidencias.map((e) => (
                    <li
                      key={e.path}
                      className="flex items-center justify-between text-xs bg-muted rounded-lg px-3 py-2"
                    >
                      <span className="truncate text-foreground">{e.nome}</span>
                      <button
                        onClick={() => removerEvidencia(e.path)}
                        className="text-[10px] font-bold text-destructive ml-2 shrink-0"
                      >
                        Remover
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </LiquidCard>

            <div className="flex gap-2">
              <button
                onClick={() => setEtapa("identificacao")}
                className="flex-1 bg-secondary text-secondary-foreground text-sm font-bold py-2.5 rounded-full"
              >
                Voltar
              </button>
              <button
                onClick={enviar}
                disabled={enviando}
                className="flex-1 bg-primary text-primary-foreground text-sm font-bold py-2.5 rounded-full disabled:opacity-50"
              >
                {enviando ? "Enviando..." : "Enviar avaliação"}
              </button>
            </div>
          </div>
        )}
      </div>

      {cartaoAberto && resumo && series && (
        <CartaoModal
          cartao={info.cartao}
          resumo={resumo}
          series={series}
          onClose={() => setCartaoAberto(false)}
        />
      )}
    </div>
  );
}

// ============= Resumo do cartão (alertas + gráficos + chips) =============
function corPorSeveridade(sev: string): string {
  const s = sev.toLowerCase();
  if (s === "critica" || s === "crítica" || s === "grave") return "bg-destructive/15 text-destructive border-destructive/40";
  if (s === "alta" || s === "alerta" || s === "atencao" || s === "atenção") return "bg-warm text-foreground border-warm";
  return "bg-muted text-foreground border-border";
}

function ResumoCartaoBlock({
  resumo,
  alertas,
  onAbrirCartao,
}: {
  resumo: ResumoCartao;
  alertas: AlertaPublico[];
  onAbrirCartao: () => void;
}) {
  return (
    <LiquidCard className="p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold font-display text-foreground">Resumo do cartão da gestante</h2>
          <p className="text-[11px] text-muted-foreground">
            Visão de relance para a consulta. Abra o cartão completo para gráficos, exames e medições.
          </p>
        </div>
        <button
          onClick={onAbrirCartao}
          className="bg-primary text-primary-foreground text-xs font-bold px-3 py-2 rounded-full shrink-0"
        >
          Ver cartão completo
        </button>
      </div>

      {/* Alertas */}
      <div>
        <p className="text-xs font-bold text-foreground mb-2">Alertas clínicos ativos</p>
        {alertas.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">Sem alertas no momento.</p>
        ) : (
          <ul className="space-y-1.5">
            {alertas.map((a) => (
              <li
                key={a.id}
                className={`text-[11px] border rounded-lg px-3 py-2 ${corPorSeveridade(a.severidade)}`}
              >
                <p className="font-bold">{a.titulo}</p>
                <p className="opacity-80">{a.mensagem}</p>
                {a.data && <p className="text-[10px] opacity-60 mt-0.5">{fmtData(a.data)}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Linha-chefe */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
        <Chip titulo="Idade" valor={resumo.idade != null ? `${resumo.idade}a` : "—"} />
        <Chip titulo="IG" valor={resumo.ig != null ? `${resumo.ig} sem.` : "—"} />
        <Chip titulo="DPP" valor={fmtData(resumo.dpp)} />
        <Chip titulo="G/P/A" valor={resumo.gpa} />
        <Chip titulo="Risco" valor={resumo.risco ?? "—"} />
        <Chip titulo="Tipo" valor={resumo.tipoGestacao ?? "—"} />
      </div>

      {/* Antropometria curta */}
      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <Chip titulo="IMC pré" valor={resumo.imcAnterior != null ? String(resumo.imcAnterior) : "—"} />
        <Chip titulo="IMC atual" valor={resumo.imcAtual != null ? String(resumo.imcAtual) : "—"} />
        <Chip
          titulo="Ganho ponderal"
          valor={resumo.ganhoPeso != null ? `${resumo.ganhoPeso > 0 ? "+" : ""}${resumo.ganhoPeso} kg` : "—"}
        />
      </div>

      {/* Últimos sinais */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        <Chip
          titulo="Última PA"
          valor={resumo.ultimaPA ? `${resumo.ultimaPA.sis}/${resumo.ultimaPA.dia}${resumo.ultimaPA.semana ? ` • ${resumo.ultimaPA.semana}s` : ""}` : "—"}
        />
        <Chip
          titulo="Último BCF"
          valor={resumo.ultimoBCF ? `${resumo.ultimoBCF.valor} bpm${resumo.ultimoBCF.semana ? ` • ${resumo.ultimoBCF.semana}s` : ""}` : "—"}
        />
        <Chip
          titulo="Última AU"
          valor={resumo.ultimaAU ? `${resumo.ultimaAU.valor} cm${resumo.ultimaAU.semana ? ` • ${resumo.ultimaAU.semana}s` : ""}` : "—"}
        />
        <Chip
          titulo="Peso atual"
          valor={resumo.pesoAtual != null ? `${resumo.pesoAtual} kg` : "—"}
        />
      </div>

      {/* Comorbidades relevantes em linha única */}
      {resumo.comorbidades.length > 0 && (
        <p className="text-[11px] text-foreground">
          <span className="font-bold">Comorbidades:</span>{" "}
          <span className="text-muted-foreground">{resumo.comorbidades.join(" • ")}</span>
        </p>
      )}
    </LiquidCard>
  );
}

function Chip({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="bg-muted rounded-lg px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{titulo}</p>
      <p className="text-[12px] font-semibold text-foreground">{valor}</p>
    </div>
  );
}

function ChipList({ titulo, itens }: { titulo: string; itens: string[] }) {
  return (
    <div className="bg-muted rounded-lg px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{titulo}</p>
      {itens.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">Nenhum registro.</p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {itens.map((i) => (
            <span key={i} className="text-[10px] bg-background border border-border rounded-full px-2 py-0.5 font-semibold text-foreground">
              {i}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ChartCard({ titulo, children }: { titulo: string; children: React.ReactElement }) {
  return (
    <div className="bg-background border border-border rounded-lg p-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 font-bold">{titulo}</p>
      <div style={{ width: "100%", height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ============= Modal com cartão completo =============
function CartaoModal({ cartao, onClose }: { cartao: Cartao; onClose: () => void }) {
  const profile = (cartao.profile ?? {}) as Record<string, unknown>;
  const semanasAtuais = semanas(profile.dum as string | null | undefined);
  const idade = idadeAnos(profile.data_nascimento);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-3"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold font-display text-foreground">Cartão da gestante</h3>
            <p className="text-xs text-muted-foreground">
              Dados clínicos completos disponíveis para esta avaliação.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-base font-bold w-8 h-8 rounded-full bg-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground shrink-0"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs mb-4">
          <div className="bg-muted rounded-lg px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Nascimento</p>
            <p className="font-semibold text-foreground">
              {fmtData(profile.data_nascimento)} {idade != null ? `• ${idade}a` : ""}
            </p>
          </div>
          <div className="bg-muted rounded-lg px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">DUM</p>
            <p className="font-semibold text-foreground">{fmtData(profile.dum)}</p>
          </div>
          <div className="bg-muted rounded-lg px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Idade gestacional</p>
            <p className="font-semibold text-foreground">
              {semanasAtuais != null ? `${semanasAtuais} semanas` : "—"}
            </p>
          </div>
          <div className="bg-muted rounded-lg px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">G / P / A</p>
            <p className="font-semibold text-foreground">
              {(profile.numero_gestacoes ?? 0) as number} / {(profile.numero_partos ?? 0) as number} / {(profile.numero_abortos ?? 0) as number}
            </p>
          </div>
          <div className="bg-muted rounded-lg px-3 py-2 col-span-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Unidade de saúde</p>
            <p className="font-semibold text-foreground">
              {(profile.unidade_saude as string) || "—"} — {(profile.bairro as string) || ""} {profile.cidade ? `/ ${profile.cidade}` : ""}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold text-foreground mb-1">Últimas medições</p>
            {cartao.medicoes.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">Sem medições registradas.</p>
            ) : (
              <ul className="space-y-1">
                {cartao.medicoes.slice(0, 30).map((m, i) => (
                  <li key={i} className="text-[11px] text-foreground flex justify-between border-b border-border py-1">
                    <span className="font-semibold">{String(m.parametro)}</span>
                    <span>
                      {String(m.valor)} {m.semana_gestacional ? `• ${m.semana_gestacional}s` : ""} • {fmtData(m.data_medicao)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="text-xs font-bold text-foreground mb-1">Exames laboratoriais</p>
            {cartao.exames.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">Sem exames registrados.</p>
            ) : (
              <ul className="space-y-1">
                {cartao.exames.slice(0, 20).map((e, i) => (
                  <li key={i} className="text-[11px] text-foreground border-b border-border py-1">
                    <span className="font-semibold">{String(e.tipo_exame)}</span> — {String(e.resultado)}{" "}
                    <span className={`text-[10px] ${e.status === "alterado" ? "text-destructive" : "text-muted-foreground"}`}>
                      ({String(e.status)})
                    </span>
                    <span className="block text-[10px] text-muted-foreground">{fmtData(e.data_exame)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="text-xs font-bold text-foreground mb-1">Exames de imagem</p>
            {cartao.imagens.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">Sem exames de imagem registrados.</p>
            ) : (
              <ul className="space-y-1">
                {cartao.imagens.slice(0, 15).map((e, i) => (
                  <li key={i} className="text-[11px] text-foreground border-b border-border py-1">
                    <span className="font-semibold">{String(e.tipo_exame)}</span>
                    <span className="block text-[10px] text-muted-foreground">{fmtData(e.data_exame)} • {String(e.status)}</span>
                    {e.laudo_texto ? <p className="text-[11px]">{String(e.laudo_texto)}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="text-xs font-bold text-foreground mb-1">Vacinas</p>
            {cartao.vacinas.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">Sem vacinas registradas.</p>
            ) : (
              <ul className="space-y-1">
                {cartao.vacinas.slice(0, 20).map((v, i) => (
                  <li key={i} className="text-[11px] text-foreground border-b border-border py-1 flex justify-between gap-2">
                    <span>
                      {String(v.vacina)}{" "}
                      {v.lote ? <span className="text-muted-foreground">(lote {String(v.lote)})</span> : null}
                      {v.fabricante ? <span className="text-muted-foreground"> — {String(v.fabricante)}</span> : null}
                    </span>
                    <span className="text-muted-foreground shrink-0">{fmtData(v.data_aplicacao)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-5 bg-primary text-primary-foreground text-sm font-bold py-2.5 rounded-full"
        >
          Fechar e continuar avaliação
        </button>
      </div>
    </div>
  );
}
