import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AdminProfile, AdminAlert } from "@/utils/admin-filters";

type State = {
  profiles: AdminProfile[];
  alerts: AdminAlert[];
  loading: boolean;
  reload: () => Promise<void>;
};

/**
 * Carrega TODAS as gestantes + todos os alertas ativos em UMA única chamada agregada.
 * Antes fazia N+1 (uma RPC por gestante) — agora usa get_all_active_alerts.
 */
export function useAdminData(): State {
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    const [profsRes, alertsRes, rolesRes] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "user_id, nome, email, telefone, cidade, bairro, unidade_saude, data_nascimento, dum, numero_gestacoes, numero_partos, numero_abortos",
        )
        .order("nome", { ascending: true })
        .limit(1000),
      supabase.rpc("get_all_active_alerts"),
      supabase.from("user_roles").select("user_id, role").eq("role", "gestante"),
    ]);

    const gestanteIds = new Set(
      ((rolesRes.data ?? []) as { user_id: string }[]).map((r) => r.user_id),
    );
    const allProfiles = (profsRes.data ?? []) as AdminProfile[];
    // Mostrar apenas perfis cujo usuário tem o papel "gestante".
    // Profissionais e admins não devem aparecer na lista de gestantes.
    const onlyGestantes = allProfiles.filter((p) => gestanteIds.has(p.user_id));

    setProfiles(onlyGestantes);
    setAlerts(((alertsRes.data ?? []) as AdminAlert[]));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { profiles, alerts, loading, reload: load };
}
