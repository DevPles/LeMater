import { createServerFn } from "@tanstack/react-start";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const VAPID_PUBLIC_KEY =
  "BEUwolCHHTeUsqVpf96fwnuZHboKS671cpkYk8PYkTKr6z8BiYe0bGL9fJK96-HpEKP6z1Ahrmw-v5B2xkCwksA";
const VAPID_PRIVATE_KEY = "wT4pK6bN5oYsR_qj1fXmZdHv8aLgC3eUiB2nW0xPyMA";
const VAPID_SUBJECT = "mailto:admin@maedigital.app";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const InputSchema = z.object({
  campaignId: z.string().uuid(),
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(2000),
  url: z.string().max(500).optional(),
  userIds: z.array(z.string().uuid()).min(1).max(5000),
});

function getAdminClient() {
  const url = process.env.SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const sendPushCampaign = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const supabase = getAdminClient();

    const { data: subs, error: subsErr } = await supabase
      .from("push_subscriptions")
      .select("user_id, endpoint, p256dh, auth")
      .in("user_id", data.userIds);

    if (subsErr) {
      return { sent: 0, failed: 0, noDevice: 0, error: subsErr.message };
    }

    const usersWithDevice = new Set((subs ?? []).map((s) => s.user_id));
    const noDevice = data.userIds.filter((u) => !usersWithDevice.has(u));

    let sent = 0;
    let failed = 0;
    const deadEndpoints: string[] = [];
    const deliveryRows: Array<{
      campaign_id: string;
      gestante_id: string;
      canal: string;
      status: string;
      enviado_em: string | null;
      erro: string | null;
    }> = [];

    const payload = JSON.stringify({
      title: data.title,
      body: data.body,
      url: data.url ?? "/",
      tag: `campaign-${data.campaignId}`,
    });

    await Promise.all(
      (subs ?? []).map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
          );
          sent++;
          deliveryRows.push({
            campaign_id: data.campaignId,
            gestante_id: s.user_id,
            canal: "push",
            status: "enviado",
            enviado_em: new Date().toISOString(),
            erro: null,
          });
        } catch (e: unknown) {
          failed++;
          const err = e as { statusCode?: number; message?: string };
          if (err.statusCode === 404 || err.statusCode === 410) {
            deadEndpoints.push(s.endpoint);
          }
          deliveryRows.push({
            campaign_id: data.campaignId,
            gestante_id: s.user_id,
            canal: "push",
            status: "falha",
            enviado_em: null,
            erro: err.message ?? "erro",
          });
        }
      }),
    );

    // Marca destinatários sem dispositivo
    for (const uid of noDevice) {
      deliveryRows.push({
        campaign_id: data.campaignId,
        gestante_id: uid,
        canal: "push",
        status: "sem_dispositivo",
        enviado_em: null,
        erro: "Usuário não habilitou notificações.",
      });
    }

    if (deliveryRows.length > 0) {
      await supabase.from("notification_deliveries").insert(deliveryRows);
    }

    if (deadEndpoints.length > 0) {
      await supabase.from("push_subscriptions").delete().in("endpoint", deadEndpoints);
    }

    return { sent, failed, noDevice: noDevice.length };
  });
