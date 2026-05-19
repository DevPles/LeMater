import { createFileRoute, Link } from "@tanstack/react-router";
import { useGestanteProfile, weeksFromDum } from "@/hooks/useGestanteProfile";
import { WeekProgress } from "@/components/WeekProgress";
import { BabySize } from "@/components/BabySize";
import { QuickActions } from "@/components/QuickActions";
import { TipCard } from "@/components/TipCard";
import { NotificacoesCard } from "@/components/NotificacoesCard";
import { PushOptInBanner } from "@/components/PushOptInBanner";
import { LiquidCard } from "@/components/LiquidCard";

export const Route = createFileRoute("/_authenticated/app/")({
  component: HomePage,
});

const dicas = [
  { title: "Hidrate-se bem", description: "Beber água ajuda na formação do líquido amniótico e reduz inchaços." },
  { title: "Movimente-se", description: "Caminhadas leves de 20 min melhoram circulação e disposição." },
  { title: "Sono de qualidade", description: "Durma de lado esquerdo a partir da semana 20 para melhor irrigação." },
];

function HomePage() {
  const { profile, loading } = useGestanteProfile();
  const semana = weeksFromDum(profile?.dum) ?? 8;
  const nome = profile?.nome?.split(" ")[0] ?? "olá";

  return (
    <main className="max-w-md mx-auto px-4 pt-6 space-y-4">
      <header className="mb-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Bem-vinda</p>
        <h1 className="font-display text-2xl font-bold text-foreground">Olá, {nome}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {loading ? "Carregando seus dados…" : "Tudo pronto para mais um dia da sua jornada."}
        </p>
      </header>

      <PushOptInBanner />

      <WeekProgress currentWeek={semana} />
      <BabySize week={semana} />
      <QuickActions />

      <LiquidCard className="p-4" bgOpacity={0.55}>
        <NotificacoesCard />
      </LiquidCard>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold text-foreground">Dicas para hoje</h2>
        {dicas.map((d) => (
          <TipCard key={d.title} title={d.title} description={d.description} />
        ))}
      </section>

      <Link
        to="/membro"
        className="block text-center text-xs uppercase tracking-wider text-muted-foreground pt-4 underline"
      >
        Voltar para minha área
      </Link>
    </main>
  );
}
