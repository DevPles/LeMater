import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";

type Slot = {
  id: string;
  data_hora: string;
  duracao_min: number;
  modalidade: string;
  status: string;
  gestante_id: string | null;
  observacao: string | null;
  titulo: string | null;
  descricao: string | null;
  tipo_atendimento: string | null;
};

type Profile = {
  user_id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  data_nascimento: string | null;
  dum: string | null;
  cidade: string | null;
  bairro: string | null;
  unidade_saude: string | null;
  numero_gestacoes: number | null;
  numero_partos: number | null;
  numero_abortos: number | null;
  bebe_sexo: string | null;
  cpf: string | null;
  foto_url: string | null;
};

type Med = {
  id: string;
  parametro: string;
  valor: number;
  data_medicao: string;
  semana_gestacional: number | null;
  observacao: string | null;
};

type Exam = {
  id: string;
  tipo_exame: string;
  resultado: string;
  status: string;
  data_exame: string;
  observacao: string | null;
};

type ImgExam = {
  id: string;
  tipo_exame: string;
  status: string;
  data_exame: string;
  laudo_texto: string | null;
};

type Vacc = {
  id: string;
  vacina: string;
  data_aplicacao: string;
};

type Alert = {
  id: string;
  origem: string;
  severidade: string;
  titulo: string;
  mensagem: string;
  data: string;
};

function calcularSemanas(dum: string | null): number | null {
  if (!dum) return null;
  const start = new Date(dum).getTime();
  const diffDays = Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return null;
  return Math.floor(diffDays / 7);
}

function calcularIdade(nasc: string | null): number | null {
  if (!nasc) return null;
  const d = new Date(nasc);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function fmtData(s: string) {
  return new Date(s).toLocaleDateString("pt-BR");
}

export function GestanteDetalheModal({
  slot,
  onClose,
}: {
  slot: Slot;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [meds, setMeds] = useState<Med[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [imgExams, setImgExams] = useState<ImgExam[]>([]);
  const [vaccs, setVaccs] = useState<Vacc[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    if (!slot.gestante_id) {
      setLoading(false);
      return;
    }
    const gid = slot.gestante_id;

    (async () => {
      setLoading(true);
      setErro(null);
      try {
        const [pRes, mRes, eRes, iRes, vRes, aRes] = await Promise.all([
          supabase
            .from("profiles")
            .select(
              "user_id, nome, email, telefone, data_nascimento, dum, cidade, bairro, unidade_saude, numero_gestacoes, numero_partos, numero_abortos, bebe_sexo, cpf, foto_url",
            )
            .eq("user_id", gid)
            .maybeSingle(),
          supabase
            .from("clinical_measurements")
            .select("id, parametro, valor, data_medicao, semana_gestacional, observacao")
            .eq("gestante_id", gid)
            .order("data_medicao", { ascending: false })
            .limit(20),
          supabase
            .from("exam_results")
            .select("id, tipo_exame, resultado, status, data_exame, observacao")
            .eq("gestante_id", gid)
            .order("data_exame", { ascending: false })
            .limit(20),
          supabase
            .from("image_exam_results")
            .select("id, tipo_exame, status, data_exame, laudo_texto")
            .eq("gestante_id", gid)
            .order("data_exame", { ascending: false })
            .limit(10),
          supabase
            .from("vaccinations")
            .select("id, vacina, data_aplicacao")
            .eq("gestante_id", gid)
            .order("data_aplicacao", { ascending: false })
            .limit(20),
          supabase.rpc("get_active_alerts", { _gestante_id: gid }),
        ]);

        if (!ativo) return;
        if (pRes.error) throw pRes.error;
        setProfile(pRes.data as Profile | null);
        setMeds((mRes.data ?? []) as Med[]);
        setExams((eRes.data ?? []) as Exam[]);
        setImgExams((iRes.data ?? []) as ImgExam[]);
        setVaccs((vRes.data ?? []) as Vacc[]);
        setAlerts((aRes.data ?? []) as Alert[]);
      } catch (e) {
        if (!ativo) return;
        setErro((e as Error).message ?? "Erro ao carregar dados");
      } finally {
        if (ativo) setLoading(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, [slot.gestante_id]);

  const semanas = calcularSemanas(profile?.dum ?? null);
  const idade = calcularIdade(profile?.data_nascimento ?? null);
  const dt = new Date(slot.data_hora);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-card w-full max-w-3xl max-h-[92vh] sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="bg-[#1a1557] text-white px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-white/60 font-bold">
              Preparação para o atendimento
            </p>
            <p className="text-base font-bold truncate">
              {slot.titulo ?? "Atendimento"}
            </p>
            <p className="text-xs text-white/80">
              {dt.toLocaleDateString("pt-BR")} às{" "}
              {dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}{" "}
              • {slot.duracao_min} min •{" "}
              {slot.modalidade === "videochamada" ? "Vídeo" : "Presencial"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 text-sm font-bold flex-shrink-0"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-5">
          {!slot.gestante_id ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Este horário ainda não tem gestante reservada.
            </p>
          ) : loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Carregando dados clínicos...</p>
          ) : erro ? (
            <p className="text-sm text-rose-700 text-center py-8 bg-rose-50 rounded-lg">{erro}</p>
          ) : !profile ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Não foi possível carregar o perfil da gestante.
            </p>
          ) : (
            <>
              {/* identificação */}
              <section className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {profile.foto_url ? (
                    <img src={profile.foto_url} alt={profile.nome ?? ""} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-muted-foreground">
                      {(profile.nome ?? "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold text-foreground truncate">
                    {profile.nome ?? "Sem nome"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {idade !== null ? `${idade} anos` : "Idade não informada"}
                    {profile.cidade ? ` • ${profile.cidade}` : ""}
                    {profile.bairro ? ` / ${profile.bairro}` : ""}
                  </p>
                  {profile.unidade_saude && (
                    <p className="text-xs text-muted-foreground">UBS: {profile.unidade_saude}</p>
                  )}
                </div>
              </section>

              {/* contato */}
              <section className="grid grid-cols-2 gap-2 text-xs">
                <Info label="Telefone" value={profile.telefone} />
                <Info label="E-mail" value={profile.email} />
                <Info label="CPF" value={profile.cpf} />
                <Info label="DUM" value={profile.dum ? fmtData(profile.dum) : null} />
              </section>

              {/* gestação */}
              <section className="bg-muted/40 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Sem. gest." value={semanas !== null ? `${semanas}` : "—"} />
                <Stat label="Gestações" value={String(profile.numero_gestacoes ?? 0)} />
                <Stat label="Partos" value={String(profile.numero_partos ?? 0)} />
                <Stat label="Abortos" value={String(profile.numero_abortos ?? 0)} />
              </section>

              {/* alertas ativos */}
              <Bloco titulo={`Alertas ativos (${alerts.length})`}>
                {alerts.length === 0 ? (
                  <Vazio>Nenhum alerta ativo.</Vazio>
                ) : (
                  <ul className="space-y-2">
                    {alerts.map((a) => (
                      <li
                        key={a.id}
                        className={`text-xs rounded-lg px-3 py-2 border ${
                          a.severidade === "urgente"
                            ? "bg-rose-50 border-rose-200 text-rose-900"
                            : "bg-amber-50 border-amber-200 text-amber-900"
                        }`}
                      >
                        <p className="font-bold">{a.titulo}</p>
                        <p>{a.mensagem}</p>
                        <p className="text-[10px] uppercase tracking-wide opacity-70 mt-1">
                          {a.origem} • {fmtData(a.data)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </Bloco>

              {/* últimas medições */}
              <Bloco titulo={`Últimas medições (${meds.length})`}>
                {meds.length === 0 ? (
                  <Vazio>Nenhuma medição registrada.</Vazio>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        <tr>
                          <th className="text-left py-1">Data</th>
                          <th className="text-left py-1">Parâmetro</th>
                          <th className="text-right py-1">Valor</th>
                          <th className="text-right py-1">Sem.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {meds.map((m) => (
                          <tr key={m.id}>
                            <td className="py-1.5">{fmtData(m.data_medicao)}</td>
                            <td className="py-1.5">{m.parametro}</td>
                            <td className="py-1.5 text-right font-semibold">{m.valor}</td>
                            <td className="py-1.5 text-right text-muted-foreground">
                              {m.semana_gestacional ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Bloco>

              {/* exames laboratoriais */}
              <Bloco titulo={`Exames laboratoriais (${exams.length})`}>
                {exams.length === 0 ? (
                  <Vazio>Nenhum exame laboratorial.</Vazio>
                ) : (
                  <ul className="space-y-1.5">
                    {exams.map((e) => (
                      <li
                        key={e.id}
                        className="text-xs flex items-start justify-between gap-2 border-b border-border pb-1.5"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">{e.tipo_exame}</p>
                          <p className="text-muted-foreground">{e.resultado}</p>
                          <p className="text-[10px] text-muted-foreground">{fmtData(e.data_exame)}</p>
                        </div>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                            e.status === "alterado"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {e.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Bloco>

              {/* exames de imagem */}
              <Bloco titulo={`Exames de imagem (${imgExams.length})`}>
                {imgExams.length === 0 ? (
                  <Vazio>Nenhum exame de imagem.</Vazio>
                ) : (
                  <ul className="space-y-1.5">
                    {imgExams.map((e) => (
                      <li
                        key={e.id}
                        className="text-xs flex items-start justify-between gap-2 border-b border-border pb-1.5"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">{e.tipo_exame}</p>
                          {e.laudo_texto && (
                            <p className="text-muted-foreground line-clamp-2">{e.laudo_texto}</p>
                          )}
                          <p className="text-[10px] text-muted-foreground">{fmtData(e.data_exame)}</p>
                        </div>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                            e.status === "alterado"
                              ? "bg-rose-100 text-rose-700"
                              : e.status === "normal"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {e.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Bloco>

              {/* vacinas */}
              <Bloco titulo={`Vacinas aplicadas (${vaccs.length})`}>
                {vaccs.length === 0 ? (
                  <Vazio>Nenhuma vacina registrada.</Vazio>
                ) : (
                  <ul className="text-xs grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {vaccs.map((v) => (
                      <li
                        key={v.id}
                        className="flex items-center justify-between border-b border-border py-1"
                      >
                        <span className="font-semibold text-foreground">{v.vacina}</span>
                        <span className="text-muted-foreground">{fmtData(v.data_aplicacao)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Bloco>

              {slot.observacao && (
                <Bloco titulo="Observação do horário">
                  <p className="text-xs text-foreground bg-muted/40 rounded-lg px-3 py-2">
                    {slot.observacao}
                  </p>
                </Bloco>
              )}
            </>
          )}
        </div>

        <div className="border-t border-border p-3 flex justify-end bg-muted/20">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-bold bg-[#1a1557] text-white hover:opacity-90"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold">{label}</p>
      <p className="text-xs text-foreground">{value || "—"}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold">{label}</p>
      <p className="text-base font-bold text-foreground">{value}</p>
    </div>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-wide text-foreground mb-2">{titulo}</p>
      {children}
    </section>
  );
}

function Vazio({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground italic">{children}</p>;
}
