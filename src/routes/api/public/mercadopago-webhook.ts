import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { upsertOrderFromWebhook, resolveProdutoByExternalId } from "@/lib/orders.server";

/**
 * Mercado Pago webhook — usa o pedido criado no checkout (external_reference = order_id).
 */
export const Route = createFileRoute("/api/public/mercadopago-webhook")({
  server: {
    handlers: {
      GET: async () => new Response("ok"),
      POST: async ({ request }) => {
        const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
        if (!token) return new Response("misconfigured", { status: 500 });

        let paymentId: string | null = null;
        try {
          const url = new URL(request.url);
          paymentId = url.searchParams.get("data.id") || url.searchParams.get("id");
          if (!paymentId) {
            const body = (await request.json().catch(() => null)) as { data?: { id?: unknown }; id?: unknown } | null;
            paymentId = body?.data?.id ? String(body.data.id) : body?.id ? String(body.id) : null;
          }
        } catch {
          /* ignore */
        }
        if (!paymentId) return new Response("ok", { status: 200 });

        const r = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) {
          console.error("[MP webhook] payment fetch failed", r.status, await r.text());
          return new Response("ok", { status: 200 });
        }
        const pay = (await r.json()) as {
          status?: string;
          external_reference?: string;
          metadata?: { order_id?: string; curso_id?: string; user_id?: string; produto_tipo?: string; produto_id?: string };
          payer?: { email?: string; first_name?: string; last_name?: string };
          transaction_amount?: number;
          description?: string;
        };

        const mpStatus = pay.status ?? "pending";
        const orderStatus: "aprovado" | "pendente" | "recusado" | "reembolsado" =
          mpStatus === "approved"
            ? "aprovado"
            : mpStatus === "refunded" || mpStatus === "charged_back"
              ? "reembolsado"
              : mpStatus === "rejected" || mpStatus === "cancelled"
                ? "recusado"
                : "pendente";

        // Caminho novo: external_reference é o order_id criado no checkout
        const externalRef = pay.external_reference ?? null;
        if (externalRef && /^[0-9a-f-]{36}$/i.test(externalRef)) {
          await supabaseAdmin
            .from("orders")
            .update({
              status: orderStatus,
              transaction_id_externo: String(paymentId),
              aprovado_em: orderStatus === "aprovado" ? new Date().toISOString() : null,
              raw_payload: pay as never,
            } as never)
            .eq("id", externalRef);
          if (orderStatus === "aprovado") {
            await supabaseAdmin.rpc("liberar_acesso_por_pedido", { _order_id: externalRef } as never);
          } else if (orderStatus === "reembolsado") {
            await supabaseAdmin.rpc("revogar_acesso_por_pedido", { _order_id: externalRef } as never);
          }
          return new Response("ok", { status: 200 });
        }

        // Fallback: metadata.curso_id (compras antigas)
        const cursoId = pay.metadata?.curso_id;
        const userId = pay.metadata?.user_id;
        if (cursoId) {
          const email = pay.payer?.email ?? "";
          await upsertOrderFromWebhook({
            produto_tipo: "curso",
            produto_id: cursoId,
            comprador_email: email,
            comprador_nome: [pay.payer?.first_name, pay.payer?.last_name].filter(Boolean).join(" "),
            plataforma: "mercadopago",
            transaction_id_externo: String(paymentId),
            status: orderStatus,
            valor_centavos: Math.round((pay.transaction_amount ?? 0) * 100),
            moeda: "BRL",
            pais: "BR",
            raw_payload: pay,
          });
          if (orderStatus === "aprovado" && userId) {
            await supabaseAdmin
              .from("curso_matriculas")
              .upsert({ user_id: userId, curso_id: cursoId, ativo: true } as never, { onConflict: "user_id,curso_id" });
          }
        }
        return new Response("ok", { status: 200 });
      },
    },
  },
});
