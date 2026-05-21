CREATE OR REPLACE FUNCTION public.get_evaluation_request_public(_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_req public.evaluation_requests%ROWTYPE;
  v_profile jsonb;
  v_medicoes jsonb;
  v_vacinas jsonb;
  v_exames jsonb;
  v_image_exames jsonb;
  v_alertas jsonb;
BEGIN
  SELECT * INTO v_req FROM public.evaluation_requests WHERE token = _token;
  IF v_req.id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'nome', p.nome,
    'data_nascimento', p.data_nascimento,
    'dum', p.dum,
    'bebe_sexo', p.bebe_sexo,
    'cidade', p.cidade,
    'bairro', p.bairro,
    'unidade_saude', p.unidade_saude,
    'numero_gestacoes', p.numero_gestacoes,
    'numero_partos', p.numero_partos,
    'numero_abortos', p.numero_abortos,
    'partos_classificacao', p.partos_classificacao
  ) INTO v_profile
  FROM public.profiles p WHERE p.user_id = v_req.gestante_id;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'parametro', m.parametro, 'valor', m.valor,
    'semana_gestacional', m.semana_gestacional, 'data_medicao', m.data_medicao
  ) ORDER BY m.data_medicao DESC), '[]'::jsonb)
  INTO v_medicoes FROM public.clinical_measurements m WHERE m.gestante_id = v_req.gestante_id;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'vacina', v.vacina, 'data_aplicacao', v.data_aplicacao,
    'lote', v.lote, 'fabricante', v.fabricante
  ) ORDER BY v.data_aplicacao DESC), '[]'::jsonb)
  INTO v_vacinas FROM public.vaccinations v WHERE v.gestante_id = v_req.gestante_id;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'tipo_exame', e.tipo_exame, 'resultado', e.resultado,
    'status', e.status, 'data_exame', e.data_exame
  ) ORDER BY e.data_exame DESC), '[]'::jsonb)
  INTO v_exames FROM public.exam_results e WHERE e.gestante_id = v_req.gestante_id;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'tipo_exame', i.tipo_exame, 'laudo_texto', i.laudo_texto,
    'status', i.status, 'data_exame', i.data_exame
  ) ORDER BY i.data_exame DESC), '[]'::jsonb)
  INTO v_image_exames FROM public.image_exam_results i WHERE i.gestante_id = v_req.gestante_id;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id,
    'origem', a.origem,
    'severidade', a.severidade,
    'titulo', a.titulo,
    'mensagem', a.mensagem,
    'data', a.data
  ) ORDER BY a.data DESC NULLS LAST), '[]'::jsonb)
  INTO v_alertas
  FROM public.get_active_alerts(v_req.gestante_id) a;

  RETURN jsonb_build_object(
    'especialidade', v_req.especialidade,
    'status', v_req.status,
    'expira_em', v_req.expira_em,
    'gestante_nome', coalesce(v_profile->>'nome', 'Gestante'),
    'cartao', jsonb_build_object(
      'profile', v_profile,
      'medicoes', v_medicoes,
      'vacinas', v_vacinas,
      'exames', v_exames,
      'imagens', v_image_exames,
      'alertas', v_alertas
    )
  );
END;
$function$;