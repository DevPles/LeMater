import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from "@/lib/push-config";

type State = "unsupported" | "denied" | "default" | "granted" | "loading";

export function usePushSubscription() {
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setState("unsupported");
      return;
    }
    setState(Notification.permission as State);
  }, []);

  const enable = useCallback(async () => {
    if (typeof window === "undefined") return { ok: false, error: "SSR" };
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return { ok: false, error: "Navegador sem suporte a push." };
    }

    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      setState(permission as State);
      if (permission !== "granted") {
        return { ok: false, error: "Permissão negada." };
      }

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      const json = sub.toJSON();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return { ok: false, error: "Usuário não autenticado." };

      const { error } = await supabase
        .from("push_subscriptions")
        .upsert(
          {
            user_id: auth.user.id,
            endpoint: sub.endpoint,
            p256dh: json.keys?.p256dh ?? "",
            auth: json.keys?.auth ?? "",
            user_agent: navigator.userAgent,
          },
          { onConflict: "user_id,endpoint" },
        );

      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      return { ok: false, error: msg };
    }
  }, []);

  return { state, enable };
}
