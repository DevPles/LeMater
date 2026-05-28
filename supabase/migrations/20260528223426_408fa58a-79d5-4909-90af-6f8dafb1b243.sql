
-- ============================================================
-- 1) SELECT em tabelas clínicas: restringir profissional ao vínculo
-- ============================================================

DROP POLICY IF EXISTS "Gestante, profissional e admin veem medições" ON public.clinical_measurements;
CREATE POLICY "Gestante, profissional vinculado e admin veem medições"
ON public.clinical_measurements FOR SELECT
USING (
  auth.uid() = gestante_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR public.is_professional_of_gestante(auth.uid(), gestante_id)
);

DROP POLICY IF EXISTS "Gestante, profissional e admin veem exames" ON public.exam_results;
CREATE POLICY "Gestante, profissional vinculado e admin veem exames"
ON public.exam_results FOR SELECT
USING (
  auth.uid() = gestante_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR public.is_professional_of_gestante(auth.uid(), gestante_id)
);

DROP POLICY IF EXISTS "Gestante, profissional e admin veem imagens" ON public.image_exam_results;
CREATE POLICY "Gestante, profissional vinculado e admin veem imagens"
ON public.image_exam_results FOR SELECT
USING (
  auth.uid() = gestante_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR public.is_professional_of_gestante(auth.uid(), gestante_id)
);

DROP POLICY IF EXISTS "Gestante, profissional e admin veem vacinas" ON public.vaccinations;
CREATE POLICY "Gestante, profissional vinculado e admin veem vacinas"
ON public.vaccinations FOR SELECT
USING (
  auth.uid() = gestante_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR public.is_professional_of_gestante(auth.uid(), gestante_id)
);

-- ============================================================
-- 2) STORAGE: consultation-recordings — remover regra ampla
-- A regra "Profissional envia gravação própria" (com JOIN em professionals)
-- já cobre o caso correto.
-- ============================================================

DROP POLICY IF EXISTS "Profissional/admin enviam gravações de consulta" ON storage.objects;

-- ============================================================
-- 3) STORAGE: image-exams — INSERT restrito ao vínculo
-- Path: {gestante_id}/...
-- ============================================================

DROP POLICY IF EXISTS "Profissional/admin enviam imagens" ON storage.objects;

CREATE POLICY "Profissional vinculado envia imagens de exame"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'image-exams'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR public.is_professional_of_gestante(
         auth.uid(),
         NULLIF((storage.foldername(name))[1], '')::uuid
       )
  )
);

-- ============================================================
-- 4) STORAGE: image-exams + exam-attachments — SELECT restrito
-- ============================================================

DROP POLICY IF EXISTS "Gestante vê próprias imagens" ON storage.objects;
DROP POLICY IF EXISTS "Gestante lê próprios image-exams" ON storage.objects;

CREATE POLICY "Image-exams: gestante, profissional vinculado e admin leem"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'image-exams'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR has_role(auth.uid(), 'admin'::app_role)
    OR public.is_professional_of_gestante(
         auth.uid(),
         NULLIF((storage.foldername(name))[1], '')::uuid
       )
  )
);

DROP POLICY IF EXISTS "Gestante lê próprios exam-attachments" ON storage.objects;

CREATE POLICY "Exam-attachments: gestante, profissional vinculado e admin leem"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'exam-attachments'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR has_role(auth.uid(), 'admin'::app_role)
    OR public.is_professional_of_gestante(
         auth.uid(),
         NULLIF((storage.foldername(name))[1], '')::uuid
       )
  )
);
