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
      className="fixed bottom-3 left-2 right-2 z-50 isolate overflow-hidden rounded-[28px] border px-1 pb-[env(safe-area-inset-bottom)]"
      style={{
        background:
          "linear-gradient(180deg, oklch(1 0 0 / 0.04) 0%, oklch(1 0 0 / 0.005) 100%)",
        borderColor: "oklch(1 0 0 / 0.22)",
        boxShadow:
          "0 28px 60px -32px color-mix(in oklab, var(--foreground) 22%, transparent), 0 10px 24px -18px color-mix(in oklab, var(--foreground) 12%, transparent), inset 0 1px 0 0 oklch(1 0 0 / 0.85), inset 0 -1px 0 0 oklch(1 0 0 / 0.16), inset 0 0 0 1px oklch(1 0 0 / 0.05)",
        WebkitBackdropFilter: "blur(22px) saturate(170%)",
        backdropFilter: "blur(22px) saturate(170%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-[28px]"
        style={{
          background:
            "linear-gradient(180deg, oklch(1 0 0 / 0.4) 0%, oklch(1 0 0 / 0.04) 22%, transparent 50%), radial-gradient(150% 120% at 50% -40%, oklch(1 0 0 / 0.55) 0%, transparent 55%)",
        }}
      />
      <div
        className="pointer-events-none absolute -top-8 left-4 h-20 w-28 rounded-full opacity-50 blur-2xl"
        style={{ background: "radial-gradient(circle, oklch(1 0 0 / 0.7) 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -top-5 right-8 h-12 w-20 rounded-full opacity-50 blur-2xl"
        style={{ background: "radial-gradient(circle, oklch(1 0 0 / 0.65) 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-44 rounded-full opacity-25 blur-xl"
        style={{ background: "radial-gradient(circle, oklch(1 0 0 / 0.5) 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-4 right-1/4 h-8 w-28 rounded-full opacity-35 blur-xl"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--primary) 35%, transparent) 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute inset-[1px] rounded-[calc(28px-1px)]"
        style={{
          background:
            "linear-gradient(180deg, oklch(1 0 0 / 0.12) 0%, transparent 32%, oklch(1 0 0 / 0.03) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-8 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, oklch(1 0 0 / 0.95), transparent)" }}
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
