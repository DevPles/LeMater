import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const APROVADOS = new Set(["PURCHASE_APPROVED", "PURCHASE_COMPLETE"]);
const REVOGAR = new Set(["PURCHASE_REFUNDED", "PURCHASE_CANCELED", "PURCHASE_CHARGEBACK", "PURCHASE_PROTEST", "PURCHASE_EXPIRED"]);

export const Route = createFileRoute("/api/public/hotmart-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.HOTMART_WEBHOOK_SECRET;
        if (!secret) return new Response("Webhook secret not configured", { status: 500 });

        const hottok = request.headers.get("x-hotmart-hottok") ?? new URL(request.url).searchParams.get("hottok");
        if (hottok !== secret) return new Response("Invalid hottok", { status: 401 });

        let payload: any;
        try { payload = await request.json(); } catch { return new Response("Invalid JSON", { status: 400 }); }

        const evento: string = payload.event ?? payload.data?.event ?? "UNKNOWN";
        const buyer = payload.data?.buyer ?? {};
        const purchase = payload.data?.purchase ?? {};
        const product = payload.data?.product ?? {};
        const email: string | undefined = (buyer.email ?? "").toLowerCase() || undefined;
        const nome: string | undefined = buyer.name ?? undefined;
        const transaction_id: string | undefined = purchase.transaction ?? purchase.order_ref ?? undefined;
        const produto: string | undefined = product.name ?? undefined;
        const produto_id: string | undefined = product.id ? String(product.id) : product.ucode ?? undefined;
        const valor_centavos: number | undefined = purchase.price?.value ? Math.round(Number(purchase.price.value) * 100) : undefined;
        const cupom_codigo: string | undefined = purchase.offer?.code ?? purchase.coupon?.code ?? payload.data?.coupon?.code ?? undefined;

        const status = APROVADOS.has(evento) ? "ativo" : REVOGAR.has(evento) ? "cancelado" : "outro";

        // Tenta encontrar curso específico por produto_externo_id (id ou nome)
        let curso_id: string | null = null;
        if (produto_id || produto) {
          const { data: curso } = await supabaseAdmin
            .from("cursos")
            .select("id")
            .or(`produto_externo_id.eq.${produto_id ?? ""},produto_externo_id.eq.${produto ?? ""}`)
            .maybeSingle();
          curso_id = curso?.id ?? null;
        }

        if (email) {
          await supabaseAdmin.from("hotmart_compras").insert({
            email_comprador: email, nome_comprador: nome ?? null, transaction_id: transaction_id ?? null,
            produto: produto ?? null, evento, status, raw_payload: payload,
            curso_id, cupom_codigo: cupom_codigo ?? null, valor_centavos: valor_centavos ?? null,
            plataforma: payload.platform ?? "hotmart",
          });
        }

        if (!email) return new Response("ok", { status: 200 });

        // Incrementa uso do cupom (se houver) em compras aprovadas
        if (APROVADOS.has(evento) && cupom_codigo) {
          const { data: cup } = await supabaseAdmin.from("cupons").select("id, usos").ilike("codigo", cupom_codigo).maybeSingle();
          if (cup?.id) {
            await supabaseAdmin.from("cupons").update({ usos: (cup.usos ?? 0) + 1 }).eq("id", cup.id);
          }
        }

        // Buscar/criar usuário
        const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
        let user = list.users.find((u) => u.email?.toLowerCase() === email);

        if (APROVADOS.has(evento)) {
          if (!user) {
            const senha = crypto.randomUUID() + "Aa1!";
            const { data: created } = await supabaseAdmin.auth.admin.createUser({
              email, password: senha, email_confirm: true,
              user_metadata: { nome: nome ?? email.split("@")[0] },
            });
            user = created.user ?? undefined;
          }
          if (user) {
            await supabaseAdmin.from("profiles").upsert(
              { user_id: user.id, email, nome: nome ?? user.email },
              { onConflict: "user_id" },
            );
            await supabaseAdmin.from("user_roles").upsert(
              { user_id: user.id, role: "aluno" as any },
              { onConflict: "user_id,role" },
            );

            if (curso_id) {
              // Liberação por curso individual
              await supabaseAdmin.from("curso_matriculas").upsert(
                { user_id: user.id, curso_id, ativo: true, origem: "hotmart" },
                { onConflict: "user_id,curso_id" } as any,
              );
            } else {
              // Passe completo
              await supabaseAdmin.from("app_acesso_pago").upsert(
                { user_id: user.id, ativo: true, origem: "hotmart" },
                { onConflict: "user_id" },
              );
            }
            await supabaseAdmin.auth.admin.generateLink({ type: "recovery", email });
          }
        } else if (REVOGAR.has(evento) && user) {
          if (curso_id) {
            await supabaseAdmin.from("curso_matriculas").update({ ativo: false }).eq("user_id", user.id).eq("curso_id", curso_id);
          } else {
            await supabaseAdmin.from("app_acesso_pago").update({ ativo: false }).eq("user_id", user.id);
          }
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
