
CREATE OR REPLACE FUNCTION public.get_all_active_alerts()
RETURNS TABLE(
  gestante_id uuid,
  id text,
  origem text,
  severidade text,
  titulo text,
  mensagem text,
  data date
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT p.user_id AS gestante_id, a.id, a.origem, a.severidade, a.titulo, a.mensagem, a.data
  FROM public.profiles p
  CROSS JOIN LATERAL public.get_active_alerts(p.user_id) a;
END;
$$;
