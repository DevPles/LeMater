import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type CursoVitrine = {
  id: string;
  slug: string;
  titulo: string;
  descricao_curta: string | null;
  capa_url: string | null;
  categoria: string;
  nivel: string;
  carga_horaria_min: number;
  preco_label: string | null;
  publicado: boolean;
  instrutor_nome: string | null;
  total_aulas: number;
  matriculado: boolean;
};

export type CursoAula = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: "video" | "pdf" | "texto";
  duracao_min: number;
  ordem: number;
  previa_gratis: boolean;
  concluida: boolean;
  bloqueada: boolean;
};

export type CursoModuloFull = {
  id: string;
  titulo: string;
  descricao: string | null;
  ordem: number;
  aulas: CursoAula[];
};

export type CursoDetalhe = {
  id: string;
  slug: string;
  titulo: string;
  descricao_curta: string | null;
  descricao_longa: string | null;
  capa_url: string | null;
  trailer_url: string | null;
  categoria: string;
  nivel: string;
  carga_horaria_min: number;
  preco_label: string | null;
  link_compra_externo: string | null;
  plataforma_venda: string | null;
  instrutor_nome: string | null;
  instrutor_bio: string | null;
  instrutor_foto: string | null;
  publicado: boolean;
  modulos: CursoModuloFull[];
  materiais_gratis: { nome: string; url: string }[];
  matriculado: boolean;
  admin: boolean;
};

function toEmbed(url: string | null): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
}

async function isAdmin(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const { data } = await supabaseAdmin.from("user_roles").select("id")
    .eq("user_id", userId).eq("role", "admin").maybeSingle();
  return !!data;
}

async function hasPaidAccess(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const { data } = await supabaseAdmin.from("app_acesso_pago").select("ativo")
    .eq("user_id", userId).maybeSingle();
  return !!data?.ativo;
}

async function getUserIdFromAuthHeader(): Promise<string | null> {
  try {
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const auth = getRequestHeader("Authorization") || getRequestHeader("authorization");
    if (!auth?.startsWith("Bearer ")) return null;
    const { data } = await supabaseAdmin.auth.getUser(auth.slice(7));
    return data.user?.id ?? null;
  } catch { return null; }
}

async function matriculasAtivas(userId: string | null): Promise<Set<string>> {
  if (!userId) return new Set();
  const { data } = await supabaseAdmin.from("curso_matriculas")
    .select("curso_id, ativo, expira_em").eq("user_id", userId).eq("ativo", true);
  const now = new Date();
  return new Set((data ?? []).filter((m) =>
    !m.expira_em || new Date(m.expira_em) > now
  ).map((m) => m.curso_id));
}

// ============== Vitrine ==============
export const listCursosVitrine = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await getUserIdFromAuthHeader();
  const admin = await isAdmin(userId);
  const matriculas = await matriculasAtivas(userId);

  let q = supabaseAdmin.from("cursos")
    .select("id, slug, titulo, descricao_curta, capa_url, categoria, nivel, carga_horaria_min, preco_label, publicado, instrutor_nome")
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: false });
  if (!admin) q = q.eq("publicado", true);
  const { data: cursos, error } = await q;
  if (error) throw new Error(error.message);

  // Conta aulas por curso
  const ids = (cursos ?? []).map((c) => c.id);
  const counts: Record<string, number> = {};
  if (ids.length) {
    const { data: mods } = await supabaseAdmin.from("curso_modulos").select("id, curso_id").in("curso_id", ids);
    const modIds = (mods ?? []).map((m) => m.id);
    const modCurso: Record<string, string> = Object.fromEntries((mods ?? []).map((m) => [m.id, m.curso_id]));
    if (modIds.length) {
      const { data: aulas } = await supabaseAdmin.from("curso_aulas").select("modulo_id").in("modulo_id", modIds);
      for (const a of aulas ?? []) {
        const cid = modCurso[a.modulo_id];
        if (cid) counts[cid] = (counts[cid] ?? 0) + 1;
      }
    }
  }

  return (cursos ?? []).map((c) => ({
    ...c,
    total_aulas: counts[c.id] ?? 0,
    matriculado: matriculas.has(c.id) || admin,
  })) as CursoVitrine[];
});

// ============== Detalhe (landing page) ==============
export const getCursoBySlug = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(i))
  .handler(async ({ data }): Promise<CursoDetalhe | null> => {
    const userId = await getUserIdFromAuthHeader();
    const admin = await isAdmin(userId);
    const paid = await hasPaidAccess(userId);
    const matriculas = await matriculasAtivas(userId);

    const { data: c } = await supabaseAdmin.from("cursos").select("*").eq("slug", data.slug).maybeSingle();
    if (!c) return null;
    if (!c.publicado && !admin) return null;

    const matriculado = admin || matriculas.has(c.id) || paid;

    const { data: mods } = await supabaseAdmin.from("curso_modulos")
      .select("*").eq("curso_id", c.id).order("ordem");
    const modIds = (mods ?? []).map((m) => m.id);
    const aulasByMod: Record<string, any[]> = {};
    if (modIds.length) {
      const { data: aulas } = await supabaseAdmin.from("curso_aulas")
        .select("id, modulo_id, titulo, descricao, tipo, duracao_min, ordem, previa_gratis")
        .in("modulo_id", modIds).order("ordem");
      for (const a of aulas ?? []) {
        (aulasByMod[a.modulo_id] ||= []).push(a);
      }
    }

    // Progresso
    let concluidasSet = new Set<string>();
    if (userId) {
      const { data: prog } = await supabaseAdmin.from("curso_progresso")
        .select("aula_id").eq("user_id", userId);
      concluidasSet = new Set((prog ?? []).map((p) => p.aula_id));
    }

    const modulos: CursoModuloFull[] = (mods ?? []).map((m) => ({
      id: m.id, titulo: m.titulo, descricao: m.descricao, ordem: m.ordem,
      aulas: (aulasByMod[m.id] ?? []).map((a) => ({
        id: a.id, titulo: a.titulo, descricao: a.descricao,
        tipo: a.tipo, duracao_min: a.duracao_min, ordem: a.ordem,
        previa_gratis: a.previa_gratis,
        concluida: concluidasSet.has(a.id),
        bloqueada: !matriculado && !a.previa_gratis,
      })),
    }));

    // Materiais grátis (PDFs no nível do curso)
    const rawMat = Array.isArray((c as any).materiais_gratis) ? (c as any).materiais_gratis : [];
    const materiais_gratis: { nome: string; url: string }[] = [];
    for (const m of rawMat) {
      const path = m?.path as string | undefined;
      const nome = (m?.nome as string | undefined) ?? "material.pdf";
      if (!path) continue;
      const { data: signed } = await supabaseAdmin.storage.from("materiais-pdf").createSignedUrl(path, 60 * 60, { download: nome });
      if (signed) materiais_gratis.push({ nome, url: signed.signedUrl });
    }

    return {
      id: c.id, slug: c.slug, titulo: c.titulo,
      descricao_curta: c.descricao_curta, descricao_longa: c.descricao_longa,
      capa_url: c.capa_url, trailer_url: toEmbed(c.trailer_url),
      categoria: c.categoria, nivel: c.nivel,
      carga_horaria_min: c.carga_horaria_min,
      preco_label: c.preco_label,
      link_compra_externo: c.link_compra_externo,
      plataforma_venda: c.plataforma_venda,
      instrutor_nome: c.instrutor_nome, instrutor_bio: c.instrutor_bio, instrutor_foto: c.instrutor_foto,
      publicado: c.publicado, modulos, materiais_gratis, matriculado, admin,
    };
  });

// ============== Player de aula ==============
export type AulaAnexo = { nome: string; url: string };
export type AulaPlayer = {
  aula: { id: string; titulo: string; descricao: string | null; tipo: "video"|"pdf"|"texto"; duracao_min: number; previa_gratis: boolean };
  conteudo:
    | { kind: "video_externo"; embedUrl: string }
    | { kind: "video_upload"; url: string }
    | { kind: "pdf"; url: string }
    | { kind: "texto"; html: string }
    | { kind: "vazio" };
  anexos: AulaAnexo[];
};

export const getAulaPlayer = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ aula_id: z.string().uuid() }).parse(i))
  .handler(async ({ data }): Promise<AulaPlayer> => {
    const userId = await getUserIdFromAuthHeader();
    const { data: a, error } = await supabaseAdmin.from("curso_aulas")
      .select("id, titulo, descricao, tipo, duracao_min, video_url, pdf_url, conteudo_html, previa_gratis, modulo_id, materiais_extras")
      .eq("id", data.aula_id).single();
    if (error || !a) throw new Error("Aula não encontrada");

    // Permissão
    const { data: ok } = await supabaseAdmin.rpc("pode_ver_aula", { _user: (userId ?? null) as any, _aula: a.id });
    if (!ok) throw new Error("Sem permissão para acessar esta aula");

    let conteudo: AulaPlayer["conteudo"] = { kind: "vazio" };
    if (a.tipo === "video" && a.video_url) {
      if (a.video_url.startsWith("http")) {
        conteudo = { kind: "video_externo", embedUrl: toEmbed(a.video_url) ?? a.video_url };
      } else {
        const { data: signed } = await supabaseAdmin.storage.from("materiais-video").createSignedUrl(a.video_url, 60 * 120);
        if (signed) conteudo = { kind: "video_upload", url: signed.signedUrl };
      }
    } else if (a.tipo === "pdf" && a.pdf_url) {
      const { data: signed } = await supabaseAdmin.storage.from("materiais-pdf").createSignedUrl(a.pdf_url, 60 * 60);
      if (signed) conteudo = { kind: "pdf", url: signed.signedUrl };
    } else if (a.tipo === "texto") {
      conteudo = { kind: "texto", html: a.conteudo_html ?? "" };
    }

    // Anexos para download (qualquer tipo de aula)
    const raw = Array.isArray(a.materiais_extras) ? a.materiais_extras : [];
    const anexos: AulaAnexo[] = [];
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const nome = String((item as any).nome ?? "Material");
      const path = String((item as any).path ?? "");
      if (!path) continue;
      const { data: signed } = await supabaseAdmin.storage.from("materiais-pdf").createSignedUrl(path, 60 * 60, { download: nome });
      if (signed) anexos.push({ nome, url: signed.signedUrl });
    }

    return {
      aula: { id: a.id, titulo: a.titulo, descricao: a.descricao, tipo: a.tipo as "video"|"pdf"|"texto", duracao_min: a.duracao_min, previa_gratis: a.previa_gratis },
      conteudo,
      anexos,
    };
  });

// ============== Progresso ==============
export const marcarAulaConcluida = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ aula_id: z.string().uuid(), concluida: z.boolean() }).parse(i))
  .handler(async ({ data, context }) => {
    if (data.concluida) {
      await supabaseAdmin.from("curso_progresso").upsert(
        { user_id: context.userId, aula_id: data.aula_id, concluida_em: new Date().toISOString() },
        { onConflict: "user_id,aula_id" }
      );
    } else {
      await supabaseAdmin.from("curso_progresso").delete()
        .eq("user_id", context.userId).eq("aula_id", data.aula_id);
    }
    return { ok: true };
  });

// ============== Meus cursos ==============
export const listMeusCursos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await isAdmin(context.userId);
    const paid = await hasPaidAccess(context.userId);
    let cursoIds: string[] = [];
    if (admin || paid) {
      const { data } = await supabaseAdmin.from("cursos").select("id").eq("publicado", true);
      cursoIds = (data ?? []).map((c) => c.id);
    } else {
      const m = await matriculasAtivas(context.userId);
      cursoIds = [...m];
    }
    if (cursoIds.length === 0) return [];
    const { data } = await supabaseAdmin.from("cursos")
      .select("id, slug, titulo, descricao_curta, capa_url, categoria, nivel, carga_horaria_min, instrutor_nome")
      .in("id", cursoIds).eq("publicado", true).order("titulo");
    return (data ?? []).map((c) => ({ ...c, matriculado: true }));
  });

// ===================================================================
// ADMIN
// ===================================================================
async function requireAdmin(userId: string): Promise<void> {
  if (!(await isAdmin(userId))) throw new Error("Acesso negado");
}

export const adminListCursos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const { data, error } = await supabaseAdmin.from("cursos").select("*")
      .order("ordem").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const CursoSchema = z.object({
  id: z.string().uuid().optional(),
  titulo: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/, "slug deve conter apenas letras minúsculas, números e hífens"),
  descricao_curta: z.string().max(400).nullable().optional(),
  descricao_longa: z.string().max(20000).nullable().optional(),
  capa_url: z.string().nullable().optional(),
  trailer_url: z.string().nullable().optional(),
  categoria: z.string().max(80).default("geral"),
  nivel: z.string().max(40).default("iniciante"),
  carga_horaria_min: z.number().int().min(0).default(0),
  preco_centavos: z.number().int().min(0).default(0),
  preco_label: z.string().max(60).nullable().optional(),
  link_compra_externo: z.string().nullable().optional(),
  plataforma_venda: z.string().max(40).nullable().optional(),
  publicado: z.boolean().default(false),
  ordem: z.number().int().default(0),
  instrutor_nome: z.string().max(120).nullable().optional(),
  instrutor_bio: z.string().max(2000).nullable().optional(),
  instrutor_foto: z.string().nullable().optional(),
});

export const adminUpsertCurso = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CursoSchema.parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const payload: any = { ...data };
    if (!payload.id) delete payload.id;
    const { data: row, error } = await supabaseAdmin.from("cursos").upsert(payload).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const adminDeleteCurso = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const { error } = await supabaseAdmin.from("cursos").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminGetCursoFull = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const { data: curso } = await supabaseAdmin.from("cursos").select("*").eq("id", data.id).single();
    if (!curso) throw new Error("Curso não encontrado");
    const { data: mods } = await supabaseAdmin.from("curso_modulos")
      .select("*").eq("curso_id", data.id).order("ordem");
    const modIds = (mods ?? []).map((m) => m.id);
    let aulas: any[] = [];
    if (modIds.length) {
      const { data: a } = await supabaseAdmin.from("curso_aulas")
        .select("*").in("modulo_id", modIds).order("ordem");
      aulas = a ?? [];
    }
    return { curso, modulos: mods ?? [], aulas };
  });

const ModuloSchema = z.object({
  id: z.string().uuid().optional(),
  curso_id: z.string().uuid(),
  titulo: z.string().trim().min(1).max(200),
  descricao: z.string().max(1000).nullable().optional(),
  ordem: z.number().int().default(0),
});

export const adminUpsertModulo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ModuloSchema.parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const payload: any = { ...data };
    if (!payload.id) delete payload.id;
    const { data: row, error } = await supabaseAdmin.from("curso_modulos").upsert(payload).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const adminDeleteModulo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const { error } = await supabaseAdmin.from("curso_modulos").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const AulaSchema = z.object({
  id: z.string().uuid().optional(),
  modulo_id: z.string().uuid(),
  titulo: z.string().trim().min(1).max(200),
  descricao: z.string().max(2000).nullable().optional(),
  tipo: z.enum(["video", "pdf", "texto"]),
  video_url: z.string().nullable().optional(),
  pdf_url: z.string().nullable().optional(),
  conteudo_html: z.string().max(60000).nullable().optional(),
  duracao_min: z.number().int().min(0).default(0),
  ordem: z.number().int().default(0),
  previa_gratis: z.boolean().default(false),
  materiais_extras: z.array(z.object({ nome: z.string().min(1).max(200), path: z.string().min(1).max(500) })).optional(),
});

export const adminUpsertAula = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AulaSchema.parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const payload: any = { ...data };
    if (!payload.id) delete payload.id;
    const { data: row, error } = await supabaseAdmin.from("curso_aulas").upsert(payload).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const adminDeleteAula = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const { error } = await supabaseAdmin.from("curso_aulas").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Matrículas manuais
export const adminListMatriculas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ curso_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const { data: matriculas } = await supabaseAdmin.from("curso_matriculas")
      .select("user_id, ativo, origem, expira_em, created_at").eq("curso_id", data.curso_id);
    const ids = (matriculas ?? []).map((m) => m.user_id);
    if (ids.length === 0) return [];
    const { data: profs } = await supabaseAdmin.from("profiles")
      .select("user_id, nome, email").in("user_id", ids);
    const map = new Map((profs ?? []).map((p) => [p.user_id, p]));
    return (matriculas ?? []).map((m) => ({
      ...m, nome: map.get(m.user_id)?.nome ?? null, email: map.get(m.user_id)?.email ?? null,
    }));
  });

export const adminLiberarMatricula = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ curso_id: z.string().uuid(), user_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const { error } = await supabaseAdmin.from("curso_matriculas").upsert({
      curso_id: data.curso_id, user_id: data.user_id, ativo: true,
      origem: "manual", liberado_por: context.userId,
    }, { onConflict: "curso_id,user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminRevogarMatricula = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ curso_id: z.string().uuid(), user_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const { error } = await supabaseAdmin.from("curso_matriculas").delete()
      .eq("curso_id", data.curso_id).eq("user_id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
