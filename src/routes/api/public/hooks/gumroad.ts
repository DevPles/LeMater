import { createFileRoute } from "@tanstack/react-router";
import { upsertOrderFromWebhook, resolveProdutoByExternalId, type OrderStatus } from "@/lib/orders.server";

/**
 * Gumroad Ping. Recebe application/x-www-form-urlencoded.
 * Autenticação: parâmetro `seller_id` (validamos contra GUMROAD_WEBHOOK_SECRET) ou query secret.
 * Doc: https://app.gumroad.com/ping
 */
export const Route = createFileRoute("/api/public/hooks/gumroad")({
  server: {
    handlers: {
      GET: async () => new Response("ok"),
      POST: async ({ request }) => {
        const fd = await request.formData();
        const body = Object.fromEntries(fd.entries()) as Record<string, string>;
        const secret = process.env.GUMROAD_WEBHOOK_SECRET;
        const url = new URL(request.url);
        if (secret) {
          const provided = url.searchParams.get("secret") ?? body.seller_id ?? "";
          if (provided !== secret) return new Response("Unauthorized", { status: 401 });
        }

        const productId = body.product_id ?? body.product_permalink ?? "";
        if (!productId) return new Response("ignored", { status: 200 });
        const produto = await resolveProdutoByExternalId("gumroad", productId);
        if (!produto) return new Response("ignored", { status: 200 });

        const refunded = body.refunded === "true";
        const cancelled = body.cancelled === "true" || body.disputed === "true";
        const status: OrderStatus = refunded ? "reembolsado" : cancelled ? "cancelado" : "aprovado";

        const valor = parseInt(body.price ?? "0", 10); // Gumroad já manda em centavos
        await upsertOrderFromWebhook({
          produto_tipo: produto.produto_tipo,
          produto_id: produto.produto_id,
          comprador_email: body.email ?? "",
          comprador_nome: body.full_name ?? null,
          plataforma: "gumroad",
          transaction_id_externo: body.sale_id ?? body.order_number ?? `${Date.now()}`,
          status,
          valor_centavos: valor,
          moeda: (body.currency ?? produto.moeda).toUpperCase(),
          pais: body.country ?? body.ip_country ?? null,
          raw_payload: body,
        });
        return new Response("ok", { status: 200 });
      },
    },
  },
});
