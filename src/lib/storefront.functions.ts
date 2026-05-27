import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * STOREFRONT — leituras públicas (sem auth) com colunas seguras.
 * Cada função filtra ativo + visibilidade != hidden, e seleciona apenas
 * campos exibíveis ao público (sem campos administrativos sensíveis).
 */

const LESSON_PUBLIC_COLS =
  "id, slug, title, subtitle, short_description, transformation, audience, thumbnail, cover_image, trailer_url, duration_sec, difficulty, tags, free_or_paid, individual_price_centavos, currency, preview_enabled";

const MODULE_PUBLIC_COLS =
  "id, slug, title, subtitle, description, emotional_context, cover_image, cover_video, color, order";

const PATHWAY_PUBLIC_COLS =
  "id, slug, title, subtitle, description, audience, cover_image, cover_video, color, price_centavos, currency, recommended_week_min, recommended_week_max, order";

const BUNDLE_PUBLIC_COLS =
  "id, slug, title, subtitle, description, cover_image, price_centavos, currency, order";

// ---------- Vitrine principal ----------
export const getStorefront = createServerFn({ method: "GET" }).handler(async () => {
  const [modulesRes, pathwaysRes, bundlesRes, featuredRes] = await Promise.all([
    supabaseAdmin
      .from("modules")
      .select(MODULE_PUBLIC_COLS)
      .eq("active", true)
      .neq("visibility", "hidden")
      .order("order", { ascending: true })
      .limit(20),
    supabaseAdmin
      .from("pathways")
      .select(PATHWAY_PUBLIC_COLS)
      .eq("active", true)
      .neq("visibility", "hidden")
      .order("order", { ascending: true })
      .limit(20),
    supabaseAdmin
      .from("bundles")
      .select(BUNDLE_PUBLIC_COLS)
      .eq("active", true)
      .neq("visibility", "hidden")
      .order("order", { ascending: true })
      .limit(10),
    supabaseAdmin
      .from("lessons")
      .select(LESSON_PUBLIC_COLS)
      .eq("active", true)
      .neq("visibility", "hidden")
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  return {
    modules: modulesRes.data ?? [],
    pathways: pathwaysRes.data ?? [],
    bundles: bundlesRes.data ?? [],
    featured_lessons: featuredRes.data ?? [],
  };
});

// ---------- Aulas por módulo ----------
export const getLessonsByModule = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ module_slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const { data: mod } = await supabaseAdmin
      .from("modules")
      .select(MODULE_PUBLIC_COLS)
      .eq("slug", data.module_slug)
      .eq("active", true)
      .neq("visibility", "hidden")
      .maybeSingle();
    if (!mod) return { module: null, lessons: [] };

    const { data: links } = await supabaseAdmin
      .from("lesson_modules")
      .select("lesson_id, order")
      .eq("module_id", mod.id)
      .order("order", { ascending: true });
    const ids = (links ?? []).map((l) => l.lesson_id);
    if (!ids.length) return { module: mod, lessons: [] };

    const { data: lessons } = await supabaseAdmin
      .from("lessons")
      .select(LESSON_PUBLIC_COLS)
      .in("id", ids)
      .eq("active", true)
      .neq("visibility", "hidden");
    return { module: mod, lessons: lessons ?? [] };
  });

// ---------- Detalhe de aula ----------
export const getLessonDetail = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const { data: lesson } = await supabaseAdmin
      .from("lessons")
      .select(
        LESSON_PUBLIC_COLS +
          ", full_description, benefits, objectives, seo_title, seo_description",
      )
      .eq("slug", data.slug)
      .eq("active", true)
      .neq("visibility", "hidden")
      .maybeSingle();
    if (!lesson) return { lesson: null };
    return { lesson };
  });
