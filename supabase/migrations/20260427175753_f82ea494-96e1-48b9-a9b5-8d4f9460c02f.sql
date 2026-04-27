
-- Permitir que gestantes registrem seus próprios dados clínicos
-- (paralelo ao fluxo das consultas por vídeo, gravando nas mesmas tabelas)

CREATE POLICY "Gestante registra própria medição"
ON public.clinical_measurements
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = gestante_id);

CREATE POLICY "Gestante registra própria vacina"
ON public.vaccinations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = gestante_id);

CREATE POLICY "Gestante registra próprio exame"
ON public.exam_results
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = gestante_id);
