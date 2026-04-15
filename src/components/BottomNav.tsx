import { Link, useLocation } from "@tanstack/react-router";
import { Home, Play, FileText, Bell, Video } from "lucide-react";

const navItems = [
  { to: "/", icon: Home, label: "Início" },
  { to: "/videos", icon: Play, label: "Vídeos" },
  { to: "/videochamada", icon: Video, label: "Chamada" },
  { to: "/prontuario", icon: FileText, label: "Prontuário" },
  { to: "/alertas", icon: Bell, label: "Alertas" },
] as const;

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border px-2 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 text-xs transition-colors ${
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
