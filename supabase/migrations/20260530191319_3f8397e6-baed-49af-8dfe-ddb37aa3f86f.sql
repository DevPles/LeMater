ALTER TABLE public.content_translations
  ADD COLUMN IF NOT EXISTS preco_centavos integer,
  ADD COLUMN IF NOT EXISTS moeda text,
  ADD COLUMN IF NOT EXISTS preco_label text;