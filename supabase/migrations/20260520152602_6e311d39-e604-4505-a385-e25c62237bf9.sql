
-- Atribui papel 'gestante' a qualquer perfil existente que ainda não tenha papel
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'gestante'::app_role
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id
)
ON CONFLICT DO NOTHING;
