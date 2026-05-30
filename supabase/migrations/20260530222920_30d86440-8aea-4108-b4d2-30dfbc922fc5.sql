CREATE POLICY "Admins manage all avatars insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage all avatars update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage all avatars delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND has_role(auth.uid(), 'admin'));
UPDATE storage.buckets SET file_size_limit = NULL, allowed_mime_types = NULL WHERE id = 'avatars';