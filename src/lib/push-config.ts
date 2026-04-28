// Chave pública VAPID — segura para expor no client (é pública por design).
// A chave privada vive somente no server route /api/public/send-push.
export const VAPID_PUBLIC_KEY =
  "BAvb-o89v2-Xo1qHb6lStDfw9ce9r3cvnlZ7d_QEvr3y7t0_SHEh3OQsQ4aHenNZTtCb6CyJO09qVy-_Z_TJ_Cs";

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
