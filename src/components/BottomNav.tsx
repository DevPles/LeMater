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
          "linear-gradient(180deg, oklch(1 0 0 / 0.10) 0%, oklch(1 0 0 / 0.02) 100%)",
        borderColor: "oklch(1 0 0 / 0.35)",
        boxShadow:
          "0 24px 50px -28px color-mix(in oklab, var(--foreground) 22%, transparent), 0 8px 22px -16px color-mix(in oklab, var(--foreground) 14%, transparent), inset 0 1px 0 0 oklch(1 0 0 / 0.85), inset 0 -1px 0 0 oklch(1 0 0 / 0.18), inset 0 0 0 1px oklch(1 0 0 / 0.08)",
        WebkitBackdropFilter: "blur(40px) saturate(200%)",
        backdropFilter: "blur(40px) saturate(200%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-[28px]"
        style={{
          background:
            "linear-gradient(180deg, oklch(1 0 0 / 0.55) 0%, oklch(1 0 0 / 0.06) 18%, transparent 42%), radial-gradient(140% 110% at 50% -30%, oklch(1 0 0 / 0.6) 0%, transparent 58%)",
        }}
      />
      <div
        className="pointer-events-none absolute -top-6 left-6 h-16 w-24 rounded-full opacity-70 blur-2xl"
        style={{ background: "radial-gradient(circle, oklch(1 0 0 / 0.7) 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -top-4 right-10 h-10 w-16 rounded-full opacity-60 blur-xl"
        style={{ background: "radial-gradient(circle, oklch(1 0 0 / 0.6) 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute bottom-2 left-1/3 h-6 w-24 rounded-full opacity-40 blur-xl"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--primary) 40%, transparent) 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute inset-[1px] rounded-[calc(28px-1px)]"
        style={{
          background:
            "linear-gradient(180deg, oklch(1 0 0 / 0.18) 0%, transparent 36%, oklch(1 0 0 / 0.06) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-6 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, oklch(1 0 0 / 0.9), transparent)" }}
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
