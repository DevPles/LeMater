-- Função para resolver e-mail de login a partir do número do conselho de classe
-- (CRM, COREN, CRO, CRF, CRP, etc). Aceita o número puro (ex: "123456")
-- ou com prefixo/UF (ex: "CRM-SP 123456", "COREN/SP 654321").
--
-- Estratégia:
--   1. Normaliza input removendo tudo que não é alfanumérico e fazendo upper-case.
--   2. Tenta match exato com o registro normalizado em professionals.
--   3. Se não achar, tenta match apenas pela parte numérica (digit-only),
--      desde que haja exatamente 1 profissional com aquele número.
--   4. Devolve o e-mail do profile correspondente (precisa estar ativo).

CREATE OR REPLACE FUNCTION public.resolve_login_email_by_registro(_registro text)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _input_norm text;
  _input_digits text;
  _email text;
  _matches int;
BEGIN
  IF _registro IS NULL OR length(trim(_registro)) = 0 THEN
    RETURN NULL;
  END IF;

  _input_norm := upper(regexp_replace(_registro, '[^A-Za-z0-9]', '', 'g'));
  _input_digits := regexp_replace(_registro, '\D', '', 'g');

  IF length(_input_norm) = 0 THEN
    RETURN NULL;
  END IF;

  -- 1. Match exato pelo registro normalizado
  SELECT pr.email
    INTO _email
  FROM public.professionals pf
  JOIN public.profiles pr ON pr.user_id = pf.user_id
  WHERE pf.ativo = true
    AND pf.registro IS NOT NULL
    AND upper(regexp_replace(pf.registro, '[^A-Za-z0-9]', '', 'g')) = _input_norm
    AND pr.email IS NOT NULL
  LIMIT 1;

  IF _email IS NOT NULL THEN
    RETURN _email;
  END IF;

  -- 2. Match somente pela parte numérica, se for único
  IF length(_input_digits) >= 4 THEN
    SELECT count(*)
      INTO _matches
    FROM public.professionals pf
    JOIN public.profiles pr ON pr.user_id = pf.user_id
    WHERE pf.ativo = true
      AND pf.registro IS NOT NULL
      AND regexp_replace(pf.registro, '\D', '', 'g') = _input_digits
      AND pr.email IS NOT NULL;

    IF _matches = 1 THEN
      SELECT pr.email
        INTO _email
      FROM public.professionals pf
      JOIN public.profiles pr ON pr.user_id = pf.user_id
      WHERE pf.ativo = true
        AND pf.registro IS NOT NULL
        AND regexp_replace(pf.registro, '\D', '', 'g') = _input_digits
        AND pr.email IS NOT NULL
      LIMIT 1;

      RETURN _email;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;