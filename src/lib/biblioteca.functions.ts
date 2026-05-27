import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// -------- helpers --------
async function ensureAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles").select("id")
    .eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Apenas administradores.");
}

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || `item-${Date.now()}`;
}

// ===================== MODULES =====================
export const listModules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("modules").select("*").order("order", { ascending: true }).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const ModuleInput = z.object({
  id: z.string().uuid().optional().nullable(),
  slug: z.string().max(120).optional().nullable(),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  emotional_context: z.string().max(2000).optional().nullable(),
  cover_image: z.string().max(2000).optional().nullable(),
  cover_video: z.string().max(2000).optional().nullable(),
  color: z.string().max(40).optional().nullable(),
  order: z.number().int().optional().default(0),
  visibility: z.enum(["public", "premium", "hidden"]).default("public"),
  active: z.boolean().default(true),
  seo_title: z.string().max(200).optional().nullable(),
  seo_description: z.string().max(400).optional().nullable(),
});

export const upsertModule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ModuleInput.parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);
    const row = { ...data, slug: data.slug?.trim() || slugify(data.title) };
    if (data.id) {
      const { id, ...rest } = row;
      const { error } = await supabaseAdmin.from("modules").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { id: _drop, ...insert } = row;
    void _drop;
    const { data: created, error } = await supabaseAdmin.from("modules").insert(insert).select("id").single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

export const deleteModule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);
    const { error } = await supabaseAdmin.from("modules").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ===================== LESSONS =====================
export const listLessons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.userId);
    const [lessonsRes, linksRes] = await Promise.all([
      supabaseAdmin.from("lessons").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("lesson_modules").select("lesson_id, module_id, order"),
    ]);
    if (lessonsRes.error) throw new Error(lessonsRes.error.message);
    if (linksRes.error) throw new Error(linksRes.error.message);
    const linksByLesson: Record<string, { module_id: string; order: number }[]> = {};
    for (const l of linksRes.data ?? []) {
      (linksByLesson[l.lesson_id] ||= []).push({ module_id: l.module_id, order: l.order });
    }
    return (lessonsRes.data ?? []).map((l) => ({ ...l, module_ids: (linksByLesson[l.id] ?? []).map(x => x.module_id) }));
  });

const LessonInput = z.object({
  id: z.string().uuid().optional().nullable(),
  slug: z.string().max(120).optional().nullable(),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300).optional().nullable(),
  short_description: z.string().max(600).optional().nullable(),
  full_description: z.string().max(10000).optional().nullable(),
  transformation: z.string().max(5000).optional().nullable(),
  benefits: z.array(z.string().max(300)).max(20).default([]),
  objectives: z.array(z.string().max(300)).max(20).default([]),
  audience: z.string().max(300).optional().nullable(),
  thumbnail: z.string().max(2000).optional().nullable(),
  cover_image: z.string().max(2000).optional().nullable(),
  cover_video_url: z.string().max(2000).optional().nullable(),
  trailer_url: z.string().max(2000).optional().nullable(),
  duration_sec: z.number().int().min(0).default(0),
  difficulty: z.string().max(40).default("iniciante"),
  tags: z.array(z.string().max(40)).max(30).default([]),
  visibility: z.enum(["public", "premium", "hidden"]).default("public"),
  free_or_paid: z.enum(["free", "paid"]).default("paid"),
  individual_price_centavos: z.number().int().min(0).default(0),
  currency: z.string().min(3).max(4).default("BRL"),
  preview_enabled: z.boolean().default(false),
  active: z.boolean().default(true),
  seo_title: z.string().max(200).optional().nullable(),
  seo_description: z.string().max(400).optional().nullable(),
  module_ids: z.array(z.string().uuid()).max(20).default([]),
});

export const upsertLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => LessonInput.parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);
    const { module_ids, id, ...rest } = data;
    const row = {
      ...rest,
      slug: rest.slug?.trim() || slugify(rest.title),
      benefits: rest.benefits as unknown as object,
      objectives: rest.objectives as unknown as object,
    };

    let lessonId = id ?? null;
    if (lessonId) {
      const { error } = await supabaseAdmin.from("lessons").update(row).eq("id", lessonId);
      if (error) throw new Error(error.message);
    } else {
      const { data: created, error } = await supabaseAdmin.from("lessons").insert(row).select("id").single();
      if (error) throw new Error(error.message);
      lessonId = created.id;
    }

    // Reset vínculos N:N
    await supabaseAdmin.from("lesson_modules").delete().eq("lesson_id", lessonId);
    if (module_ids.length) {
      const rows = module_ids.map((m, idx) => ({ lesson_id: lessonId!, module_id: m, order: idx }));
      const { error } = await supabaseAdmin.from("lesson_modules").insert(rows);
      if (error) throw new Error(error.message);
    }
    return { id: lessonId };
  });

export const deleteLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);
    const { error } = await supabaseAdmin.from("lessons").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ===================== MEDIA ITEMS =====================
export const listMediaItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ lesson_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);
    const { data: rows, error } = await supabaseAdmin
      .from("media_items").select("*").eq("lesson_id", data.lesson_id).order("order");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const MediaInput = z.object({
  id: z.string().uuid().optional().nullable(),
  lesson_id: z.string().uuid(),
  type: z.string().max(40),
  provider: z.string().max(40).optional().nullable(),
  url: z.string().max(2000).optional().nullable(),
  embed_url: z.string().max(2000).optional().nullable(),
  thumbnail: z.string().max(2000).optional().nullable(),
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  duration_sec: z.number().int().min(0).optional().nullable(),
  order: z.number().int().default(0),
  visibility: z.string().max(40).default("public"),
  active: z.boolean().default(true),
});

export const upsertMediaItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => MediaInput.parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);
    const { id, ...rest } = data;
    if (id) {
      const { error } = await supabaseAdmin.from("media_items").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: created, error } = await supabaseAdmin.from("media_items").insert(rest).select("id").single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

export const deleteMediaItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);
    const { error } = await supabaseAdmin.from("media_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ===================== ENTITLEMENTS =====================
export const listEntitlements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("entitlements").select("*").order("granted_at", { ascending: false }).limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const grantEntitlement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    user_email: z.string().email(),
    item_type: z.enum(["lesson", "module", "pathway", "bundle", "service", "all_access"]),
    item_id: z.string().uuid().nullable().optional(),
    expires_at: z.string().datetime().nullable().optional(),
    notes: z.string().max(500).optional().nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);
    const { data: prof } = await supabaseAdmin
      .from("profiles").select("user_id").eq("email", data.user_email.toLowerCase()).maybeSingle();
    if (!prof) throw new Error("Usuária não encontrada.");
    const insert = {
      user_id: prof.user_id,
      item_type: data.item_type,
      item_id: data.item_id ?? null,
      source: "manual" as const,
      granted_by: context.userId,
      expires_at: data.expires_at ?? null,
      notes: data.notes ?? null,
      active: true,
    };
    const { error } = await supabaseAdmin.from("entitlements").upsert(insert, {
      onConflict: "user_id,item_type,item_id,source",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const revokeEntitlement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);
    const { error } = await supabaseAdmin.from("entitlements").update({ active: false }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
