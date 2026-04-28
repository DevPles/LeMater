
CREATE POLICY "Profissional/admin enviam gravações de consulta"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'consultation-recordings'
  AND (
    public.has_role(auth.uid(), 'profissional'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);
