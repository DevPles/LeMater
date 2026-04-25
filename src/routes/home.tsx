import { createFileRoute, Navigate } from "@tanstack/react-router";
import { WeekProgress } from "@/components/WeekProgress";
import { BabySize } from "@/components/BabySize";
import { QuickActions } from "@/components/QuickActions";
import { TipCard } from "@/components/TipCard";
import { UserAvatar } from "@/components/UserAvatar";
import { FlyingStork } from "@/components/FlyingStork";
import { motion } from "framer-motion";
import { useScreenContent } from "@/hooks/useScreenContent";
import { HOME_DEFAULT } from "@/components/admin/TelasTab";
import { useGestanteProfile, weeksFromDum } from "@/hooks/useGestanteProfile";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "MãeDigital — Minha Gestação" },
      {
        name: "description",
        content:
          "Acompanhe sua gestação com suporte de profissionais de saúde, vídeos educativos e cartão digital.",
      },
    ],
  }),
  ssr: false,
  component: HomePage,
});

type Tip = { title: string; description: string; weekMin?: number; weekMax?: number };

function tipMatchesWeek(tip: Tip, week: number) {
  const min = typeof tip.weekMin === "number" ? tip.weekMin : 0;
  const max = typeof tip.weekMax === "number" ? tip.weekMax : 42;
  return week >= min && week <= max;
}

function firstName(name: string | null | undefined) {
  if (!name) return "";
  return name.trim().split(/\s+/)[0];
}

function HomePage() {
  const { content } = useScreenContent("home", HOME_DEFAULT);
  const { profile, loading, session } = useGestanteProfile();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  // Sem sessão → manda para tela de boas-vindas/login
  if (!session) {
    return <Navigate to="/" />;
  }

  const nomeCompleto =
    profile?.nome?.trim() || profile?.email?.split("@")[0] || "Mamãe";
  const primeiroNome = firstName(nomeCompleto) || "Mamãe";

  // Semana = calculada da DUM da gestante (se houver). Senão cai no padrão editável.
  const calculatedWeek = weeksFromDum(profile?.dum ?? null);
  const currentWeek = calculatedWeek ?? content.currentWeek;

  // Filtra dicas pela semana atual (se a dica tiver weekMin/weekMax definidos).
  const tipsAll = (content.weeklyTips ?? []) as Tip[];
  const tipsFiltered = tipsAll.filter((t) => tipMatchesWeek(t, currentWeek));
  const tipsToShow = tipsFiltered.length > 0 ? tipsFiltered : tipsAll;

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto relative">
      <FlyingStork />
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <p className="text-sm text-muted-foreground">Olá, {primeiroNome}</p>
          <h1 className="text-2xl font-bold font-display text-foreground">
            {content.pageTitle}
          </h1>
          {!profile?.dum && (
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 mt-1 inline-block">
              Cadastre sua DUM para acompanhar sua semana
            </p>
          )}
        </div>
        <UserAvatar name={nomeCompleto} week={currentWeek} photoUrl={profile?.foto_url} />
      </motion.div>

      <div className="space-y-5">
        <WeekProgress currentWeek={currentWeek} />
        <BabySize week={currentWeek} />
        <QuickActions />

        <div>
          <h3 className="font-display font-semibold text-lg text-foreground mb-3">
            {content.tipsHeading}
          </h3>
          <div className="space-y-3">
            {tipsToShow.map((tip, i) => (
              <TipCard key={`${tip.title}-${i}`} {...tip} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
