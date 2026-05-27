
DROP POLICY IF EXISTS "Profissional vê gravações próprias" ON storage.objects;

CREATE POLICY "Profissional vê gravações próprias"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'consultation-recordings'
  AND EXISTS (
    SELECT 1 FROM appointment_slots a
    JOIN professionals p ON p.id = a.professional_id
    WHERE p.user_id = auth.uid()
      AND a.id::text = substring(storage.filename(objects.name) from 1 for 36)
  )
);

CREATE POLICY "Gestante vê gravações próprias"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'consultation-recordings'
  AND EXISTS (
    SELECT 1 FROM appointment_slots a
    WHERE a.gestante_id = auth.uid()
      AND a.id::text = substring(storage.filename(objects.name) from 1 for 36)
  )
);
