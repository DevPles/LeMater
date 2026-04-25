import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "profissional" | "gestante";

export function useUserRole() {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async (uid: string | null) => {
      if (!uid) {
        if (active) {
          setRoles([]);
          setLoading(false);
        }
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid);
      if (!active) return;
      setRoles((data ?? []).map((r: { role: AppRole }) => r.role));
      setLoading(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const uid = session?.user.id ?? null;
      setUserId(uid);
      setLoading(true);
      load(uid);
    });

    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id ?? null;
      setUserId(uid);
      load(uid);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return {
    userId,
    roles,
    loading,
    isProfissional: roles.includes("profissional"),
    isAdmin: roles.includes("admin"),
    isGestante: roles.includes("gestante") && !roles.includes("profissional"),
  };
}
