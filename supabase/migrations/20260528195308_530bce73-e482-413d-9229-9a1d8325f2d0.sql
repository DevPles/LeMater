ALTER TABLE public.curso_aulas
ADD COLUMN IF NOT EXISTS beneficios text[] NOT NULL DEFAULT ARRAY[]::text[];