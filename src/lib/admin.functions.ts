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
  acesso: z.enum(["publico", "restrito"]).default("publico"),
  conteudo_url: z.string().max(2000).nullable().optional(),
  conteudo_html: z.string().max(200000).nullable().optional(),
  capa_url: z.string().max(2000).nullable().optional(),
  link_compra: z.string().max(2000).nullable().optional(),
  plataforma_venda: z.string().max(60).nullable().optional(),
  preco_label: z.string().max(80).nullable().optional(),
  cta_label: z.string().max(60).nullable().optional(),
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
      link_compra: rest.link_compra?.trim() ? rest.link_compra.trim() : null,
      plataforma_venda: rest.plataforma_venda?.trim() ? rest.plataforma_venda.trim() : null,
      preco_label: rest.preco_label?.trim() ? rest.preco_label.trim() : null,
      cta_label: rest.cta_label?.trim() ? rest.cta_label.trim() : null,
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

// ===== Acessos por material =====

export const buscarUsuarios = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ termo: z.string().trim().min(2).max(120) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const t = `%${data.termo}%`;
    const { data: rows, error } = await supabaseAdmin
      .from("profiles")
      .select("user_id, nome, email")
      .or(`nome.ilike.${t},email.ilike.${t}`)
      .limit(20);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const listMaterialAcessos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ material_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: rows, error } = await supabaseAdmin
      .from("material_acessos")
      .select("user_id, created_at")
      .eq("material_id", data.material_id);
    if (error) throw new Error(error.message);
    const ids = (rows ?? []).map((r) => r.user_id);
    if (ids.length === 0) return [];
    const { data: profs } = await supabaseAdmin
      .from("profiles")
      .select("user_id, nome, email")
      .in("user_id", ids);
    const map = new Map((profs ?? []).map((p) => [p.user_id, p]));
    return (rows ?? []).map((r) => ({
      user_id: r.user_id,
      created_at: r.created_at,
      nome: map.get(r.user_id)?.nome ?? null,
      email: map.get(r.user_id)?.email ?? null,
    }));
  });

export const liberarAcessoMaterial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      material_id: z.string().uuid(),
      user_id: z.string().uuid(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("material_acessos")
      .upsert(
        { material_id: data.material_id, user_id: data.user_id, liberado_por: context.userId },
        { onConflict: "material_id,user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const revogarAcessoMaterial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      material_id: z.string().uuid(),
      user_id: z.string().uuid(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("material_acessos")
      .delete()
      .eq("material_id", data.material_id)
      .eq("user_id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
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

// ============================================================
// Dashboard overview — KPIs, séries diárias e listas recentes
// ============================================================
export const dashboardOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);

    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const start14 = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
    const start7 = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

    const [
      leadsTotal,
      leads7d,
      leadsSerie,
      alunosAtivos,
      gestantes,
      materiaisPub,
      cursosPub,
      matriculasAtivas,
      hotmartTotal,
      ordersMes,
      ordersMesAnt,
      ordersSerie,
      ordersRecentes,
      leadsRecentes,
    ] = await Promise.all([
      supabaseAdmin.from("leads_gratis").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("leads_gratis").select("*", { count: "exact", head: true }).gte("created_at", start7),
      supabaseAdmin.from("leads_gratis").select("created_at").gte("created_at", start14),
      supabaseAdmin.from("app_acesso_pago").select("*", { count: "exact", head: true }).eq("ativo", true),
      supabaseAdmin.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "gestante"),
      supabaseAdmin.from("materiais").select("*", { count: "exact", head: true }).eq("publicado", true),
      supabaseAdmin.from("cursos").select("*", { count: "exact", head: true }).eq("publicado", true),
      supabaseAdmin.from("curso_matriculas").select("*", { count: "exact", head: true }).eq("ativo", true),
      supabaseAdmin.from("hotmart_compras").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("orders").select("valor_centavos, plataforma").eq("status", "aprovado").gte("created_at", startThisMonth),
      supabaseAdmin.from("orders").select("valor_centavos").eq("status", "aprovado").gte("created_at", startPrevMonth).lt("created_at", startMonth),
      supabaseAdmin.from("orders").select("created_at, valor_centavos, plataforma, status").gte("created_at", start14),
      supabaseAdmin.from("orders").select("id, created_at, comprador_nome, comprador_email, produto_tipo, plataforma, valor_centavos, moeda, status").order("created_at", { ascending: false }).limit(8),
      supabaseAdmin.from("leads_gratis").select("id, created_at, nome, email, materiais(titulo)").order("created_at", { ascending: false }).limit(8),
    ]);

    const receitaMes = (ordersMes.data ?? []).reduce((acc, o) => acc + (o.valor_centavos ?? 0), 0);
    const receitaMesAnt = (ordersMesAnt.data ?? []).reduce((acc, o) => acc + (o.valor_centavos ?? 0), 0);
    const pedidosMes = (ordersMes.data ?? []).length;
    const pedidosMesAnt = (ordersMesAnt.data ?? []).length;

    // Vendas por plataforma (mês atual, aprovados)
    const porPlataforma: Record<string, number> = {};
    (ordersMes.data ?? []).forEach((o) => {
      const k = o.plataforma || "outros";
      porPlataforma[k] = (porPlataforma[k] ?? 0) + 1;
    });

    // Séries diárias (14 dias)
    const buildSerie = (rows: Array<{ created_at: string }>, valueFn?: (r: any) => number) => {
      const map = new Map<string, number>();
      for (let i = 13; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 3600 * 1000);
        map.set(d.toISOString().slice(0, 10), 0);
      }
      rows.forEach((r) => {
        const k = r.created_at.slice(0, 10);
        if (map.has(k)) map.set(k, (map.get(k) ?? 0) + (valueFn ? valueFn(r) : 1));
      });
      return Array.from(map.entries()).map(([dia, valor]) => ({ dia: dia.slice(5), valor }));
    };

    const aprovados = (ordersSerie.data ?? []).filter((o: any) => o.status === "aprovado");

    return {
      kpis: {
        gestantes: gestantes.count ?? 0,
        alunos_ativos: alunosAtivos.count ?? 0,
        leads_total: leadsTotal.count ?? 0,
        leads_7d: leads7d.count ?? 0,
        materiais_publicados: materiaisPub.count ?? 0,
        cursos_publicados: cursosPub.count ?? 0,
        matriculas_ativas: matriculasAtivas.count ?? 0,
        hotmart_total: hotmartTotal.count ?? 0,
        pedidos_mes: pedidosMes,
        pedidos_mes_ant: pedidosMesAnt,
        receita_mes_centavos: receitaMes,
        receita_mes_ant_centavos: receitaMesAnt,
      },
      series: {
        pedidos_14d: buildSerie(aprovados),
        receita_14d: buildSerie(aprovados, (r) => (r.valor_centavos ?? 0) / 100),
        leads_14d: buildSerie((leadsSerie.data ?? []) as Array<{ created_at: string }>),
      },
      plataformas: Object.entries(porPlataforma).map(([name, value]) => ({ name, value })),
      pedidos_recentes: ordersRecentes.data ?? [],
      leads_recentes: leadsRecentes.data ?? [],
    };
  });
