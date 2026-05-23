import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("forbidden");
}

// ---------- VENDAS ----------
export const listVendas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data: compras, error } = await supabaseAdmin
      .from("hotmart_compras")
      .select("id, processado_em, email_comprador, nome_comprador, produto, evento, status, transaction_id, curso_id, cupom_codigo, valor_centavos, plataforma")
      .order("processado_em", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);

    const cursoIds = Array.from(new Set((compras ?? []).map((c) => c.curso_id).filter(Boolean) as string[]));
    let cursosMap = new Map<string, string>();
    if (cursoIds.length > 0) {
      const { data: cs } = await supabaseAdmin.from("cursos").select("id, titulo").in("id", cursoIds);
      cursosMap = new Map((cs ?? []).map((c) => [c.id, c.titulo]));
    }
    const enriched = (compras ?? []).map((c) => ({ ...c, curso_titulo: c.curso_id ? cursosMap.get(c.curso_id) ?? null : null }));

    // Resumo
    const total = enriched.length;
    const aprovadas = enriched.filter((c) => c.status === "ativo").length;
    const receita = enriched.filter((c) => c.status === "ativo").reduce((s, c) => s + (c.valor_centavos ?? 0), 0);

    return { compras: enriched, resumo: { total, aprovadas, receita_centavos: receita } };
  });

// ---------- CUPONS ----------
export const listCupons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("cupons")
      .select("id, codigo, descricao, desconto_pct, desconto_centavos, curso_id, valido_de, valido_ate, max_usos, usos, ativo, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { cupons: data ?? [] };
  });

const cupomSchema = z.object({
  id: z.string().uuid().optional(),
  codigo: z.string().min(2).max(40),
  descricao: z.string().max(200).optional().nullable(),
  desconto_pct: z.number().min(0).max(100).optional().nullable(),
  desconto_centavos: z.number().int().min(0).optional().nullable(),
  curso_id: z.string().uuid().optional().nullable(),
  valido_de: z.string().optional().nullable(),
  valido_ate: z.string().optional().nullable(),
  max_usos: z.number().int().min(1).optional().nullable(),
  ativo: z.boolean().optional(),
});

export const saveCupom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => cupomSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    if (data.desconto_pct == null && data.desconto_centavos == null) {
      throw new Error("Informe desconto em % ou em R$");
    }
    const row = {
      codigo: data.codigo.trim().toUpperCase(),
      descricao: data.descricao ?? null,
      desconto_pct: data.desconto_pct ?? null,
      desconto_centavos: data.desconto_centavos ?? null,
      curso_id: data.curso_id ?? null,
      valido_de: data.valido_de || null,
      valido_ate: data.valido_ate || null,
      max_usos: data.max_usos ?? null,
      ativo: data.ativo ?? true,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("cupons").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: ins, error } = await supabaseAdmin.from("cupons").insert(row).select("id").single();
    if (error) throw new Error(error.message);
    return { id: ins.id };
  });

export const deleteCupom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("cupons").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- VALIDAÇÃO PÚBLICA ----------
export const validateCupomPublic = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ codigo: z.string().min(1).max(40), curso_id: z.string().uuid().optional() }).parse(d))
  .handler(async ({ data }) => {
    const { data: result, error } = await supabaseAdmin.rpc("validate_cupom", {
      _codigo: data.codigo,
      ...(data.curso_id ? { _curso_id: data.curso_id } : {}),
    });
    if (error) throw new Error(error.message);
    return result as { valid: boolean; message?: string; codigo?: string; desconto_pct?: number; desconto_centavos?: number; preco_centavos?: number; desconto_aplicado_centavos?: number; total_centavos?: number };
  });

export const startCursoCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    curso_id: z.string().uuid(),
    plataforma: z.string().min(1).max(60),
    tipo: z.enum(["curso", "passe"]).default("curso"),
    pais: z.string().max(40).optional().nullable(),
    cupom_codigo: z.string().max(40).optional().nullable(),
  }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: curso, error } = await supabaseAdmin
      .from("cursos")
      .select("id, titulo, descricao_curta, capa_url, preco_centavos, links_compra, link_compra_externo, plataforma_venda")
      .eq("id", data.curso_id)
      .maybeSingle();
    if (error || !curso) throw new Error("Curso não encontrado");

    const links = Array.isArray((curso as any).links_compra) ? (curso as any).links_compra as any[] : [];
    const escolhido = links.find((l) =>
      String(l?.plataforma ?? "") === data.plataforma &&
      (!data.pais || !l?.pais || String(l.pais) === data.pais) &&
      (!l?.tipo || String(l.tipo) === data.tipo)
    ) ?? (curso.link_compra_externo ? { url: curso.link_compra_externo, plataforma: curso.plataforma_venda ?? data.plataforma } : null);

    // Aplica cupom para calcular valor final
    let valorFinal = curso.preco_centavos ?? 0;
    if (data.cupom_codigo) {
      const { data: cupResult } = await supabaseAdmin.rpc("validate_cupom", {
        _codigo: data.cupom_codigo,
        _curso_id: data.curso_id,
      });
      const c = cupResult as any;
      if (c?.valid && typeof c.total_centavos === "number") valorFinal = c.total_centavos;
    }

    const emailComprador = String((context.claims as any)?.email ?? "");
    const nomeComprador = String((context.claims as any)?.user_metadata?.nome ?? "");

    let urlCheckout: string | null = escolhido?.url ? String(escolhido.url) : null;
    let referenciaExterna: string | null = null;

    // Integração nativa Mercado Pago (Brasil)
    if (data.plataforma === "Mercado Pago" && valorFinal > 0) {
      const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
      if (mpToken) {
        try {
          referenciaExterna = `curso_${data.curso_id}_${context.userId}_${Date.now()}`;
          const reqHeaders = (await import("@tanstack/react-start/server")).getRequest();
          const origin = reqHeaders.headers.get("origin") ?? `https://${reqHeaders.headers.get("host") ?? "lemater.com"}`;
          const body = {
            items: [{
              id: data.curso_id,
              title: `${curso.titulo}${data.tipo === "passe" ? " · Passe completo" : ""}`,
              description: curso.descricao_curta ?? undefined,
              picture_url: curso.capa_url ?? undefined,
              category_id: "education",
              quantity: 1,
              currency_id: "BRL",
              unit_price: Math.round(valorFinal) / 100,
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
            metadata: { curso_id: data.curso_id, user_id: context.userId, tipo: data.tipo },
          };
          const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${mpToken}` },
            body: JSON.stringify(body),
          });
          const j: any = await r.json();
          if (!r.ok) {
            console.error("[MP] preference error", j);
            throw new Error(j?.message ?? "Falha ao criar pagamento Mercado Pago");
          }
          urlCheckout = (mpToken.startsWith("TEST-") ? j.sandbox_init_point : j.init_point) ?? j.init_point;
        } catch (e: any) {
          console.error("[MP] exception", e);
          throw new Error("Não foi possível abrir o Mercado Pago: " + (e?.message ?? "erro"));
        }
      }
    }

    await supabaseAdmin.from("hotmart_compras").insert({
      email_comprador: emailComprador,
      nome_comprador: nomeComprador,
      produto: curso.titulo,
      evento: "CHECKOUT_STARTED",
      status: "pendente",
      transaction_id: referenciaExterna,
      raw_payload: { curso_id: data.curso_id, plataforma: data.plataforma, tipo: data.tipo, pais: data.pais ?? null, valor_final_centavos: valorFinal },
      curso_id: data.curso_id,
      cupom_codigo: data.cupom_codigo || null,
      valor_centavos: valorFinal,
      plataforma: data.plataforma,
    });

    return { url: urlCheckout, pendente: !urlCheckout };
  });


// ---------- CURSOS DROPDOWN ----------
export const listCursosBasic = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data } = await supabaseAdmin.from("cursos").select("id, titulo, preco_centavos, produto_externo_id").order("titulo");
    return { cursos: data ?? [] };
  });
