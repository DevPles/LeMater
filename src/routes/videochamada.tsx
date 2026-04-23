import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { LiquidCard } from "@/components/LiquidCard";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_GESTANTE_ID } from "@/components/admin/DadosClinicosTab";

export const Route = createFileRoute("/videochamada")({
  head: () => ({
    meta: [
      { title: "Agendamentos — MãeDigital" },
      { name: "description", content: "Agende consultas com profissionais nos horários disponíveis." },
    ],
  }),
  ssr: false,
  component: AgendamentosPage,
});

type SlotComProf = {
  id: string;
  data_hora: string;
  duracao_min: number;
  modalidade: string;
  status: string;
  gestante_id: string | null;
  professional_id: string;
  professionals: {
    id: string;
    nome: string;
    especialidade: string;
  } | null;
};

function AgendamentosPage() {
  const [slots, setSlots] = useState<SlotComProf[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"disponiveis" | "meus">("disponiveis");
  const [filtroEsp, setFiltroEsp] = useState<string>("todas");
  const [booking, setBooking] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setMsg(null);
    if (tab === "disponiveis") {
      const { data, error } = await supabase
        .from("appointment_slots")
        .select("*, professionals(id, nome, especialidade)")
        .eq("status", "disponivel")
        .gte("data_hora", new Date().toISOString())
        .order("data_hora", { ascending: true });
      if (error) console.error(error);
      if (data) setSlots(data as SlotComProf[]);
    } else {
      // "meus" - reservados/realizados pela gestante demo
      const { data, error } = await supabase
        .from("appointment_slots")
        .select("*, professionals(id, nome, especialidade)")
        .eq("gestante_id", DEMO_GESTANTE_ID)
        .order("data_hora", { ascending: false });
      if (error) console.error(error);
      if (data) setSlots(data as SlotComProf[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const especialidades = useMemo(() => {
    const s = new Set(slots.map((x) => x.professionals?.especialidade).filter(Boolean) as string[]);
    return Array.from(s).sort();
  }, [slots]);

  const filtrados = useMemo(() => {
    if (filtroEsp === "todas") return slots;
    return slots.filter((s) => s.professionals?.especialidade === filtroEsp);
  }, [slots, filtroEsp]);

  const reservar = async (slotId: string) => {
    setBooking(slotId);
    setMsg(null);
    // Para o MVP sem auth de gestante, fazemos reserva direta com gestante_id demo.
    // Em produção, a função book_slot usa auth.uid().
    const { error } = await supabase
      .from("appointment_slots")
      .update({
        status: "reservado",
        gestante_id: DEMO_GESTANTE_ID,
        reservado_em: new Date().toISOString(),
      })
      .eq("id", slotId)
      .eq("status", "disponivel");

    if (error) {
      setMsg("Não foi possível reservar: " + error.message);
    } else {
      setMsg("Horário reservado com sucesso!");
    }
    setBooking(null);
    await load();
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto bg-background">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold font-display text-foreground mb-1">Agendamentos</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Veja horários disponíveis e marque sua consulta.
        </p>
      </motion.div>

      <div className="flex gap-1 bg-muted rounded-full p-1 mb-4">
        <button
          onClick={() => setTab("disponiveis")}
          className={`flex-1 py-1.5 rounded-full text-xs font-semibold ${
            tab === "disponiveis" ? "bg-white text-primary shadow-sm" : "text-muted-foreground"
          }`}
        >
          Disponíveis
        </button>
        <button
          onClick={() => setTab("meus")}
          className={`flex-1 py-1.5 rounded-full text-xs font-semibold ${
            tab === "meus" ? "bg-white text-primary shadow-sm" : "text-muted-foreground"
          }`}
        >
          Meus agendamentos
        </button>
      </div>

      {tab === "disponiveis" && especialidades.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <button
            onClick={() => setFiltroEsp("todas")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
              filtroEsp === "todas" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            Todas
          </button>
          {especialidades.map((e) => (
            <button
              key={e}
              onClick={() => setFiltroEsp(e)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                filtroEsp === e ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {msg && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-mint-light text-foreground text-xs">{msg}</div>
      )}

      {loading ? (
        <p className="text-center text-sm text-muted-foreground py-12">Carregando...</p>
      ) : filtrados.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-12">
          {tab === "disponiveis" ? "Nenhum horário disponível no momento." : "Você ainda não reservou consultas."}
        </p>
      ) : (
        <div className="space-y-3">
          {filtrados.map((s, i) => {
            const dt = new Date(s.data_hora);
            const initials = (s.professionals?.nome ?? "?")
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <LiquidCard className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-foreground truncate">
                        {s.professionals?.nome ?? "Profissional"}
                      </h4>
                      <p className="text-xs text-muted-foreground">{s.professionals?.especialidade}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          {dt.toLocaleDateString("pt-BR")} às{" "}
                          {dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          • {s.modalidade === "videochamada" ? "Vídeo" : "Presencial"} • {s.duracao_min}min
                        </span>
                      </div>
                    </div>
                    {tab === "disponiveis" ? (
                      <button
                        onClick={() => reservar(s.id)}
                        disabled={booking === s.id}
                        className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full disabled:opacity-50 hover:opacity-90"
                      >
                        {booking === s.id ? "..." : "Marcar"}
                      </button>
                    ) : (
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                          s.status === "reservado"
                            ? "bg-amber-100 text-amber-700"
                            : s.status === "realizado"
                              ? "bg-green-100 text-green-700"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {s.status}
                      </span>
                    )}
                  </div>
                </LiquidCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
