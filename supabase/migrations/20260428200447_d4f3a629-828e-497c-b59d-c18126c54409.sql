-- Add arquivo_path to exam_results for laboratory exam attachments
ALTER TABLE public.exam_results 
  ADD COLUMN IF NOT EXISTS arquivo_path text;

-- Allow gestante to insert her own image exam (with optional file)
DROP POLICY IF EXISTS "Gestante registra próprio exame de imagem" ON public.image_exam_results;
CREATE POLICY "Gestante registra próprio exame de imagem"
ON public.image_exam_results
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = gestante_id);

-- Create private bucket for laboratory exam attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('exam-attachments', 'exam-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: gestante manages own files, prof/admin can read
DROP POLICY IF EXISTS "Gestante envia exam-attachments" ON storage.objects;
CREATE POLICY "Gestante envia exam-attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exam-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Gestante lê próprios exam-attachments" ON storage.objects;
CREATE POLICY "Gestante lê próprios exam-attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'exam-attachments'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'profissional'::app_role)
  )
);

DROP POLICY IF EXISTS "Gestante remove próprios exam-attachments" ON storage.objects;
CREATE POLICY "Gestante remove próprios exam-attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'exam-attachments'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Same for image-exams bucket (so gestante can upload too)
DROP POLICY IF EXISTS "Gestante envia image-exams" ON storage.objects;
CREATE POLICY "Gestante envia image-exams"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'image-exams'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Gestante lê próprios image-exams" ON storage.objects;
CREATE POLICY "Gestante lê próprios image-exams"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'image-exams'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'profissional'::app_role)
  )
);