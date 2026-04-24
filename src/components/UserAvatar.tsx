import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

interface UserAvatarProps {
  name?: string;
  week?: number;
}

export function UserAvatar({ name = "Mamãe", week }: UserAvatarProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity"
      >
        {initials}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-56 bg-card rounded-xl border border-border shadow-lg overflow-hidden">
            <div className="p-4 border-b border-border">
              <p className="font-semibold text-sm text-foreground">{name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Gestante{typeof week === "number" ? ` • Semana ${week}` : ""}
              </p>
            </div>
            <div className="py-1">
              <Link
                to="/cartao"
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                Meu Cartão
              </Link>
              <Link
                to="/alertas"
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                Meus Alertas
              </Link>
              <div className="border-t border-border my-1" />
              <button
                onClick={() => {
                  setOpen(false);
                  handleLogout();
                }}
                className="block w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-muted transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
