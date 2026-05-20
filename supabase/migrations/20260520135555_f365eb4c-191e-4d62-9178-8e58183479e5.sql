-- Garante um único perfil por usuário antes de usar upsert pelo user_id
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_unique_idx
ON public.profiles (user_id);

-- Atualiza o gatilho de novo usuário para copiar todos os dados principais do cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _tipo text;
BEGIN
  _tipo := COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'gestante');

  INSERT INTO public.profiles (
    user_id,
    nome,
    email,
    dum,
    cpf,
    telefone,
    data_nascimento,
    bairro,
    cidade,
    unidade_saude,
    district_id,
    health_unit_id
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'dum', '')::date,
    NULLIF(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'cpf', ''), '\D', '', 'g'), ''),
    NULLIF(NEW.raw_user_meta_data->>'telefone', ''),
    NULLIF(NEW.raw_user_meta_data->>'data_nascimento', '')::date,
    NULLIF(NEW.raw_user_meta_data->>'bairro', ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'cidade', ''), 'Ribeirão Preto'),
    NULLIF(NEW.raw_user_meta_data->>'unidade_saude', ''),
    NULLIF(NEW.raw_user_meta_data->>'district_id', '')::uuid,
    NULLIF(NEW.raw_user_meta_data->>'health_unit_id', '')::uuid
  )
  ON CONFLICT (user_id) DO UPDATE SET
    nome = COALESCE(EXCLUDED.nome, public.profiles.nome),
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    dum = COALESCE(EXCLUDED.dum, public.profiles.dum),
    cpf = COALESCE(EXCLUDED.cpf, public.profiles.cpf),
    telefone = COALESCE(EXCLUDED.telefone, public.profiles.telefone),
    data_nascimento = COALESCE(EXCLUDED.data_nascimento, public.profiles.data_nascimento),
    bairro = COALESCE(EXCLUDED.bairro, public.profiles.bairro),
    cidade = COALESCE(EXCLUDED.cidade, public.profiles.cidade),
    unidade_saude = COALESCE(EXCLUDED.unidade_saude, public.profiles.unidade_saude),
    district_id = COALESCE(EXCLUDED.district_id, public.profiles.district_id),
    health_unit_id = COALESCE(EXCLUDED.health_unit_id, public.profiles.health_unit_id),
    updated_at = now();

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
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();