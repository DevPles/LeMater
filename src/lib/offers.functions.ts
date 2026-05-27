import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type MPResp = { init_point?: string; sandbox_init_point?: string; message?: string };

function getMpToken() {
  const t = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!t) throw new Error("Mercado Pago não configurado.");
  if (!t.startsWith("APP_USR-") && !t.startsWith("TEST-")) {
    throw new Error("Credencial Mercado Pago inválida — use Access Token.");
  }
  return t;
}

/** Listagem pública de ofertas por produto + país. */
export const getPublicOffers = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        produto_tipo: z.enum(["curso", "aula", "material", "servico"]),
        produto_id: z.string().uuid(),
        pais: z.string().min(2).max(8).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin.rpc("get_public_offers", {
      _tipo: data.produto_tipo,
      _id: data.produto_id,
      _pais: data.pais ?? undefined,
    });
    if (error) throw new Error(error.message);
    return { offers: rows ?? [] };
  });

/**
 * Inicia checkout para UMA oferta específica (curso, aula, material ou serviço).
 * - mercadopago: cria preference nativa
 * - demais: retorna url_externo cadastrada na oferta
 */
export const startOfferCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ offer_id: z.string().uuid(), cupom_codigo: z.string().max(40).optional().nullable() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { data: offer, error } = await supabaseAdmin
      .from("product_offers")
      .select("id, produto_tipo, produto_id, pais, plataforma, tipo_link, url_externo, preco_centavos, moeda, label")
      .eq("id", data.offer_id)
      .eq("ativo", true)
      .maybeSingle();
    if (error || !offer) throw new Error("Oferta indisponível.");

    // Resolve título/descrição/capa do produto para usar no checkout
    let titulo = offer.label ?? "Compra";
    let descricao: string | null = null;
    let capa: string | null = null;
    let cursoIdRelacionado: string | null = null;

    if (offer.produto_tipo === "curso") {
      const { data: c } = await supabaseAdmin
        .from("cursos")
        .select("id, titulo, descricao_curta, capa_url")
        .eq("id", offer.produto_id)
        .maybeSingle();
      if (c) {
        titulo = offer.label ?? c.titulo;
        descricao = c.descricao_curta ?? null;
        capa = c.capa_url ?? null;
        cursoIdRelacionado = c.id;
      }
    } else if (offer.produto_tipo === "aula") {
      const { data: a } = await supabaseAdmin
        .from("aulas")
        .select("id, titulo, descricao, modulo_id")
        .eq("id", offer.produto_id)
        .maybeSingle();
      if (a) {
        titulo = offer.label ?? `Aula · ${a.titulo}`;
        descricao = a.descricao ?? null;
        if (a.modulo_id) {
          const { data: mod } = await supabaseAdmin.from("modulos").select("curso_id").eq("id", a.modulo_id).maybeSingle();
          cursoIdRelacionado = mod?.curso_id ?? null;
        }
      }
    } else if (offer.produto_tipo === "material" || offer.produto_tipo === "servico") {
      const { data: m } = await supabaseAdmin
        .from("materiais")
        .select("id, titulo, descricao, capa_url")
        .eq("id", offer.produto_id)
        .maybeSingle();
      if (m) {
        titulo = offer.label ?? m.titulo;
        descricao = m.descricao ?? null;
        capa = m.capa_url ?? null;
      }
    }

    const claims = context.claims as { email?: unknown; user_metadata?: { nome?: unknown } } | null;
    const emailComprador = typeof claims?.email === "string" ? claims.email : "";
    const nomeComprador = typeof claims?.user_metadata?.nome === "string" ? claims.user_metadata.nome : "";

    let urlCheckout: string | null = offer.url_externo ?? null;
    let referenciaExterna: string | null = null;

    if (offer.plataforma === "mercadopago") {
      if (offer.preco_centavos <= 0) throw new Error("Configure um preço maior que zero para esta oferta.");
      const token = getMpToken();
      referenciaExterna = `${offer.produto_tipo}_${offer.produto_id}_${context.userId}_${Date.now()}`;
      const reqHeaders = (await import("@tanstack/react-start/server")).getRequest();
      const origin = reqHeaders.headers.get("origin") ?? `https://${reqHeaders.headers.get("host") ?? "lemater.com"}`;
      const body = {
        items: [{
          id: offer.produto_id,
          title: titulo,
          description: descricao ?? undefined,
          picture_url: capa ?? undefined,
          category_id: "education",
          quantity: 1,
          currency_id: offer.moeda,
          unit_price: Math.round(offer.preco_centavos) / 100,
        }],
        payer: emailComprador ? { email: emailComprador, name: nomeComprador || undefined } : undefined,
        external_reference: referenciaExterna,
        statement_descriptor: "LEMATER",
        back_urls: {
          success: `${origin}/app/videos?compra=sucesso`,
          pending: `${origin}/app/videos?compra=pendente`,
          failure: `${origin}/app/videos?compra=falha`,
        },
        auto_return: "approved",
        notification_url: `${origin}/api/public/mercadopago-webhook`,
        metadata: {
          offer_id: offer.id,
          produto_tipo: offer.produto_tipo,
          produto_id: offer.produto_id,
          user_id: context.userId,
          curso_id: cursoIdRelacionado,
        },
      };
      const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const j = (await r.json()) as MPResp;
      if (!r.ok) {
        console.error("[MP] preference error", j);
        throw new Error(j?.message ?? "Falha ao criar pagamento Mercado Pago");
      }
      urlCheckout = (token.startsWith("TEST-") ? j.sandbox_init_point : j.init_point) ?? j.init_point ?? null;
    }

    await supabaseAdmin.from("hotmart_compras").insert({
      email_comprador: emailComprador,
      nome_comprador: nomeComprador,
      produto: titulo,
      evento: "CHECKOUT_STARTED",
      status: "pendente",
      transaction_id: referenciaExterna,
      raw_payload: {
        offer_id: offer.id,
        produto_tipo: offer.produto_tipo,
        produto_id: offer.produto_id,
        pais: offer.pais,
        moeda: offer.moeda,
        valor_centavos: offer.preco_centavos,
      },
      curso_id: cursoIdRelacionado,
      cupom_codigo: data.cupom_codigo || null,
      valor_centavos: offer.preco_centavos,
      plataforma: offer.plataforma,
    });

    return {
      url: urlCheckout,
      pendente: !urlCheckout,
      message: urlCheckout ? null : "Oferta sem link de checkout configurado.",
    };
  });
