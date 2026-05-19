import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { LiquidCard } from "@/components/LiquidCard";
import { LoadingMessage } from "@/components/LoadingMessage";
import { supabase } from "@/integrations/supabase/client";
import { useGestanteProfile } from "@/hooks/useGestanteProfile";

export const Route = createFileRoute("/app/alertas")({
  head: () => ({
    meta: [
      { title: "Alertas — MãeDigital" },
      { name: "description", content: "Alertas automáticos a partir dos seus dados clínicos." },
    ],
  }),
  ssr: false,
  component: AlertasPage,
});

type Alerta = {
  id: string;
  origem: string;
  severidade: string;
  titulo: string;
  mensagem: string;
  data: string;
};

const origemLabel: Record<string, string> = {
  medicao: "Sinal clínico",
  exame: "Exame",
  vacina: "Vacina",
  imagem: "Imagem",
};

const severidadeStyle: Record<string, { bg: string; dot: string; text: string; label: string }> = {
  urgente: { bg: "bg-red-100", dot: "bg-red-600", text: "text-red-700", label: "Urgente" },
  atencao: { bg: "bg-amber-100", dot: "bg-amber-500", text: "text-amber-800", label: "Atenção" },
};

function AlertasPage() {
  const { session, loading: authLoading } = useGestanteProfile();
  const [alerts, setAlerts] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Alerta | null>(null);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!session?.user?.id) {
      setAlerts([]);
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      const { data, error } = await supabase.rpc("get_active_alerts", {
        _gestante_id: session.user.id,
      });
      if (!active) return;
      if (error) console.error("get_active_alerts:", error);
      if (data) setAlerts(data as Alerta[]);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [authLoading, session?.user?.id]);

  async function handleDismiss() {
    if (!selected || !session?.user?.id) return;
    setDismissing(true);
    const alertId = selected.id;
    const { error } = await supabase
      .from("dismissed_alerts")
      .insert({ gestante_id: session.user.id, alert_id: alertId });
    if (error) {
      console.error("dismiss alert:", error);
      setDismissing(false);
      return;
    }
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    setSelected(null);
    setDismissing(false);
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold font-display text-foreground">Alertas</h1>
          {alerts.length > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full">
              {alerts.length} ativos
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Gerados automaticamente a partir dos seus dados clínicos, exames e calendário vacinal. Toque em um alerta para marcá-lo como resolvido.
        </p>
      </motion.div>

      {loading ? (
        <LoadingMessage text="Calculando alertas" />
      ) : alerts.length === 0 ? (
        <LiquidCard className="p-6 text-center">
          <h3 className="font-bold text-foreground">Tudo dentro do padrão</h3>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Nenhum alerta no momento. Continue mantendo as consultas, exames e vacinas em dia.
          </p>
        </LiquidCard>
      ) : (
        <div className="space-y-3">
          {alerts.map((a, i) => {
            const sev = severidadeStyle[a.severidade] ?? severidadeStyle.atencao;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelected(a)}
                className="cursor-pointer"
              >
                <LiquidCard className="p-4 active:scale-[0.98] transition-transform">
                  <div className="flex gap-3">
                    <div className={`w-2 h-2 rounded-full ${sev.dot} mt-1.5 shrink-0`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${sev.bg} ${sev.text}`}>
                          {sev.label}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {origemLabel[a.origem] ?? a.origem}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm text-foreground">{a.titulo}</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{a.mensagem}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(a.data).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </LiquidCard>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !dismissing && setSelected(null)}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl p-6 w-full max-w-md shadow-xl"
            >
              {(() => {
                const sev = severidadeStyle[selected.severidade] ?? severidadeStyle.atencao;
                return (
                  <>
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${sev.bg} ${sev.text}`}>
                        {sev.label}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {origemLabel[selected.origem] ?? selected.origem}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-foreground mb-2">{selected.titulo}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-2">{selected.mensagem}</p>
                    <p className="text-xs text-muted-foreground mb-5">
                      {new Date(selected.data).toLocaleDateString("pt-BR")}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelected(null)}
                        disabled={dismissing}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground disabled:opacity-50"
                      >
                        Fechar
                      </button>
                      <button
                        onClick={handleDismiss}
                        disabled={dismissing}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
                      >
                        {dismissing ? "Resolvendo..." : "Marcar como resolvido"}
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
