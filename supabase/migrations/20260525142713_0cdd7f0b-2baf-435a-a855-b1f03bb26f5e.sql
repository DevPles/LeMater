ALTER TABLE public.curso_aulas
  ADD COLUMN IF NOT EXISTS preco_centavos integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS preco_label text,
  ADD COLUMN IF NOT EXISTS links_compra jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS link_compra_externo text,
  ADD COLUMN IF NOT EXISTS plataforma_venda text;