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
    <nav className="fixed bottom-3 left-2 right-2 z-50 bg-card border border-border rounded-2xl shadow-lg px-1 pb-[env(safe-area-inset-bottom)]">
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
              <span className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wide truncate ${isActive ? "text-primary" : ""}`}>
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
