-- ============================================================
-- FASE A: Auth + Roles
-- ============================================================

-- 1. Enum de papéis
CREATE TYPE public.app_role AS ENUM ('gestante', 'profissional', 'admin');

-- 2. Tabela de perfis (dados básicos do usuário)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  telefone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Tabela de papéis (NUNCA na tabela de perfis - segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Função SECURITY DEFINER para checar papel (evita recursão em RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. Trigger updated_at em profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_app_content_updated_at();

-- 6. Trigger: ao criar usuário, cria perfil + papel "gestante" por padrão
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'gestante');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. RLS profiles
CREATE POLICY "Usuário vê próprio perfil"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuário edita próprio perfil"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Usuário cria próprio perfil"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 8. RLS user_roles
CREATE POLICY "Usuário vê próprios papéis"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admin concede papéis"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admin remove papéis"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- FASE B: Tabelas clínicas + regras + alertas automáticos
-- ============================================================

-- 9. Faixas de referência por parâmetro × semana gestacional
CREATE TABLE public.reference_ranges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parametro TEXT NOT NULL, -- 'pa_sistolica', 'pa_diastolica', 'peso', 'glicemia', 'bcf', 'altura_uterina'
  semana_min INT NOT NULL DEFAULT 0,
  semana_max INT NOT NULL DEFAULT 42,
  valor_min NUMERIC,
  valor_max NUMERIC,
  unidade TEXT,
  severidade TEXT NOT NULL DEFAULT 'atencao', -- 'atencao' | 'urgente'
  mensagem TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reference_ranges ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_reference_ranges_updated_at
BEFORE UPDATE ON public.reference_ranges
FOR EACH ROW EXECUTE FUNCTION public.touch_app_content_updated_at();

-- 10. Critérios de exames alterados
CREATE TABLE public.exam_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_exame TEXT NOT NULL, -- 'hemograma', 'urina', 'glicemia_jejum', 'sifilis', 'hiv', 'toxoplasmose', 'ultrassom'
  resultado_alterado TEXT NOT NULL, -- valor ou termo que indica alteração: 'reagente', 'positivo', '>200', etc.
  severidade TEXT NOT NULL DEFAULT 'atencao',
  mensagem TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_criteria ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_exam_criteria_updated_at
BEFORE UPDATE ON public.exam_criteria
FOR EACH ROW EXECUTE FUNCTION public.touch_app_content_updated_at();

-- 11. Calendário vacinal recomendado
CREATE TABLE public.vaccine_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vacina TEXT NOT NULL, -- 'dTpa', 'hepatite_b', 'influenza', 'covid'
  semana_min INT NOT NULL DEFAULT 0,
  semana_max INT,
  obrigatoria BOOLEAN NOT NULL DEFAULT true,
  mensagem TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vaccine_schedule ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_vaccine_schedule_updated_at
BEFORE UPDATE ON public.vaccine_schedule
FOR EACH ROW EXECUTE FUNCTION public.touch_app_content_updated_at();

-- 12. Medições clínicas da gestante
CREATE TABLE public.clinical_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gestante_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parametro TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  semana_gestacional INT,
  data_medicao DATE NOT NULL DEFAULT CURRENT_DATE,
  registrado_por UUID REFERENCES auth.users(id),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clinical_measurements ENABLE ROW LEVEL SECURITY;

-- 13. Resultados de exames
CREATE TABLE public.exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gestante_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_exame TEXT NOT NULL,
  resultado TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'normal', -- 'normal' | 'alterado'
  data_exame DATE NOT NULL DEFAULT CURRENT_DATE,
  registrado_por UUID REFERENCES auth.users(id),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- 14. Vacinas aplicadas
CREATE TABLE public.vaccinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gestante_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vacina TEXT NOT NULL,
  data_aplicacao DATE NOT NULL DEFAULT CURRENT_DATE,
  registrado_por UUID REFERENCES auth.users(id),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vaccinations ENABLE ROW LEVEL SECURITY;

-- RLS para dados clínicos: gestante vê próprios; profissional/admin podem ler/inserir
CREATE POLICY "Gestante vê próprias medições"
ON public.clinical_measurements FOR SELECT
TO authenticated
USING (
  auth.uid() = gestante_id
  OR public.has_role(auth.uid(), 'profissional')
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Profissional/admin inserem medições"
ON public.clinical_measurements FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'profissional')
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Gestante vê próprios exames"
ON public.exam_results FOR SELECT
TO authenticated
USING (
  auth.uid() = gestante_id
  OR public.has_role(auth.uid(), 'profissional')
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Profissional/admin inserem exames"
ON public.exam_results FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'profissional')
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Gestante vê próprias vacinas"
ON public.vaccinations FOR SELECT
TO authenticated
USING (
  auth.uid() = gestante_id
  OR public.has_role(auth.uid(), 'profissional')
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Profissional/admin inserem vacinas"
ON public.vaccinations FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'profissional')
  OR public.has_role(auth.uid(), 'admin')
);

-- RLS para regras: público autenticado lê; admin gerencia
CREATE POLICY "Autenticados leem faixas"
ON public.reference_ranges FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin gerencia faixas - insert"
ON public.reference_ranges FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin gerencia faixas - update"
ON public.reference_ranges FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin gerencia faixas - delete"
ON public.reference_ranges FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Autenticados leem critérios"
ON public.exam_criteria FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin gerencia critérios - insert"
ON public.exam_criteria FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin gerencia critérios - update"
ON public.exam_criteria FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin gerencia critérios - delete"
ON public.exam_criteria FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Autenticados leem calendário vacinal"
ON public.vaccine_schedule FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin gerencia calendário - insert"
ON public.vaccine_schedule FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin gerencia calendário - update"
ON public.vaccine_schedule FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin gerencia calendário - delete"
ON public.vaccine_schedule FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 15. Função que retorna alertas ativos cruzando dados clínicos × regras
CREATE OR REPLACE FUNCTION public.get_active_alerts(_gestante_id UUID)
RETURNS TABLE (
  id TEXT,
  origem TEXT,
  severidade TEXT,
  titulo TEXT,
  mensagem TEXT,
  data DATE
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Medições fora da faixa
  SELECT
    'med_' || cm.id::text AS id,
    'medicao'::text AS origem,
    rr.severidade,
    ('Valor fora do padrão: ' || cm.parametro)::text AS titulo,
    (rr.mensagem || ' (valor: ' || cm.valor || COALESCE(' ' || rr.unidade, '') || ')')::text AS mensagem,
    cm.data_medicao AS data
  FROM clinical_measurements cm
  JOIN reference_ranges rr
    ON rr.parametro = cm.parametro
   AND COALESCE(cm.semana_gestacional, 0) BETWEEN rr.semana_min AND rr.semana_max
  WHERE cm.gestante_id = _gestante_id
    AND (
      (rr.valor_min IS NOT NULL AND cm.valor < rr.valor_min)
      OR (rr.valor_max IS NOT NULL AND cm.valor > rr.valor_max)
    )

  UNION ALL

  -- Exames alterados
  SELECT
    'ex_' || er.id::text,
    'exame'::text,
    COALESCE(ec.severidade, 'atencao'),
    ('Exame alterado: ' || er.tipo_exame)::text,
    COALESCE(ec.mensagem, 'Resultado fora do padrão')::text,
    er.data_exame
  FROM exam_results er
  LEFT JOIN exam_criteria ec ON ec.tipo_exame = er.tipo_exame
  WHERE er.gestante_id = _gestante_id
    AND er.status = 'alterado'

  UNION ALL

  -- Vacinas em atraso (semana atual estimada via última medição com semana_gestacional)
  SELECT
    'vac_' || vs.id::text,
    'vacina'::text,
    'atencao'::text,
    ('Vacina em atraso: ' || vs.vacina)::text,
    vs.mensagem,
    CURRENT_DATE
  FROM vaccine_schedule vs
  WHERE vs.obrigatoria = true
    AND COALESCE(
      (SELECT MAX(semana_gestacional) FROM clinical_measurements
       WHERE gestante_id = _gestante_id AND semana_gestacional IS NOT NULL),
      0
    ) >= vs.semana_min
    AND NOT EXISTS (
      SELECT 1 FROM vaccinations v
      WHERE v.gestante_id = _gestante_id AND v.vacina = vs.vacina
    );
$$;

-- ============================================================
-- FASE C: Profissionais + Agendamentos reais
-- ============================================================

-- 16. Profissionais
CREATE TABLE public.professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  especialidade TEXT NOT NULL,
  registro TEXT, -- CRM/COREN
  bio TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_professionals_updated_at
BEFORE UPDATE ON public.professionals
FOR EACH ROW EXECUTE FUNCTION public.touch_app_content_updated_at();

-- 17. Slots de agendamento
CREATE TABLE public.appointment_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  data_hora TIMESTAMPTZ NOT NULL,
  duracao_min INT NOT NULL DEFAULT 30,
  modalidade TEXT NOT NULL DEFAULT 'videochamada', -- 'videochamada' | 'presencial'
  status TEXT NOT NULL DEFAULT 'disponivel', -- 'disponivel' | 'reservado' | 'realizado' | 'cancelado'
  gestante_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reservado_em TIMESTAMPTZ,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.appointment_slots ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_slots_status_data ON public.appointment_slots (status, data_hora);
CREATE INDEX idx_slots_professional ON public.appointment_slots (professional_id);
CREATE INDEX idx_slots_gestante ON public.appointment_slots (gestante_id);

CREATE TRIGGER update_slots_updated_at
BEFORE UPDATE ON public.appointment_slots
FOR EACH ROW EXECUTE FUNCTION public.touch_app_content_updated_at();

-- RLS professionals
CREATE POLICY "Autenticados leem profissionais ativos"
ON public.professionals FOR SELECT TO authenticated
USING (ativo = true OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Profissional edita próprio cadastro"
ON public.professionals FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin cadastra profissional"
ON public.professionals FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

CREATE POLICY "Admin remove profissional"
ON public.professionals FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS appointment_slots
CREATE POLICY "Gestante vê slots disponíveis ou próprios"
ON public.appointment_slots FOR SELECT TO authenticated
USING (
  status = 'disponivel'
  OR auth.uid() = gestante_id
  OR EXISTS (SELECT 1 FROM professionals p WHERE p.id = professional_id AND p.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Profissional cria próprios slots"
ON public.appointment_slots FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM professionals p WHERE p.id = professional_id AND p.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Profissional/admin atualizam slots"
ON public.appointment_slots FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM professionals p WHERE p.id = professional_id AND p.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR auth.uid() = gestante_id
);

CREATE POLICY "Profissional/admin removem slots"
ON public.appointment_slots FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM professionals p WHERE p.id = professional_id AND p.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- 18. Função atômica de booking (evita double-booking)
CREATE OR REPLACE FUNCTION public.book_slot(_slot_id UUID)
RETURNS TABLE (success BOOLEAN, message TEXT, slot_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
      reservado_em = now()
  WHERE id = _slot_id
    AND status = 'disponivel'
  RETURNING id INTO _updated;

  IF _updated IS NULL THEN
    RETURN QUERY SELECT false, 'Horário indisponível'::text, _slot_id;
  ELSE
    RETURN QUERY SELECT true, 'Reservado com sucesso'::text, _updated;
  END IF;
END;
$$;