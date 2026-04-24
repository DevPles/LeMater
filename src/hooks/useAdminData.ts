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

    const [profsRes, alertsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "user_id, nome, email, telefone, cidade, bairro, unidade_saude, data_nascimento, dum, numero_gestacoes, numero_partos, numero_abortos",
        )
        .order("nome", { ascending: true })
        .limit(1000),
      supabase.rpc("get_all_active_alerts"),
    ]);

    setProfiles(((profsRes.data ?? []) as AdminProfile[]));
    setAlerts(((alertsRes.data ?? []) as AdminAlert[]));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { profiles, alerts, loading, reload: load };
}
