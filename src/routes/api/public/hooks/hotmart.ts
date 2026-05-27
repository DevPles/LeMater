import { createFileRoute } from "@tanstack/react-router";
import { upsertOrderFromWebhook, resolveProdutoByExternalId, type OrderStatus } from "@/lib/orders.server";

/**
 * Hotmart webhook.
 * Autenticação: token "hottok" no header (configurado em https://app-vlc.hotmart.com/tools/post-back).
 * Eventos: PURCHASE_APPROVED, PURCHASE_COMPLETE, PURCHASE_REFUNDED, PURCHASE_CHARGEBACK, PURCHASE_CANCELED.
 */
export const Route = createFileRoute("/api/public/hooks/hotmart")({
  server: {
    handlers: {
      GET: async () => new Response("ok"),
      POST: async ({ request }) => {
        const secret = process.env.HOTMART_HOTTOK;
        const hottok = request.headers.get("x-hotmart-hottok") || request.headers.get("hottok");
        if (!secret) {
          console.warn("[hotmart] HOTMART_HOTTOK não configurado — webhook recebido sem validação");
        } else if (hottok !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }

        const body = (await request.json().catch(() => null)) as {
          event?: string;
          data?: {
            buyer?: { email?: string; name?: string; address?: { country?: string } };
            purchase?: {
              transaction?: string;
              status?: string;
              price?: { value?: number; currency_value?: string };
              offer?: { code?: string };
            };
            product?: { id?: number | string };
          };
        } | null;
        if (!body) return new Response("bad request", { status: 400 });

        const event = body.event ?? "";
        const buyer = body.data?.buyer;
        const purchase = body.data?.purchase;
        const productId = body.data?.product?.id ? String(body.data.product.id) : null;
        const offerCode = purchase?.offer?.code ?? null;
        const externalKey = offerCode ?? productId ?? "";
        const txId = purchase?.transaction ?? `${event}_${Date.now()}`;

        const status: OrderStatus =
          event.includes("APPROVED") || event.includes("COMPLETE")
            ? "aprovado"
            : event.includes("REFUNDED") || event.includes("CHARGEBACK")
              ? "reembolsado"
              : event.includes("CANCELED")
                ? "cancelado"
                : "pendente";

        const produto = externalKey ? await resolveProdutoByExternalId("hotmart", externalKey) : null;
        if (!produto) {
          console.warn("[hotmart] produto não encontrado para offer/product", externalKey);
          return new Response("ignored", { status: 200 });
        }

        await upsertOrderFromWebhook({
          produto_tipo: produto.produto_tipo,
          produto_id: produto.produto_id,
          comprador_email: buyer?.email ?? "",
          comprador_nome: buyer?.name ?? null,
          plataforma: "hotmart",
          transaction_id_externo: txId,
          status,
          valor_centavos: Math.round((purchase?.price?.value ?? 0) * 100),
          moeda: purchase?.price?.currency_value ?? produto.moeda,
          pais: buyer?.address?.country ?? null,
          raw_payload: body,
        });
        return new Response("ok", { status: 200 });
      },
    },
  },
});
