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
      className="fixed bottom-3 left-2 right-2 z-50 rounded-3xl px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl border border-white/30 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%)",
        boxShadow:
          "0 8px 32px -8px rgba(0,0,0,0.18), 0 2px 8px -2px rgba(0,0,0,0.08), inset 0 1px 0 0 rgba(255,255,255,0.5), inset 0 -1px 0 0 rgba(255,255,255,0.1)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        backdropFilter: "blur(24px) saturate(180%)",
      }}
    >
      {/* Liquid highlight overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 0%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 55%)",
        }}
      />
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
