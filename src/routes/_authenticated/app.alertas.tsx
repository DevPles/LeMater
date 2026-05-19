import { createFileRoute } from "@tanstack/react-router";
import { LiquidCard } from "@/components/LiquidCard";
import { NotificacoesCard } from "@/components/NotificacoesCard";

export const Route = createFileRoute("/_authenticated/app/alertas")({
  component: AlertasPage,
});

const alertas = [
  { tipo: "Consulta", titulo: "Pré-natal próxima semana", data: "Quinta, 14h", cor: "bg-mint-light text-mint-dark" },
  { tipo: "Exame", titulo: "Resultado do hemograma disponível", data: "Hoje", cor: "bg-coral-light text-primary" },
  { tipo: "Vacina", titulo: "dTpa em 30 dias", data: "Vence em 21/06", cor: "bg-warm text-warm-dark" },
];

function AlertasPage() {
  return (
    <main className="max-w-md mx-auto px-4 pt-6 space-y-4">
      <header>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Seus alertas</p>
        <h1 className="font-display text-2xl font-bold text-foreground">Notificações</h1>
      </header>

      <LiquidCard className="p-4" bgOpacity={0.6}>
        <NotificacoesCard />
      </LiquidCard>

      <section className="space-y-3">
        {alertas.map((a) => (
          <LiquidCard key={a.titulo} className="p-4" bgOpacity={0.6}>
            <span className={`inline-block text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full ${a.cor}`}>
              {a.tipo}
            </span>
            <h3 className="font-display text-base font-bold text-foreground mt-2">{a.titulo}</h3>
            <p className="text-xs text-muted-foreground mt-1">{a.data}</p>
          </LiquidCard>
        ))}
      </section>
    </main>
  );
}
