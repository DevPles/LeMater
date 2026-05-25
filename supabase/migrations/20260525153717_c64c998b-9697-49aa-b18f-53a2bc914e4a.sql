
-- 1. Restringir SELECT de prontuário a profissional vinculado
DROP POLICY IF EXISTS "Gestante vê próprias medições" ON public.clinical_measurements;
CREATE POLICY "Gestante e profissional vinculado veem medições"
ON public.clinical_measurements FOR SELECT TO authenticated
USING (
  auth.uid() = gestante_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR public.is_professional_of_gestante(auth.uid(), gestante_id)
);

DROP POLICY IF EXISTS "Gestante vê próprios exames" ON public.exam_results;
CREATE POLICY "Gestante e profissional vinculado veem exames"
ON public.exam_results FOR SELECT TO authenticated
USING (
  auth.uid() = gestante_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR public.is_professional_of_gestante(auth.uid(), gestante_id)
);

DROP POLICY IF EXISTS "Gestante vê próprios exames de imagem" ON public.image_exam_results;
CREATE POLICY "Gestante e profissional vinculado veem imagens"
ON public.image_exam_results FOR SELECT TO authenticated
USING (
  auth.uid() = gestante_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR public.is_professional_of_gestante(auth.uid(), gestante_id)
);

DROP POLICY IF EXISTS "Gestante vê próprias vacinas" ON public.vaccinations;
CREATE POLICY "Gestante e profissional vinculado veem vacinas"
ON public.vaccinations FOR SELECT TO authenticated
USING (
  auth.uid() = gestante_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR public.is_professional_of_gestante(auth.uid(), gestante_id)
);

-- Igualmente para INSERT (profissional só insere para gestante vinculada)
DROP POLICY IF EXISTS "Profissional/admin inserem medições" ON public.clinical_measurements;
CREATE POLICY "Profissional vinculado ou admin inserem medições"
ON public.clinical_measurements FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR public.is_professional_of_gestante(auth.uid(), gestante_id)
);

DROP POLICY IF EXISTS "Profissional/admin inserem exames" ON public.exam_results;
CREATE POLICY "Profissional vinculado ou admin inserem exames"
ON public.exam_results FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR public.is_professional_of_gestante(auth.uid(), gestante_id)
);

DROP POLICY IF EXISTS "Profissional/admin inserem exames de imagem" ON public.image_exam_results;
CREATE POLICY "Profissional vinculado ou admin inserem imagens"
ON public.image_exam_results FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR public.is_professional_of_gestante(auth.uid(), gestante_id)
);

-- 2. app_content: bloquear escrita anônima
DROP POLICY IF EXISTS "Anyone can insert app content" ON public.app_content;
DROP POLICY IF EXISTS "Anyone can update app content" ON public.app_content;

CREATE POLICY "Admin insere app_content"
ON public.app_content FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin atualiza app_content"
ON public.app_content FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin remove app_content"
ON public.app_content FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Storage image-exams: UPDATE/DELETE só admin ou profissional vinculado à gestante (pasta = gestante_id)
DROP POLICY IF EXISTS "Profissional/admin atualizam imagens" ON storage.objects;
DROP POLICY IF EXISTS "Profissional/admin removem imagens" ON storage.objects;

CREATE POLICY "Imagens exame: atualizar restrito"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'image-exams'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR public.is_professional_of_gestante(
      auth.uid(),
      NULLIF((storage.foldername(name))[1], '')::uuid
    )
  )
);

CREATE POLICY "Imagens exame: remover restrito"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'image-exams'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR public.is_professional_of_gestante(
      auth.uid(),
      NULLIF((storage.foldername(name))[1], '')::uuid
    )
  )
);

-- 4. Storage materiais-pdf / materiais-video: leitura exige acesso específico ao material
DROP POLICY IF EXISTS "PDFs leitura aluno ou admin" ON storage.objects;
DROP POLICY IF EXISTS "Videos leitura aluno ou admin" ON storage.objects;

CREATE POLICY "PDFs leitura por entitlement"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'materiais-pdf'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.materiais m
      WHERE m.conteudo_url = storage.objects.name
        AND public.pode_ver_material(auth.uid(), m.id)
    )
  )
);

CREATE POLICY "Videos leitura por entitlement"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'materiais-video'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.materiais m
      WHERE m.conteudo_url = storage.objects.name
        AND public.pode_ver_material(auth.uid(), m.id)
    )
  )
);
