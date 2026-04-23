import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { LiquidCard } from "@/components/LiquidCard";
import { useScreenContent } from "@/hooks/useScreenContent";
import { ALERTAS_DEFAULT } from "@/components/admin/TelasTab";

export const Route = createFileRoute("/alertas")({
  head: () => ({
    meta: [
      { title: "Alertas e Dicas — MãeDigital" },
      { name: "description", content: "Alertas e dicas personalizadas para sua gestação." },
    ],
  }),
  component: AlertasPage,
});

const typeConfig: Record<string, { label: string; bg: string; dot: string }> = {
  warning: { label: "Atenção", bg: "bg-warm", dot: "bg-chart-3" },
  info: { label: "Info", bg: "bg-mint-light", dot: "bg-accent" },
  success: { label: "OK", bg: "bg-mint-light", dot: "bg-accent" },
};

const categoryLabels: Record<string, string> = {
  vacina: "Vacina",
  exame: "Exame",
  consulta: "Consulta",
  dica: "Dica",
};

function AlertasPage() {
  const { content } = useScreenContent("alertas", ALERTAS_DEFAULT);
  const alerts = content.alerts;
  const unread = alerts.filter((a) => !a.read);
  const read = alerts.filter((a) => a.read);

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold font-display text-foreground">{content.pageTitle}</h1>
          {unread.length > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full">
              {unread.length} novos
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-5">{content.pageSubtitle}</p>
      </motion.div>

      {unread.length > 0 && (
        <div className="mb-6">
          <h3 className="font-display font-semibold text-sm text-foreground mb-3 uppercase tracking-wide">Novos</h3>
          <div className="space-y-3">
            {unread.map((alert, i) => {
              const config = typeConfig[alert.type] ?? typeConfig.info;
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <LiquidCard className="p-4">
                  <div className="flex gap-3">
                    <div className={`w-2 h-2 rounded-full ${config.dot} mt-1.5 shrink-0`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${config.bg}`}>
                          {config.label}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {categoryLabels[alert.category] || alert.category}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm text-foreground">{alert.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{alert.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">{alert.time}</p>
                    </div>
                  </div>
                  </LiquidCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-display font-semibold text-sm text-foreground mb-3 uppercase tracking-wide">Anteriores</h3>
        <div className="space-y-3">
          {read.map((alert, i) => {
            const config = typeConfig[alert.type];
            return (
              <motion.div
                key={alert.id}
                className="opacity-75"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.75, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <LiquidCard className="p-4" withCoralDroplet={false}>
                <div className="flex gap-3">
                  <div className={`w-2 h-2 rounded-full ${config.dot} mt-1.5 shrink-0`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {categoryLabels[alert.category] || alert.category}
                      </span>
                    </div>
                    <h4 className="font-semibold text-sm text-foreground">{alert.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{alert.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">{alert.time}</p>
                  </div>
                </div>
                </LiquidCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
