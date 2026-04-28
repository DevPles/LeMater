import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const VAPID_PUBLIC_KEY =
  "BEUwolCHHTeUsqVpf96fwnuZHboKS671cpkYk8PYkTKr6z8BiYe0bGL9fJK96-HpEKP6z1Ahrmw-v5B2xkCwksA";
const VAPID_PRIVATE_KEY = "wT4pK6bN5oYsR_qj1fXmZdHv8aLgC3eUiB2nW0xPyMA";
const VAPID_SUBJECT = "mailto:admin@maedigital.app";

const InputSchema = z.object({
  campaignId: z.string().uuid(),
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(2000),
  url: z.string().max(500).optional(),
  userIds: z.array(z.string().uuid()).min(1).max(5000),
});

export const sendPushCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: role } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!role) {
      throw new Error("Não autorizado");
    }

    const { data: subs, error: subsErr } = await supabaseAdmin
      .from("push_subscriptions")
      .select("user_id, endpoint, p256dh, auth")
      .in("user_id", data.userIds);

    if (subsErr) {
      return { sent: 0, failed: 0, noDevice: 0, error: subsErr.message };
    }

    const usersWithDevice = new Set((subs ?? []).map((s) => s.user_id));
    const noDevice = data.userIds.filter((u) => !usersWithDevice.has(u));
    const payload = JSON.stringify({
      title: data.title,
      body: data.body,
      url: data.url ?? "/",
      tag: `campaign-${data.campaignId}`,
    });

    let sent = 0;
    let failed = 0;
    const deadEndpoints: string[] = [];
    const deliveryRows: Array<{
      campaign_id: string;
      gestante_id: string;
      canal: "push";
      status: "enviado" | "falha";
      enviado_em: string | null;
      erro: string | null;
    }> = [];

    await Promise.all(
      (subs ?? []).map(async (sub) => {
        const result = await sendWebPush({
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth,
          payload,
        });

        if (result.ok) {
          sent++;
          deliveryRows.push({
            campaign_id: data.campaignId,
            gestante_id: sub.user_id,
            canal: "push",
            status: "enviado",
            enviado_em: new Date().toISOString(),
            erro: null,
          });
          return;
        }

        failed++;
        if (result.status === 404 || result.status === 410) deadEndpoints.push(sub.endpoint);
        deliveryRows.push({
          campaign_id: data.campaignId,
          gestante_id: sub.user_id,
          canal: "push",
          status: "falha",
          enviado_em: null,
          erro: result.error,
        });
      }),
    );

    for (const uid of noDevice) {
      deliveryRows.push({
        campaign_id: data.campaignId,
        gestante_id: uid,
        canal: "push",
        status: "falha",
        enviado_em: null,
        erro: "Sem dispositivo com notificações ativadas.",
      });
    }

    if (deliveryRows.length > 0) {
      await supabaseAdmin.from("notification_deliveries").insert(deliveryRows);
    }

    if (deadEndpoints.length > 0) {
      await supabaseAdmin.from("push_subscriptions").delete().in("endpoint", deadEndpoints);
    }

    return { sent, failed, noDevice: noDevice.length };
  });

type SendWebPushInput = {
  endpoint: string;
  p256dh: string;
  auth: string;
  payload: string;
};

async function sendWebPush(input: SendWebPushInput) {
  try {
    const encrypted = await encryptPushPayload(input.payload, input.p256dh, input.auth);
    const token = await createVapidToken(input.endpoint);
    const response = await fetch(input.endpoint, {
      method: "POST",
      headers: {
        Authorization: `vapid t=${token}, k=${VAPID_PUBLIC_KEY}`,
        "Content-Encoding": "aes128gcm",
        "Content-Type": "application/octet-stream",
        TTL: "2419200",
        Urgency: "normal",
      },
      body: encrypted,
    });

    if (response.ok) return { ok: true as const };
    const text = await response.text().catch(() => "");
    return {
      ok: false as const,
      status: response.status,
      error: text || `Push recusado pelo serviço (${response.status})`,
    };
  } catch (error) {
    return {
      ok: false as const,
      status: 0,
      error: error instanceof Error ? error.message : "Erro desconhecido no push",
    };
  }
}
