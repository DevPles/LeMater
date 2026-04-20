import { Link, useLocation } from "@tanstack/react-router";

const navItems = [
  { to: "/home", label: "Início" },
  { to: "/videos", label: "Vídeos" },
  { to: "/videochamada", label: "Chamada" },
  { to: "/prontuario", label: "Cartão Digital" },
  { to: "/alertas", label: "Alertas" },
] as const;

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 bg-card border border-border rounded-2xl shadow-lg px-2 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map(({ to, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 py-5 px-3 text-xs transition-colors ${
                isActive
                  ? "text-primary font-bold"
                  : "text-muted-foreground"
              }`}
            >
              <span className={`text-xs font-semibold uppercase tracking-wider ${isActive ? "text-primary" : ""}`}>
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
