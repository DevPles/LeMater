import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type MaterialAccess =
  | { kind: "pdf"; url: string }
  | { kind: "video_upload"; url: string }
  | { kind: "video_externo"; embedUrl: string; rawUrl: string }
  | { kind: "artigo"; html: string }
  | { kind: "externo"; url: string };

export type VitrineMaterial = {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria: string;
  tipo: "pdf" | "video_externo" | "video_upload" | "artigo";
  area: "gratis" | "pago";
  acesso: "publico" | "restrito";
  capa_url: string | null;
  link_compra: string | null;
  plataforma_venda: string | null;
  preco_label: string | null;
  cta_label: string | null;
  ordem: number;
  created_at: string;
  pode_consumir: boolean;
  precisa_lead: boolean;
  vende_externo: boolean;
};

function toEmbed(url: string): string {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
}

async function isAdmin(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

async function hasPaidAccess(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const { data } = await supabaseAdmin
    .from("app_acesso_pago")
    .select("ativo")
    .eq("user_id", userId)
    .maybeSingle();
  return !!data?.ativo;
}

async function liberadoIds(userId: string | null): Promise<Set<string>> {
  if (!userId) return new Set();
  const { data } = await supabaseAdmin
    .from("material_acessos")
    .select("material_id")
    .eq("user_id", userId);
  return new Set((data ?? []).map((r) => r.material_id));
}

async function getUserIdFromAuthHeader(): Promise<string | null> {
  try {
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const auth = getRequestHeader("Authorization") || getRequestHeader("authorization");
    if (!auth?.startsWith("Bearer ")) return null;
    const token = auth.slice(7);
    const { data } = await supabaseAdmin.auth.getUser(token);
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Listagem pública. Retorna materiais visíveis ao caller (anônimo ou logado).
 */
export const listMateriaisVitrine = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await getUserIdFromAuthHeader();
  const admin = await isAdmin(userId);
  const paid = await hasPaidAccess(userId);
  const liberados = await liberadoIds(userId);

  const { data, error } = await supabaseAdmin
    .from("materiais")
    .select(
      "id, titulo, descricao, categoria, tipo, area, acesso, capa_url, link_compra, plataforma_venda, preco_label, cta_label, ordem, created_at, publicado",
    )
    .eq("publicado", true)
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const items: VitrineMaterial[] = [];
  for (const m of data ?? []) {
    const liberadoManual = liberados.has(m.id);
    let visivel = false;
    let podeConsumir = false;

    if (admin) {
      visivel = true;
      podeConsumir = true;
    } else if (m.acesso === "restrito") {
      visivel = liberadoManual;
      podeConsumir = liberadoManual;
    } else {
      // publico
      if (m.area === "gratis") {
        visivel = true;
        podeConsumir = true;
      } else {
        // pago
        if (m.link_compra) visivel = true;
        if (paid || liberadoManual) {
          visivel = true;
          podeConsumir = true;
        }
      }
    }

    if (!visivel) continue;

    items.push({
      id: m.id,
      titulo: m.titulo,
      descricao: m.descricao,
      categoria: m.categoria,
      tipo: m.tipo as VitrineMaterial["tipo"],
      area: m.area as VitrineMaterial["area"],
      acesso: m.acesso as VitrineMaterial["acesso"],
      capa_url: m.capa_url,
      link_compra: m.link_compra,
      plataforma_venda: m.plataforma_venda,
      preco_label: m.preco_label,
      cta_label: m.cta_label,
      ordem: m.ordem,
      created_at: m.created_at,
      pode_consumir: podeConsumir,
      precisa_lead: !podeConsumir && m.area === "gratis" && m.acesso === "publico",
      vende_externo: !podeConsumir && !!m.link_compra,
    });
  }
  return items;
});

const LeadSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  telefone: z.string().trim().min(8).max(30),
});

/**
 * Entrega pública para materiais grátis. Grava lead e retorna o conteúdo.
 */
export const getMaterialGratisAccess = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      material_id: z.string().uuid(),
      lead: LeadSchema,
    }).parse(input),
  )
  .handler(async ({ data }): Promise<MaterialAccess> => {
    const { data: m, error } = await supabaseAdmin
      .from("materiais")
      .select("id, tipo, area, acesso, publicado, conteudo_url, conteudo_html, link_compra")
      .eq("id", data.material_id)
      .single();
    if (error || !m) throw new Error("Material não encontrado");
    if (!m.publicado || m.area !== "gratis" || m.acesso !== "publico") {
      throw new Error("Material indisponível");
    }

    await supabaseAdmin.from("leads_gratis").insert({
      material_id: m.id,
      nome: data.lead.nome,
      email: data.lead.email.toLowerCase(),
      telefone: data.lead.telefone.replace(/\s+/g, " "),
    });

    return await buildAccess(m);
  });

/**
 * Entrega autenticada (área de membros / restrito / pago interno).
 */
export const getMaterialAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ material_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }): Promise<MaterialAccess> => {
    const { data: ok } = await supabaseAdmin.rpc("pode_ver_material", {
      _user: context.userId,
      _mat: data.material_id,
    });
    if (!ok) throw new Error("Sem permissão para acessar este material");

    const { data: m, error } = await supabaseAdmin
      .from("materiais")
      .select("id, tipo, area, acesso, publicado, conteudo_url, conteudo_html, link_compra")
      .eq("id", data.material_id)
      .single();
    if (error || !m) throw new Error("Material não encontrado");

    // Se usuário não tem consumo interno mas há link de compra, devolve externo
    const admin = await isAdmin(context.userId);
    const paid = await hasPaidAccess(context.userId);
    const { data: lib } = await supabaseAdmin
      .from("material_acessos")
      .select("user_id")
      .eq("material_id", m.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    const podeConsumir =
      admin ||
      m.area === "gratis" ||
      (m.area === "pago" && paid) ||
      !!lib;

    if (!podeConsumir && m.link_compra) {
      return { kind: "externo", url: m.link_compra };
    }
    return await buildAccess(m);
  });

async function buildAccess(m: {
  tipo: string;
  conteudo_url: string | null;
  conteudo_html: string | null;
}): Promise<MaterialAccess> {
  if (m.tipo === "artigo") {
    const html = DOMPurify.sanitize(m.conteudo_html ?? "", {
      ALLOWED_TAGS: [
        "h1", "h2", "h3", "h4", "p", "br", "strong", "em", "u", "s", "ul", "ol", "li",
        "a", "blockquote", "img", "figure", "figcaption", "hr", "code", "pre", "table",
        "thead", "tbody", "tr", "th", "td", "span", "div",
      ],
      ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel", "style", "class"],
    });
    return { kind: "artigo", html };
  }
  if (!m.conteudo_url) throw new Error("Material sem conteúdo");

  if (m.tipo === "video_externo") {
    return { kind: "video_externo", embedUrl: toEmbed(m.conteudo_url), rawUrl: m.conteudo_url };
  }
  const bucket = m.tipo === "pdf" ? "materiais-pdf" : "materiais-video";
  const { data: signed, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(m.conteudo_url, m.tipo === "pdf" ? 60 * 60 : 60 * 120);
  if (error) throw new Error(error.message);
  if (m.tipo === "pdf") return { kind: "pdf", url: signed.signedUrl };
  return { kind: "video_upload", url: signed.signedUrl };
}
