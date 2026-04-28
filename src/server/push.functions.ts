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

async function createVapidToken(endpoint: string) {
  const aud = new URL(endpoint).origin;
  const exp = Math.floor(Date.now() / 1000) + 12 * 60 * 60;
  const header = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const body = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify({ aud, exp, sub: VAPID_SUBJECT })),
  );
  const publicKey = base64UrlDecode(VAPID_PUBLIC_KEY);
  const key = await crypto.subtle.importKey(
    "jwk",
    {
      kty: "EC",
      crv: "P-256",
      d: VAPID_PRIVATE_KEY,
      x: base64UrlEncode(publicKey.slice(1, 33)),
      y: base64UrlEncode(publicKey.slice(33, 65)),
      ext: true,
    },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const signed = `${header}.${body}`;
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(signed),
  );
  return `${signed}.${base64UrlEncode(new Uint8Array(signature))}`;
}

async function encryptPushPayload(payload: string, receiverPublicKey: string, receiverAuth: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const receiverPub = base64UrlDecode(receiverPublicKey);
  const authSecret = base64UrlDecode(receiverAuth);
  const receiverKey = await crypto.subtle.importKey(
    "raw",
    receiverPub,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const senderKeys = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: receiverKey }, senderKeys.privateKey, 256),
  );
  const senderPub = new Uint8Array(await crypto.subtle.exportKey("raw", senderKeys.publicKey));
  const keyInfo = concatBytes(
    new TextEncoder().encode("WebPush: info\0"),
    receiverPub,
    senderPub,
  );
  const ikm = await hkdfExpand(await hmac(authSecret, sharedSecret), keyInfo, 32);
  const prk = await hmac(salt, ikm);
  const cek = await hkdfExpand(prk, new TextEncoder().encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdfExpand(prk, new TextEncoder().encode("Content-Encoding: nonce\0"), 12);
  const aesKey = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const plain = concatBytes(new TextEncoder().encode(payload), new Uint8Array([2]));
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, toArrayBuffer(plain)),
  );
  const recordSize = new Uint8Array([0, 0, 16, 0]);
  return concatBytes(salt, recordSize, new Uint8Array([senderPub.length]), senderPub, cipher);
}

async function hmac(keyBytes: Uint8Array, data: Uint8Array) {
  const key = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(keyBytes),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, toArrayBuffer(data)));
}

async function hkdfExpand(prk: Uint8Array, info: Uint8Array, length: number) {
  const blocks: Uint8Array[] = [];
  let previous = new Uint8Array(0);
  let generated = 0;
  for (let counter = 1; generated < length; counter++) {
    previous = await hmac(prk, concatBytes(previous, info, new Uint8Array([counter])));
    blocks.push(previous);
    generated += previous.length;
  }
  return concatBytes(...blocks).slice(0, length);
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function concatBytes(...arrays: Uint8Array[]) {
  const total = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  arrays.forEach((arr) => {
    out.set(arr, offset);
    offset += arr.length;
  });
  return out;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}
