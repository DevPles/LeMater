import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Não autorizado");
}

const MaterialSchema = z.object({
  id: z.string().uuid().optional(),
  titulo: z.string().min(2).max(200),
  descricao: z.string().max(2000).nullable().optional(),
  categoria: z.string().min(1).max(60),
  tipo: z.enum(["pdf", "video_externo", "video_upload", "artigo"]),
  area: z.enum(["gratis", "pago"]),
  conteudo_url: z.string().max(2000).nullable().optional(),
  conteudo_html: z.string().max(200000).nullable().optional(),
  capa_url: z.string().max(2000).nullable().optional(),
  ordem: z.number().int().min(0).max(10000).default(0),
  publicado: z.boolean().default(false),
});

export const upsertMaterial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => MaterialSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { id, ...rest } = data;
    const payload = {
      ...rest,
      descricao: rest.descricao ?? null,
      conteudo_url: rest.conteudo_url ?? null,
      conteudo_html: rest.conteudo_html ?? null,
      capa_url: rest.capa_url ?? null,
    };
    if (id) {
      const { error } = await supabaseAdmin.from("materiais").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: inserted, error } = await supabaseAdmin
      .from("materiais")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: inserted.id };
  });

export const deleteMaterial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("materiais").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAllMateriais = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("materiais")
      .select("*")
      .order("ordem", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("leads_gratis")
      .select("id, nome, email, telefone, material_id, created_at, materiais(titulo)")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listAlunos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("app_acesso_pago")
      .select("id, user_id, ativo, origem, expira_em, created_at, updated_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const ids = (data ?? []).map((a) => a.user_id);
    if (ids.length === 0) return [];
    const { data: profs } = await supabaseAdmin
      .from("profiles")
      .select("user_id, nome, email")
      .in("user_id", ids);
    const profMap = new Map((profs ?? []).map((p) => [p.user_id, p]));
    return (data ?? []).map((a) => ({
      ...a,
      nome: profMap.get(a.user_id)?.nome ?? null,
      email: profMap.get(a.user_id)?.email ?? null,
    }));
  });

export const liberarAcessoManual = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      email: z.string().email(),
      nome: z.string().min(2).max(120).optional(),
      senha_temporaria: z.string().min(6).max(72).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const email = data.email.toLowerCase();

    // Buscar usuário existente
    const { data: existing } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    let user = existing.users.find((u) => u.email?.toLowerCase() === email);

    if (!user) {
      const senha = data.senha_temporaria ?? Math.random().toString(36).slice(2, 12) + "Aa1!";
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
        user_metadata: { nome: data.nome ?? email.split("@")[0] },
      });
      if (createErr) throw new Error(createErr.message);
      user = created.user;
    }

    if (!user) throw new Error("Falha ao criar usuário");

    await supabaseAdmin
      .from("profiles")
      .upsert(
        { user_id: user.id, email, nome: data.nome ?? user.email },
        { onConflict: "user_id" },
      );

    const { error: accessErr } = await supabaseAdmin
      .from("app_acesso_pago")
      .upsert(
        { user_id: user.id, ativo: true, origem: "manual" },
        { onConflict: "user_id" },
      );
    if (accessErr) throw new Error(accessErr.message);

    return { user_id: user.id, email };
  });

export const revogarAcesso = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ user_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("app_acesso_pago")
      .update({ ativo: false })
      .eq("user_id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reativarAcesso = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ user_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("app_acesso_pago")
      .update({ ativo: true })
      .eq("user_id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const enviarResetSenha = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ email: z.string().email() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: data.email.toLowerCase(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listCompras = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("hotmart_compras")
      .select("id, email_comprador, nome_comprador, transaction_id, produto, evento, status, processado_em")
      .order("processado_em", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const dashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const [leads, alunos, materiais] = await Promise.all([
      supabaseAdmin.from("leads_gratis").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("app_acesso_pago").select("*", { count: "exact", head: true }).eq("ativo", true),
      supabaseAdmin.from("materiais").select("*", { count: "exact", head: true }).eq("publicado", true),
    ]);
    return {
      leads: leads.count ?? 0,
      alunos_ativos: alunos.count ?? 0,
      materiais_publicados: materiais.count ?? 0,
    };
  });

export const getMaterialPagoSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ material_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    // Verificar acesso
    const { data: access } = await supabaseAdmin
      .from("app_acesso_pago")
      .select("ativo")
      .eq("user_id", context.userId)
      .maybeSingle();
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!access?.ativo && !roleRow) throw new Error("Sem acesso");

    const { data: mat, error: matErr } = await supabaseAdmin
      .from("materiais")
      .select("tipo, conteudo_url")
      .eq("id", data.material_id)
      .single();
    if (matErr) throw new Error(matErr.message);
    if (!mat.conteudo_url) return { url: null };

    if (mat.tipo === "video_externo" || mat.tipo === "artigo") {
      return { url: mat.conteudo_url };
    }

    const bucket = mat.tipo === "pdf" ? "materiais-pdf" : "materiais-video";
    const { data: signed, error: signedErr } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(mat.conteudo_url, 60 * 60);
    if (signedErr) throw new Error(signedErr.message);
    return { url: signed.signedUrl };
  });
