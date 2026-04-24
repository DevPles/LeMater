-- ============================================================
-- A1. Expansão de profiles (demografia + obstétrico)
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bairro text,
  ADD COLUMN IF NOT EXISTS cidade text DEFAULT 'Ribeirão Preto',
  ADD COLUMN IF NOT EXISTS unidade_saude text,
  ADD COLUMN IF NOT EXISTS data_nascimento date,
  ADD COLUMN IF NOT EXISTS numero_gestacoes integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS numero_partos integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS numero_abortos integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS partos_classificacao jsonb DEFAULT '[]'::jsonb;

-- ============================================================
-- A2. image_exam_schedule (janelas ideais)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.image_exam_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_exame text NOT NULL UNIQUE,
  semana_min integer NOT NULL,
  semana_max integer NOT NULL,
  obrigatorio boolean NOT NULL DEFAULT true,
  mensagem text NOT NULL,
  fonte text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.image_exam_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leem agenda de imagem"
  ON public.image_exam_schedule FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin gerencia agenda imagem - insert"
  ON public.image_exam_schedule FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin gerencia agenda imagem - update"
  ON public.image_exam_schedule FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin gerencia agenda imagem - delete"
  ON public.image_exam_schedule FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- A3. image_exam_results (resultados com upload)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.image_exam_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gestante_id uuid NOT NULL,
  tipo_exame text NOT NULL,
  data_exame date NOT NULL DEFAULT CURRENT_DATE,
  semana_gestacional integer,
  status text NOT NULL DEFAULT 'pendente',
  laudo_texto text,
  imagem_path text,
  observacao text,
  registrado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.image_exam_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gestante vê próprios exames de imagem"
  ON public.image_exam_results FOR SELECT TO authenticated
  USING (
    auth.uid() = gestante_id
    OR has_role(auth.uid(), 'profissional'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Profissional/admin inserem exames de imagem"
  ON public.image_exam_results FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'profissional'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================================
-- A4. vaccine_schedule_extra (vacinas fora do PNI)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vaccine_schedule_extra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vacina text NOT NULL UNIQUE,
  semana_min integer NOT NULL DEFAULT 0,
  semana_max integer,
  mensagem text NOT NULL,
  fonte text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vaccine_schedule_extra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leem vacinas extras"
  ON public.vaccine_schedule_extra FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin gerencia vacinas extras - insert"
  ON public.vaccine_schedule_extra FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin gerencia vacinas extras - update"
  ON public.vaccine_schedule_extra FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin gerencia vacinas extras - delete"
  ON public.vaccine_schedule_extra FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Adicionar coluna fonte ao vaccine_schedule (PNI) se não existe
ALTER TABLE public.vaccine_schedule
  ADD COLUMN IF NOT EXISTS fonte text DEFAULT 'PNI - Programa Nacional de Imunizações';

-- Adicionar coluna fonte às demais tabelas de regras
ALTER TABLE public.reference_ranges
  ADD COLUMN IF NOT EXISTS fonte text;

ALTER TABLE public.exam_criteria
  ADD COLUMN IF NOT EXISTS fonte text;

-- ============================================================
-- C1. Storage bucket para imagens de exames (privado)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('image-exams', 'image-exams', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Gestante vê próprias imagens"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'image-exams'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR has_role(auth.uid(), 'profissional'::app_role)
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

CREATE POLICY "Profissional/admin enviam imagens"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'image-exams'
    AND (
      has_role(auth.uid(), 'profissional'::app_role)
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

CREATE POLICY "Profissional/admin atualizam imagens"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'image-exams'
    AND (
      has_role(auth.uid(), 'profissional'::app_role)
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

CREATE POLICY "Profissional/admin removem imagens"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'image-exams'
    AND (
      has_role(auth.uid(), 'profissional'::app_role)
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

-- ============================================================
-- Atualizar get_active_alerts para incluir exames de imagem
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_active_alerts(_gestante_id uuid)
RETURNS TABLE(id text, origem text, severidade text, titulo text, mensagem text, data date)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Medições fora da faixa
  SELECT
    'med_' || cm.id::text AS id,
    'medicao'::text AS origem,
    rr.severidade,
    ('Valor fora do padrão: ' || cm.parametro)::text AS titulo,
    (rr.mensagem || ' (valor: ' || cm.valor || COALESCE(' ' || rr.unidade, '') || ')')::text AS mensagem,
    cm.data_medicao AS data
  FROM clinical_measurements cm
  JOIN reference_ranges rr
    ON rr.parametro = cm.parametro
   AND COALESCE(cm.semana_gestacional, 0) BETWEEN rr.semana_min AND rr.semana_max
  WHERE cm.gestante_id = _gestante_id
    AND (
      (rr.valor_min IS NOT NULL AND cm.valor < rr.valor_min)
      OR (rr.valor_max IS NOT NULL AND cm.valor > rr.valor_max)
    )

  UNION ALL

  -- Exames laboratoriais alterados
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

  -- Exames de imagem alterados
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

  -- Exames de imagem obrigatórios não realizados na janela
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

  -- Vacinas PNI em atraso
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
    );
$function$;

-- Trigger para updated_at em image_exam_schedule e vaccine_schedule_extra
CREATE TRIGGER trg_image_exam_schedule_updated_at
  BEFORE UPDATE ON public.image_exam_schedule
  FOR EACH ROW EXECUTE FUNCTION public.touch_app_content_updated_at();

CREATE TRIGGER trg_vaccine_schedule_extra_updated_at
  BEFORE UPDATE ON public.vaccine_schedule_extra
  FOR EACH ROW EXECUTE FUNCTION public.touch_app_content_updated_at();

-- ============================================================
-- SEED: image_exam_schedule (janelas oficiais MS/FEBRASGO)
-- ============================================================
INSERT INTO public.image_exam_schedule (tipo_exame, semana_min, semana_max, obrigatorio, mensagem, fonte) VALUES
  ('USG 1º Trimestre / Translucência Nucal', 11, 14, true, 'Ultrassonografia obstétrica de primeiro trimestre com translucência nucal recomendada entre 11 e 14 semanas.', 'MS / FEBRASGO'),
  ('USG Morfológica', 20, 24, true, 'Ultrassonografia morfológica do segundo trimestre recomendada entre 20 e 24 semanas para avaliação anatômica fetal.', 'MS / FEBRASGO'),
  ('USG Obstétrica 3º Trimestre', 32, 36, true, 'Ultrassonografia obstétrica do terceiro trimestre recomendada entre 32 e 36 semanas para avaliação de crescimento.', 'MS / FEBRASGO'),
  ('Dopplervelocimetria', 26, 32, false, 'Dopplervelocimetria recomendada entre 26 e 32 semanas em gestações de alto risco.', 'FEBRASGO')
ON CONFLICT (tipo_exame) DO NOTHING;

-- ============================================================
-- SEED: vaccine_schedule_extra (recomendadas, não-PNI)
-- ============================================================
INSERT INTO public.vaccine_schedule_extra (vacina, semana_min, semana_max, mensagem, fonte) VALUES
  ('Meningocócica ACWY', 0, 42, 'Vacina meningocócica ACWY recomendada para gestantes em situação de risco. Disponível na rede particular.', 'SBIm'),
  ('Meningocócica B', 0, 42, 'Vacina meningocócica B recomendada para gestantes em situação de risco. Disponível na rede particular.', 'SBIm'),
  ('Pneumocócica 13/15/20', 0, 42, 'Vacina pneumocócica recomendada para gestantes com comorbidades pulmonares ou imunodepressão.', 'SBIm'),
  ('Tríplice Viral (pré-concepção)', 0, 0, 'Tríplice viral (sarampo/caxumba/rubéola) deve ser tomada antes da gestação. Contraindicada durante a gravidez.', 'SBIm'),
  ('Varicela (pré-concepção)', 0, 0, 'Vacina contra varicela deve ser tomada antes da gestação. Contraindicada durante a gravidez.', 'SBIm'),
  ('HPV (pós-parto)', 0, 0, 'Vacina HPV recomendada para mulheres até 45 anos no pós-parto. Disponível na rede particular ou SUS conforme idade.', 'SBIm')
ON CONFLICT (vacina) DO NOTHING;