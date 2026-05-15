import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const LeadSchema = z.object({
  material_id: z.string().uuid().nullable().optional(),
  nome: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  telefone: z.string().trim().min(8).max(30),
});

export const registrarLead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => LeadSchema.parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("leads_gratis").insert({
      material_id: data.material_id ?? null,
      nome: data.nome,
      email: data.email.toLowerCase(),
      telefone: data.telefone.replace(/\s+/g, " "),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
