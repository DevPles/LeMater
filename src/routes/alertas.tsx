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
  { id: 1, type: "warning" as const, title: "Exame pendente: Teste de tolerância à glicose", description: "Deve ser realizado até a semana 28. Agende com seu médico.", time: "Há 2 horas", read: false, category: "exame" as const },
  { id: 2, type: "warning" as const, title: "Vacina agendada: Influenza", description: "Vacina contra gripe recomendada na semana 28. Data prevista: 08/05/2026.", time: "Hoje", read: false, category: "vacina" as const },
  { id: 3, type: "warning" as const, title: "Exame agendado: Ultrassom obstétrico", description: "Verificar crescimento fetal. Semana 30 — 22/05/2026.", time: "Hoje", read: false, category: "exame" as const },
  { id: 4, type: "warning" as const, title: "Consulta em 5 dias", description: "Sua próxima consulta pré-natal está agendada para 08/05/2026.", time: "Ontem", read: false, category: "consulta" as const },
  { id: 5, type: "success" as const, title: "Ultrassom morfológico OK", description: "Resultado do ultrassom morfológico da semana 22 sem alterações.", time: "2 dias atrás", read: true, category: "exame" as const },
  { id: 6, type: "success" as const, title: "Vacina dTpa aplicada", description: "Vacina dTpa aplicada na semana 20 na UBS Central.", time: "3 dias atrás", read: true, category: "vacina" as const },
  { id: 7, type: "info" as const, title: "Dica: Posição para dormir", description: "A partir do 2º trimestre, prefira dormir de lado esquerdo para melhor circulação.", time: "3 dias atrás", read: true, category: "dica" as const },
  { id: 8, type: "info" as const, title: "Novo vídeo disponível", description: "A Dra. Ana Costa publicou um vídeo sobre preparação para o parto normal.", time: "4 dias atrás", read: true, category: "dica" as const },
];

const typeConfig = {
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
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {categoryLabels[alert.category] || alert.category}
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
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
