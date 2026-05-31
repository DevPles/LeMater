
DROP POLICY IF EXISTS "Profissional ou admin inserem medições" ON public.clinical_measurements;
CREATE POLICY "Profissional ou admin inserem medições" ON public.clinical_measurements
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR (has_role(auth.uid(), 'profissional'::app_role) AND is_professional_of_gestante(auth.uid(), gestante_id)));

DROP POLICY IF EXISTS "Profissional ou admin inserem exames" ON public.exam_results;
CREATE POLICY "Profissional ou admin inserem exames" ON public.exam_results
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR (has_role(auth.uid(), 'profissional'::app_role) AND is_professional_of_gestante(auth.uid(), gestante_id)));

DROP POLICY IF EXISTS "Profissional ou admin inserem imagens" ON public.image_exam_results;
CREATE POLICY "Profissional ou admin inserem imagens" ON public.image_exam_results
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR (has_role(auth.uid(), 'profissional'::app_role) AND is_professional_of_gestante(auth.uid(), gestante_id)));

DROP POLICY IF EXISTS "Profissional ou admin inserem vacinas" ON public.vaccinations;
DROP POLICY IF EXISTS "Profissional/admin inserem vacinas" ON public.vaccinations;
CREATE POLICY "Profissional ou admin inserem vacinas" ON public.vaccinations
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR (has_role(auth.uid(), 'profissional'::app_role) AND is_professional_of_gestante(auth.uid(), gestante_id)));
