import { Link, useLocation } from "@tanstack/react-router";

const navItems = [
  { to: "/app", label: "Início", match: (p: string) => p === "/app" },
  { to: "/app/gestacao", label: "Gestação", match: (p: string) => p.startsWith("/app/gestacao") },
  { to: "/app/videos", label: "Reels", match: (p: string) => p.startsWith("/app/videos") },
  { to: "/app/cartao", label: "Cartão", match: (p: string) => p.startsWith("/app/cartao") },
  { to: "/app/alertas", label: "Alertas", match: (p: string) => p.startsWith("/app/alertas") },
  { to: "/app/perfil", label: "Perfil", match: (p: string) => p.startsWith("/app/perfil") },
] as const;

export function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-3 left-2 right-2 z-30 rounded-[28px] border px-1 pb-[env(safe-area-inset-bottom)]"
      style={{
        background: "oklch(1 0 0 / 0.92)",
        borderColor: "oklch(0 0 0 / 0.06)",
        boxShadow:
          "0 12px 32px -16px color-mix(in oklab, var(--foreground) 22%, transparent), 0 2px 6px -2px color-mix(in oklab, var(--foreground) 10%, transparent), inset 0 1px 0 0 oklch(1 0 0 / 0.7)",
      }}
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map(({ to, label, match }) => {
          const isActive = match(location.pathname);
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 py-3 px-1 transition-colors min-w-0 flex-1 ${
                isActive ? "text-primary font-bold" : "text-muted-foreground"
              }`}
            >
              <span
                className={`text-[10px] font-semibold uppercase tracking-wide truncate ${
                  isActive ? "text-primary" : ""
                }`}
              >
                {label}
              </span>
              {isActive && <div className="w-5 h-0.5 rounded-full bg-primary mt-0.5" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
