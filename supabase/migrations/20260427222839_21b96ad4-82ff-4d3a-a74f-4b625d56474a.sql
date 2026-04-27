
-- Categorias
CREATE TABLE public.reel_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  nome text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reel_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categorias publicas" ON public.reel_categories
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin gerencia categorias - insert" ON public.reel_categories
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admin gerencia categorias - update" ON public.reel_categories
  FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admin gerencia categorias - delete" ON public.reel_categories
  FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));

INSERT INTO public.reel_categories (slug, nome, ordem) VALUES
  ('nutricao','Nutrição',1),
  ('parto','Parto',2),
  ('amamentacao','Amamentação',3),
  ('pre-natal','Pré-natal',4),
  ('saude-mental','Saúde Mental',5),
  ('exercicios','Exercícios',6),
  ('cuidados-bebe','Cuidados com o Bebê',7),
  ('geral','Geral',8);

-- Reels
CREATE TABLE public.reels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autor_id uuid NOT NULL,
  titulo text NOT NULL,
  descricao text,
  categoria_slug text REFERENCES public.reel_categories(slug) ON DELETE SET NULL,
  video_url text NOT NULL,
  video_path text,
  thumbnail_url text,
  duracao_seg integer,
  visualizacoes integer NOT NULL DEFAULT 0,
  publicado boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reels_created_at ON public.reels (created_at DESC);
CREATE INDEX idx_reels_categoria ON public.reels (categoria_slug);
CREATE INDEX idx_reels_autor ON public.reels (autor_id);

ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer um vê reels publicados" ON public.reels
  FOR SELECT TO anon, authenticated
  USING (publicado = true OR auth.uid() = autor_id OR has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Autenticados publicam reels" ON public.reels
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = autor_id);

CREATE POLICY "Autor edita proprio reel" ON public.reels
  FOR UPDATE TO authenticated
  USING (auth.uid() = autor_id OR has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Autor remove proprio reel" ON public.reels
  FOR DELETE TO authenticated
  USING (auth.uid() = autor_id OR has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER reels_updated_at BEFORE UPDATE ON public.reels
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Likes
CREATE TABLE public.reel_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reel_id uuid NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reel_id, user_id)
);

CREATE INDEX idx_reel_likes_reel ON public.reel_likes (reel_id);

ALTER TABLE public.reel_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes visiveis a todos" ON public.reel_likes
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Autenticado curte" ON public.reel_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuario remove proprio like" ON public.reel_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Comentarios
CREATE TABLE public.reel_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reel_id uuid NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  conteudo text NOT NULL CHECK (length(conteudo) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reel_comments_reel ON public.reel_comments (reel_id, created_at DESC);

ALTER TABLE public.reel_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comentarios visiveis a todos" ON public.reel_comments
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Autenticado comenta" ON public.reel_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Autor edita comentario" ON public.reel_comments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Autor remove comentario" ON public.reel_comments
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER reel_comments_updated_at BEFORE UPDATE ON public.reel_comments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Storage bucket publico para reels
INSERT INTO storage.buckets (id, name, public) VALUES ('reels','reels', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Reels publicos leitura" ON storage.objects
  FOR SELECT USING (bucket_id = 'reels');

CREATE POLICY "Autenticados sobem reels" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'reels' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Autor atualiza proprio video" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'reels' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Autor remove proprio video" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'reels' AND auth.uid()::text = (storage.foldername(name))[1]);

-- View enriquecida com contagens e dados do autor
CREATE OR REPLACE VIEW public.reels_feed AS
SELECT
  r.*,
  p.nome AS autor_nome,
  p.foto_url AS autor_foto,
  COALESCE((SELECT count(*) FROM reel_likes l WHERE l.reel_id = r.id), 0) AS total_likes,
  COALESCE((SELECT count(*) FROM reel_comments c WHERE c.reel_id = r.id), 0) AS total_comentarios
FROM public.reels r
LEFT JOIN public.profiles p ON p.user_id = r.autor_id;
