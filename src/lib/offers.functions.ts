import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Listagem pública de ofertas de venda por produto + país.
 * Retorna apenas campos seguros (sem `produto_externo_id`).
 */
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
