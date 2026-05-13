CREATE TABLE public.atlas_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text NOT NULL,
  whatsapp text NOT NULL,
  momento text NOT NULL,
  origem text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.atlas_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer um pode submeter lead"
ON public.atlas_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admin lê leads"
ON public.atlas_leads
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_atlas_leads_origem ON public.atlas_leads(origem);
CREATE INDEX idx_atlas_leads_created_at ON public.atlas_leads(created_at DESC);