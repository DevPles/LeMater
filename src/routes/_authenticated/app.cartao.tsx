import { createFileRoute } from "@tanstack/react-router";
import { useGestanteProfile, weeksFromDum } from "@/hooks/useGestanteProfile";
import { LiquidCard } from "@/components/LiquidCard";

export const Route = createFileRoute("/_authenticated/app/cartao")({
  component: CartaoPage,
});

function CartaoPage() {
  const { profile, loading } = useGestanteProfile();
  const semana = weeksFromDum(profile?.dum);
  const dpp = profile?.dum
    ? new Date(new Date(profile.dum).getTime() + 280 * 86400000).toLocaleDateString("pt-BR")
    : null;

  return (
    <main className="max-w-md mx-auto px-4 pt-6 space-y-4">
      <header>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Documento digital</p>
        <h1 className="font-display text-2xl font-bold text-foreground">Cartão da Gestante</h1>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <>
          <div
            className="rounded-3xl p-6 text-white shadow-xl"
            style={{
              background: "linear-gradient(135deg, #1a1557 0%, #2d2580 100%)",
            }}
          >
            <p className="text-[10px] uppercase tracking-wider opacity-70">Le Mater</p>
            <h2 className="font-display text-xl font-bold mt-1">{profile?.nome ?? "—"}</h2>
            <p className="text-xs opacity-80 mt-0.5">{profile?.email ?? ""}</p>

            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <Info label="Semana" valor={semana !== null ? `${semana}ª` : "—"} />
              <Info label="DPP" valor={dpp ?? "—"} />
              <Info label="UBS" valor={profile?.unidade_saude ?? "—"} />
              <Info label="Cidade" valor={profile?.cidade ?? "—"} />
            </div>
          </div>

          <LiquidCard className="p-4" bgOpacity={0.6}>
            <h3 className="font-display text-base font-bold text-foreground mb-3">Histórico obstétrico</h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Bloco label="Gestações" valor={profile?.numero_gestacoes ?? 0} />
              <Bloco label="Partos" valor={profile?.numero_partos ?? 0} />
              <Bloco label="Abortos" valor={profile?.numero_abortos ?? 0} />
            </div>
          </LiquidCard>

          <LiquidCard className="p-4" bgOpacity={0.6}>
            <h3 className="font-display text-base font-bold text-foreground mb-3">Dados pessoais</h3>
            <Linha k="Telefone" v={profile?.telefone} />
            <Linha k="Nascimento" v={profile?.data_nascimento} />
            <Linha k="Bairro" v={profile?.bairro} />
          </LiquidCard>
        </>
      )}
    </main>
  );
}

function Info({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase opacity-70">{label}</p>
      <p className="font-display text-base font-bold mt-0.5">{valor}</p>
    </div>
  );
}

function Bloco({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="bg-muted rounded-xl py-3">
      <p className="font-display text-2xl font-bold text-primary">{valor}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function Linha({ k, v }: { k: string; v: string | null | undefined }) {
  return (
    <div className="flex justify-between text-sm py-2 border-b border-border last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-foreground font-medium">{v ?? "—"}</span>
    </div>
  );
}
