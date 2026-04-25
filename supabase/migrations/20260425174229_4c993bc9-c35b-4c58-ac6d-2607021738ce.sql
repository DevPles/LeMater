-- 1) Atualiza handle_new_user para respeitar metadado tipo_usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _tipo text;
BEGIN
  _tipo := COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'gestante');

  INSERT INTO public.profiles (user_id, nome, email, dum, cpf)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'dum', '')::date,
    NULLIF(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'cpf', ''), '\D', '', 'g'), '')
  )
  ON CONFLICT DO NOTHING;

  -- Atribui a role conforme o metadado (default: gestante)
  IF _tipo = 'profissional' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'profissional')
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'gestante')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- 2) Garante que o trigger está ligado em auth.users (caso ainda não esteja)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3) RPC para promover um usuário a profissional (idempotente, segura).
-- Pode ser chamada por: o próprio usuário (autoatribuição) OU admin.
-- Como o painel admin do MVP usa sessionStorage e não JWT, permitimos
-- também quando o user_id alvo já tem registro em professionals.
CREATE OR REPLACE FUNCTION public.promote_to_professional(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Só promove se o usuário existe em professionals (vínculo já criado)
  IF NOT EXISTS (SELECT 1 FROM public.professionals WHERE user_id = _user_id) THEN
    RAISE EXCEPTION 'Usuário não está cadastrado como profissional';
  END IF;

  -- Adiciona role profissional
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'profissional')
  ON CONFLICT DO NOTHING;

  -- Remove role gestante atribuída automaticamente pelo trigger
  DELETE FROM public.user_roles
  WHERE user_id = _user_id AND role = 'gestante';
END;
$function$;

-- Permite chamada via supabase.rpc por usuários autenticados e anon
GRANT EXECUTE ON FUNCTION public.promote_to_professional(uuid) TO anon, authenticated;

-- 4) Corrige profissionais já existentes que ficaram só como gestante
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT user_id FROM public.professionals LOOP
    INSERT INTO public.user_roles (user_id, role)
    VALUES (r.user_id, 'profissional')
    ON CONFLICT DO NOTHING;
    DELETE FROM public.user_roles
    WHERE user_id = r.user_id AND role = 'gestante';
  END LOOP;
END $$;