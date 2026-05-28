import { Link, useLocation } from "@tanstack/react-router";

const navItems = [
  { to: "/app/home", label: "Início" },
  { to: "/app/videos", label: "Cursos" },
  { to: "/app/videochamada", label: "Consulta" },
  { to: "/app/cartao", label: "Cartão" },
  { to: "/app/alertas", label: "Alertas" },
] as const;

export function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-1rem)] max-w-md rounded-[28px] border px-1 pb-[env(safe-area-inset-bottom)]"
      style={{
        background: "oklch(1 0 0 / 0.88)",
        borderColor: "oklch(0 0 0 / 0.06)",
        boxShadow:
          "0 12px 32px -16px color-mix(in oklab, var(--foreground) 22%, transparent), 0 2px 6px -2px color-mix(in oklab, var(--foreground) 10%, transparent), inset 0 1px 0 0 oklch(1 0 0 / 0.7)",
      }}
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map(({ to, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 py-4 px-1 transition-colors min-w-0 flex-1 ${
                isActive ? "text-primary font-bold" : "text-muted-foreground"
              }`}
            >
              <span
                className={`text-[9px] sm:text-xs font-semibold uppercase tracking-tight truncate max-w-full ${
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
