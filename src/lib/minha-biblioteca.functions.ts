import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * MINHA BIBLIOTECA — leituras autenticadas que devolvem somente os conteúdos
 * a que a aluna tem entitlement ativo (direto ou via módulo/trilha/pacote/all_access).
 */

type ItemType = "lesson" | "module" | "pathway" | "bundle" | "all_access";

const LESSON_COLS =
  "id, slug, title, subtitle, short_description, transformation, thumbnail, cover_image, duration_sec, difficulty, tags, free_or_paid";
const MODULE_COLS = "id, slug, title, subtitle, description, cover_image, color, order";
const PATHWAY_COLS =
  "id, slug, title, subtitle, description, cover_image, color, recommended_week_min, recommended_week_max, order";
const BUNDLE_COLS = "id, slug, title, subtitle, description, cover_image, order";

export const getMinhaBiblioteca = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;

    // 1) Entitlements ativos
    const { data: entRows } = await supabaseAdmin
      .from("entitlements")
      .select("item_type, item_id, expires_at, active")
      .eq("user_id", userId)
      .eq("active", true);

    const ents = (entRows ?? []).filter(
      (e) => !e.expires_at || new Date(e.expires_at as string) > new Date(),
    ) as Array<{ item_type: ItemType; item_id: string | null }>;

    const allAccess = ents.some((e) => e.item_type === "all_access");
    const lessonIds = new Set<string>();
    const moduleIds = new Set<string>();
    const pathwayIds = new Set<string>();
    const bundleIds = new Set<string>();

    ents.forEach((e) => {
      if (!e.item_id) return;
      if (e.item_type === "lesson") lessonIds.add(e.item_id);
      else if (e.item_type === "module") moduleIds.add(e.item_id);
      else if (e.item_type === "pathway") pathwayIds.add(e.item_id);
      else if (e.item_type === "bundle") bundleIds.add(e.item_id);
    });

    // 2) Expandir bundles → seus itens
    if (bundleIds.size) {
      const { data: items } = await supabaseAdmin
        .from("bundle_items")
        .select("bundle_id, item_type, item_id")
        .in("bundle_id", Array.from(bundleIds));
      (items ?? []).forEach((i) => {
        if (i.item_type === "lesson") lessonIds.add(i.item_id);
        else if (i.item_type === "module") moduleIds.add(i.item_id);
        else if (i.item_type === "pathway") pathwayIds.add(i.item_id);
      });
    }

    // 3) Expandir trilhas → aulas
    if (pathwayIds.size) {
      const { data: pl } = await supabaseAdmin
        .from("pathway_lessons")
        .select("pathway_id, lesson_id")
        .in("pathway_id", Array.from(pathwayIds));
      (pl ?? []).forEach((p) => lessonIds.add(p.lesson_id));
    }

    // 4) Expandir módulos → aulas
    if (moduleIds.size) {
      const { data: lm } = await supabaseAdmin
        .from("lesson_modules")
        .select("module_id, lesson_id")
        .in("module_id", Array.from(moduleIds));
      (lm ?? []).forEach((l) => lessonIds.add(l.lesson_id));
    }

    // 5) all_access libera tudo
    type LessonRow = {
      id: string;
      slug: string | null;
      title: string;
      subtitle: string | null;
      short_description: string | null;
      transformation: string | null;
      thumbnail: string | null;
      cover_image: string | null;
      duration_sec: number | null;
      difficulty: string | null;
      tags: string[] | null;
      free_or_paid: string | null;
    };
    type ModuleRow = {
      id: string;
      slug: string | null;
      title: string;
      subtitle: string | null;
      description: string | null;
      cover_image: string | null;
      color: string | null;
      order: number | null;
    };
    type PathwayRow = {
      id: string;
      slug: string | null;
      title: string;
      subtitle: string | null;
      description: string | null;
      cover_image: string | null;
      color: string | null;
      recommended_week_min: number | null;
      recommended_week_max: number | null;
      order: number | null;
    };
    type BundleRow = {
      id: string;
      slug: string | null;
      title: string;
      subtitle: string | null;
      description: string | null;
      cover_image: string | null;
      order: number | null;
    };

    let lessonsQuery = supabaseAdmin
      .from("lessons")
      .select(LESSON_COLS)
      .eq("active", true)
      .neq("visibility", "hidden")
      .order("created_at", { ascending: false });
    if (!allAccess) {
      if (!lessonIds.size) {
        return {
          all_access: false,
          modules: [] as ModuleRow[],
          pathways: [] as PathwayRow[],
          bundles: [] as BundleRow[],
          lessons: [] as LessonRow[],
          continue_watching: [] as LessonRow[],
        };
      }
      lessonsQuery = lessonsQuery.in("id", Array.from(lessonIds));
    }

    const [lessonsRes, modulesRes, pathwaysRes, bundlesRes] = await Promise.all([
      lessonsQuery,
      allAccess
        ? supabaseAdmin
            .from("modules")
            .select(MODULE_COLS)
            .eq("active", true)
            .neq("visibility", "hidden")
            .order("order", { ascending: true })
        : moduleIds.size
        ? supabaseAdmin.from("modules").select(MODULE_COLS).in("id", Array.from(moduleIds))
        : Promise.resolve({ data: [] }),
      allAccess
        ? supabaseAdmin
            .from("pathways")
            .select(PATHWAY_COLS)
            .eq("active", true)
            .neq("visibility", "hidden")
            .order("order", { ascending: true })
        : pathwayIds.size
        ? supabaseAdmin.from("pathways").select(PATHWAY_COLS).in("id", Array.from(pathwayIds))
        : Promise.resolve({ data: [] }),
      bundleIds.size
        ? supabaseAdmin.from("bundles").select(BUNDLE_COLS).in("id", Array.from(bundleIds))
        : Promise.resolve({ data: [] }),
    ]);

    const lessons = (lessonsRes.data ?? []) as unknown as LessonRow[];

    const { data: views } = await supabaseAdmin
      .from("lesson_views")
      .select("lesson_id, viewed_at")
      .eq("user_id", userId)
      .order("viewed_at", { ascending: false })
      .limit(8);

    const watchedIds = ((views ?? []) as Array<{ lesson_id: string }>).map((v) => v.lesson_id);
    const continueWatching = watchedIds
      .map((id) => lessons.find((l) => l.id === id))
      .filter((x): x is LessonRow => Boolean(x));

    return {
      all_access: allAccess,
      modules: (modulesRes.data ?? []) as unknown as ModuleRow[],
      pathways: (pathwaysRes.data ?? []) as unknown as PathwayRow[],
      bundles: (bundlesRes.data ?? []) as unknown as BundleRow[],
      lessons,
      continue_watching: continueWatching,
    };
  });


