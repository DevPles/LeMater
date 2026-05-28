import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const inputSchema = z.object({
  order_id: z.string().uuid(),
  origin: z.string().url(),
});

type OrderRow = {
  id: string;
  status: string;
  valor_centavos: number;
  moeda: string;
  comprador_email: string;
  comprador_nome: string | null;
  pais: string | null;
};

type OrderItemRow = {
  title: string;
  quantity: number;
  unit_price_centavos: number;
  currency: string;
};

async function loadOrder(order_id: string): Promise<{ order: OrderRow; items: OrderItemRow[] }> {
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("id, status, valor_centavos, moeda, comprador_email, comprador_nome, pais")
    .eq("id", order_id)
    .single();
  if (error || !order) throw new Error("Pedido não encontrado.");
  if (order.status === "aprovado") throw new Error("Pedido já aprovado.");

  const { data: items } = await supabaseAdmin
    .from("order_items")
    .select("title, quantity, unit_price_centavos, currency")
    .eq("order_id", order_id);

  return { order: order as OrderRow, items: (items ?? []) as OrderItemRow[] };
}

// ---------------- STRIPE ----------------
export const createStripeCheckout = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }) => {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) throw new Error("Stripe não configurado.");

    const { order, items } = await loadOrder(data.order_id);
    const currency = (order.moeda || "BRL").toLowerCase();

    const lineItems = items.length
      ? items
      : [{ title: "Atlas Materno", quantity: 1, unit_price_centavos: order.valor_centavos, currency: order.moeda }];

    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set("success_url", `${data.origin}/atlas?paid=${order.id}`);
    form.set("cancel_url", `${data.origin}/atlas?canceled=${order.id}`);
    form.set("client_reference_id", order.id);
    form.set("customer_email", order.comprador_email);
    form.set("metadata[order_id]", order.id);
    form.set("payment_intent_data[metadata][order_id]", order.id);

    lineItems.forEach((it, i) => {
      form.set(`line_items[${i}][quantity]`, String(it.quantity || 1));
      form.set(`line_items[${i}][price_data][currency]`, currency);
      form.set(`line_items[${i}][price_data][unit_amount]`, String(it.unit_price_centavos));
      form.set(`line_items[${i}][price_data][product_data][name]`, it.title.slice(0, 250));
    });

    const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    const json = (await r.json()) as { id?: string; url?: string; error?: { message?: string } };
    if (!r.ok || !json.url) throw new Error(json.error?.message ?? "Falha ao criar sessão Stripe.");

    await supabaseAdmin
      .from("orders")
      .update({ plataforma: "stripe", transaction_id_externo: json.id ?? `pending_${order.id}` })
      .eq("id", order.id);

    return { url: json.url };
  });

// ---------------- MERCADO PAGO ----------------
export const createMercadoPagoCheckout = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }) => {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) throw new Error("Mercado Pago não configurado.");

    const { order, items } = await loadOrder(data.order_id);
    const currency = (order.moeda || "BRL").toUpperCase();

    const mpItems = (items.length
      ? items
      : [{ title: "Atlas Materno", quantity: 1, unit_price_centavos: order.valor_centavos, currency: order.moeda }]
    ).map((it) => ({
      title: it.title.slice(0, 250),
      quantity: it.quantity || 1,
      unit_price: Math.round(it.unit_price_centavos) / 100,
      currency_id: currency,
    }));

    const payload = {
      items: mpItems,
      external_reference: order.id,
      payer: { email: order.comprador_email, name: order.comprador_nome ?? undefined },
      back_urls: {
        success: `${data.origin}/atlas?paid=${order.id}`,
        pending: `${data.origin}/atlas?pending=${order.id}`,
        failure: `${data.origin}/atlas?canceled=${order.id}`,
      },
      auto_return: "approved",
      metadata: { order_id: order.id },
      statement_descriptor: "LE MATER",
    };

    const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const json = (await r.json()) as {
      id?: string;
      init_point?: string;
      sandbox_init_point?: string;
      message?: string;
    };
    if (!r.ok || (!json.init_point && !json.sandbox_init_point)) {
      throw new Error(json.message ?? "Falha ao criar preferência Mercado Pago.");
    }

    await supabaseAdmin
      .from("orders")
      .update({ plataforma: "mercadopago", transaction_id_externo: json.id ?? `pending_${order.id}` })
      .eq("id", order.id);

    return { url: json.init_point ?? json.sandbox_init_point! };
  });
