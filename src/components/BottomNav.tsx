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
      className="fixed bottom-3 left-2 right-2 z-50 rounded-3xl px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl border border-white/40 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, color-mix(in oklab, var(--card) 70%, transparent) 0%, color-mix(in oklab, var(--card) 45%, transparent) 100%)",
        boxShadow:
          "0 8px 32px -8px color-mix(in oklab, var(--primary) 25%, transparent), 0 2px 8px -2px rgba(0,0,0,0.08), inset 0 1px 0 0 rgba(255,255,255,0.6), inset 0 -1px 0 0 rgba(255,255,255,0.15)",
      }}
    >
      {/* Liquid highlight overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-60"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 0%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 60%)",
        }}
      />
      <div className="relative flex items-center justify-around max-w-md mx-auto">
        {navItems.map(({ to, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`relative flex flex-col items-center gap-1 py-4 px-1 transition-all min-w-0 flex-1 ${
                isActive ? "text-primary font-bold" : "text-muted-foreground"
              }`}
            >
              {isActive && (
                <span
                  className="absolute inset-1 rounded-2xl -z-10 backdrop-blur-md border border-white/50"
                  style={{
                    background:
                      "linear-gradient(135deg, color-mix(in oklab, var(--primary) 18%, transparent) 0%, color-mix(in oklab, var(--primary) 6%, transparent) 100%)",
                    boxShadow:
                      "inset 0 1px 0 0 rgba(255,255,255,0.7), inset 0 -1px 2px 0 color-mix(in oklab, var(--primary) 20%, transparent), 0 4px 12px -4px color-mix(in oklab, var(--primary) 30%, transparent)",
                  }}
                />
              )}
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
