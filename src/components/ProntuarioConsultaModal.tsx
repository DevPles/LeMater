import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  appointmentId: string;
  onClose: () => void;
};

type Prontuario = {
  slot: {
    id: string;
    data_hora: string;
    status: string;
    duracao_min: number;
    modalidade: string;
    titulo: string | null;
    tipo_atendimento: string | null;
    observacao: string | null;
  };
  profissional: { nome: string; especialidade: string; registro: string | null } | null;
  gestante: { nome: string | null; email: string | null } | null;
  observacoes: { id: string; observacoes: string | null; created_at: string }[];
  medicoes: {
    id: string; parametro: string; valor: number; semana_gestacional: number | null;
    data_medicao: string; observacao: string | null; created_at: string;
  }[];
  exames: {
    id: string; tipo_exame: string; resultado: string; status: string;
    data_exame: string; observacao: string | null; created_at: string;
  }[];
  imagens: {
    id: string; tipo_exame: string; status: string; semana_gestacional: number | null;
    laudo_texto: string | null; data_exame: string; created_at: string;
  }[];
  vacinas: {
    id: string; vacina: string; data_aplicacao: string;
    observacao: string | null; created_at: string;
  }[];
};

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function ProntuarioConsultaModal({ appointmentId, onClose }: Props) {
  const [data, setData] = useState<Prontuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      setLoading(true);
      const { data: rpc, error } = await supabase
        .rpc("get_consulta_prontuario" as any, { _appointment_id: appointmentId });
      if (!ativo) return;
      if (error) {
        console.error(error);
        setErro("Não foi possível carregar o prontuário desta consulta.");
      } else {
        setData(rpc as unknown as Prontuario);
      }
      setLoading(false);
    })();
    return () => { ativo = false; };
  }, [appointmentId]);

  const total =
    (data?.observacoes.length ?? 0) +
    (data?.medicoes.length ?? 0) +
    (data?.exames.length ?? 0) +
    (data?.imagens.length ?? 0) +
    (data?.vacinas.length ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-xl">
        <div className="px-5 py-3 bg-[#1a1557] text-white flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-white/70">
              Prontuário da consulta
            </p>
            <p className="text-sm font-bold">
              {data?.slot ? fmtDateTime(data.slot.data_hora) : "Carregando..."}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-base font-bold leading-none flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading && (
            <p className="text-sm text-muted-foreground italic text-center py-10">
              Carregando prontuário...
            </p>
          )}
          {erro && (
            <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
              {erro}
            </p>
          )}

          {data && (
            <>
              {/* Cabeçalho */}
              <section className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                    Profissional
                  </p>
                  <p className="font-bold text-foreground">
                    {data.profissional?.nome ?? "—"}
                  </p>
                  <p className="text-muted-foreground">
                    {data.profissional?.especialidade ?? ""}
                    {data.profissional?.registro ? ` • ${data.profissional.registro}` : ""}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                    Gestante
                  </p>
                  <p className="font-bold text-foreground">
                    {data.gestante?.nome ?? "—"}
                  </p>
                  <p className="text-muted-foreground">{data.gestante?.email ?? ""}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 sm:col-span-2">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                    Sessão
                  </p>
                  <p className="text-foreground">
                    <span className="font-semibold">{data.slot.titulo ?? "Sem título"}</span>
                    {" • "}{data.slot.tipo_atendimento ?? "—"}
                  </p>
                  <p className="text-muted-foreground">
                    {data.slot.duracao_min} min •{" "}
                    {data.slot.modalidade === "videochamada" ? "Vídeo" : "Presencial"} •
                    Status: {data.slot.status}
                  </p>
                </div>
              </section>

              {total === 0 && (
                <p className="text-sm text-muted-foreground italic text-center py-6">
                  Nenhum lançamento foi feito durante esta consulta.
                </p>
              )}

              {/* Observações */}
              {data.observacoes.length > 0 && (
                <Section title={`Observações clínicas (${data.observacoes.length})`}>
                  <div className="space-y-2">
                    {data.observacoes.map((o) => (
                      <div key={o.id} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-[10px] text-amber-700 mb-1">
                          {fmtDateTime(o.created_at)}
                        </p>
                        <p className="text-xs text-foreground whitespace-pre-wrap">
                          {o.observacoes ?? "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Medições */}
              {data.medicoes.length > 0 && (
                <Section title={`Medições (${data.medicoes.length})`}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-[10px] uppercase text-muted-foreground border-b border-border">
                        <th className="py-1.5">Parâmetro</th>
                        <th className="py-1.5">Valor</th>
                        <th className="py-1.5">Sem.</th>
                        <th className="py-1.5">Data</th>
                        <th className="py-1.5">Observação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.medicoes.map((m) => (
                        <tr key={m.id} className="border-b border-border/50">
                          <td className="py-1.5 font-semibold">{m.parametro}</td>
                          <td className="py-1.5">{m.valor}</td>
                          <td className="py-1.5">{m.semana_gestacional ?? "—"}</td>
                          <td className="py-1.5">{fmtDate(m.data_medicao)}</td>
                          <td className="py-1.5 text-muted-foreground">{m.observacao ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Section>
              )}

              {/* Exames */}
              {data.exames.length > 0 && (
                <Section title={`Exames laboratoriais (${data.exames.length})`}>
                  <div className="space-y-2">
                    {data.exames.map((e) => (
                      <div key={e.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
                        <div className="flex justify-between mb-1">
                          <p className="font-bold text-blue-900">{e.tipo_exame}</p>
                          <span className="text-[10px] text-blue-700">{fmtDate(e.data_exame)}</span>
                        </div>
                        <p className="text-blue-800">Resultado: {e.resultado}</p>
                        <p className="text-blue-700">Status: {e.status}</p>
                        {e.observacao && (
                          <p className="text-blue-700 italic mt-1">Obs: {e.observacao}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Imagens */}
              {data.imagens.length > 0 && (
                <Section title={`Exames de imagem (${data.imagens.length})`}>
                  <div className="space-y-2">
                    {data.imagens.map((i) => (
                      <div key={i.id} className="bg-violet-50 border border-violet-200 rounded-lg p-3 text-xs">
                        <div className="flex justify-between mb-1">
                          <p className="font-bold text-violet-900">{i.tipo_exame}</p>
                          <span className="text-[10px] text-violet-700">{fmtDate(i.data_exame)}</span>
                        </div>
                        <p className="text-violet-700">
                          Status: {i.status} • Semana: {i.semana_gestacional ?? "—"}
                        </p>
                        {i.laudo_texto && (
                          <p className="text-violet-800 mt-1 whitespace-pre-wrap">{i.laudo_texto}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Vacinas */}
              {data.vacinas.length > 0 && (
                <Section title={`Vacinas (${data.vacinas.length})`}>
                  <div className="space-y-2">
                    {data.vacinas.map((v) => (
                      <div key={v.id} className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs">
                        <div className="flex justify-between mb-1">
                          <p className="font-bold text-emerald-900">{v.vacina}</p>
                          <span className="text-[10px] text-emerald-700">{fmtDate(v.data_aplicacao)}</span>
                        </div>
                        {v.observacao && (
                          <p className="text-emerald-700 italic">{v.observacao}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#1a1557] mb-2">
        {title}
      </h3>
      {children}
    </section>
  );
}
