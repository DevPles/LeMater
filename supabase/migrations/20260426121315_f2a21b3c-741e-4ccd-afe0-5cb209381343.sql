-- Função para verificar se um profissional tem (ou teve) atendimento reservado/realizado com a gestante
CREATE OR REPLACE FUNCTION public.is_professional_of_gestante(_prof_user_id uuid, _gestante_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM appointment_slots a
    JOIN professionals p ON p.id = a.professional_id
    WHERE p.user_id = _prof_user_id
      AND a.gestante_id = _gestante_id
      AND a.status IN ('reservado','realizado')
  )
$$;

-- profiles: profissional pode ler perfil de gestante que tem slot reservado/realizado com ele
DROP POLICY IF EXISTS "Profissional vê perfil de gestantes atendidas" ON public.profiles;
CREATE POLICY "Profissional vê perfil de gestantes atendidas"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_professional_of_gestante(auth.uid(), user_id));