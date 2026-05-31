
CREATE TABLE public.terms_acceptances (
  user_id uuid PRIMARY KEY,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  terms_version text NOT NULL,
  hash text NOT NULL,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.terms_acceptances TO authenticated;
GRANT ALL ON public.terms_acceptances TO service_role;

ALTER TABLE public.terms_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own acceptance"
ON public.terms_acceptances
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));
