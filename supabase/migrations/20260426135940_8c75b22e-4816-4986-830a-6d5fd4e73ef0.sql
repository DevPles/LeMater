CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.consultation_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL,
  gestante_id UUID NOT NULL,
  professional_user_id UUID NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_consultation_notes_appointment ON public.consultation_notes(appointment_id);
CREATE INDEX idx_consultation_notes_gestante ON public.consultation_notes(gestante_id);

ALTER TABLE public.consultation_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profissional autor e admin veem anotacoes"
ON public.consultation_notes
FOR SELECT
TO authenticated
USING (
  auth.uid() = professional_user_id
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Profissional cria propria anotacao"
ON public.consultation_notes
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = professional_user_id
  AND (
    has_role(auth.uid(), 'profissional'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Profissional autor edita anotacao"
ON public.consultation_notes
FOR UPDATE
TO authenticated
USING (
  auth.uid() = professional_user_id
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Profissional autor remove anotacao"
ON public.consultation_notes
FOR DELETE
TO authenticated
USING (
  auth.uid() = professional_user_id
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE TRIGGER trg_consultation_notes_updated_at
BEFORE UPDATE ON public.consultation_notes
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();