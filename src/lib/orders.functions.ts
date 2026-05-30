import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("forbidden");
}

// ---------- PEDIDOS UNIFICADOS ----------
export const listOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("id, created_at, aprovado_em, plataforma, produto_tipo, produto_id, comprador_email, comprador_nome, status, valor_centavos, moeda, pais, transaction_id_externo, cupom_codigo, aprovacao_manual")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return { orders: data ?? [] };
  });

// ---------- RELATÓRIO DE VENDAS ----------
export const getSalesReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        from: z.string().optional(),
        to: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    let q = supabaseAdmin
      .from("orders")
      .select(
        "id, created_at, aprovado_em, plataforma, produto_tipo, produto_id, status, valor_centavos, moeda, pais, cupom_codigo, comprador_email",
      )
      .order("created_at", { ascending: false })
      .limit(5000);
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", data.to);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    // Resolver títulos de produto (curso/aula/material) em lote
    const ids: Record<string, Set<string>> = { curso: new Set(), aula: new Set(), material: new Set() };
    (rows ?? []).forEach((r: any) => {
      if (r.produto_id && ids[r.produto_tipo]) ids[r.produto_tipo].add(r.produto_id);
    });
    const titulos: Record<string, string> = {};
    const loadTitulos = async (
      tabela: "cursos" | "aulas" | "materiais",
      keyTipo: "curso" | "aula" | "material",
      set: Set<string>,
    ) => {
      if (!set.size) return;
      const { data: ts } = await (supabaseAdmin as any)
        .from(tabela)
        .select("id, titulo")
        .in("id", [...set]);
      (ts ?? []).forEach((t: any) => (titulos[`${keyTipo}:${t.id}`] = t.titulo));
    };
    await Promise.all([
      loadTitulos("cursos", "curso", ids.curso),
      loadTitulos("aulas", "aula", ids.aula),
      loadTitulos("materiais", "material", ids.material),
    ]);

    return { orders: rows ?? [], titulos };
  });

export const aprovarPedidoManual = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ order_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("orders").update({
      status: "aprovado",
      aprovado_em: new Date().toISOString(),
      aprovado_por: context.userId,
      aprovacao_manual: true,
    }).eq("id", data.order_id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.rpc("liberar_acesso_por_pedido", { _order_id: data.order_id });
    return { ok: true };
  });

export const reembolsarPedido = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ order_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("orders").update({ status: "reembolsado" }).eq("id", data.order_id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.rpc("revogar_acesso_por_pedido", { _order_id: data.order_id });
    return { ok: true };
  });

// ---------- OFERTAS POR PRODUTO ----------
const ofertaSchema = z.object({
  id: z.string().uuid().optional(),
  produto_tipo: z.enum(["curso", "aula", "material", "servico"]),
  produto_id: z.string().uuid(),
  pais: z.string().min(1).max(8).default("ALL"),
  plataforma: z.string().min(1).max(40),
  tipo_link: z.enum(["nativo", "externo"]),
  url_externo: z.string().url().nullable().optional(),
  produto_externo_id: z.string().max(120).nullable().optional(),
  preco_centavos: z.number().int().min(0).default(0),
  moeda: z.string().length(3).default("BRL"),
  label: z.string().max(60).nullable().optional(),
  ordem: z.number().int().min(0).default(0),
  ativo: z.boolean().default(true),
});

export const listOffersByProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ produto_tipo: z.string(), produto_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { data: offers, error } = await supabaseAdmin
      .from("product_offers")
      .select("*")
      .eq("produto_tipo", data.produto_tipo)
      .eq("produto_id", data.produto_id)
      .order("pais", { ascending: true });
    if (error) throw new Error(error.message);
    return { offers: offers ?? [] };
  });

export const saveOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ofertaSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const row = {
      produto_tipo: data.produto_tipo,
      produto_id: data.produto_id,
      pais: data.pais,
      plataforma: data.plataforma,
      tipo_link: data.tipo_link,
      url_externo: data.url_externo ?? null,
      produto_externo_id: data.produto_externo_id ?? null,
      preco_centavos: data.preco_centavos,
      moeda: data.moeda,
      label: data.label ?? null,
      ordem: data.ordem,
      ativo: data.ativo,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("product_offers").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: ins, error } = await supabaseAdmin.from("product_offers").insert(row).select("id").single();
    if (error) throw new Error(error.message);
    return { id: ins.id };
  });


export const deleteOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("product_offers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
