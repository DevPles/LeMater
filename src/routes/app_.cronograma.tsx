import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { FlyingStork } from "@/components/FlyingStork";
import { PregnancyTimeline } from "@/components/PregnancyTimeline";
import { useGestanteProfile } from "@/hooks/useGestanteProfile";
import { LoadingMessage } from "@/components/LoadingMessage";

export const Route = createFileRoute("/app_/cronograma")({
  head: () => ({
    meta: [
      { title: "Meu cronograma — MãeDigital" },
      { name: "description", content: "Linha do tempo da sua gestação com gráficos de peso e pressão arterial." },
    ],
  }),
  ssr: false,
  component: CronogramaPage,
});

function CronogramaPage() {
  const { profile, loading, session } = useGestanteProfile();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingMessage />
      </div>
    );
  }

  if (!session) return <Navigate to="/app" />;

  return (
    <>
      <FlyingStork />
      <div className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto relative z-10">
        <div className="mb-5 flex items-center justify-between">
          <Link
            to="/app/home"
            className="text-sm text-[#1a1557] font-semibold hover:underline"
          >
            Voltar
          </Link>
          <h1 className="text-lg font-bold font-display text-foreground">
            Meu cronograma
          </h1>
          <span className="w-12" />
        </div>

        <PregnancyTimeline
          userId={profile!.user_id}
          dum={profile?.dum}
          cadastroISO={(profile as { created_at?: string } | null)?.created_at ?? null}
        />
      </div>
    </>
  );
}
