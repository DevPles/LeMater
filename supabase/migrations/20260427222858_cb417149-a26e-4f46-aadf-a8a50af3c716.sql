
DROP VIEW IF EXISTS public.reels_feed;

CREATE VIEW public.reels_feed
WITH (security_invoker = true) AS
SELECT
  r.*,
  p.nome AS autor_nome,
  p.foto_url AS autor_foto,
  COALESCE((SELECT count(*) FROM public.reel_likes l WHERE l.reel_id = r.id), 0) AS total_likes,
  COALESCE((SELECT count(*) FROM public.reel_comments c WHERE c.reel_id = r.id), 0) AS total_comentarios
FROM public.reels r
LEFT JOIN public.profiles p ON p.user_id = r.autor_id;
