import { createFileRoute } from "@tanstack/react-router";
import { useGestanteProfile, weeksFromDum } from "@/hooks/useGestanteProfile";
import { WeekProgress } from "@/components/WeekProgress";
import { BabySize } from "@/components/BabySize";
import { LiquidCard } from "@/components/LiquidCard";

export const Route = createFileRoute("/_authenticated/app/gestacao")({
  component: GestacaoPage,
});

const marcos = [
  { semana: 8, titulo: "Primeira ultrassom", desc: "Confirmação da gestação e batimento cardíaco." },
  { semana: 12, titulo: "Translucência nucal", desc: "Rastreio de alterações cromossômicas." },
  { semana: 20, titulo: "Morfológico", desc: "Avaliação detalhada da anatomia do bebê." },
  { semana: 24, titulo: "Curva glicêmica", desc: "Rastreio de diabetes gestacional." },
  { semana: 28, titulo: "3º trimestre", desc: "Início do acompanhamento mais frequente." },
  { semana: 36, titulo: "Streptococcus B", desc: "Coleta de cultura vaginal e anal." },
  { semana: 40, titulo: "Data provável do parto", desc: "Reta final — mala pronta!" },
];

function GestacaoPage() {
  const { profile } = useGestanteProfile();
  const semana = weeksFromDum(profile?.dum) ?? 8;
  const trimestre = semana <= 13 ? 1 : semana <= 26 ? 2 : 3;

  return (
    <main className="max-w-md mx-auto px-4 pt-6 space-y-4">
      <header>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Sua gestação</p>
        <h1 className="font-display text-2xl font-bold text-foreground">{trimestre}º Trimestre</h1>
      </header>

      <WeekProgress currentWeek={semana} />
      <BabySize week={semana} />

      <section className="space-y-3 pt-2">
        <h2 className="font-display text-lg font-bold text-foreground">Marcos do pré-natal</h2>
        {marcos.map((m) => {
          const passou = semana >= m.semana;
          const atual = Math.abs(semana - m.semana) <= 1;
          return (
            <LiquidCard key={m.semana} className="p-4" bgOpacity={0.6}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-primary font-bold">
                    Semana {m.semana} {atual && "· agora"}
                  </p>
                  <h3 className="font-display text-base font-bold text-foreground">{m.titulo}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{m.desc}</p>
                </div>
                <span
                  className={`shrink-0 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full ${
                    passou ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {passou ? "Feito" : "A fazer"}
                </span>
              </div>
            </LiquidCard>
          );
        })}
      </section>
    </main>
  );
}
