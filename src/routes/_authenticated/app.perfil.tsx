import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useGestanteProfile } from "@/hooks/useGestanteProfile";
import { LiquidCard } from "@/components/LiquidCard";
import { UserAvatar } from "@/components/UserAvatar";

export const Route = createFileRoute("/_authenticated/app/perfil")({
  component: PerfilPage,
});

function PerfilPage() {
  const { profile, session, loading } = useGestanteProfile();
  const navigate = useNavigate();

  const sair = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <main className="max-w-md mx-auto px-4 pt-6 space-y-4">
      <header className="flex items-center gap-4">
        <UserAvatar name={profile?.nome ?? undefined} photoUrl={profile?.foto_url ?? null} />
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">{profile?.nome ?? "—"}</h1>
          <p className="text-xs text-muted-foreground">{session?.user.email ?? ""}</p>
        </div>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <>
          <LiquidCard className="divide-y divide-border" bgOpacity={0.6}>
            <LinkRow to="/membro" label="Minha área completa" />
            <LinkRow to="/app/cartao" label="Cartão da gestante" />
            <LinkRow to="/atlas" label="Atlas Materno" />
          </LiquidCard>

          <LiquidCard className="p-4" bgOpacity={0.6}>
            <h3 className="font-display text-base font-bold text-foreground mb-2">Para editar seus dados</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Vá em "Minha área completa" → botão Editar para alterar dados pessoais, gestação e
              histórico obstétrico.
            </p>
          </LiquidCard>

          <button
            type="button"
            onClick={sair}
            className="w-full py-3 rounded-2xl bg-muted text-foreground text-sm font-bold hover:bg-muted/70 transition"
          >
            Sair da conta
          </button>
        </>
      )}
    </main>
  );
}

import { Link } from "@tanstack/react-router";
function LinkRow({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between px-4 py-4 text-sm text-foreground hover:bg-muted/40 transition"
    >
      <span>{label}</span>
      <span className="text-muted-foreground">→</span>
    </Link>
  );
}
