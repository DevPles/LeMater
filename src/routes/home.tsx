import { createFileRoute } from "@tanstack/react-router";
import { WeekProgress } from "@/components/WeekProgress";
import { BabySize } from "@/components/BabySize";
import { QuickActions } from "@/components/QuickActions";
import { TipCard } from "@/components/TipCard";
import { motion } from "framer-motion";
import { Droplets, Footprints, CalendarCheck } from "lucide-react";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "MãeDigital — Minha Gestação" },
      { name: "description", content: "Acompanhe sua gestação com suporte de profissionais de saúde, vídeos educativos e prontuário digital." },
    ],
  }),
  component: HomePage,
});

const CURRENT_WEEK = 24;

const weeklyTips = [
  {
    title: "Hidratação é essencial",
    description: "Beba pelo menos 2 litros de água por dia para manter o líquido amniótico saudável.",
    icon: Droplets,
  },
  {
    title: "Exercícios leves",
    description: "Caminhadas de 30 minutos ajudam na circulação e preparam para o parto.",
    icon: Footprints,
  },
  {
    title: "Próxima consulta",
    description: "Não esqueça do ultrassom morfológico agendado para esta semana.",
    icon: CalendarCheck,
  },
];

function HomePage() {
  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <p className="text-sm text-muted-foreground">Olá, Maria 👋</p>
        <h1 className="text-2xl font-bold font-display text-foreground">
          Minha Gestação
        </h1>
      </motion.div>

      <div className="space-y-5">
        <WeekProgress currentWeek={CURRENT_WEEK} />
        <BabySize week={CURRENT_WEEK} />
        <QuickActions />

        <div>
          <h3 className="font-display font-semibold text-lg text-foreground mb-3">
            Dicas da semana
          </h3>
          <div className="space-y-3">
            {weeklyTips.map((tip) => (
              <TipCard key={tip.title} {...tip} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
