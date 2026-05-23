import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Mercado Pago envia notificações IPN/Webhook em POST com query `type` e `data.id`
// ou body { type, action, data: { id } }. A confirmação é feita consultando
// https://api.mercadopago.com/v1/payments/{id} com nosso access token (autenticação).
export const Route = createFileRoute("/api/public/mercadopago-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
        if (!token) return new Response("misconfigured", { status: 500 });

        let paymentId: string | null = null;
        try {
          const url = new URL(request.url);
          paymentId = url.searchParams.get("data.id") || url.searchParams.get("id");
          if (!paymentId) {
            const body = await request.json().catch(() => null) as any;
            paymentId = body?.data?.id ? String(body.data.id) : (body?.id ? String(body.id) : null);
          }
        } catch { /* ignore */ }

        if (!paymentId) return new Response("ok", { status: 200 });

        const r = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) {
          console.error("[MP webhook] payment fetch failed", r.status, await r.text());
          return new Response("ok", { status: 200 });
        }
        const pay: any = await r.json();
        const externalRef: string | null = pay.external_reference ?? null;
        const status: string = pay.status ?? "unknown";
        const cursoId: string | undefined = pay.metadata?.curso_id;
        const userId: string | undefined = pay.metadata?.user_id;
        const valorCentavos = Math.round(((pay.transaction_amount ?? 0) as number) * 100);

        await supabaseAdmin.from("hotmart_compras").insert({
          email_comprador: pay.payer?.email ?? "",
          nome_comprador: [pay.payer?.first_name, pay.payer?.last_name].filter(Boolean).join(" "),
          produto: pay.description ?? "Curso",
          evento: "PAYMENT_" + status.toUpperCase(),
          status: status === "approved" ? "ativo" : status,
          transaction_id: externalRef ?? String(paymentId),
          raw_payload: pay,
          curso_id: cursoId ?? null,
          valor_centavos: valorCentavos,
          plataforma: "Mercado Pago",
        });

        if (status === "approved" && userId && cursoId) {
          await supabaseAdmin.from("curso_matriculas").upsert({
            user_id: userId,
            curso_id: cursoId,
            ativo: true,
          }, { onConflict: "user_id,curso_id" });
        }

        return new Response("ok", { status: 200 });
      },
      GET: async () => new Response("ok"),
    },
  },
});
