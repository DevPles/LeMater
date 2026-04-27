-- 1) Adiciona appointment_id em todas as tabelas clínicas
ALTER TABLE public.clinical_measurements ADD COLUMN IF NOT EXISTS appointment_id uuid;
ALTER TABLE public.exam_results          ADD COLUMN IF NOT EXISTS appointment_id uuid;
ALTER TABLE public.image_exam_results    ADD COLUMN IF NOT EXISTS appointment_id uuid;
ALTER TABLE public.vaccinations          ADD COLUMN IF NOT EXISTS appointment_id uuid;

CREATE INDEX IF NOT EXISTS idx_clinical_measurements_appointment ON public.clinical_measurements(appointment_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_appointment          ON public.exam_results(appointment_id);
CREATE INDEX IF NOT EXISTS idx_image_exam_results_appointment    ON public.image_exam_results(appointment_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_appointment          ON public.vaccinations(appointment_id);

-- 2) Backfill: tenta associar registros antigos ao slot 'reservado'/'realizado'
--    do mesmo profissional+gestante mais próximo da data do registro.

-- Helper inline via UPDATE com LATERAL JOIN
WITH base AS (
  SELECT cm.id AS rid, cm.gestante_id, cm.registrado_por, cm.data_medicao::timestamptz AS d
  FROM public.clinical_measurements cm
  WHERE cm.appointment_id IS NULL AND cm.registrado_por IS NOT NULL
)
UPDATE public.clinical_measurements t
SET appointment_id = sub.slot_id
FROM (
  SELECT b.rid, s.id AS slot_id
  FROM base b
  CROSS JOIN LATERAL (
    SELECT a.id
    FROM public.appointment_slots a
    JOIN public.professionals p ON p.id = a.professional_id
    WHERE p.user_id = b.registrado_por
      AND a.gestante_id = b.gestante_id
      AND a.status IN ('reservado','realizado')
      AND ABS(EXTRACT(EPOCH FROM (a.data_hora - b.d))) <= 60*60*24*2
    ORDER BY ABS(EXTRACT(EPOCH FROM (a.data_hora - b.d))) ASC
    LIMIT 1
  ) s
) sub
WHERE t.id = sub.rid;

WITH base AS (
  SELECT er.id AS rid, er.gestante_id, er.registrado_por, er.data_exame::timestamptz AS d
  FROM public.exam_results er
  WHERE er.appointment_id IS NULL AND er.registrado_por IS NOT NULL
)
UPDATE public.exam_results t
SET appointment_id = sub.slot_id
FROM (
  SELECT b.rid, s.id AS slot_id
  FROM base b
  CROSS JOIN LATERAL (
    SELECT a.id
    FROM public.appointment_slots a
    JOIN public.professionals p ON p.id = a.professional_id
    WHERE p.user_id = b.registrado_por
      AND a.gestante_id = b.gestante_id
      AND a.status IN ('reservado','realizado')
      AND ABS(EXTRACT(EPOCH FROM (a.data_hora - b.d))) <= 60*60*24*2
    ORDER BY ABS(EXTRACT(EPOCH FROM (a.data_hora - b.d))) ASC
    LIMIT 1
  ) s
) sub
WHERE t.id = sub.rid;

WITH base AS (
  SELECT ir.id AS rid, ir.gestante_id, ir.registrado_por, ir.data_exame::timestamptz AS d
  FROM public.image_exam_results ir
  WHERE ir.appointment_id IS NULL AND ir.registrado_por IS NOT NULL
)
UPDATE public.image_exam_results t
SET appointment_id = sub.slot_id
FROM (
  SELECT b.rid, s.id AS slot_id
  FROM base b
  CROSS JOIN LATERAL (
    SELECT a.id
    FROM public.appointment_slots a
    JOIN public.professionals p ON p.id = a.professional_id
    WHERE p.user_id = b.registrado_por
      AND a.gestante_id = b.gestante_id
      AND a.status IN ('reservado','realizado')
      AND ABS(EXTRACT(EPOCH FROM (a.data_hora - b.d))) <= 60*60*24*2
    ORDER BY ABS(EXTRACT(EPOCH FROM (a.data_hora - b.d))) ASC
    LIMIT 1
  ) s
) sub
WHERE t.id = sub.rid;

WITH base AS (
  SELECT v.id AS rid, v.gestante_id, v.registrado_por, v.data_aplicacao::timestamptz AS d
  FROM public.vaccinations v
  WHERE v.appointment_id IS NULL AND v.registrado_por IS NOT NULL
)
UPDATE public.vaccinations t
SET appointment_id = sub.slot_id
FROM (
  SELECT b.rid, s.id AS slot_id
  FROM base b
  CROSS JOIN LATERAL (
    SELECT a.id
    FROM public.appointment_slots a
    JOIN public.professionals p ON p.id = a.professional_id
    WHERE p.user_id = b.registrado_por
      AND a.gestante_id = b.gestante_id
      AND a.status IN ('reservado','realizado')
      AND ABS(EXTRACT(EPOCH FROM (a.data_hora - b.d))) <= 60*60*24*2
    ORDER BY ABS(EXTRACT(EPOCH FROM (a.data_hora - b.d))) ASC
    LIMIT 1
  ) s
) sub
WHERE t.id = sub.rid;

-- 3) Função RPC: prontuário compilado de uma consulta
CREATE OR REPLACE FUNCTION public.get_consulta_prontuario(_appointment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slot jsonb;
  v_prof jsonb;
  v_gest jsonb;
  v_obs  jsonb;
  v_med  jsonb;
  v_ex   jsonb;
  v_img  jsonb;
  v_vac  jsonb;
  v_uid  uuid := auth.uid();
  v_slot_row record;
  v_allowed boolean := false;
BEGIN
  SELECT * INTO v_slot_row FROM appointment_slots WHERE id = _appointment_id;
  IF v_slot_row.id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Autorização: admin, profissional dono do slot, ou gestante do slot
  IF has_role(v_uid, 'admin'::app_role) THEN
    v_allowed := true;
  ELSIF v_slot_row.gestante_id = v_uid THEN
    v_allowed := true;
  ELSIF EXISTS (
    SELECT 1 FROM professionals p
    WHERE p.id = v_slot_row.professional_id AND p.user_id = v_uid
  ) THEN
    v_allowed := true;
  END IF;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT to_jsonb(s) INTO v_slot FROM appointment_slots s WHERE s.id = _appointment_id;

  SELECT to_jsonb(pr) INTO v_prof
  FROM professionals pr WHERE pr.id = v_slot_row.professional_id;

  SELECT to_jsonb(p) - 'cpf' INTO v_gest
  FROM profiles p WHERE p.user_id = v_slot_row.gestante_id;

  SELECT coalesce(jsonb_agg(to_jsonb(n) ORDER BY n.created_at), '[]'::jsonb) INTO v_obs
  FROM consultation_notes n WHERE n.appointment_id = _appointment_id;

  SELECT coalesce(jsonb_agg(to_jsonb(m) ORDER BY m.created_at), '[]'::jsonb) INTO v_med
  FROM clinical_measurements m WHERE m.appointment_id = _appointment_id;

  SELECT coalesce(jsonb_agg(to_jsonb(e) ORDER BY e.created_at), '[]'::jsonb) INTO v_ex
  FROM exam_results e WHERE e.appointment_id = _appointment_id;

  SELECT coalesce(jsonb_agg(to_jsonb(i) ORDER BY i.created_at), '[]'::jsonb) INTO v_img
  FROM image_exam_results i WHERE i.appointment_id = _appointment_id;

  SELECT coalesce(jsonb_agg(to_jsonb(v) ORDER BY v.created_at), '[]'::jsonb) INTO v_vac
  FROM vaccinations v WHERE v.appointment_id = _appointment_id;

  RETURN jsonb_build_object(
    'slot', v_slot,
    'profissional', v_prof,
    'gestante', v_gest,
    'observacoes', v_obs,
    'medicoes', v_med,
    'exames', v_ex,
    'imagens', v_img,
    'vacinas', v_vac
  );
END;
$$;

-- 4) Função: lista todas as consultas (slots) do profissional logado
--    com contagens de itens lançados.
CREATE OR REPLACE FUNCTION public.list_consultas_prof(_only_with_lancamentos boolean DEFAULT false)
RETURNS TABLE(
  appointment_id uuid,
  data_hora timestamptz,
  gestante_id uuid,
  gestante_nome text,
  status text,
  total_obs int,
  total_med int,
  total_ex int,
  total_img int,
  total_vac int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.id,
    a.data_hora,
    a.gestante_id,
    p.nome,
    a.status,
    (SELECT count(*)::int FROM consultation_notes n   WHERE n.appointment_id = a.id),
    (SELECT count(*)::int FROM clinical_measurements m WHERE m.appointment_id = a.id),
    (SELECT count(*)::int FROM exam_results e          WHERE e.appointment_id = a.id),
    (SELECT count(*)::int FROM image_exam_results i    WHERE i.appointment_id = a.id),
    (SELECT count(*)::int FROM vaccinations v          WHERE v.appointment_id = a.id)
  FROM appointment_slots a
  LEFT JOIN profiles p ON p.user_id = a.gestante_id
  WHERE a.gestante_id IS NOT NULL
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (SELECT 1 FROM professionals pr WHERE pr.id = a.professional_id AND pr.user_id = auth.uid())
    )
    AND (
      NOT _only_with_lancamentos
      OR EXISTS (SELECT 1 FROM consultation_notes n WHERE n.appointment_id = a.id)
      OR EXISTS (SELECT 1 FROM clinical_measurements m WHERE m.appointment_id = a.id)
      OR EXISTS (SELECT 1 FROM exam_results e WHERE e.appointment_id = a.id)
      OR EXISTS (SELECT 1 FROM image_exam_results i WHERE i.appointment_id = a.id)
      OR EXISTS (SELECT 1 FROM vaccinations v WHERE v.appointment_id = a.id)
    )
  ORDER BY a.data_hora DESC;
$$;