import { createFileRoute } from "@tanstack/react-router";
import { upsertOrderFromWebhook, resolveProdutoByExternalId, type OrderStatus, type Plataforma } from "@/lib/orders.server";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Stripe webhook. Assinatura: header `stripe-signature` (t=, v1=).
 * Eventos relevantes: checkout.session.completed, charge.refunded, payment_intent.payment_failed.
 * O produto é resolvido por metadata.product_external_id (definido na criação do PaymentLink/Checkout)
 * OU pelo Price/Product ID.
 */
function verifyStripeSignature(secret: string, payload: string, header: string | null): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return false;
  const signed = `${t}.${payload}`;
  const expected = createHmac("sha256", secret).update(signed).digest("hex");
  try {
    const a = Buffer.from(v1, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch { return false; }
}

export const Route = createFileRoute("/api/public/hooks/stripe")({
  server: {
    handlers: {
      GET: async () => new Response("ok"),
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        const raw = await request.text();
        const sig = request.headers.get("stripe-signature");
        if (secret && !verifyStripeSignature(secret, raw, sig)) {
          return new Response("Unauthorized", { status: 401 });
        }
        type StripeEvent = {
          id?: string;
          type?: string;
          data?: { object?: {
            id?: string; amount_total?: number; amount?: number; currency?: string;
            customer_email?: string; customer_details?: { email?: string; name?: string; address?: { country?: string } };
            metadata?: Record<string, string>;
            payment_intent?: string;
          } };
        };
        const evt = JSON.parse(raw) as StripeEvent;
        const obj = evt.data?.object ?? {};
        const meta = obj.metadata ?? {};
        const type = evt.type ?? "";
        const status: OrderStatus = type.includes("completed") || type.includes("succeeded")
          ? "aprovado"
          : type.includes("refund") ? "reembolsado"
          : type.includes("failed") || type.includes("canceled") ? "cancelado"
          : "pendente";

        // --- Fluxo carrinho: order_id na metadata ---
        const orderId = meta.order_id;
        if (orderId) {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const update: Record<string, unknown> = {
            status,
            raw_payload: evt as never,
            transaction_id_externo: obj.payment_intent ?? obj.id ?? evt.id ?? `${Date.now()}`,
            plataforma: "stripe",
          };
          if (status === "aprovado") update.aprovado_em = new Date().toISOString();
          await supabaseAdmin.from("orders").update(update as never).eq("id", orderId);
          if (status === "aprovado") {
            await supabaseAdmin.rpc("liberar_acesso_por_pedido", { _order_id: orderId });
          } else if (status === "reembolsado" || status === "cancelado") {
            await supabaseAdmin.rpc("revogar_acesso_por_pedido", { _order_id: orderId });
          }
          return new Response("ok", { status: 200 });
        }

        // --- Fluxo legado: produto resolvido via offer ---
        const externalId = meta.product_external_id ?? meta.product_id ?? "";
        if (!externalId) return new Response("ignored", { status: 200 });

        const produto = await resolveProdutoByExternalId("stripe" as Plataforma, externalId);
        if (!produto) return new Response("ignored", { status: 200 });

        const amount = (obj.amount_total ?? obj.amount ?? 0) as number;
        await upsertOrderFromWebhook({
          produto_tipo: produto.produto_tipo,
          produto_id: produto.produto_id,
          comprador_email: obj.customer_details?.email ?? obj.customer_email ?? "",
          comprador_nome: obj.customer_details?.name ?? null,
          plataforma: "stripe",
          transaction_id_externo: obj.payment_intent ?? obj.id ?? evt.id ?? `${Date.now()}`,
          status,
          valor_centavos: amount,
          moeda: (obj.currency ?? produto.moeda).toUpperCase(),
          pais: obj.customer_details?.address?.country ?? null,
          raw_payload: evt,
        });
        return new Response("ok", { status: 200 });
      },
    },
  },
});
