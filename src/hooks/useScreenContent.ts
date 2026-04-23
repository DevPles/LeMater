import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook que carrega o conteúdo editável de uma tela do app a partir
 * da tabela `app_content`. Se não houver registro salvo no banco,
 * retorna o `defaultContent` informado, garantindo que a tela continue
 * funcionando normalmente.
 */
export function useScreenContent<T>(screenKey: string, defaultContent: T) {
  const [content, setContent] = useState<T>(defaultContent);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("app_content")
        .select("content")
        .eq("screen_key", screenKey)
        .maybeSingle();

      if (!active) return;
      if (!error && data?.content) {
        setContent({ ...defaultContent, ...(data.content as object) } as T);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenKey]);

  return { content, loading };
}

export async function saveScreenContent(screenKey: string, content: unknown) {
  const { error } = await supabase
    .from("app_content")
    .upsert(
      [{ screen_key: screenKey, content: content as object }],
      { onConflict: "screen_key" },
    );
  if (error) throw error;
}

export async function loadScreenContentOnce<T>(
  screenKey: string,
  defaultContent: T,
): Promise<T> {
  const { data } = await supabase
    .from("app_content")
    .select("content")
    .eq("screen_key", screenKey)
    .maybeSingle();
  if (data?.content) return { ...defaultContent, ...(data.content as object) } as T;
  return defaultContent;
}
