import { createFileRoute } from "@tanstack/react-router";
import { WeekProgress } from "@/components/WeekProgress";
import { BabySize } from "@/components/BabySize";
import { QuickActions } from "@/components/QuickActions";
import { TipCard } from "@/components/TipCard";
import { UserAvatar } from "@/components/UserAvatar";
import { motion } from "framer-motion";
import { useScreenContent } from "@/hooks/useScreenContent";
import { HOME_DEFAULT } from "@/components/admin/TelasTab";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "MãeDigital — Minha Gestação" },
      { name: "description", content: "Acompanhe sua gestação com suporte de profissionais de saúde, vídeos educativos e cartão digital." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { content } = useScreenContent("home", HOME_DEFAULT);

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <p className="text-sm text-muted-foreground">{content.greeting}</p>
          <h1 className="text-2xl font-bold font-display text-foreground">
            {content.pageTitle}
          </h1>
        </div>
        <UserAvatar name="Maria Silva" />
      </motion.div>

      <div className="space-y-5">
        <WeekProgress currentWeek={content.currentWeek} />
        <BabySize week={content.currentWeek} />
        <QuickActions />

        <div>
          <h3 className="font-display font-semibold text-lg text-foreground mb-3">
            {content.tipsHeading}
          </h3>
          <div className="space-y-3">
            {content.weeklyTips.map((tip, i) => (
              <TipCard key={`${tip.title}-${i}`} {...tip} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
