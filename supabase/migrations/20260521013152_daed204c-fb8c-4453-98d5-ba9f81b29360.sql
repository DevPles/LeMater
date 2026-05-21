
CREATE TABLE public.evaluation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  gestante_id uuid NOT NULL,
  appointment_id uuid,
  especialidade text NOT NULL CHECK (especialidade IN ('medico','nutricionista','psicologo')),
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','respondida','expirada')),
  expira_em timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_eval_req_gestante ON public.evaluation_requests(gestante_id);
CREATE INDEX idx_eval_req_appointment ON public.evaluation_requests(appointment_id);

ALTER TABLE public.evaluation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gestante cria proprio pedido"
ON public.evaluation_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = gestante_id);

CREATE POLICY "Gestante e admin veem pedidos"
ON public.evaluation_requests FOR SELECT TO authenticated
USING (auth.uid() = gestante_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Gestante e admin removem pedidos"
ON public.evaluation_requests FOR DELETE TO authenticated
USING (auth.uid() = gestante_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.evaluation_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.evaluation_requests(id) ON DELETE CASCADE,
  professional_nome text NOT NULL,
  professional_registro_tipo text NOT NULL CHECK (professional_registro_tipo IN ('CRM','CRN','CRP')),
  professional_registro_numero text NOT NULL,
  professional_registro_uf text NOT NULL,
  respostas jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_eval_resp_request ON public.evaluation_responses(request_id);

ALTER TABLE public.evaluation_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gestante e admin veem respostas"
ON public.evaluation_responses FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.evaluation_requests r
    WHERE r.id = evaluation_responses.request_id
      AND (r.gestante_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Função pública (anon) para gravar a resposta validando o token.
CREATE OR REPLACE FUNCTION public.submit_evaluation_response(
  _token uuid,
  _nome text,
  _registro_tipo text,
  _registro_numero text,
  _registro_uf text,
  _respostas jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.evaluation_requests%ROWTYPE;
  v_resp_id uuid;
BEGIN
  SELECT * INTO v_req FROM public.evaluation_requests WHERE token = _token;
  IF v_req.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Link inválido');
  END IF;
  IF v_req.status = 'respondida' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Esta avaliação já foi preenchida');
  END IF;
  IF v_req.expira_em < now() THEN
    UPDATE public.evaluation_requests SET status = 'expirada' WHERE id = v_req.id;
    RETURN jsonb_build_object('success', false, 'message', 'Link expirado');
  END IF;
  IF _registro_tipo NOT IN ('CRM','CRN','CRP') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Tipo de registro inválido');
  END IF;
  IF length(coalesce(trim(_nome),'')) < 3
     OR length(coalesce(trim(_registro_numero),'')) < 3
     OR length(coalesce(trim(_registro_uf),'')) <> 2 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Dados do profissional incompletos');
  END IF;

  INSERT INTO public.evaluation_responses (
    request_id, professional_nome, professional_registro_tipo,
    professional_registro_numero, professional_registro_uf, respostas
  ) VALUES (
    v_req.id, trim(_nome), _registro_tipo,
    trim(_registro_numero), upper(trim(_registro_uf)), coalesce(_respostas, '{}'::jsonb)
  ) RETURNING id INTO v_resp_id;

  UPDATE public.evaluation_requests SET status = 'respondida' WHERE id = v_req.id;

  RETURN jsonb_build_object('success', true, 'response_id', v_resp_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_evaluation_response(uuid,text,text,text,text,jsonb) TO anon, authenticated;

-- Função pública para ler infos mínimas do token (sem expor PII)
CREATE OR REPLACE FUNCTION public.get_evaluation_request_public(_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.evaluation_requests%ROWTYPE;
  v_gest_nome text;
BEGIN
  SELECT * INTO v_req FROM public.evaluation_requests WHERE token = _token;
  IF v_req.id IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT nome INTO v_gest_nome FROM public.profiles WHERE user_id = v_req.gestante_id;
  RETURN jsonb_build_object(
    'especialidade', v_req.especialidade,
    'status', v_req.status,
    'expira_em', v_req.expira_em,
    'gestante_nome', coalesce(v_gest_nome, 'Gestante')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_evaluation_request_public(uuid) TO anon, authenticated;
