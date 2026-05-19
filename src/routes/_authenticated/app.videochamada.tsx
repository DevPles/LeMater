import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LiquidCard } from "@/components/LiquidCard";

export const Route = createFileRoute("/_authenticated/app/videochamada")({
  component: VideochamadaPage,
});

type Slot = {
  id: string;
  data_hora: string;
  duracao_min: number;
  status: string;
  titulo: string | null;
  room_id: string | null;
};

function VideochamadaPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id;
      if (!uid) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("appointment_slots")
        .select("id,data_hora,duracao_min,status,titulo,room_id")
        .eq("gestante_id", uid)
        .gte("data_hora", new Date(Date.now() - 86400000).toISOString())
        .order("data_hora")
        .limit(20);
      setSlots((data as Slot[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <main className="max-w-md mx-auto px-4 pt-6 space-y-4">
      <header>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Atendimento online</p>
        <h1 className="font-display text-2xl font-bold text-foreground">Suas consultas</h1>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : slots.length === 0 ? (
        <LiquidCard className="p-6 text-center" bgOpacity={0.6}>
          <p className="text-sm text-muted-foreground">
            Você ainda não tem videoconsultas agendadas.
          </p>
        </LiquidCard>
      ) : (
        <div className="space-y-3">
          {slots.map((s) => {
            const data = new Date(s.data_hora);
            const podeEntrar =
              !!s.room_id && Math.abs(Date.now() - data.getTime()) < 60 * 60 * 1000;
            return (
              <LiquidCard key={s.id} className="p-4" bgOpacity={0.6}>
                <p className="text-[10px] uppercase tracking-wider text-primary font-bold">
                  {data.toLocaleDateString("pt-BR", { weekday: "long" })}
                </p>
                <h3 className="font-display text-base font-bold text-foreground mt-1">
                  {s.titulo ?? "Consulta"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.toLocaleString("pt-BR")} · {s.duracao_min} min
                </p>
                {s.room_id && (
                  <Link
                    to="/app/sala/$roomId"
                    params={{ roomId: s.room_id }}
                    className={`inline-block mt-3 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${
                      podeEntrar
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {podeEntrar ? "Entrar agora" : "Aguardando horário"}
                  </Link>
                )}
              </LiquidCard>
            );
          })}
        </div>
      )}
    </main>
  );
}
