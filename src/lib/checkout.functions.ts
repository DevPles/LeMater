import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type ItemType = "lesson" | "module" | "pathway" | "bundle" | "all_access";

/**
 * Resolve título e preço (em centavos, na moeda solicitada) de um item da biblioteca.
 * Preço é determinado pela tabela product_offers (país BR -> mercadopago, demais -> stripe).
 */
async function resolveItem(item_type: ItemType, item_id: string, pais: "BR" | "INT") {
  let title = "";
  if (item_type === "lesson") {
    const { data } = await supabaseAdmin.from("lessons").select("title").eq("id", item_id).maybeSingle();
    title = (data as { title?: string } | null)?.title ?? "Aula";
  } else if (item_type === "module") {
    const { data } = await supabaseAdmin.from("modules").select("title").eq("id", item_id).maybeSingle();
    title = (data as { title?: string } | null)?.title ?? "Módulo";
  } else if (item_type === "pathway") {
    const { data } = await supabaseAdmin.from("pathways").select("title").eq("id", item_id).maybeSingle();
    title = (data as { title?: string } | null)?.title ?? "Trilha";
  } else if (item_type === "bundle") {
    const { data } = await supabaseAdmin.from("bundles").select("title").eq("id", item_id).maybeSingle();
    title = (data as { title?: string } | null)?.title ?? "Pacote";
  } else {
    title = "Acesso completo";
  }

  const plataforma = pais === "BR" ? "mercadopago" : "stripe";
  const moeda = pais === "BR" ? "BRL" : "EUR";
  const { data: offer } = await supabaseAdmin
    .from("product_offers")
    .select("preco_centavos, moeda")
    .eq("produto_tipo", item_type)
    .eq("produto_id", item_id)
    .eq("plataforma", plataforma)
    .eq("ativo", true)
    .order("ordem", { ascending: true })
    .limit(1)
    .maybeSingle();

  const o = offer as { preco_centavos?: number; moeda?: string } | null;
  return {
    title,
    unit_price_centavos: o?.preco_centavos ?? 0,
    currency: o?.moeda ?? moeda,
  };
}

// ---------- CARRINHO ----------
export const addToCart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      item_type: z.enum(["lesson", "module", "pathway", "bundle", "all_access"]),
      item_id: z.string().uuid(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await supabaseAdmin.from("cart_items").upsert(
      { user_id: context.userId, item_type: data.item_type, item_id: data.item_id },
      { onConflict: "user_id,item_type,item_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeFromCart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await supabaseAdmin
      .from("cart_items")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getCart = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ pais: z.enum(["BR", "INT"]).default("BR") }).parse(d ?? {}))
  .handler(async ({ context, data }) => {
    const { data: items } = await supabaseAdmin
      .from("cart_items")
      .select("id, item_type, item_id, added_at")
      .eq("user_id", context.userId)
      .order("added_at", { ascending: false });

    const enriched = await Promise.all(
      (items ?? []).map(async (it) => {
        const meta = await resolveItem(it.item_type as ItemType, it.item_id, data.pais);
        return { ...it, ...meta };
      }),
    );
    const total = enriched.reduce((s, it) => s + it.unit_price_centavos, 0);
    const currency = enriched[0]?.currency ?? (data.pais === "BR" ? "BRL" : "EUR");
    return { items: enriched, total_centavos: total, currency };
  });

// ---------- CHECKOUT MERCADO PAGO (BR / PIX + cartão) ----------
export const createMercadoPagoCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");

    const { data: cart } = await supabaseAdmin
      .from("cart_items")
      .select("item_type, item_id")
      .eq("user_id", context.userId);
    if (!cart || cart.length === 0) throw new Error("Carrinho vazio");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, nome")
      .eq("user_id", context.userId)
      .maybeSingle();
    const email = (profile as { email?: string } | null)?.email ?? "";

    const items = await Promise.all(
      cart.map((c) => resolveItem(c.item_type as ItemType, c.item_id, "BR").then((m) => ({ ...c, ...m }))),
    );
    const total = items.reduce((s, it) => s + it.unit_price_centavos, 0);
    if (total <= 0) throw new Error("Itens sem preço definido");

    // Cria pedido
    const { data: orderRow, error: oErr } = await supabaseAdmin
      .from("orders")
      .insert({
        produto_tipo: "cart",
        produto_id: null,
        comprador_email: email,
        comprador_user_id: context.userId,
        plataforma: "mercadopago",
        status: "pendente",
        valor_centavos: total,
        moeda: "BRL",
        pais: "BR",
        raw_payload: { cart },
      })
      .select("id")
      .single();
    if (oErr) throw new Error(oErr.message);
    const orderId = (orderRow as { id: string }).id;

    await supabaseAdmin.from("order_items").insert(
      items.map((it) => ({
        order_id: orderId,
        item_type: it.item_type,
        item_id: it.item_id,
        title: it.title,
        unit_price_centavos: it.unit_price_centavos,
        currency: "BRL",
      })),
    );

    // Preferência MP
    const origin = process.env.PUBLIC_APP_URL ?? "https://lemater.com";
    const pref = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        items: items.map((it) => ({
          title: it.title,
          quantity: 1,
          unit_price: it.unit_price_centavos / 100,
          currency_id: "BRL",
        })),
        payer: { email },
        external_reference: orderId,
        back_urls: {
          success: `${origin}/app/biblioteca?ok=1`,
          failure: `${origin}/carrinho?erro=1`,
          pending: `${origin}/carrinho?pendente=1`,
        },
        auto_return: "approved",
        notification_url: `${origin}/api/public/mercadopago-webhook`,
      }),
    });
    if (!pref.ok) {
      const txt = await pref.text();
      throw new Error(`MP error: ${pref.status} ${txt}`);
    }
    const prefData = (await pref.json()) as { id?: string; init_point?: string; sandbox_init_point?: string };
    return {
      order_id: orderId,
      checkout_url: prefData.init_point ?? prefData.sandbox_init_point ?? null,
    };
  });

// ---------- CHECKOUT STRIPE (Internacional) ----------
export const createStripeCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY não configurado");

    const { data: cart } = await supabaseAdmin
      .from("cart_items")
      .select("item_type, item_id")
      .eq("user_id", context.userId);
    if (!cart || cart.length === 0) throw new Error("Carrinho vazio");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("user_id", context.userId)
      .maybeSingle();
    const email = (profile as { email?: string } | null)?.email ?? "";

    const items = await Promise.all(
      cart.map((c) => resolveItem(c.item_type as ItemType, c.item_id, "INT").then((m) => ({ ...c, ...m }))),
    );
    const total = items.reduce((s, it) => s + it.unit_price_centavos, 0);
    if (total <= 0) throw new Error("Itens sem preço definido");
    const currency = (items[0]?.currency ?? "EUR").toLowerCase();

    const { data: orderRow, error: oErr } = await supabaseAdmin
      .from("orders")
      .insert({
        produto_tipo: "cart",
        produto_id: null,
        comprador_email: email,
        comprador_user_id: context.userId,
        plataforma: "stripe",
        status: "pendente",
        valor_centavos: total,
        moeda: currency.toUpperCase(),
        raw_payload: { cart },
      })
      .select("id")
      .single();
    if (oErr) throw new Error(oErr.message);
    const orderId = (orderRow as { id: string }).id;

    await supabaseAdmin.from("order_items").insert(
      items.map((it) => ({
        order_id: orderId,
        item_type: it.item_type,
        item_id: it.item_id,
        title: it.title,
        unit_price_centavos: it.unit_price_centavos,
        currency: it.currency,
      })),
    );

    const origin = process.env.PUBLIC_APP_URL ?? "https://lemater.com";
    const form = new URLSearchParams();
    form.append("mode", "payment");
    form.append("success_url", `${origin}/app/biblioteca?ok=1`);
    form.append("cancel_url", `${origin}/carrinho?cancelado=1`);
    form.append("customer_email", email);
    form.append("client_reference_id", orderId);
    form.append("metadata[order_id]", orderId);
    form.append("metadata[product_external_id]", orderId);
    items.forEach((it, i) => {
      form.append(`line_items[${i}][quantity]`, "1");
      form.append(`line_items[${i}][price_data][currency]`, currency);
      form.append(`line_items[${i}][price_data][unit_amount]`, String(it.unit_price_centavos));
      form.append(`line_items[${i}][price_data][product_data][name]`, it.title);
    });

    const sess = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    if (!sess.ok) {
      const txt = await sess.text();
      throw new Error(`Stripe error: ${sess.status} ${txt}`);
    }
    const sessData = (await sess.json()) as { id?: string; url?: string };
    return { order_id: orderId, checkout_url: sessData.url ?? null };
  });
