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
 * Carrega TODAS as gestantes + todos os alertas ativos (uma chamada por gestante via RPC).
 * É a fonte única de dados das seções de Visão geral, Gestantes e Comunicação.
 */
export function useAdminData(): State {
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: profs } = await supabase
      .from("profiles")
      .select(
        "user_id, nome, email, telefone, cidade, bairro, unidade_saude, data_nascimento, dum, numero_gestacoes, numero_partos, numero_abortos",
      )
      .order("nome", { ascending: true })
      .limit(1000);

    const list = (profs ?? []) as AdminProfile[];
    setProfiles(list);

    // Carrega alertas em paralelo via RPC
    const alertResults = await Promise.all(
      list.map((p) =>
        supabase
          .rpc("get_active_alerts", { _gestante_id: p.user_id })
          .then(({ data }) =>
            ((data ?? []) as Omit<AdminAlert, "gestante_id">[]).map((a) => ({
              ...a,
              gestante_id: p.user_id,
            })),
          ),
      ),
    );
    setAlerts(alertResults.flat());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { profiles, alerts, loading, reload: load };
}
