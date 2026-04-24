import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export type GestanteProfile = {
  id: string;
  user_id: string;
  nome: string | null;
  email: string | null;
  dum: string | null; // ISO date
  telefone: string | null;
  foto_url: string | null;
};

/** Calcula semanas completas entre a DUM e hoje. */
export function weeksFromDum(dum: string | null | undefined): number | null {
  if (!dum) return null;
  const d = new Date(dum);
  if (isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
  if (weeks < 0) return 0;
  if (weeks > 42) return 42;
  return weeks;
}

/**
 * Hook que carrega a sessão atual + perfil da gestante logada.
 * Retorna `profile = null` quando o usuário não está autenticado.
 */
export function useGestanteProfile() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<GestanteProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Listener PRIMEIRO para não perder eventos
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!active) return;
      setSession(s);
      // Defer call para evitar deadlock dentro do callback
      if (s) {
        setTimeout(() => fetchProfile(s.user.id), 0);
      } else {
        setProfile(null);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) {
        fetchProfile(data.session.user.id).finally(() => {
          if (active) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    async function fetchProfile(userId: string) {
      const { data } = await supabase
        .from("profiles")
        .select("id,user_id,nome,email,dum,telefone,foto_url")
        .eq("user_id", userId)
        .maybeSingle();
      if (active) setProfile((data as GestanteProfile | null) ?? null);
    }

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, profile, loading };
}
