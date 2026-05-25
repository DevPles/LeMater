
-- clinical_measurements
DROP POLICY IF EXISTS "Gestante e profissional vinculado veem medições" ON public.clinical_measurements;
DROP POLICY IF EXISTS "Profissional vinculado ou admin inserem medições" ON public.clinical_measurements;

CREATE POLICY "Gestante, profissional e admin veem medições"
ON public.clinical_measurements FOR SELECT TO authenticated
USING (
  auth.uid() = gestante_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'profissional'::app_role)
);

CREATE POLICY "Profissional ou admin inserem medições"
ON public.clinical_measurements FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'profissional'::app_role)
);

-- exam_results
DROP POLICY IF EXISTS "Gestante e profissional vinculado veem exames" ON public.exam_results;
DROP POLICY IF EXISTS "Profissional vinculado ou admin inserem exames" ON public.exam_results;

CREATE POLICY "Gestante, profissional e admin veem exames"
ON public.exam_results FOR SELECT TO authenticated
USING (
  auth.uid() = gestante_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'profissional'::app_role)
);

CREATE POLICY "Profissional ou admin inserem exames"
ON public.exam_results FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'profissional'::app_role)
);

-- image_exam_results
DROP POLICY IF EXISTS "Gestante e profissional vinculado veem imagens" ON public.image_exam_results;
DROP POLICY IF EXISTS "Profissional vinculado ou admin inserem imagens" ON public.image_exam_results;

CREATE POLICY "Gestante, profissional e admin veem imagens"
ON public.image_exam_results FOR SELECT TO authenticated
USING (
  auth.uid() = gestante_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'profissional'::app_role)
);

CREATE POLICY "Profissional ou admin inserem imagens"
ON public.image_exam_results FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'profissional'::app_role)
);

-- vaccinations
DROP POLICY IF EXISTS "Gestante e profissional vinculado veem vacinas" ON public.vaccinations;
DROP POLICY IF EXISTS "Profissional vinculado ou admin inserem vacinas" ON public.vaccinations;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='vaccinations') THEN
    EXECUTE $p$
      CREATE POLICY "Gestante, profissional e admin veem vacinas"
      ON public.vaccinations FOR SELECT TO authenticated
      USING (
        auth.uid() = gestante_id
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'profissional'::app_role)
      )
    $p$;
    EXECUTE $p$
      CREATE POLICY "Profissional ou admin inserem vacinas"
      ON public.vaccinations FOR INSERT TO authenticated
      WITH CHECK (
        has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'profissional'::app_role)
      )
    $p$;
  END IF;
END $$;
