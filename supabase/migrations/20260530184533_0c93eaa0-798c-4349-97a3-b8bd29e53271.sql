CREATE TABLE public.content_translations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_type text NOT NULL CHECK (item_type IN ('curso_aula','material','atlas_card','audio','curso')),
  item_id uuid NOT NULL,
  pais text NOT NULL CHECK (pais IN ('BR','ES','US')),
  titulo text,
  descricao text,
  video_url text,
  pdf_url text,
  capa_url text,
  audio_url text,
  legenda_url text,
  conteudo_html text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (item_type, item_id, pais)
);

CREATE INDEX idx_content_translations_lookup
  ON public.content_translations (item_type, item_id, pais);

GRANT SELECT ON public.content_translations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_translations TO authenticated;
GRANT ALL ON public.content_translations TO service_role;

ALTER TABLE public.content_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publico le traducoes"
  ON public.content_translations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin cria traducoes"
  ON public.content_translations FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin edita traducoes"
  ON public.content_translations FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin remove traducoes"
  ON public.content_translations FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.set_content_translations_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_content_translations_updated_at
  BEFORE UPDATE ON public.content_translations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_content_translations_updated_at();