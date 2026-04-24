ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dum date,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS foto_url text;

-- Atualiza o trigger para também copiar dum/email vindos do raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email, dum)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'dum', '')::date
  )
  ON CONFLICT DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'gestante')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$;

-- Garante que o trigger de auth.users está em pé
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Evita duplicidade de roles por usuário
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_role_unique
  ON public.user_roles(user_id, role);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_unique
  ON public.profiles(user_id);