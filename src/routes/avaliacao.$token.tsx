import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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

type Info = {
  especialidade: Especialidade;
  status: "pendente" | "respondida" | "expirada";
  expira_em: string;
  gestante_nome: string;
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

const CAMPOS: Record<Especialidade, Array<{ key: string; label: string; type: "text" | "number" | "textarea" }>> = {
  medico: [
    { key: "pa_sistolica", label: "Pressão sistólica (mmHg)", type: "number" },
    { key: "pa_diastolica", label: "Pressão diastólica (mmHg)", type: "number" },
    { key: "frequencia_cardiaca", label: "Frequência cardíaca (bpm)", type: "number" },
    { key: "peso_kg", label: "Peso atual (kg)", type: "number" },
    { key: "altura_uterina_cm", label: "Altura uterina (cm)", type: "number" },
    { key: "bcf", label: "Batimentos cardíacos fetais (bpm)", type: "number" },
    { key: "idade_gestacional_sem", label: "Idade gestacional (semanas)", type: "number" },
    { key: "queixas", label: "Queixas relatadas", type: "textarea" },
    { key: "exame_fisico", label: "Exame físico", type: "textarea" },
    { key: "conduta", label: "Conduta e orientações", type: "textarea" },
    { key: "prescricoes", label: "Prescrições", type: "textarea" },
  ],
  nutricionista: [
    { key: "peso_atual_kg", label: "Peso atual (kg)", type: "number" },
    { key: "ganho_ponderal_kg", label: "Ganho ponderal na gestação (kg)", type: "number" },
    { key: "imc", label: "IMC", type: "number" },
    { key: "recordatorio_24h", label: "Recordatório 24h", type: "textarea" },
    { key: "intolerancias_alergias", label: "Intolerâncias e alergias", type: "textarea" },
    { key: "suplementacao", label: "Suplementação atual", type: "textarea" },
    { key: "plano_alimentar", label: "Plano alimentar e orientações", type: "textarea" },
  ],
  psicologo: [
    { key: "humor_1a10", label: "Humor (1 a 10)", type: "number" },
    { key: "ansiedade_1a10", label: "Ansiedade (1 a 10)", type: "number" },
    { key: "sono", label: "Qualidade do sono", type: "text" },
    { key: "suporte_familiar", label: "Suporte familiar", type: "text" },
    { key: "rede_apoio", label: "Rede de apoio", type: "textarea" },
    { key: "sinais_depressao", label: "Sinais de depressão (PHQ-2 / EPDS)", type: "textarea" },
    { key: "conduta", label: "Conduta e encaminhamentos", type: "textarea" },
  ],
};

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

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
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("get_evaluation_request_public", {
        _token: token,
      });
      if (error || !data) {
        setErro("Link inválido ou não encontrado.");
      } else {
        setInfo(data as unknown as Info);
      }
      setLoading(false);
    })();
  }, [token]);

  const enviar = async () => {
    if (!info) return;
    setEnviando(true);
    setErro(null);
    const { data, error } = await supabase.rpc("submit_evaluation_response", {
      _token: token,
      _nome: nome.trim(),
      _registro_tipo: REG_POR_ESP[info.especialidade],
      _registro_numero: registroNumero.trim(),
      _registro_uf: registroUf.trim().toUpperCase(),
      _respostas: respostas,
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
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold font-display text-foreground">
          Avaliação — {ESP_LABEL[info.especialidade]}
        </h1>
        <p className="text-sm text-muted-foreground mb-5">
          Gestante: <span className="font-semibold text-foreground">{info.gestante_nome}</span>
        </p>

        {erro && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs">{erro}</div>
        )}

        {etapa === "identificacao" ? (
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
              <div className="col-span-1">
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
                    <option key={u} value={u}>
                      {u}
                    </option>
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
                setEtapa("formulario");
              }}
              className="w-full bg-primary text-primary-foreground text-sm font-bold py-2.5 rounded-full hover:opacity-90"
            >
              Continuar para avaliação
            </button>
          </LiquidCard>
        ) : (
          <LiquidCard className="p-5 space-y-3">
            <h2 className="text-base font-bold font-display text-foreground">Avaliação clínica</h2>
            {CAMPOS[info.especialidade].map((c) => (
              <div key={c.key}>
                <label className="text-xs font-semibold text-foreground block mb-1">{c.label}</label>
                {c.type === "textarea" ? (
                  <textarea
                    value={respostas[c.key] ?? ""}
                    onChange={(e) => setRespostas({ ...respostas, [c.key]: e.target.value })}
                    rows={3}
                    className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background"
                  />
                ) : (
                  <input
                    type={c.type}
                    value={respostas[c.key] ?? ""}
                    onChange={(e) => setRespostas({ ...respostas, [c.key]: e.target.value })}
                    className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background"
                  />
                )}
              </div>
            ))}
            <div className="flex gap-2 pt-2">
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
          </LiquidCard>
        )}
      </div>
    </div>
  );
}
