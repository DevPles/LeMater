import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePais, type Pais } from "@/lib/translate.context";

export type ContentItemType = "curso_aula" | "material" | "atlas_card" | "audio" | "curso";

export type ContentTranslation = {
  id: string;
  item_type: ContentItemType;
  item_id: string;
  pais: Pais;
  titulo: string | null;
  descricao: string | null;
  video_url: string | null;
  pdf_url: string | null;
  capa_url: string | null;
  audio_url: string | null;
  legenda_url: string | null;
  conteudo_html: string | null;
};

/**
 * Busca a tradução de um item no país atual.
 * Retorna { translation, isFallback, loading }.
 * `isFallback = true` quando o país é diferente de BR e não há tradução salva.
 */
export function useTranslatedContent(itemType: ContentItemType, itemId: string | null | undefined) {
  const pais = usePais();
  const [translation, setTranslation] = useState<ContentTranslation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancel = false;
    if (!itemId || pais === "BR") {
      setTranslation(null);
      return;
    }
    setLoading(true);
    supabase
      .from("content_translations")
      .select("*")
      .eq("item_type", itemType)
      .eq("item_id", itemId)
      .eq("pais", pais)
      .maybeSingle()
      .then(({ data }) => {
        if (cancel) return;
        setTranslation((data as ContentTranslation | null) ?? null);
        setLoading(false);
      });
    return () => { cancel = true; };
  }, [itemType, itemId, pais]);

  const isFallback = pais !== "BR" && !translation;
  return { translation, isFallback, pais, loading };
}

/** Aplica a tradução sobre um objeto, mantendo o PT como fallback. */
export function applyTranslation<T extends Record<string, any>>(base: T, t: ContentTranslation | null): T {
  if (!t) return base;
  const out: any = { ...base };
  for (const k of ["titulo","descricao","video_url","pdf_url","capa_url","audio_url","legenda_url","conteudo_html"] as const) {
    if (t[k]) out[k] = t[k];
  }
  return out;
}

/** Busca traduções em lote para uma lista. */
export function useTranslatedList(itemType: ContentItemType, itemIds: string[]) {
  const pais = usePais();
  const [byId, setById] = useState<Record<string, ContentTranslation>>({});
  const key = itemIds.join(",");

  useEffect(() => {
    let cancel = false;
    if (pais === "BR" || itemIds.length === 0) { setById({}); return; }
    supabase
      .from("content_translations")
      .select("*")
      .eq("item_type", itemType)
      .eq("pais", pais)
      .in("item_id", itemIds)
      .then(({ data }) => {
        if (cancel) return;
        const map: Record<string, ContentTranslation> = {};
        (data as ContentTranslation[] | null)?.forEach((t) => { map[t.item_id] = t; });
        setById(map);
      });
    return () => { cancel = true; };
  }, [itemType, key, pais]);

  return { byId, pais };
}
