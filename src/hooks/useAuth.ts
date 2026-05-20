import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type Role = "admin" | "aluno" | "gestante" | "profissional";

export interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  hasPaidAccess: boolean;
  roles: Role[];
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [rolesLoaded, setRolesLoaded] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [hasPaidAccess, setHasPaidAccess] = useState(false);
  const userId = session?.user?.id;

  useEffect(() => {
    let mounted = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (!mounted) return;
      setSession(s);
      setSessionLoaded(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setSessionLoaded(true);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!userId) {
      setRoles([]);
      setHasPaidAccess(false);
      setRolesLoaded(true);
      return;
    }
    setRolesLoaded(false);

    Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("app_acesso_pago").select("ativo").eq("user_id", userId).maybeSingle(),
    ]).then(([rolesRes, accessRes]) => {
      if (!mounted) return;
      setRoles(((rolesRes.data ?? []) as { role: Role }[]).map((r) => r.role));
      setHasPaidAccess(!!accessRes.data?.ativo);
      setRolesLoaded(true);
    });

    return () => {
      mounted = false;
    };
  }, [userId, sessionLoaded]);

  return {
    session,
    user: session?.user ?? null,
    loading: !sessionLoaded || !rolesLoaded,
    roles,
    isAdmin: roles.includes("admin"),
    hasPaidAccess,
  };
}
