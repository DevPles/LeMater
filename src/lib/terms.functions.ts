import { createServerFn } from "@tanstack/react-start";
import { createHash } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const TERMS_VERSION = "2.0";

export const getMyTermsAcceptance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data } = await supabaseAdmin
      .from("terms_acceptances")
      .select("user_id, accepted_at, terms_version, hash")
      .eq("user_id", userId)
      .maybeSingle();
    return { acceptance: data ?? null };
  });

export const acceptTerms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userAgent?: string }) => input)
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const accepted_at = new Date().toISOString();
    const hash = createHash("sha256")
      .update(`${userId}|${accepted_at}|${TERMS_VERSION}`)
      .digest("hex");

    const { error } = await supabaseAdmin
      .from("terms_acceptances")
      .upsert(
        {
          user_id: userId,
          accepted_at,
          terms_version: TERMS_VERSION,
          hash,
          user_agent: data.userAgent ?? null,
        },
        { onConflict: "user_id" },
      );
    if (error) throw new Error(error.message);
    return { accepted_at, hash, terms_version: TERMS_VERSION };
  });

export const listTermsAcceptances = createServerFn({ method: "POST" })
  .inputValidator((input: { adminSecret: string }) => input)
  .handler(async ({ data }) => {
    if (data.adminSecret !== "unaerp2026") throw new Error("Não autorizado");
    const { data: rows, error } = await supabaseAdmin
      .from("terms_acceptances")
      .select("user_id, accepted_at, terms_version, hash");
    if (error) throw new Error(error.message);
    return { acceptances: rows ?? [] };
  });
