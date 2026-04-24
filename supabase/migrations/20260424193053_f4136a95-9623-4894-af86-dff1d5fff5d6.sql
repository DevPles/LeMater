CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email, dum, cpf)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'dum', '')::date,
    NULLIF(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'cpf', ''), '\\D', '', 'g'), '')
  )
  ON CONFLICT DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'gestante')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$;