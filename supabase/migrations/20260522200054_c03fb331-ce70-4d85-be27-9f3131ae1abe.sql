CREATE OR REPLACE FUNCTION public.submit_evaluation_response(
  _token uuid,
  _nome text,
  _registro_tipo text,
  _registro_numero text,
  _registro_uf text,
  _respostas jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_req public.evaluation_requests%ROWTYPE;
  v_resp_id uuid;
  v_dum date;
  v_semana integer;
  v_pares text[][] := ARRAY[
    ['pa_sistolica', 'pa_sistolica'],
    ['pa_diastolica', 'pa_diastolica'],
    ['frequencia_cardiaca', 'frequencia_cardiaca'],
    ['frequencia_respiratoria', 'frequencia_respiratoria'],
    ['temperatura', 'temperatura'],
    ['saturacao_o2', 'saturacao_o2'],
    ['peso_kg', 'peso'],
    ['peso_atual_kg', 'peso'],
    ['altura_uterina_cm', 'altura_uterina'],
    ['bcf', 'bcf'],
    ['circunferencia_braco', 'circunferencia_braco'],
    ['necessidades_caloricas', 'necessidades_caloricas']
  ];
  v_par text[];
  v_raw text;
  v_num numeric;
BEGIN
  SELECT * INTO v_req FROM public.evaluation_requests WHERE token = _token;
  IF v_req.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Link inválido');
  END IF;
  IF v_req.status = 'respondida' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Esta avaliação já foi preenchida');
  END IF;
  IF v_req.expira_em < now() THEN
    UPDATE public.evaluation_requests SET status = 'expirada' WHERE id = v_req.id;
    RETURN jsonb_build_object('success', false, 'message', 'Link expirado');
  END IF;
  IF _registro_tipo NOT IN ('CRM','CRN','CRP') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Tipo de registro inválido');
  END IF;
  IF length(coalesce(trim(_nome),'')) < 3
     OR length(coalesce(trim(_registro_numero),'')) < 3
     OR length(coalesce(trim(_registro_uf),'')) <> 2 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Dados do profissional incompletos');
  END IF;

  INSERT INTO public.evaluation_responses (
    request_id, professional_nome, professional_registro_tipo,
    professional_registro_numero, professional_registro_uf, respostas
  ) VALUES (
    v_req.id, trim(_nome), _registro_tipo,
    trim(_registro_numero), upper(trim(_registro_uf)), coalesce(_respostas, '{}'::jsonb)
  ) RETURNING id INTO v_resp_id;

  UPDATE public.evaluation_requests SET status = 'respondida' WHERE id = v_req.id;

  -- Semana gestacional a partir da DUM da gestante (se houver)
  SELECT dum INTO v_dum FROM public.profiles WHERE id = v_req.gestante_id;
  IF v_dum IS NOT NULL THEN
    v_semana := GREATEST(0, LEAST(42, floor((CURRENT_DATE - v_dum) / 7.0)::int));
  END IF;

  -- Insere as medições numéricas no cartão da gestante
  FOREACH v_par SLICE 1 IN ARRAY v_pares LOOP
    v_raw := NULLIF(trim(coalesce(_respostas ->> v_par[1], '')), '');
    IF v_raw IS NULL THEN CONTINUE; END IF;
    BEGIN
      v_num := replace(v_raw, ',', '.')::numeric;
    EXCEPTION WHEN others THEN
      v_num := NULL;
    END;
    IF v_num IS NULL THEN CONTINUE; END IF;
    INSERT INTO public.clinical_measurements (
      gestante_id, parametro, valor, semana_gestacional, data_medicao, observacao, appointment_id
    ) VALUES (
      v_req.gestante_id,
      v_par[2],
      v_num,
      v_semana,
      CURRENT_DATE,
      'Consulta ' || v_req.especialidade || ' — ' || trim(_nome)
        || ' (' || _registro_tipo || ' ' || trim(_registro_numero) || '/' || upper(trim(_registro_uf)) || ')',
      v_req.appointment_id
    );
  END LOOP;

  RETURN jsonb_build_object('success', true, 'response_id', v_resp_id);
END;
$function$;