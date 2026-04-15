import { createFileRoute } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, CheckCircle, Clock, FlaskConical, CalendarDays, Info, Moon, Play, Scan, Syringe } from "lucide-react";
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
  {
    id: 1,
    type: "warning" as const,
    icon: FlaskConical,
    title: "Exame pendente",
    description: "O teste de tolerância à glicose deve ser realizado até a semana 28.",
    time: "Há 2 horas",
    read: false,
  },
  {
    id: 2,
    type: "info" as const,
    icon: Syringe,
    title: "Vacina da gripe",
    description: "A vacina contra influenza é recomendada durante a gestação. Converse com seu médico.",
    time: "Hoje",
    read: false,
  },
  {
    id: 3,
    type: "success" as const,
    icon: Scan,
    title: "Ultrassom morfológico OK",
    description: "Resultado do ultrassom morfológico da semana 22 sem alterações.",
    time: "2 dias atrás",
    read: true,
  },
  {
    id: 4,
    type: "info" as const,
    icon: Moon,
    title: "Dica: Posição para dormir",
    description: "A partir do 2º trimestre, prefira dormir de lado esquerdo para melhor circulação.",
    time: "3 dias atrás",
    read: true,
  },
  {
    id: 5,
    type: "warning" as const,
    icon: CalendarDays,
    title: "Consulta em 5 dias",
    description: "Sua próxima consulta pré-natal está agendada para 15/04/2026 às 10h.",
    time: "Ontem",
    read: true,
  },
  {
    id: 6,
    type: "info" as const,
    icon: Play,
    title: "Novo vídeo disponível",
    description: "A Dra. Ana Costa publicou um vídeo sobre preparação para o parto normal.",
    time: "4 dias atrás",
    read: true,
  },
];

const typeConfig = {
  warning: {
    icon: AlertTriangle,
    bg: "bg-warm",
    iconColor: "text-chart-3",
  },
  info: {
    icon: Info,
    bg: "bg-mint-light",
    iconColor: "text-accent-foreground",
  },
  success: {
    icon: CheckCircle,
    bg: "bg-mint-light",
    iconColor: "text-accent-foreground",
  },
} satisfies Record<string, { icon?: LucideIcon; bg: string; iconColor: string }>;

function AlertasPage() {
  const unread = alerts.filter((a) => !a.read);
  const read = alerts.filter((a) => a.read);

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold font-display text-foreground">
            Alertas
          </h1>
          {unread.length > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full">
              {unread.length} novos
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Alertas, lembretes e dicas para sua gestação
        </p>
      </motion.div>

      {unread.length > 0 && (
        <div className="mb-6">
          <h3 className="font-display font-semibold text-sm text-foreground mb-3 uppercase tracking-wide">
            Novos
          </h3>
          <div className="space-y-3">
            {unread.map((alert, i) => {
              const config = typeConfig[alert.type];
              const AlertIcon = alert.icon ?? config.icon ?? AlertTriangle;
              return (
                <motion.div
                  key={alert.id}
                  className="bg-card rounded-2xl p-4 shadow-sm border-2 border-primary/20"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div className="flex gap-3">
                    <div className={`w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                      <AlertIcon className={`w-4 h-4 ${config.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-foreground">{alert.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {alert.description}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{alert.time}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-display font-semibold text-sm text-foreground mb-3 uppercase tracking-wide">
          Anteriores
        </h3>
        <div className="space-y-3">
          {read.map((alert, i) => {
            const config = typeConfig[alert.type];
            const AlertIcon = alert.icon ?? config.icon ?? AlertTriangle;
            return (
              <motion.div
                key={alert.id}
                className="bg-card rounded-2xl p-4 shadow-sm border border-border opacity-75"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.75, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="flex gap-3">
                  <div className={`w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                    <AlertIcon className={`w-4 h-4 ${config.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-foreground">{alert.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {alert.description}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{alert.time}</span>
                    </div>
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
