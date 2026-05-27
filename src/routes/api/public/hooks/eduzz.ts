import { createFileRoute } from "@tanstack/react-router";
import { upsertOrderFromWebhook, resolveProdutoByExternalId, type OrderStatus } from "@/lib/orders.server";

/**
 * Eduzz webhook (Myeduzz).
 * Autenticação: query param `?api_key=...` igual a EDUZZ_WEBHOOK_SECRET.
 * Doc: https://api.eduzz.com/docs/ (Postback).
 */
export const Route = createFileRoute("/api/public/hooks/eduzz")({
  server: {
    handlers: {
      GET: async () => new Response("ok"),
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const secret = process.env.EDUZZ_WEBHOOK_SECRET;
        const provided = url.searchParams.get("api_key") ?? request.headers.get("x-api-key");
        if (secret && provided !== secret) return new Response("Unauthorized", { status: 401 });

        const ct = request.headers.get("content-type") ?? "";
        type EduzzBody = {
          trans_cod?: string | number;
          trans_status?: string;
          product_cod?: string | number;
          product_name?: string;
          cus_email?: string;
          cus_name?: string;
          trans_value?: string | number;
          trans_currency?: string;
        };
        let body: EduzzBody = {};
        if (ct.includes("application/json")) {
          body = (await request.json()) as EduzzBody;
        } else {
          const fd = await request.formData();
          body = Object.fromEntries(fd.entries()) as unknown as EduzzBody;
        }

        const st = String(body.trans_status ?? "").toLowerCase();
        const status: OrderStatus = ["paid", "approved", "completo", "finalizado"].some(s => st.includes(s))
          ? "aprovado"
          : ["refund", "estornado", "chargeback"].some(s => st.includes(s)) ? "reembolsado"
          : ["cancel", "cancelado", "denied"].some(s => st.includes(s)) ? "cancelado"
          : "pendente";

        const productId = String(body.product_cod ?? "");
        if (!productId) return new Response("ignored", { status: 200 });
        const produto = await resolveProdutoByExternalId("eduzz", productId);
        if (!produto) return new Response("ignored", { status: 200 });

        const valor = Math.round(parseFloat(String(body.trans_value ?? "0")) * 100);
        await upsertOrderFromWebhook({
          produto_tipo: produto.produto_tipo,
          produto_id: produto.produto_id,
          comprador_email: body.cus_email ?? "",
          comprador_nome: body.cus_name ?? null,
          plataforma: "eduzz",
          transaction_id_externo: String(body.trans_cod ?? Date.now()),
          status,
          valor_centavos: valor,
          moeda: body.trans_currency ?? produto.moeda,
          raw_payload: body,
        });
        return new Response("ok", { status: 200 });
      },
    },
  },
});
