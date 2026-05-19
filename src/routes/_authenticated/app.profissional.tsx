import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { LiquidCard } from "@/components/LiquidCard";

export const Route = createFileRoute("/_authenticated/app/profissional")({
  component: ProfissionalPage,
});

type Slot = {
  id: string;
  data_hora: string;
  duracao_min: number;
  status: string;
  titulo: string | null;
  room_id: string | null;
};

function ProfissionalPage() {
  const { isProfissional, isAdmin, loading: roleLoading, userId } = useUserRole();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (roleLoading) return;
    if (!isProfissional && !isAdmin) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data: prof } = await supabase
        .from("professionals")
        .select("id")
        .eq("user_id", userId!)
        .maybeSingle();
      if (!prof) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("appointment_slots")
        .select("id,data_hora,duracao_min,status,titulo,room_id")
        .eq("professional_id", prof.id)
        .gte("data_hora", new Date().toISOString())
        .order("data_hora")
        .limit(20);
      setSlots((data as Slot[]) ?? []);
      setLoading(false);
    })();
  }, [roleLoading, isProfissional, isAdmin, userId]);

  if (roleLoading || loading) {
    return <p className="px-4 pt-6 text-sm text-muted-foreground max-w-md mx-auto">Carregando…</p>;
  }

  if (!isProfissional && !isAdmin) {
    return (
      <main className="max-w-md mx-auto px-4 pt-6">
        <LiquidCard className="p-6 text-center" bgOpacity={0.6}>
          <h2 className="font-display text-lg font-bold text-foreground">Acesso restrito</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Esta área é exclusiva para profissionais cadastrados.
          </p>
        </LiquidCard>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-4 pt-6 space-y-4">
      <header>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Agenda</p>
        <h1 className="font-display text-2xl font-bold text-foreground">Próximas consultas</h1>
      </header>

      {slots.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Nenhuma consulta agendada.</p>
      ) : (
        <div className="space-y-3">
          {slots.map((s) => (
            <LiquidCard key={s.id} className="p-4" bgOpacity={0.6}>
              <p className="text-[10px] uppercase tracking-wider text-primary font-bold">{s.status}</p>
              <h3 className="font-display text-base font-bold text-foreground mt-1">
                {s.titulo ?? "Consulta"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(s.data_hora).toLocaleString("pt-BR")} · {s.duracao_min} min
              </p>
              {s.room_id && (
                <Link
                  to="/app/sala/$roomId"
                  params={{ roomId: s.room_id }}
                  className="inline-block mt-3 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider"
                >
                  Entrar na sala
                </Link>
              )}
            </LiquidCard>
          ))}
        </div>
      )}
    </main>
  );
}
