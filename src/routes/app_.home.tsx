import { createFileRoute, Navigate } from "@tanstack/react-router";
import { WeekProgress } from "@/components/WeekProgress";
import { BabySize } from "@/components/BabySize";
import { QuickActions } from "@/components/QuickActions";
import { UserAvatar } from "@/components/UserAvatar";
import { FlyingStork } from "@/components/FlyingStork";
import { PregnancyTimelinePreview } from "@/components/PregnancyTimelinePreview";
import { motion } from "framer-motion";
import { useGestanteProfile, weeksFromDum } from "@/hooks/useGestanteProfile";
import { LoadingMessage } from "@/components/LoadingMessage";



export const Route = createFileRoute("/app_/home")({
  head: () => ({
    meta: [
      { title: "App — Minha Gestação — MãeDigital" },
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

function firstName(name: string | null | undefined) {
  if (!name) return "";
  return name.trim().split(/\s+/)[0];
}

function HomePage() {
  const { profile, loading, session } = useGestanteProfile();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingMessage />
      </div>
    );
  }

  // Sem sessão → manda para tela de boas-vindas/login do app
  if (!session) {
    return <Navigate to="/app" />;
  }

  const nomeCompleto =
    profile?.nome?.trim() || profile?.email?.split("@")[0] || "Mamãe";
  const primeiroNome = firstName(nomeCompleto) || "Mamãe";

  // Semana = calculada da DUM da gestante (se houver). Senão 1.
  const calculatedWeek = weeksFromDum(profile?.dum ?? null);
  const currentWeek = calculatedWeek ?? 1;



  return (
    <>
      <FlyingStork />
      <div className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground">
              Olá, {primeiroNome}
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

          <PregnancyTimelinePreview
            userId={profile!.user_id}
            dum={profile?.dum}
            cadastroISO={(profile as { created_at?: string } | null)?.created_at ?? null}
          />



        </div>
      </div>
    </>
  );
}
