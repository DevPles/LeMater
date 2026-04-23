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
          "linear-gradient(180deg, color-mix(in oklab, var(--background) 14%, transparent) 0%, color-mix(in oklab, var(--background) 6%, transparent) 100%)",
        borderColor: "color-mix(in oklab, var(--foreground) 8%, oklch(1 0 0 / 0.5))",
        boxShadow:
          "0 18px 40px -24px color-mix(in oklab, var(--foreground) 18%, transparent), 0 6px 18px -14px color-mix(in oklab, var(--foreground) 12%, transparent), inset 0 1px 0 0 oklch(1 0 0 / 0.72), inset 0 -1px 0 0 oklch(1 0 0 / 0.1)",
        WebkitBackdropFilter: "blur(36px) saturate(200%)",
        backdropFilter: "blur(36px) saturate(200%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl"
        style={{
          background:
            "linear-gradient(180deg, oklch(1 0 0 / 0.4) 0%, oklch(1 0 0 / 0.08) 22%, transparent 52%), radial-gradient(120% 100% at 50% -28%, oklch(1 0 0 / 0.5) 0%, transparent 54%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-[1px] rounded-[calc(1.5rem-1px)]"
        style={{
          background:
            "linear-gradient(180deg, oklch(1 0 0 / 0.12) 0%, transparent 38%, oklch(1 0 0 / 0.04) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-5 top-0 h-px"
        style={{ background: "oklch(1 0 0 / 0.75)" }}
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
