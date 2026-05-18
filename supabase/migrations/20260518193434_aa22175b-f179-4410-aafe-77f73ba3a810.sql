CREATE TABLE public.atlas_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text,
  imagem_url text,
  video_url text,
  link text,
  categoria text,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.atlas_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publico le cards ativos"
  ON public.atlas_cards FOR SELECT
  TO anon, authenticated
  USING (ativo = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin cria cards"
  ON public.atlas_cards FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin edita cards"
  ON public.atlas_cards FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin remove cards"
  ON public.atlas_cards FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER touch_atlas_cards_updated_at
  BEFORE UPDATE ON public.atlas_cards
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_atlas_cards_categoria_ordem ON public.atlas_cards(categoria, ordem);