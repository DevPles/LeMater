import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AdminProfile, AdminAlert } from "@/utils/admin-filters";
import { listGestanteProfilesForAdmin } from "@/utils/admin-users.functions";

const ADMIN_SECRET = "unaerp2026";

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
    try {
      const [profilesRes, alertsRes] = await Promise.all([
        listGestanteProfilesForAdmin({ data: { adminSecret: ADMIN_SECRET } }),
        supabase.rpc("get_all_active_alerts"),
      ]);

      const onlyGestantes = profilesRes.profiles;
      const gestanteIds = new Set(onlyGestantes.map((p) => p.user_id));
      const onlyGestanteAlerts = ((alertsRes.data ?? []) as AdminAlert[]).filter((a) =>
        gestanteIds.has(a.gestante_id),
      );

      setProfiles(onlyGestantes);
      setAlerts(onlyGestanteAlerts);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { profiles, alerts, loading, reload: load };
}
