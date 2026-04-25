-- 1. Add columns
ALTER TABLE public.appointment_slots
  ADD COLUMN IF NOT EXISTS room_id uuid,
  ADD COLUMN IF NOT EXISTS recording_path text,
  ADD COLUMN IF NOT EXISTS recording_duration_seg integer,
  ADD COLUMN IF NOT EXISTS gravacao_iniciada_em timestamptz,
  ADD COLUMN IF NOT EXISTS gravacao_finalizada_em timestamptz;

CREATE INDEX IF NOT EXISTS idx_appointment_slots_room_id ON public.appointment_slots(room_id);

-- 2. Update book_slot to generate room_id
CREATE OR REPLACE FUNCTION public.book_slot(_slot_id uuid)
 RETURNS TABLE(success boolean, message text, slot_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _user_id UUID := auth.uid();
  _updated UUID;
BEGIN
  IF _user_id IS NULL THEN
    RETURN QUERY SELECT false, 'Não autenticado'::text, NULL::uuid;
    RETURN;
  END IF;

  UPDATE appointment_slots
  SET status = 'reservado',
      gestante_id = _user_id,
      reservado_em = now(),
      room_id = COALESCE(room_id, gen_random_uuid())
  WHERE id = _slot_id
    AND status = 'disponivel'
  RETURNING id INTO _updated;

  IF _updated IS NULL THEN
    RETURN QUERY SELECT false, 'Horário indisponível'::text, _slot_id;
  ELSE
    RETURN QUERY SELECT true, 'Reservado com sucesso'::text, _updated;
  END IF;
END;
$function$;

-- Backfill room_id for existing reserved slots
UPDATE public.appointment_slots
SET room_id = gen_random_uuid()
WHERE room_id IS NULL AND status IN ('reservado','realizado');

-- 3. Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('consultation-recordings', 'consultation-recordings', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage RLS — files are stored at "<slot_id>/<filename>"
-- Admin: all access
CREATE POLICY "Admin full access recordings"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'consultation-recordings'
  AND public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  bucket_id = 'consultation-recordings'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Profissional dono da consulta: SELECT
CREATE POLICY "Profissional vê gravações próprias"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'consultation-recordings'
  AND EXISTS (
    SELECT 1
    FROM public.appointment_slots a
    JOIN public.professionals p ON p.id = a.professional_id
    WHERE a.id::text = (storage.foldername(name))[1]
      AND p.user_id = auth.uid()
  )
);

-- Profissional dono da consulta: INSERT (upload da gravação)
CREATE POLICY "Profissional envia gravação própria"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'consultation-recordings'
  AND EXISTS (
    SELECT 1
    FROM public.appointment_slots a
    JOIN public.professionals p ON p.id = a.professional_id
    WHERE a.id::text = (storage.foldername(name))[1]
      AND p.user_id = auth.uid()
  )
);
