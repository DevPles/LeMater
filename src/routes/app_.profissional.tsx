import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { GestanteDetalheModal } from "@/components/profissional/GestanteDetalheModal";
import { ProntuarioConsultaModal } from "@/components/ProntuarioConsultaModal";
import { LoadingMessage } from "@/components/LoadingMessage";
import { NotificacoesCard } from "@/components/NotificacoesCard";

export const Route = createFileRoute("/app_/profissional")({
  head: () => ({
    meta: [
      { title: "App — Portal do Profissional — MãeDigital" },
      { name: "description", content: "Área restrita para profissionais de saúde gerenciarem horários e atendimentos." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  ssr: false,
  component: ProfissionalPage,
});

type Professional = {
  id: string;
  user_id: string;
  nome: string;
  especialidade: string;
  registro: string | null;
  ativo: boolean;
};

type Slot = {
  id: string;
  data_hora: string;
  duracao_min: number;
  modalidade: string;
  status: string;
  gestante_id: string | null;
  observacao: string | null;
  room_id: string | null;
  titulo: string | null;
  descricao: string | null;
  tipo_atendimento: string | null;
  recording_path: string | null;
  recording_duration_seg: number | null;
};

const TIPOS_ATENDIMENTO = [
  "Consulta médica obstétrica",
  "Consulta de enfermagem",
  "Visita do agente comunitário de saúde",
  "Orientação nutricional",
  "Orientação psicológica",
  "Orientação sobre amamentação",
  "Orientação geral pré-natal",
  "Outro",
] as const;

const SALA_ANTECEDENCIA_MS = 15 * 60 * 1000;
const SALA_TOLERANCIA_MS = 30 * 60 * 1000;

function podeEntrarSala(s: Slot) {
  if (!s.room_id || s.status !== "reservado") return false;
  const inicio = new Date(s.data_hora).getTime();
  const fim = inicio + s.duracao_min * 60 * 1000 + SALA_TOLERANCIA_MS;
  const agora = Date.now();
  return agora >= inicio - SALA_ANTECEDENCIA_MS && agora <= fim;
}

function ProfissionalPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // SETUP listener primeiro (evita perder eventos)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Sem login? Manda para a tela inicial (login comum).
  useEffect(() => {
    if (ready && !session) {
      navigate({ to: "/" });
    }
  }, [ready, session, navigate]);

  if (!ready || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingMessage />
      </div>
    );
  }
  return <Dashboard session={session} />;
}

function Dashboard({ session }: { session: Session }) {
  const navigate = useNavigate();
  const [prof, setProf] = useState<Professional | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoSlot, setNovoSlot] = useState({
    data: "",
    hora: "",
    duracao_min: 30,
    modalidade: "videochamada",
    tipo_atendimento: TIPOS_ATENDIMENTO[0] as string,
    titulo: "",
    descricao: "",
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "disponivel" | "reservado" | "realizado">("todos");
  const [aba, setAba] = useState<"agenda" | "historico">("agenda");
  const [gestanteNomes, setGestanteNomes] = useState<Record<string, string>>({});
  const [slotDetalhe, setSlotDetalhe] = useState<Slot | null>(null);
  const [prontuarioId, setProntuarioId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: p } = await supabase
      .from("professionals")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();
    setProf(p as Professional | null);

    if (p) {
      const { data: s } = await supabase
        .from("appointment_slots")
        .select("*")
        .eq("professional_id", (p as Professional).id)
        .order("data_hora", { ascending: false });
      if (s) {
        setSlots(s as Slot[]);
        const ids = Array.from(
          new Set((s as Slot[]).map((x) => x.gestante_id).filter(Boolean) as string[]),
        );
        if (ids.length) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("user_id, nome")
            .in("user_id", ids);
          const map: Record<string, string> = {};
          (profs ?? []).forEach((p) => {
            map[(p as { user_id: string }).user_id] = (p as { nome: string | null }).nome ?? "Gestante";
          });
          setGestanteNomes(map);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.user.id]);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const criarSlot = async () => {
    setMsg(null);
    if (!prof) return setMsg("Você ainda não tem perfil profissional. Solicite ao admin.");
    if (!novoSlot.data || !novoSlot.hora) return setMsg("Informe data e hora.");
    if (!novoSlot.titulo.trim()) return setMsg("Informe um título para o atendimento.");
    if (!novoSlot.tipo_atendimento) return setMsg("Selecione o tipo de atendimento.");
    const dt = new Date(`${novoSlot.data}T${novoSlot.hora}:00`);
    if (isNaN(dt.getTime())) return setMsg("Data/hora inválida.");

    const { error } = await supabase.from("appointment_slots").insert({
      professional_id: prof.id,
      data_hora: dt.toISOString(),
      duracao_min: novoSlot.duracao_min,
      modalidade: novoSlot.modalidade,
      status: "disponivel",
      titulo: novoSlot.titulo.trim().slice(0, 120),
      descricao: novoSlot.descricao.trim().slice(0, 500) || null,
      tipo_atendimento: novoSlot.tipo_atendimento,
    });
    if (error) return setMsg("Erro: " + error.message);
    setNovoSlot({
      data: "",
      hora: "",
      duracao_min: 30,
      modalidade: "videochamada",
      tipo_atendimento: TIPOS_ATENDIMENTO[0],
      titulo: "",
      descricao: "",
    });
    setMsg("Horário publicado!");
    await load();
  };

  const cancelarSlot = async (id: string) => {
    if (!confirm("Cancelar este horário?")) return;
    await supabase.from("appointment_slots").update({ status: "cancelado" }).eq("id", id);
    await load();
  };

  const marcarRealizado = async (id: string) => {
    await supabase.from("appointment_slots").update({ status: "realizado" }).eq("id", id);
    await load();
  };

  const removerSlot = async (id: string) => {
    if (!confirm("Excluir este horário?")) return;
    await supabase.from("appointment_slots").delete().eq("id", id);
    await load();
  };

  const filtered = filtroStatus === "todos" ? slots : slots.filter((s) => s.status === filtroStatus);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-[#1a1557] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div>
          <p className="text-xs text-white/60 uppercase font-semibold tracking-wider">Portal do Profissional</p>
          <p className="text-sm font-bold">{prof?.nome ?? session.user.email}</p>
        </div>
        <button onClick={logout} className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-xs">
          Sair
        </button>
      </div>

      <div className="max-w-3xl mx-auto p-4 pb-32 space-y-5">
        <div className="bg-card border border-border rounded-2xl px-4 shadow-sm">
          <NotificacoesCard />
        </div>

        {!prof && !loading && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
            Sua conta de auth foi criada, mas ainda não há um perfil profissional vinculado.
            Solicite ao administrador para finalizar seu cadastro.
          </div>
        )}

        {prof && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-5 space-y-3"
          >
            <h2 className="text-base font-bold font-display text-foreground">Publicar novo horário</h2>
            <p className="text-xs text-muted-foreground -mt-1">
              Descreva o que você está oferecendo para que a gestante saiba antes de reservar.
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  Tipo de atendimento *
                </label>
                <select
                  value={novoSlot.tipo_atendimento}
                  onChange={(e) => setNovoSlot({ ...novoSlot, tipo_atendimento: e.target.value })}
                  className="w-full h-9 text-sm rounded-xl border border-border bg-background px-3"
                >
                  {TIPOS_ATENDIMENTO.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  Título / tema *
                </label>
                <input
                  type="text"
                  maxLength={120}
                  placeholder="Ex.: Orientação sobre amamentação"
                  value={novoSlot.titulo}
                  onChange={(e) => setNovoSlot({ ...novoSlot, titulo: e.target.value })}
                  className="w-full h-9 text-sm rounded-xl border border-border bg-background px-3"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Descrição (opcional)
              </label>
              <textarea
                rows={3}
                maxLength={500}
                placeholder="Detalhes do que será oferecido, público-alvo, o que levar, etc."
                value={novoSlot.descricao}
                onChange={(e) => setNovoSlot({ ...novoSlot, descricao: e.target.value })}
                className="w-full text-sm rounded-xl border border-border bg-background px-3 py-2 resize-none"
              />
              <p className="text-[10px] text-muted-foreground text-right mt-1">
                {novoSlot.descricao.length}/500
              </p>
            </div>

            <div className="grid sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Data *</label>
                <input
                  type="date"
                  value={novoSlot.data}
                  onChange={(e) => setNovoSlot({ ...novoSlot, data: e.target.value })}
                  className="w-full h-9 text-sm rounded-xl border border-border bg-background px-3"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Hora *</label>
                <input
                  type="time"
                  value={novoSlot.hora}
                  onChange={(e) => setNovoSlot({ ...novoSlot, hora: e.target.value })}
                  className="w-full h-9 text-sm rounded-xl border border-border bg-background px-3"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Duração (min)</label>
                <input
                  type="number"
                  value={novoSlot.duracao_min}
                  onChange={(e) => setNovoSlot({ ...novoSlot, duracao_min: Number(e.target.value) })}
                  className="w-full h-9 text-sm rounded-xl border border-border bg-background px-3"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Modalidade</label>
                <select
                  value={novoSlot.modalidade}
                  onChange={(e) => setNovoSlot({ ...novoSlot, modalidade: e.target.value })}
                  className="w-full h-9 text-sm rounded-xl border border-border bg-background px-3"
                >
                  <option value="videochamada">Vídeo</option>
                  <option value="presencial">Presencial</option>
                </select>
              </div>
            </div>
            {msg && <p className="text-xs text-foreground bg-muted px-3 py-2 rounded-lg">{msg}</p>}
            <div className="flex justify-end">
              <button
                onClick={criarSlot}
                className="px-4 py-2 rounded-full text-xs font-bold bg-[#1a1557] text-white hover:bg-[#241e7a]"
              >
                Publicar horário
              </button>
            </div>
          </motion.div>
        )}

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-2 bg-muted/40 border-b border-border flex items-center justify-between gap-2 flex-wrap">
            <p className="text-xs font-bold uppercase tracking-wide">Minha agenda ({filtered.length})</p>
            <div className="flex gap-1">
              {(["todos", "disponivel", "reservado", "realizado"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFiltroStatus(s)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    filtroStatus === s ? "bg-[#1a1557] text-white" : "bg-background text-muted-foreground border border-border"
                  }`}
                >
                  {s === "todos" ? "Todos" : s}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <LoadingMessage />
          ) : filtered.length === 0 ? (
            <p className="p-6 text-sm text-center text-muted-foreground">Nenhum horário.</p>
          ) : (
            <div className="max-h-[clamp(14rem,42dvh,24rem)] overflow-y-auto overscroll-contain scroll-pb-28">

            <ul className="divide-y divide-border">
              {filtered.map((s) => {
                const dt = new Date(s.data_hora);
                const statusColor =
                  s.status === "disponivel"
                    ? "bg-blue-100 text-blue-700"
                    : s.status === "reservado"
                      ? "bg-amber-100 text-amber-700"
                      : s.status === "realizado"
                        ? "bg-green-100 text-green-700"
                        : "bg-muted text-muted-foreground";
                const podeAbrir = !!s.gestante_id;
                return (
                  <li key={s.id} className="p-3 flex items-center justify-between gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => podeAbrir && setSlotDetalhe(s)}
                      disabled={!podeAbrir}
                      className={`text-xs flex-1 min-w-[200px] text-left ${
                        podeAbrir ? "cursor-pointer hover:bg-muted/30 rounded-lg -m-1 p-1 transition-colors" : "cursor-default"
                      }`}
                      title={podeAbrir ? "Ver dados clínicos da gestante" : undefined}
                    >
                      {s.titulo && (
                        <p className="font-bold text-foreground text-sm mb-0.5">{s.titulo}</p>
                      )}
                      {s.tipo_atendimento && (
                        <p className="text-[10px] uppercase tracking-wide font-semibold text-primary mb-1">
                          {s.tipo_atendimento}
                        </p>
                      )}
                      <p className="font-semibold text-foreground">
                        {dt.toLocaleDateString("pt-BR")} às{" "}
                        {dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-muted-foreground">
                        {s.duracao_min} min • {s.modalidade === "videochamada" ? "Vídeo" : "Presencial"}
                      </p>
                      {s.descricao && (
                        <p className="text-muted-foreground mt-1 line-clamp-2">{s.descricao}</p>
                      )}
                      {podeAbrir && (
                        <p className="text-[10px] font-bold text-primary mt-1">
                          Toque para ver os dados da gestante →
                        </p>
                      )}
                    </button>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColor}`}>
                        {s.status}
                      </span>
                      {podeEntrarSala(s) && (
                        <button
                          onClick={() => navigate({ to: "/app/sala/$roomId", params: { roomId: s.room_id! } })}
                          className="text-[10px] font-bold bg-primary text-primary-foreground px-3 py-1 rounded-full hover:opacity-90"
                        >
                          Entrar na sala
                        </button>
                      )}
                      {s.status === "reservado" && (
                        <button
                          onClick={() => marcarRealizado(s.id)}
                          className="text-[10px] font-semibold text-green-700 hover:text-green-900"
                        >
                          Marcar realizado
                        </button>
                      )}
                      {s.status === "reservado" && (
                        <button
                          onClick={() => cancelarSlot(s.id)}
                          className="text-[10px] font-semibold text-red-700 hover:text-red-900"
                        >
                          Cancelar
                        </button>
                      )}
                      {podeAbrir && (
                        <button
                          onClick={() => setProntuarioId(s.id)}
                          className="text-[10px] font-semibold text-[#1a1557] hover:underline"
                          title="Ver prontuário compilado da consulta"
                        >
                          Prontuário
                        </button>
                      )}
                      <button
                        onClick={() => removerSlot(s.id)}
                        className="text-[10px] font-semibold text-red-700 hover:text-red-900"
                        title="Excluir definitivamente"
                      >
                        Excluir
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            </div>
          )}
        </div>
      </div>

      {slotDetalhe && (
        <GestanteDetalheModal slot={slotDetalhe} onClose={() => setSlotDetalhe(null)} />
      )}
      {prontuarioId && (
        <ProntuarioConsultaModal
          appointmentId={prontuarioId}
          onClose={() => setProntuarioId(null)}
        />
      )}
    </div>
  );
}
