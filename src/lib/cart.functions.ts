import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const itemSchema = z.object({
  aula_id: z.string().uuid(),
  titulo: z.string().min(1).max(255),
  preco_centavos: z.number().int().min(0).max(99999999),
  moeda: z.string().length(3).default("BRL"),
});

const checkoutSchema = z.object({
  comprador_nome: z.string().min(1).max(200),
  comprador_email: z.string().email().max(200),
  pais: z.string().min(2).max(8).default("BR"),
  items: z.array(itemSchema).min(1).max(50),
});

export const createCartOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => checkoutSchema.parse(d))
  .handler(async ({ data }) => {
    const totalCent = data.items.reduce((s, i) => s + i.preco_centavos, 0);
    const moeda = data.items[0]?.moeda ?? "BRL";

    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .insert({
        produto_tipo: "cart",
        comprador_email: data.comprador_email,
        comprador_nome: data.comprador_nome,
        plataforma: "manual",
        status: "pendente",
        valor_centavos: totalCent,
        moeda,
        pais: data.pais,
        aprovacao_manual: true,
      })
      .select("id")
      .single();
    if (oErr || !order) throw new Error(oErr?.message ?? "Falha ao criar pedido");

    const rows = data.items.map((i) => ({
      order_id: order.id,
      item_type: "aula",
      item_id: i.aula_id,
      title: i.titulo,
      quantity: 1,
      unit_price_centavos: i.preco_centavos,
      currency: i.moeda,
    }));
    const { error: iErr } = await supabaseAdmin.from("order_items").insert(rows);
    if (iErr) throw new Error(iErr.message);

    return { ok: true, order_id: order.id, total_centavos: totalCent };
  });
