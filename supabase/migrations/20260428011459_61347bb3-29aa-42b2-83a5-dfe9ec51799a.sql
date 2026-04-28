
CREATE TABLE public.dismissed_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gestante_id uuid NOT NULL,
  alert_id text NOT NULL,
  dismissed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gestante_id, alert_id)
);

ALTER TABLE public.dismissed_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gestante vê seus alertas dispensados"
  ON public.dismissed_alerts FOR SELECT
  TO authenticated
  USING (gestante_id = auth.uid());

CREATE POLICY "Gestante insere seus alertas dispensados"
  ON public.dismissed_alerts FOR INSERT
  TO authenticated
  WITH CHECK (gestante_id = auth.uid());

CREATE POLICY "Gestante remove seus alertas dispensados"
  ON public.dismissed_alerts FOR DELETE
  TO authenticated
  USING (gestante_id = auth.uid());

CREATE INDEX idx_dismissed_alerts_gestante ON public.dismissed_alerts(gestante_id);

-- Atualiza get_active_alerts para excluir dispensados
CREATE OR REPLACE FUNCTION public.get_active_alerts(_gestante_id uuid)
 RETURNS TABLE(id text, origem text, severidade text, titulo text, mensagem text, data date)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH med_norm AS (
    SELECT
      cm.id,
      cm.parametro AS parametro_original,
      CASE
        WHEN cm.parametro ILIKE '%sist%lica%' THEN 'pa_sistolica'
        WHEN cm.parametro ILIKE '%diast%lica%' THEN 'pa_diastolica'
        WHEN cm.parametro ILIKE 'bcf%' OR cm.parametro ILIKE '%batiment%' THEN 'bcf'
        WHEN cm.parametro ILIKE '%glicemia%' THEN 'glicemia_jejum'
        WHEN cm.parametro ILIKE '%temperatura%' THEN 'temperatura'
        WHEN cm.parametro ILIKE '%freq%cardi%' THEN 'frequencia_cardiaca'
        WHEN cm.parametro ILIKE '%hemoglobin%' THEN 'hemoglobina'
        WHEN cm.parametro ILIKE '%proteinuria%' OR cm.parametro ILIKE '%protein%ria%' THEN 'proteinuria'
        WHEN cm.parametro ILIKE '%altura uterina%' THEN 'altura_uterina'
        ELSE lower(cm.parametro)
      END AS parametro_norm,
      cm.valor,
      cm.semana_gestacional,
      cm.data_medicao,
      cm.gestante_id
    FROM clinical_measurements cm
  ),
  all_alerts AS (
    SELECT
      'med_' || mn.id::text || '_' || rr.id::text AS id,
      'medicao'::text AS origem,
      rr.severidade,
      ('Valor fora do padrão: ' || mn.parametro_original)::text AS titulo,
      (rr.mensagem || ' (valor: ' || mn.valor || COALESCE(' ' || rr.unidade, '') || ')')::text AS mensagem,
      mn.data_medicao AS data
    FROM med_norm mn
    JOIN reference_ranges rr
      ON rr.parametro = mn.parametro_norm
     AND COALESCE(mn.semana_gestacional, 0) BETWEEN rr.semana_min AND rr.semana_max
    WHERE mn.gestante_id = _gestante_id
      AND (
        (rr.valor_min IS NOT NULL AND mn.valor < rr.valor_min)
        OR (rr.valor_max IS NOT NULL AND mn.valor > rr.valor_max)
      )

    UNION ALL

    SELECT
      'ex_' || er.id::text,
      'exame'::text,
      COALESCE(ec.severidade, 'atencao'),
      ('Exame alterado: ' || er.tipo_exame)::text,
      COALESCE(ec.mensagem, 'Resultado fora do padrão')::text,
      er.data_exame
    FROM exam_results er
    LEFT JOIN exam_criteria ec ON ec.tipo_exame = er.tipo_exame
    WHERE er.gestante_id = _gestante_id
      AND er.status = 'alterado'

    UNION ALL

    SELECT
      'img_alt_' || ir.id::text,
      'imagem'::text,
      'atencao'::text,
      ('Exame de imagem alterado: ' || ir.tipo_exame)::text,
      COALESCE(ir.laudo_texto, 'Resultado de imagem fora do padrão. Procure avaliação.')::text,
      ir.data_exame
    FROM image_exam_results ir
    WHERE ir.gestante_id = _gestante_id
      AND ir.status = 'alterado'

    UNION ALL

    SELECT
      'img_pend_' || ies.id::text,
      'imagem'::text,
      'atencao'::text,
      ('Exame de imagem em atraso: ' || ies.tipo_exame)::text,
      ies.mensagem,
      CURRENT_DATE
    FROM image_exam_schedule ies
    WHERE ies.obrigatorio = true
      AND COALESCE(
        (SELECT MAX(semana_gestacional) FROM clinical_measurements
         WHERE gestante_id = _gestante_id AND semana_gestacional IS NOT NULL),
        0
      ) > ies.semana_max
      AND NOT EXISTS (
        SELECT 1 FROM image_exam_results r
        WHERE r.gestante_id = _gestante_id
          AND r.tipo_exame = ies.tipo_exame
          AND r.status IN ('normal','alterado')
      )

    UNION ALL

    SELECT
      'vac_' || vs.id::text,
      'vacina'::text,
      'atencao'::text,
      ('Vacina em atraso: ' || vs.vacina)::text,
      vs.mensagem,
      CURRENT_DATE
    FROM vaccine_schedule vs
    WHERE vs.obrigatoria = true
      AND COALESCE(
        (SELECT MAX(semana_gestacional) FROM clinical_measurements
         WHERE gestante_id = _gestante_id AND semana_gestacional IS NOT NULL),
        0
      ) >= vs.semana_min
      AND NOT EXISTS (
        SELECT 1 FROM vaccinations v
        WHERE v.gestante_id = _gestante_id AND v.vacina = vs.vacina
      )
  )
  SELECT a.id, a.origem, a.severidade, a.titulo, a.mensagem, a.data
  FROM all_alerts a
  WHERE NOT EXISTS (
    SELECT 1 FROM dismissed_alerts da
    WHERE da.gestante_id = _gestante_id
      AND da.alert_id = a.id
  );
$function$;
