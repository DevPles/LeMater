import { Link, useLocation } from "@tanstack/react-router";

const navItems = [
  { to: "/home", label: "Início" },
  { to: "/videos", label: "Vídeos" },
  { to: "/videochamada", label: "Chamada" },
  { to: "/cartao", label: "Cartão" },
  { to: "/alertas", label: "Alertas" },
] as const;

export function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-3 left-2 right-2 z-50 isolate overflow-hidden rounded-3xl border px-1 pb-[env(safe-area-inset-bottom)]"
      style={{
        background:
          "linear-gradient(180deg, var(--glass-nav-strong) 0%, var(--glass-nav) 100%)",
        borderColor: "var(--glass-stroke)",
        boxShadow: "var(--glass-shadow)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        backdropFilter: "blur(28px) saturate(180%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl"
        style={{
          background:
            "linear-gradient(180deg, var(--glass-highlight) 0%, transparent 34%), radial-gradient(120% 90% at 50% -10%, oklch(1 0 0 / 0.48) 0%, transparent 56%)",
        }}
      />
      <div className="pointer-events-none absolute inset-x-5 top-0 h-px" style={{ background: "var(--glass-highlight)" }} />
      <div className="relative flex items-center justify-around max-w-md mx-auto">
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
                className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wide truncate ${
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
