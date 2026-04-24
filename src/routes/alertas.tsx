import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { LiquidCard } from "@/components/LiquidCard";
import { supabase } from "@/integrations/supabase/client";
import { useGestanteProfile } from "@/hooks/useGestanteProfile";

export const Route = createFileRoute("/alertas")({
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
  origem: string; // medicao | exame | vacina
  severidade: string; // atencao | urgente
  titulo: string;
  mensagem: string;
  data: string;
};

const origemLabel: Record<string, string> = {
  medicao: "Sinal clínico",
  exame: "Exame",
  vacina: "Vacina",
};

const severidadeStyle: Record<string, { bg: string; dot: string; text: string; label: string }> = {
  urgente: { bg: "bg-red-100", dot: "bg-red-600", text: "text-red-700", label: "Urgente" },
  atencao: { bg: "bg-amber-100", dot: "bg-amber-500", text: "text-amber-800", label: "Atenção" },
};

function AlertasPage() {
  const [alerts, setAlerts] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase.rpc("get_active_alerts", {
        _gestante_id: DEMO_GESTANTE_ID,
      });
      if (!active) return;
      if (error) console.error("get_active_alerts:", error);
      if (data) setAlerts(data as Alerta[]);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

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
          Gerados automaticamente a partir dos seus dados clínicos, exames e calendário vacinal.
        </p>
      </motion.div>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground py-12">Calculando alertas...</p>
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
                transition={{ delay: i * 0.05 }}
              >
                <LiquidCard className="p-4">
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
    </div>
  );
}
