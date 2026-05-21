import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { LiquidCard } from "@/components/LiquidCard";
import { LoadingMessage } from "@/components/LoadingMessage";
import { supabase } from "@/integrations/supabase/client";

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

type Cartao = {
  profile: Record<string, unknown> | null;
  medicoes: Array<Record<string, unknown>>;
  vacinas: Array<Record<string, unknown>>;
  exames: Array<Record<string, unknown>>;
  imagens: Array<Record<string, unknown>>;
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
  /** Dica visível abaixo do campo (ex.: orientação clínica). */
  hint?: string;
};

type Secao = { titulo: string; campos: Campo[] };

const SECOES: Record<Especialidade, Secao[]> = {
  medico: [
    {
      titulo: "Identificação clínica",
      campos: [
        { key: "idade_materna_anos", label: "Idade materna (anos)", type: "number" },
        { key: "tipo_sanguineo", label: "Tipo sanguíneo / Rh", type: "select", options: ["A+","A-","B+","B-","AB+","AB-","O+","O-","Não informado"] },
        { key: "gestacao_atual_tipo", label: "Gestação atual", type: "select", options: ["Única","Gemelar dicoriônica","Gemelar monocoriônica","Múltipla","Indeterminada"] },
        { key: "classificacao_risco", label: "Classificação de risco gestacional", type: "select", options: ["Habitual / baixo","Alto risco","Muito alto risco"] },
      ],
    },
    {
      titulo: "Anamnese",
      campos: [
        { key: "queixa_principal", label: "Queixa principal", type: "textarea", full: true },
        { key: "historia_doenca_atual", label: "História da doença atual", type: "textarea", full: true },
        { key: "antecedentes_pessoais", label: "Antecedentes pessoais e comorbidades", type: "textarea", full: true },
        { key: "antecedentes_obstetricos", label: "Antecedentes obstétricos (G/P/A)", type: "text" },
        { key: "antecedentes_familiares", label: "Antecedentes familiares relevantes", type: "textarea", full: true },
        { key: "alergias", label: "Alergias", type: "text" },
        { key: "medicamentos_uso", label: "Medicamentos em uso", type: "textarea", full: true },
        { key: "tabagismo", label: "Tabagismo", type: "select", options: ["Não", "Sim", "Ex-tabagista"] },
        { key: "etilismo", label: "Etilismo", type: "select", options: ["Não", "Sim", "Ex-etilista"] },
        { key: "drogas_ilicitas", label: "Uso de drogas ilícitas", type: "select", options: ["Não", "Sim", "Ex-usuária"] },
      ],
    },
    {
      titulo: "Sinais vitais e exame físico",
      campos: [
        { key: "pa_sistolica", label: "PA sistólica (mmHg)", type: "number" },
        { key: "pa_diastolica", label: "PA diastólica (mmHg)", type: "number" },
        { key: "frequencia_cardiaca", label: "FC materna (bpm)", type: "number" },
        { key: "frequencia_respiratoria", label: "FR (irpm)", type: "number" },
        { key: "temperatura", label: "Temperatura (°C)", type: "number" },
        { key: "saturacao_o2", label: "SatO₂ (%)", type: "number" },
        { key: "peso_kg", label: "Peso (kg)", type: "number" },
        { key: "altura_cm", label: "Altura (cm)", type: "number" },
        { key: "imc", label: "IMC", type: "number" },
        { key: "exame_fisico_geral", label: "Exame físico geral", type: "textarea", full: true },
      ],
    },
    {
      titulo: "Avaliação obstétrica",
      campos: [
        { key: "idade_gestacional_sem", label: "Idade gestacional (semanas)", type: "number" },
        { key: "altura_uterina_cm", label: "Altura uterina (cm)", type: "number" },
        { key: "bcf", label: "BCF (bpm)", type: "number" },
        { key: "movimentos_fetais", label: "Movimentos fetais", type: "select", options: ["Presentes", "Diminuídos", "Ausentes", "Ainda não percebe"] },
        { key: "apresentacao", label: "Apresentação fetal", type: "select", options: ["Cefálica", "Pélvica", "Córmica", "Não definida"] },
        { key: "edema", label: "Edema", type: "select", options: ["Ausente", "MMII +/4", "MMII ++/4", "MMII +++/4", "Anasarca"] },
        { key: "dinamica_uterina", label: "Dinâmica uterina", type: "text" },
        { key: "perdas_vaginais", label: "Perdas vaginais", type: "text" },
        { key: "toque_vaginal", label: "Toque vaginal (se realizado)", type: "text" },
      ],
    },
    {
      titulo: "Avaliação de exames disponíveis",
      campos: [
        { key: "analise_laboratoriais", label: "Análise dos exames laboratoriais", type: "textarea", full: true, hint: "Revise os exames listados no cartão da gestante." },
        { key: "analise_imagem", label: "Análise dos exames de imagem", type: "textarea", full: true, hint: "Inclui USG, doppler, ecocardio fetal etc." },
        { key: "situacao_vacinal", label: "Situação vacinal", type: "select", options: ["Em dia","Pendências","Esquema desconhecido"] },
      ],
    },
    {
      titulo: "Conduta",
      campos: [
        { key: "hipoteses_diagnosticas", label: "Hipóteses diagnósticas / CID", type: "textarea", full: true },
        { key: "exames_solicitados", label: "Exames solicitados", type: "textarea", full: true },
        { key: "prescricoes", label: "Prescrições", type: "textarea", full: true },
        { key: "suplementacao", label: "Suplementação (ácido fólico, ferro, cálcio, DHA...)", type: "textarea", full: true },
        { key: "orientacoes", label: "Orientações", type: "textarea", full: true },
        { key: "encaminhamentos", label: "Encaminhamentos", type: "textarea", full: true },
        { key: "sinais_alarme_orientados", label: "Sinais de alarme orientados", type: "textarea", full: true, hint: "Sangramento, cefaleia, edema súbito, redução de movimentação fetal, etc." },
        { key: "data_retorno", label: "Data sugerida de retorno", type: "date" },
      ],
    },
  ],
  nutricionista: [
    {
      titulo: "Avaliação antropométrica",
      campos: [
        { key: "peso_pregestacional_kg", label: "Peso pré-gestacional (kg)", type: "number" },
        { key: "peso_atual_kg", label: "Peso atual (kg)", type: "number" },
        { key: "altura_cm", label: "Altura (cm)", type: "number" },
        { key: "imc_pregestacional", label: "IMC pré-gestacional", type: "number" },
        { key: "imc_atual", label: "IMC atual", type: "number" },
        { key: "ganho_ponderal_kg", label: "Ganho ponderal total (kg)", type: "number" },
        { key: "ganho_esperado", label: "Ganho esperado (kg)", type: "text", hint: "Conforme IMC pré-gestacional (IOM)." },
        { key: "circunferencia_braco", label: "Circunferência do braço (cm)", type: "number" },
        { key: "classificacao_nutricional", label: "Classificação nutricional", type: "select", options: ["Baixo peso","Eutrofia","Sobrepeso","Obesidade"] },
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
        { key: "preferencias_culturais", label: "Preferências culturais/religiosas", type: "textarea", full: true },
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
      titulo: "Exames bioquímicos relevantes",
      campos: [
        { key: "exames_bioquimicos", label: "Análise dos exames laboratoriais (Hb, Ht, ferritina, glicemia, TOTG, vit D...)", type: "textarea", full: true, hint: "Use o cartão da gestante como referência." },
        { key: "deficiencias_identificadas", label: "Deficiências identificadas", type: "textarea", full: true },
      ],
    },
    {
      titulo: "Conduta nutricional",
      campos: [
        { key: "diagnostico_nutricional", label: "Diagnóstico nutricional", type: "textarea", full: true },
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
      titulo: "Anamnese psicológica",
      campos: [
        { key: "queixa_principal", label: "Queixa principal", type: "textarea", full: true },
        { key: "gestacao_planejada", label: "Gestação planejada", type: "select", options: ["Sim", "Não", "Parcialmente"] },
        { key: "gestacao_desejada", label: "Gestação desejada", type: "select", options: ["Sim", "Não", "Ambivalente"] },
        { key: "historico_psiquiatrico", label: "Histórico psiquiátrico pessoal", type: "textarea", full: true },
        { key: "historico_familiar", label: "Histórico psiquiátrico familiar", type: "textarea", full: true },
        { key: "uso_medicacao_psi", label: "Uso de psicofármacos", type: "text" },
        { key: "uso_substancias", label: "Uso de álcool / tabaco / outras substâncias", type: "text" },
        { key: "acompanhamento_anterior", label: "Acompanhamento psicológico anterior", type: "text" },
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
        { key: "condicoes_socioeconomicas", label: "Condições socioeconômicas / moradia", type: "textarea", full: true },
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

function semanas(dum: string | null | undefined): number | null {
  if (!dum) return null;
  const d = new Date(dum);
  if (isNaN(d.getTime())) return null;
  const w = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 7));
  return w < 0 ? 0 : w > 42 ? 42 : w;
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

/** Acha a última medição cujo parâmetro contenha qualquer um dos termos (case insensitive). */
function ultimaMedicao(medicoes: Array<Record<string, unknown>>, termos: string[]): string | null {
  const norm = (s: string) => s.toLowerCase();
  const matched = medicoes.find((m) => {
    const p = norm(String(m.parametro ?? ""));
    return termos.some((t) => p.includes(norm(t)));
  });
  return matched ? String(matched.valor ?? "") : null;
}

/** Monta valores pré-preenchidos a partir do cartão. Retorna mapa + conjunto de chaves preenchidas. */
function montarPrefill(cartao: Cartao): { valores: Record<string, string>; preenchidos: Set<string> } {
  const valores: Record<string, string> = {};
  const profile = (cartao.profile ?? {}) as Record<string, unknown>;
  const medicoes = cartao.medicoes ?? [];

  // Demografia / obstétrico básico
  const idade = idadeAnos(profile.data_nascimento);
  if (idade != null) valores.idade_materna_anos = String(idade);

  const ig = semanas(profile.dum as string | null | undefined);
  if (ig != null) valores.idade_gestacional_sem = String(ig);

  const g = (profile.numero_gestacoes ?? null) as number | null;
  const p = (profile.numero_partos ?? null) as number | null;
  const a = (profile.numero_abortos ?? null) as number | null;
  if (g != null || p != null || a != null) {
    valores.antecedentes_obstetricos = `G${g ?? 0} P${p ?? 0} A${a ?? 0}`;
  }

  // Medições clínicas mais recentes
  const map: Array<[string, string[]]> = [
    ["pa_sistolica", ["sistólica", "sistolica"]],
    ["pa_diastolica", ["diastólica", "diastolica"]],
    ["frequencia_cardiaca", ["frequência cardíaca", "frequencia cardiaca", "fc"]],
    ["bcf", ["bcf", "batimento"]],
    ["temperatura", ["temperatura"]],
    ["saturacao_o2", ["satura"]],
    ["peso_kg", ["peso"]],
    ["peso_atual_kg", ["peso"]],
    ["altura_cm", ["altura "]], // espaço para não casar com 'altura uterina'
    ["altura_uterina_cm", ["altura uterina"]],
    ["imc", ["imc"]],
    ["imc_atual", ["imc"]],
    ["circunferencia_braco", ["circunferência do braço", "circunferencia do braco"]],
  ];
  for (const [k, termos] of map) {
    const v = ultimaMedicao(medicoes, termos);
    if (v != null && v !== "") valores[k] = v;
  }

  const preenchidos = new Set(Object.keys(valores));
  return { valores, preenchidos };
}

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
  const [jaAbriuCartao, setJaAbriuCartao] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("get_evaluation_request_public", { _token: token });
      if (error || !data) setErro("Link inválido ou não encontrado.");
      else setInfo(data as unknown as Info);
      setLoading(false);
    })();
  }, [token]);

  const prefill = useMemo(() => (info ? montarPrefill(info.cartao) : null), [info]);

  const irParaFormulario = () => {
    if (prefill) {
      // Mescla pré-preenchidos sem sobrescrever o que o profissional já digitou.
      setRespostas((prev) => ({ ...prefill.valores, ...prev }));
      setPreenchidos(prefill.preenchidos);
    }
    setEtapa("formulario");
    if (!jaAbriuCartao) {
      setCartaoAberto(true);
      setJaAbriuCartao(true);
    }
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
      <div className="max-w-2xl mx-auto">
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

        {etapa === "formulario" && (
          <div className="space-y-4">
            <LiquidCard className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground">Dados da gestante disponíveis</p>
                <p className="text-[11px] text-muted-foreground">
                  Reabra a qualquer momento para revisar o cartão e histórico clínico.
                </p>
              </div>
              <button
                onClick={() => setCartaoAberto(true)}
                className="bg-primary text-primary-foreground text-xs font-bold px-3 py-2 rounded-full shrink-0"
              >
                Ver dados da gestante
              </button>
            </LiquidCard>

            {preenchidos.size > 0 && (
              <div className="px-3 py-2 rounded-lg bg-mint-light text-foreground text-[11px]">
                Campos marcados com <strong>“do cartão”</strong> foram pré-preenchidos com dados já registrados no aplicativo da gestante. Confirme ou ajuste se necessário.
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

      {cartaoAberto && (
        <CartaoModal cartao={info.cartao} onClose={() => setCartaoAberto(false)} />
      )}
    </div>
  );
}

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
              Dados clínicos disponíveis para esta avaliação.
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
                {cartao.medicoes.slice(0, 20).map((m, i) => (
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
                {cartao.exames.slice(0, 15).map((e, i) => (
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
                {cartao.imagens.slice(0, 10).map((e, i) => (
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
                {cartao.vacinas.slice(0, 15).map((v, i) => (
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
