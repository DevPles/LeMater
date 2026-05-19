ALTER TABLE public.cursos
ADD COLUMN IF NOT EXISTS links_compra jsonb NOT NULL DEFAULT '[]'::jsonb;