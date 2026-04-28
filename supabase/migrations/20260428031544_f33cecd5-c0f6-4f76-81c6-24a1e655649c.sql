DROP POLICY IF EXISTS "Admin cria campanhas" ON public.notification_campaigns;
CREATE POLICY "Admin cria campanhas"
ON public.notification_campaigns
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admin cria entregas" ON public.notification_deliveries;
CREATE POLICY "Admin cria entregas"
ON public.notification_deliveries
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));