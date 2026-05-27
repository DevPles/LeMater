
-- 1) Expandir lista de países aceitos em product_offers
ALTER TABLE public.product_offers DROP CONSTRAINT IF EXISTS product_offers_pais_check;
ALTER TABLE public.product_offers
  ADD CONSTRAINT product_offers_pais_check
  CHECK (pais IN ('BR','ES','US','PT','EU','OUTROS','ALL'));

-- 2) Função pública para listar ofertas (somente campos seguros)
CREATE OR REPLACE FUNCTION public.get_public_offers(_tipo text, _id uuid, _pais text DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  pais text,
  plataforma text,
  tipo_link text,
  url_externo text,
  preco_centavos integer,
  moeda text,
  label text,
  ordem integer
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT o.id, o.pais, o.plataforma, o.tipo_link, o.url_externo,
         o.preco_centavos, o.moeda, o.label, o.ordem
  FROM public.product_offers o
  WHERE o.produto_tipo = _tipo
    AND o.produto_id = _id
    AND o.ativo = true
    AND (_pais IS NULL OR o.pais = _pais OR o.pais = 'ALL')
  ORDER BY o.ordem ASC, o.preco_centavos ASC;
$$;
GRANT EXECUTE ON FUNCTION public.get_public_offers(text, uuid, text) TO anon, authenticated;

-- 3) Tabela de áudios vinculados (Spotify, podcasts, meditações, etc.)
CREATE TABLE IF NOT EXISTS public.course_audios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vinculo_tipo text NOT NULL CHECK (vinculo_tipo IN ('curso','modulo','aula','servico','pacote')),
  vinculo_id uuid NOT NULL,
  titulo text NOT NULL,
  descricao text,
  capa_url text,
  spotify_url text,
  audio_url text,
  tipo_audio text NOT NULL DEFAULT 'podcast'
    CHECK (tipo_audio IN ('podcast','meditacao','aula_audio','explicacao','exercicio','relaxamento','bonus')),
  duracao_seg integer NOT NULL DEFAULT 0,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  gratuito boolean NOT NULL DEFAULT false,
  liberacao text NOT NULL DEFAULT 'com_compra'
    CHECK (liberacao IN ('com_compra','apos_aula','bonus','sempre')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_audios_vinculo
  ON public.course_audios(vinculo_tipo, vinculo_id);

GRANT SELECT ON public.course_audios TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_audios TO authenticated;
GRANT ALL ON public.course_audios TO service_role;

ALTER TABLE public.course_audios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publico le audios ativos"
  ON public.course_audios FOR SELECT TO anon, authenticated
  USING (ativo = true OR has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Admin cria audios"
  ON public.course_audios FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Admin edita audios"
  ON public.course_audios FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Admin remove audios"
  ON public.course_audios FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_course_audios_touch BEFORE UPDATE ON public.course_audios
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4) Campos extras de apresentação multimídia em cursos
ALTER TABLE public.cursos
  ADD COLUMN IF NOT EXISTS subtitulo text,
  ADD COLUMN IF NOT EXISTS titulo_comercial text,
  ADD COLUMN IF NOT EXISTS audio_apresentacao_url text,
  ADD COLUMN IF NOT EXISTS thumbnail_url text;
