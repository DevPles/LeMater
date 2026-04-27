ALTER TABLE public.vaccinations
ADD COLUMN IF NOT EXISTS lote text,
ADD COLUMN IF NOT EXISTS fabricante text;

CREATE OR REPLACE FUNCTION public.get_cartao_publico(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile jsonb;
  v_medicoes jsonb;
  v_vacinas jsonb;
  v_exames jsonb;
BEGIN
  SELECT to_jsonb(p) - 'cpf' INTO v_profile
  FROM public.profiles p
  WHERE p.user_id = _user_id
  LIMIT 1;

  IF v_profile IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT coalesce(jsonb_agg(to_jsonb(m) ORDER BY m.data_medicao), '[]'::jsonb) INTO v_medicoes
  FROM public.clinical_measurements m
  WHERE m.gestante_id = _user_id;

  SELECT coalesce(jsonb_agg(to_jsonb(v) ORDER BY v.data_aplicacao DESC), '[]'::jsonb) INTO v_vacinas
  FROM public.vaccinations v
  WHERE v.gestante_id = _user_id;

  SELECT coalesce(jsonb_agg(to_jsonb(e) ORDER BY e.data_exame DESC), '[]'::jsonb) INTO v_exames
  FROM public.exam_results e
  WHERE e.gestante_id = _user_id;

  RETURN jsonb_build_object(
    'profile', v_profile,
    'medicoes', v_medicoes,
    'vacinas', v_vacinas,
    'exames', v_exames
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_cartao_publico(uuid) TO anon, authenticated;