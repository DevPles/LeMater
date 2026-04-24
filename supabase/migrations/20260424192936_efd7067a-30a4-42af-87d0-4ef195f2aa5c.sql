CREATE OR REPLACE FUNCTION public.resolve_login_email_by_cpf(_cpf text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.email
  FROM public.profiles p
  WHERE p.cpf = NULLIF(regexp_replace(COALESCE(_cpf, ''), '\\D', '', 'g'), '')
    AND p.email IS NOT NULL
  LIMIT 1
$$;