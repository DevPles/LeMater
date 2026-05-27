import { createFileRoute } from "@tanstack/react-router";
import { upsertOrderFromWebhook, resolveProdutoByExternalId, verifyHmacSha256, type OrderStatus } from "@/lib/orders.server";

/**
 * Teachable webhook. Header: X-Teachable-Signature (HMAC SHA256 hex).
 * Eventos relevantes: enrollment.created, sale.created, sale.refunded.
 */
export const Route = createFileRoute("/api/public/hooks/teachable")({
  server: {
    handlers: {
      GET: async () => new Response("ok"),
      POST: async ({ request }) => {
        const secret = process.env.TEACHABLE_WEBHOOK_SECRET;
        const raw = await request.text();
        const sig = request.headers.get("x-teachable-signature");
        if (secret && !verifyHmacSha256(secret, raw, sig)) {
          return new Response("Unauthorized", { status: 401 });
        }
        type TBody = {
          id?: string | number;
          event?: string;
          object?: {
            id?: string | number;
            user?: { email?: string; name?: string };
            course?: { id?: string | number };
            product?: { id?: string | number };
            sale_price?: number; price?: number; currency?: string;
            purchase_country?: string;
          };
        };
        const body = JSON.parse(raw) as TBody;
        const o = body.object ?? {};
        const externalId = String(o.product?.id ?? o.course?.id ?? "");
        if (!externalId) return new Response("ignored", { status: 200 });

        const produto = await resolveProdutoByExternalId("teachable", externalId);
        if (!produto) return new Response("ignored", { status: 200 });

        const ev = (body.event ?? "").toLowerCase();
        const status: OrderStatus = ev.includes("refund") ? "reembolsado"
          : ev.includes("cancel") ? "cancelado"
          : ev.includes("sale") || ev.includes("enrollment") ? "aprovado"
          : "pendente";

        const valor = Math.round(((o.sale_price ?? o.price ?? 0) as number) * 100);
        await upsertOrderFromWebhook({
          produto_tipo: produto.produto_tipo,
          produto_id: produto.produto_id,
          comprador_email: o.user?.email ?? "",
          comprador_nome: o.user?.name ?? null,
          plataforma: "teachable",
          transaction_id_externo: String(o.id ?? body.id ?? Date.now()),
          status,
          valor_centavos: valor,
          moeda: (o.currency ?? produto.moeda).toUpperCase(),
          pais: o.purchase_country ?? null,
          raw_payload: body,
        });
        return new Response("ok", { status: 200 });
      },
    },
  },
});
