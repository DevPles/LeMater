
ALTER TABLE public.curso_aulas
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS capa_url text,
  ADD COLUMN IF NOT EXISTS capa_video_url text,
  ADD COLUMN IF NOT EXISTS publicado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gratis boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS moeda text NOT NULL DEFAULT 'BRL';

UPDATE public.curso_aulas
SET slug = lower(
  regexp_replace(
    regexp_replace(coalesce(titulo, id::text), '[^a-zA-Z0-9]+', '-', 'g'),
    '(^-+|-+$)', '', 'g'
  )
) || '-' || substr(id::text, 1, 6)
WHERE slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS curso_aulas_slug_uidx ON public.curso_aulas (slug);

CREATE TABLE IF NOT EXISTS public.aula_temas (
  aula_id uuid NOT NULL REFERENCES public.curso_aulas(id) ON DELETE CASCADE,
  tema_id uuid NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (aula_id, tema_id)
);

CREATE INDEX IF NOT EXISTS aula_temas_tema_idx ON public.aula_temas (tema_id, ordem);

GRANT SELECT ON public.aula_temas TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.aula_temas TO authenticated;
GRANT ALL ON public.aula_temas TO service_role;

ALTER TABLE public.aula_temas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publico le vinculos aula-tema"
  ON public.aula_temas FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin cria vinculos aula-tema"
  ON public.aula_temas FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin edita vinculos aula-tema"
  ON public.aula_temas FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin remove vinculos aula-tema"
  ON public.aula_temas FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.aula_temas (aula_id, tema_id, ordem)
SELECT a.id, m.curso_id, a.ordem
FROM public.curso_aulas a
JOIN public.curso_modulos m ON m.id = a.modulo_id
ON CONFLICT DO NOTHING;
