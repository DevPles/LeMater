import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from "@/lib/push-config";
import { useServerFn } from "@tanstack/react-start";
import { registerPushSubscription } from "@/server/push.functions";

type State = "unsupported" | "denied" | "default" | "granted" | "loading";

export function usePushSubscription() {
  const [state, setState] = useState<State>("loading");
  const [registered, setRegistered] = useState(false);
  const registerSubscription = useServerFn(registerPushSubscription);

  const enable = useCallback(async () => {
    if (typeof window === "undefined") return { ok: false, error: "SSR" };
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      return { ok: false, error: "Navegador sem suporte a push." };
    }

    try {
      // CRÍTICO: requestPermission() precisa ser chamado SÍNCRONO no clique,
      // sem await antes. Senão o navegador rejeita silenciosamente.
      let permission: NotificationPermission = Notification.permission;
      if (permission === "default") {
        permission = await Notification.requestPermission();
      }
      setState(permission as State);

      if (permission === "denied") {
        setRegistered(false);
        return {
          ok: false,
          error:
            "Notificações bloqueadas. Clique no cadeado ao lado da URL → Permissões do site → Notificações: Permitir, e recarregue a página.",
        };
      }
      if (permission !== "granted") {
        setRegistered(false);
        return { ok: false, error: "Permissão não concedida." };
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
        });
      }

      const json = sub.toJSON();
      if (!json.keys?.p256dh || !json.keys?.auth) {
        setRegistered(false);
        return { ok: false, error: "Navegador não retornou as chaves do dispositivo." };
      }

      await registerSubscription({
        data: {
          endpoint: sub.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
          userAgent: navigator.userAgent,
        },
      });
      setRegistered(true);
      return { ok: true };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      setRegistered(false);
      return { ok: false, error: msg };
    }
  }, [registerSubscription]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setState("unsupported");
      return;
    }

    const permission = Notification.permission as State;
    setState(permission);
    if (permission === "granted") {
      void enable();
    }
  }, [enable]);

  return { state, registered, enable };
}
