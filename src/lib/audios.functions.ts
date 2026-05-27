import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("forbidden");
}

const vinculoEnum = z.enum(["curso", "modulo", "aula", "servico", "pacote"]);
const tipoEnum = z.enum([
  "podcast",
  "meditacao",
  "aula_audio",
  "explicacao",
  "exercicio",
  "relaxamento",
  "bonus",
]);
const liberacaoEnum = z.enum(["com_compra", "apos_aula", "bonus", "sempre"]);

const audioSchema = z.object({
  id: z.string().uuid().optional(),
  vinculo_tipo: vinculoEnum,
  vinculo_id: z.string().uuid(),
  titulo: z.string().min(1).max(200),
  descricao: z.string().max(2000).nullable().optional(),
  capa_url: z.string().max(1000).nullable().optional(),
  spotify_url: z.string().max(1000).nullable().optional(),
  audio_url: z.string().max(1000).nullable().optional(),
  tipo_audio: tipoEnum.default("podcast"),
  duracao_seg: z.number().int().min(0).default(0),
  ordem: z.number().int().min(0).default(0),
  ativo: z.boolean().default(true),
  gratuito: z.boolean().default(false),
  liberacao: liberacaoEnum.default("com_compra"),
});

export const listAudiosByVinculo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ vinculo_tipo: vinculoEnum, vinculo_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { data: audios, error } = await supabaseAdmin
      .from("course_audios")
      .select("*")
      .eq("vinculo_tipo", data.vinculo_tipo)
      .eq("vinculo_id", data.vinculo_id)
      .order("ordem", { ascending: true });
    if (error) throw new Error(error.message);
    return { audios: audios ?? [] };
  });

export const saveAudio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => audioSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const row = {
      vinculo_tipo: data.vinculo_tipo,
      vinculo_id: data.vinculo_id,
      titulo: data.titulo.trim(),
      descricao: data.descricao ?? null,
      capa_url: data.capa_url ?? null,
      spotify_url: data.spotify_url ?? null,
      audio_url: data.audio_url ?? null,
      tipo_audio: data.tipo_audio,
      duracao_seg: data.duracao_seg,
      ordem: data.ordem,
      ativo: data.ativo,
      gratuito: data.gratuito,
      liberacao: data.liberacao,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("course_audios").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: ins, error } = await supabaseAdmin
      .from("course_audios")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: ins.id };
  });

export const deleteAudio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("course_audios").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Público: lista áudios ativos de um vínculo (curso, módulo, aula, etc). */
export const getPublicAudios = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ vinculo_tipo: vinculoEnum, vinculo_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { data: audios, error } = await supabaseAdmin
      .from("course_audios")
      .select("id, titulo, descricao, capa_url, spotify_url, audio_url, tipo_audio, duracao_seg, ordem, gratuito, liberacao")
      .eq("vinculo_tipo", data.vinculo_tipo)
      .eq("vinculo_id", data.vinculo_id)
      .eq("ativo", true)
      .order("ordem", { ascending: true });
    if (error) throw new Error(error.message);
    return { audios: audios ?? [] };
  });
