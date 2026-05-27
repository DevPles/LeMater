import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createHmac, timingSafeEqual } from "crypto";

export type ProdutoTipo = "curso" | "aula" | "material" | "servico";
export type Plataforma =
  | "mercadopago"
  | "hotmart"
  | "kiwify"
  | "eduzz"
  | "stripe"
  | "teachable"
  | "gumroad"
  | "manual";
export type OrderStatus = "pendente" | "aprovado" | "recusado" | "reembolsado" | "cancelado";

export interface UpsertOrderInput {
  produto_tipo: ProdutoTipo;
  produto_id: string;
  comprador_email: string;
  comprador_nome?: string | null;
  plataforma: Plataforma;
  transaction_id_externo: string;
  status: OrderStatus;
  valor_centavos?: number;
  moeda?: string;
  pais?: string | null;
  raw_payload: unknown;
}

/**
 * Upsert idempotente de pedido a partir de webhook externo.
 * Após upsert, se status='aprovado', chama liberar_acesso_por_pedido.
 */
export async function upsertOrderFromWebhook(input: UpsertOrderInput) {
  const row = {
    produto_tipo: input.produto_tipo,
    produto_id: input.produto_id,
    comprador_email: input.comprador_email.toLowerCase().trim(),
    comprador_nome: input.comprador_nome ?? null,
    plataforma: input.plataforma,
    transaction_id_externo: input.transaction_id_externo,
    status: input.status,
    valor_centavos: input.valor_centavos ?? 0,
    moeda: input.moeda ?? "BRL",
    pais: input.pais ?? null,
    raw_payload: input.raw_payload ?? {},
    aprovado_em: input.status === "aprovado" ? new Date().toISOString() : null,
  };

  const { data, error } = await supabaseAdmin
    .from("orders")
    .upsert(row, { onConflict: "plataforma,transaction_id_externo" })
    .select("id, status")
    .single();
  if (error) {
    console.error("[upsertOrderFromWebhook] error", error);
    throw error;
  }

  if (data.status === "aprovado") {
    await supabaseAdmin.rpc("liberar_acesso_por_pedido", { _order_id: data.id });
  } else if (data.status === "reembolsado" || data.status === "cancelado") {
    await supabaseAdmin.rpc("revogar_acesso_por_pedido", { _order_id: data.id });
  }
  return data;
}

/**
 * Resolve produto a partir de `produto_externo_id` cadastrado nas ofertas.
 * Retorna { produto_tipo, produto_id } ou null.
 */
export async function resolveProdutoByExternalId(
  plataforma: Plataforma,
  externalId: string
): Promise<{ produto_tipo: ProdutoTipo; produto_id: string; preco_centavos: number; moeda: string } | null> {
  const { data } = await supabaseAdmin
    .from("product_offers")
    .select("produto_tipo, produto_id, preco_centavos, moeda")
    .eq("plataforma", plataforma)
    .eq("produto_externo_id", externalId)
    .eq("ativo", true)
    .maybeSingle();
  if (!data) return null;
  return {
    produto_tipo: data.produto_tipo as ProdutoTipo,
    produto_id: data.produto_id,
    preco_centavos: data.preco_centavos ?? 0,
    moeda: data.moeda ?? "BRL",
  };
}

/** Verifica HMAC genérico (sha256 hex). */
export function verifyHmacSha256(secret: string, payload: string, signature: string | null): boolean {
  if (!signature) return false;
  const clean = signature.replace(/^sha256=/, "").trim();
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  try {
    const a = Buffer.from(clean, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
