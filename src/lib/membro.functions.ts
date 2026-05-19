import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type MembroCursoProgresso = {
  id: string;
  slug: string;
  titulo: string;
  descricao_curta: string | null;
  capa_url: string | null;
  capa_video_url: string | null;
  categoria: string;
  nivel: string;
  carga_horaria_min: number;
  instrutor_nome: string | null;
  total_aulas: number;
  aulas_concluidas: number;
  percentual: number;
  proxima_aula_id: string | null;
};

export type MembroCursoSugerido = {
  id: string;
  slug: string;
  titulo: string;
  descricao_curta: string | null;
  capa_url: string | null;
  categoria: string;
  preco_label: string | null;
  total_aulas: number;
};

export type MembroPerfil = {
  user_id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  foto_url: string | null;
  data_nascimento: string | null;
  cidade: string | null;
  bairro: string | null;
  unidade_saude: string | null;
  dum: string | null;
  bebe_sexo: string | null;
  numero_gestacoes: number | null;
  numero_partos: number | null;
  numero_abortos: number | null;
};

export type MembroMedicao = {
  id: string;
  parametro: string;
  valor: number;
  semana_gestacional: number | null;
  data_medicao: string;
};

export type MembroTimelineItem = {
  id: string;
  tipo: "exame" | "imagem" | "vacina" | "consulta";
  titulo: string;
  data: string;
  status?: string | null;
  observacao?: string | null;
};

export type MembroDashboard = {
  perfil: MembroPerfil;
  is_admin: boolean;
  pago: boolean;
  semana_atual: number | null;
  dpp: string | null;
  cursos: MembroCursoProgresso[];
  sugeridos: MembroCursoSugerido[];
  medicoes: MembroMedicao[];
  timeline: MembroTimelineItem[];
  total_aulas_concluidas: number;
  total_horas_estudadas: number;
};

function calcSemana(dum: string | null): number | null {
  if (!dum) return null;
  const d = new Date(dum);
  if (isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  const w = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
  if (w < 0) return 0;
  if (w > 42) return 42;
  return w;
}

function calcDpp(dum: string | null): string | null {
  if (!dum) return null;
  const d = new Date(dum);
  if (isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + 280);
  return d.toISOString().slice(0, 10);
}

export const getDashboardMembro = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MembroDashboard> => {
    const userId = context.userId;

    // Perfil
    const { data: perfilRow } = await supabaseAdmin
      .from("profiles")
      .select("user_id, nome, email, telefone, foto_url, data_nascimento, cidade, bairro, unidade_saude, dum, bebe_sexo, numero_gestacoes, numero_partos, numero_abortos")
      .eq("user_id", userId)
      .maybeSingle();

    const perfil: MembroPerfil = perfilRow ?? {
      user_id: userId,
      nome: null, email: null, telefone: null, foto_url: null,
      data_nascimento: null, cidade: null, bairro: null, unidade_saude: null,
      dum: null, bebe_sexo: null,
      numero_gestacoes: null, numero_partos: null, numero_abortos: null,
    };

    // Roles + acesso pago
    const { data: rolesData } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", userId);
    const roles = (rolesData ?? []).map((r) => r.role);
    const isAdmin = roles.includes("admin");

    const { data: acessoData } = await supabaseAdmin
      .from("app_acesso_pago").select("ativo").eq("user_id", userId).maybeSingle();
    const pago = !!acessoData?.ativo;

    // Matrículas ativas
    const { data: matRows } = await supabaseAdmin
      .from("curso_matriculas")
      .select("curso_id, ativo, expira_em")
      .eq("user_id", userId)
      .eq("ativo", true);
    const now = Date.now();
    const matriculadosIds = new Set(
      (matRows ?? [])
        .filter((m) => !m.expira_em || new Date(m.expira_em).getTime() > now)
        .map((m) => m.curso_id)
    );

    // Cursos publicados
    const { data: cursosPub } = await supabaseAdmin
      .from("cursos")
      .select("id, slug, titulo, descricao_curta, capa_url, capa_video_url, categoria, nivel, carga_horaria_min, instrutor_nome, preco_label, ordem")
      .eq("publicado", true)
      .order("ordem");

    const meusIds = new Set<string>();
    if (isAdmin || pago) {
      (cursosPub ?? []).forEach((c) => meusIds.add(c.id));
    } else {
      matriculadosIds.forEach((id) => meusIds.add(id));
    }

    // Módulos e aulas de todos os cursos publicados
    const cursoIds = (cursosPub ?? []).map((c) => c.id);
    const { data: mods } = cursoIds.length
      ? await supabaseAdmin.from("curso_modulos").select("id, curso_id, ordem").in("curso_id", cursoIds)
      : { data: [] as { id: string; curso_id: string; ordem: number }[] };

    const modIds = (mods ?? []).map((m) => m.id);
    const { data: aulas } = modIds.length
      ? await supabaseAdmin.from("curso_aulas").select("id, modulo_id, ordem, duracao_min").in("modulo_id", modIds).order("ordem")
      : { data: [] as { id: string; modulo_id: string; ordem: number; duracao_min: number }[] };

    const modCurso = new Map<string, string>();
    for (const m of mods ?? []) modCurso.set(m.id, m.curso_id);

    // aulas agrupadas por curso (ordenadas pela ordem do módulo + ordem da aula)
    const modOrdem = new Map<string, number>();
    for (const m of mods ?? []) modOrdem.set(m.id, m.ordem);
    const aulasPorCurso = new Map<string, { id: string; duracao_min: number; sort: number }[]>();
    for (const a of aulas ?? []) {
      const cid = modCurso.get(a.modulo_id);
      if (!cid) continue;
      const sort = (modOrdem.get(a.modulo_id) ?? 0) * 10000 + a.ordem;
      const arr = aulasPorCurso.get(cid) ?? [];
      arr.push({ id: a.id, duracao_min: a.duracao_min, sort });
      aulasPorCurso.set(cid, arr);
    }
    for (const arr of aulasPorCurso.values()) arr.sort((a, b) => a.sort - b.sort);

    // Progresso do usuário
    const { data: progRows } = await supabaseAdmin
      .from("curso_progresso").select("aula_id").eq("user_id", userId);
    const concluidasSet = new Set((progRows ?? []).map((p) => p.aula_id));

    const cursos: MembroCursoProgresso[] = [];
    const sugeridos: MembroCursoSugerido[] = [];
    let totalAulasConcluidas = 0;
    let totalMinEstudados = 0;

    for (const c of cursosPub ?? []) {
      const arr = aulasPorCurso.get(c.id) ?? [];
      const total = arr.length;
      const concluidas = arr.filter((a) => concluidasSet.has(a.id)).length;
      const proxima = arr.find((a) => !concluidasSet.has(a.id))?.id ?? null;
      const minEstudados = arr
        .filter((a) => concluidasSet.has(a.id))
        .reduce((s, a) => s + (a.duracao_min ?? 0), 0);

      if (meusIds.has(c.id)) {
        totalAulasConcluidas += concluidas;
        totalMinEstudados += minEstudados;
        cursos.push({
          id: c.id, slug: c.slug, titulo: c.titulo,
          descricao_curta: c.descricao_curta, capa_url: c.capa_url,
          capa_video_url: c.capa_video_url,
          categoria: c.categoria, nivel: c.nivel,
          carga_horaria_min: c.carga_horaria_min,
          instrutor_nome: c.instrutor_nome,
          total_aulas: total,
          aulas_concluidas: concluidas,
          percentual: total > 0 ? Math.round((concluidas / total) * 100) : 0,
          proxima_aula_id: proxima,
        });
      } else {
        sugeridos.push({
          id: c.id, slug: c.slug, titulo: c.titulo,
          descricao_curta: c.descricao_curta, capa_url: c.capa_url,
          categoria: c.categoria, preco_label: c.preco_label,
          total_aulas: total,
        });
      }
    }

    // Medições clínicas
    const { data: medRows } = await supabaseAdmin
      .from("clinical_measurements")
      .select("id, parametro, valor, semana_gestacional, data_medicao")
      .eq("gestante_id", userId)
      .order("data_medicao");
    const medicoes: MembroMedicao[] = (medRows ?? []).map((m) => ({
      id: m.id, parametro: m.parametro, valor: Number(m.valor),
      semana_gestacional: m.semana_gestacional, data_medicao: m.data_medicao,
    }));

    // Timeline: exames + imagens + vacinas + consultas
    const timeline: MembroTimelineItem[] = [];
    const { data: exames } = await supabaseAdmin
      .from("exam_results").select("id, tipo_exame, data_exame, status, observacao")
      .eq("gestante_id", userId);
    for (const e of exames ?? []) {
      timeline.push({ id: `ex-${e.id}`, tipo: "exame", titulo: e.tipo_exame, data: e.data_exame, status: e.status, observacao: e.observacao });
    }
    const { data: imgs } = await supabaseAdmin
      .from("image_exam_results").select("id, tipo_exame, data_exame, status, observacao")
      .eq("gestante_id", userId);
    for (const i of imgs ?? []) {
      timeline.push({ id: `img-${i.id}`, tipo: "imagem", titulo: i.tipo_exame, data: i.data_exame, status: i.status, observacao: i.observacao });
    }
    const { data: vacs } = await supabaseAdmin
      .from("vaccinations").select("id, vacina, data_aplicacao")
      .eq("gestante_id", userId);
    for (const v of vacs ?? []) {
      timeline.push({ id: `vac-${v.id}`, tipo: "vacina", titulo: v.vacina, data: v.data_aplicacao });
    }
    const { data: consultas } = await supabaseAdmin
      .from("appointment_slots").select("id, titulo, data_hora, status, tipo_atendimento")
      .eq("gestante_id", userId);
    for (const c of consultas ?? []) {
      timeline.push({
        id: `con-${c.id}`, tipo: "consulta",
        titulo: c.titulo ?? c.tipo_atendimento ?? "Consulta",
        data: (c.data_hora ?? "").slice(0, 10),
        status: c.status,
      });
    }
    timeline.sort((a, b) => (b.data ?? "").localeCompare(a.data ?? ""));

    return {
      perfil,
      is_admin: isAdmin,
      pago,
      semana_atual: calcSemana(perfil.dum),
      dpp: calcDpp(perfil.dum),
      cursos: cursos.sort((a, b) => b.percentual - a.percentual),
      sugeridos,
      medicoes,
      timeline,
      total_aulas_concluidas: totalAulasConcluidas,
      total_horas_estudadas: Math.round((totalMinEstudados / 60) * 10) / 10,
    };
  });

const PerfilSchema = z.object({
  nome: z.string().min(1).max(120).optional().nullable(),
  telefone: z.string().max(40).optional().nullable(),
  data_nascimento: z.string().optional().nullable(),
  cidade: z.string().max(120).optional().nullable(),
  bairro: z.string().max(120).optional().nullable(),
  unidade_saude: z.string().max(180).optional().nullable(),
  dum: z.string().optional().nullable(),
  bebe_sexo: z.enum(["masculino", "feminino", "neutro"]).optional().nullable(),
  numero_gestacoes: z.number().int().min(0).max(30).optional().nullable(),
  numero_partos: z.number().int().min(0).max(30).optional().nullable(),
  numero_abortos: z.number().int().min(0).max(30).optional().nullable(),
});

export const updateMeuPerfil = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => PerfilSchema.parse(i))
  .handler(async ({ data, context }) => {
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      payload[k] = v === "" ? null : v;
    }
    payload.updated_at = new Date().toISOString();

    const { data: existing } = await supabaseAdmin
      .from("profiles").select("id").eq("user_id", context.userId).maybeSingle();

    if (existing) {
      const { error } = await supabaseAdmin
        .from("profiles").update(payload).eq("user_id", context.userId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("profiles").insert({ ...payload, user_id: context.userId });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
