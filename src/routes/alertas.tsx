import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";

export const Route = createFileRoute("/alertas")({
  head: () => ({
    meta: [
      { title: "Alertas e Dicas — MãeDigital" },
      { name: "description", content: "Alertas e dicas personalizadas para sua gestação." },
    ],
  }),
  component: AlertasPage,
});

const alerts = [
  { id: 1, type: "warning" as const, title: "Exame pendente", description: "O teste de tolerância à glicose deve ser realizado até a semana 28.", time: "Há 2 horas", read: false },
  { id: 2, type: "info" as const, title: "Vacina da gripe", description: "A vacina contra influenza é recomendada durante a gestação. Converse com seu médico.", time: "Hoje", read: false },
  { id: 3, type: "success" as const, title: "Ultrassom morfológico OK", description: "Resultado do ultrassom morfológico da semana 22 sem alterações.", time: "2 dias atrás", read: true },
  { id: 4, type: "info" as const, title: "Dica: Posição para dormir", description: "A partir do 2º trimestre, prefira dormir de lado esquerdo para melhor circulação.", time: "3 dias atrás", read: true },
  { id: 5, type: "warning" as const, title: "Consulta em 5 dias", description: "Sua próxima consulta pré-natal está agendada para 15/04/2026 às 10h.", time: "Ontem", read: true },
  { id: 6, type: "info" as const, title: "Novo vídeo disponível", description: "A Dra. Ana Costa publicou um vídeo sobre preparação para o parto normal.", time: "4 dias atrás", read: true },
];

const typeConfig = {
  warning: { label: "Atenção", bg: "bg-warm", dot: "bg-chart-3" },
  info: { label: "Info", bg: "bg-mint-light", dot: "bg-accent" },
  success: { label: "OK", bg: "bg-mint-light", dot: "bg-accent" },
};

function AlertasPage() {
  const unread = alerts.filter((a) => !a.read);
  const read = alerts.filter((a) => a.read);

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold font-display text-foreground">Alertas</h1>
          {unread.length > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full">
              {unread.length} novos
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-5">Alertas, lembretes e dicas para sua gestação</p>
      </motion.div>

      {unread.length > 0 && (
        <div className="mb-6">
          <h3 className="font-display font-semibold text-sm text-foreground mb-3 uppercase tracking-wide">Novos</h3>
          <div className="space-y-3">
            {unread.map((alert, i) => {
              const config = typeConfig[alert.type];
              return (
                <motion.div
                  key={alert.id}
                  className="bg-card rounded-2xl p-4 shadow-sm border-2 border-primary/20"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div className="flex gap-3">
                    <div className={`w-2 h-2 rounded-full ${config.dot} mt-1.5 shrink-0`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${config.bg}`}>
                          {config.label}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm text-foreground">{alert.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{alert.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">{alert.time}</p>
                    </div>
                  </div>
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
                className="bg-card rounded-2xl p-4 shadow-sm border border-border opacity-75"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.75, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="flex gap-3">
                  <div className={`w-2 h-2 rounded-full ${config.dot} mt-1.5 shrink-0`} />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-foreground">{alert.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{alert.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">{alert.time}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
