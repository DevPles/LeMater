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
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [hasPaidAccess, setHasPaidAccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!session?.user) {
      setRoles([]);
      setHasPaidAccess(false);
      return;
    }
    const uid = session.user.id;

    Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase
        .from("app_acesso_pago")
        .select("ativo")
        .eq("user_id", uid)
        .maybeSingle(),
    ]).then(([rolesRes, accessRes]) => {
      if (!mounted) return;
      setRoles(((rolesRes.data ?? []) as { role: Role }[]).map((r) => r.role));
      setHasPaidAccess(!!accessRes.data?.ativo);
    });

    return () => {
      mounted = false;
    };
  }, [session?.user?.id]);

  return {
    session,
    user: session?.user ?? null,
    loading,
    roles,
    isAdmin: roles.includes("admin"),
    hasPaidAccess,
  };
}
