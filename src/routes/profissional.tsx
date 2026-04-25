import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export const Route = createFileRoute("/profissional")({
  head: () => ({
    meta: [
      { title: "Portal do Profissional — MãeDigital" },
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
  recording_path: string | null;
};

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
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Carregando...
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
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "disponivel" | "reservado" | "realizado">("todos");

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
        .order("data_hora", { ascending: true });
      if (s) setSlots(s as Slot[]);
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
    const dt = new Date(`${novoSlot.data}T${novoSlot.hora}:00`);
    if (isNaN(dt.getTime())) return setMsg("Data/hora inválida.");

    const { error } = await supabase.from("appointment_slots").insert({
      professional_id: prof.id,
      data_hora: dt.toISOString(),
      duracao_min: novoSlot.duracao_min,
      modalidade: novoSlot.modalidade,
      status: "disponivel",
    });
    if (error) return setMsg("Erro: " + error.message);
    setNovoSlot({ data: "", hora: "", duracao_min: 30, modalidade: "videochamada" });
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

      <div className="max-w-3xl mx-auto p-4 space-y-5">
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
            <div className="grid sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Data</label>
                <input
                  type="date"
                  value={novoSlot.data}
                  onChange={(e) => setNovoSlot({ ...novoSlot, data: e.target.value })}
                  className="w-full h-9 text-sm rounded-xl border border-border bg-background px-3"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Hora</label>
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
            <p className="p-6 text-sm text-center text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-sm text-center text-muted-foreground">Nenhum horário.</p>
          ) : (
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
                return (
                  <li key={s.id} className="p-3 flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-xs">
                      <p className="font-bold text-foreground">
                        {dt.toLocaleDateString("pt-BR")} às{" "}
                        {dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-muted-foreground">
                        {s.duracao_min} min • {s.modalidade === "videochamada" ? "Vídeo" : "Presencial"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColor}`}>
                        {s.status}
                      </span>
                      {podeEntrarSala(s) && (
                        <button
                          onClick={() => navigate({ to: "/sala/$roomId", params: { roomId: s.room_id! } })}
                          className="text-[10px] font-bold bg-primary text-primary-foreground px-3 py-1 rounded-full hover:opacity-90"
                        >
                          Entrar na sala
                        </button>
                      )}
                      {s.recording_path && (
                        <span className="text-[10px] font-semibold text-green-700">
                          ● gravado
                        </span>
                      )}
                      {s.status === "reservado" && (
                        <button
                          onClick={() => marcarRealizado(s.id)}
                          className="text-[10px] font-semibold text-green-700 hover:text-green-900"
                        >
                          Marcar realizado
                        </button>
                      )}
                      {s.status === "disponivel" && (
                        <button
                          onClick={() => removerSlot(s.id)}
                          className="text-[10px] font-semibold text-red-700 hover:text-red-900"
                        >
                          Excluir
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
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
