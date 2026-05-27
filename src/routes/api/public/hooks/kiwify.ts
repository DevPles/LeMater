import { createFileRoute } from "@tanstack/react-router";
import { upsertOrderFromWebhook, resolveProdutoByExternalId, verifyHmacSha256, type OrderStatus } from "@/lib/orders.server";

/**
 * Kiwify webhook — assinatura HMAC-SHA256 do corpo bruto.
 * Header: x-kiwify-signature ou ?signature=
 */
export const Route = createFileRoute("/api/public/hooks/kiwify")({
  server: {
    handlers: {
      GET: async () => new Response("ok"),
      POST: async ({ request }) => {
        const secret = process.env.KIWIFY_WEBHOOK_SECRET;
        const raw = await request.text();
        const url = new URL(request.url);
        const signature = request.headers.get("x-kiwify-signature") ?? url.searchParams.get("signature");
        if (secret && !verifyHmacSha256(secret, raw, signature)) {
          return new Response("Unauthorized", { status: 401 });
        }
        const body = JSON.parse(raw) as {
          order_id?: string;
          order_status?: string;
          webhook_event_type?: string;
          Customer?: { email?: string; first_name?: string; last_name?: string; mobile?: string };
          Product?: { product_id?: string };
          Commissions?: { charge_amount?: number; currency?: string };
        };

        const evt = (body.webhook_event_type ?? body.order_status ?? "").toLowerCase();
        const status: OrderStatus = evt.includes("approved") || evt.includes("paid")
          ? "aprovado"
          : evt.includes("refund") || evt.includes("chargeback")
            ? "reembolsado"
            : evt.includes("rejected") || evt.includes("cancel")
              ? "cancelado"
              : "pendente";

        const productId = body.Product?.product_id ?? "";
        if (!productId) return new Response("ignored", { status: 200 });

        const produto = await resolveProdutoByExternalId("kiwify", productId);
        if (!produto) return new Response("ignored", { status: 200 });

        const valor = Math.round(((body.Commissions?.charge_amount ?? 0) as number) * 100);
        await upsertOrderFromWebhook({
          produto_tipo: produto.produto_tipo,
          produto_id: produto.produto_id,
          comprador_email: body.Customer?.email ?? "",
          comprador_nome: [body.Customer?.first_name, body.Customer?.last_name].filter(Boolean).join(" "),
          plataforma: "kiwify",
          transaction_id_externo: body.order_id ?? `${Date.now()}`,
          status,
          valor_centavos: valor,
          moeda: body.Commissions?.currency ?? produto.moeda,
          raw_payload: body,
        });
        return new Response("ok", { status: 200 });
      },
    },
  },
});
