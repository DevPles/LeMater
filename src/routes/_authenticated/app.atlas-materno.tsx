import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/app/atlas-materno")({
  component: AtlasMaternoLayout,
});

const fases = [
  { to: "/app/atlas-materno/concepcao", label: "Concepção" },
  { to: "/app/atlas-materno/gestacao", label: "Gestação" },
  { to: "/app/atlas-materno/bebe", label: "Bebê" },
  { to: "/app/atlas-materno/pos-parto", label: "Pós-parto" },
] as const;

function AtlasMaternoLayout() {
  const loc = useLocation();
  return (
    <main className="max-w-md mx-auto px-4 pt-6">
      <header className="mb-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Conteúdos</p>
        <h1 className="font-display text-2xl font-bold text-foreground">Atlas Materno</h1>
      </header>

      <nav className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4">
        {fases.map((f) => {
          const active = loc.pathname === f.to;
          return (
            <Link
              key={f.to}
              to={f.to}
              className={`shrink-0 text-xs uppercase tracking-wider font-bold px-4 py-2 rounded-full border transition ${
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </nav>

      <Outlet />
    </main>
  );
}
