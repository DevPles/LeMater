-- 1. Cupons
CREATE TABLE public.cupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  descricao text,
  desconto_pct numeric(5,2),
  desconto_centavos integer,
  curso_id uuid REFERENCES public.cursos(id) ON DELETE CASCADE,
  valido_de timestamptz,
  valido_ate timestamptz,
  max_usos integer,
  usos integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cupons_desconto_check CHECK (desconto_pct IS NOT NULL OR desconto_centavos IS NOT NULL)
);

CREATE INDEX cupons_codigo_idx ON public.cupons (lower(codigo));
ALTER TABLE public.cupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gerencia cupons - select" ON public.cupons FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin gerencia cupons - insert" ON public.cupons FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin gerencia cupons - update" ON public.cupons FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin gerencia cupons - delete" ON public.cupons FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER tg_cupons_updated_at BEFORE UPDATE ON public.cupons FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2. Mapeamento produto externo → curso
ALTER TABLE public.cursos ADD COLUMN IF NOT EXISTS produto_externo_id text;
CREATE INDEX IF NOT EXISTS cursos_produto_externo_idx ON public.cursos (produto_externo_id);

-- 3. Rastreio em hotmart_compras
ALTER TABLE public.hotmart_compras ADD COLUMN IF NOT EXISTS curso_id uuid REFERENCES public.cursos(id);
ALTER TABLE public.hotmart_compras ADD COLUMN IF NOT EXISTS cupom_codigo text;
ALTER TABLE public.hotmart_compras ADD COLUMN IF NOT EXISTS valor_centavos integer;
ALTER TABLE public.hotmart_compras ADD COLUMN IF NOT EXISTS plataforma text DEFAULT 'hotmart';

-- 4. Validação pública de cupom
CREATE OR REPLACE FUNCTION public.validate_cupom(_codigo text, _curso_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_c public.cupons%ROWTYPE;
  v_preco integer;
  v_desconto integer := 0;
  v_total integer;
BEGIN
  SELECT * INTO v_c FROM public.cupons
  WHERE lower(codigo) = lower(trim(_codigo)) AND ativo = true
  LIMIT 1;

  IF v_c.id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Cupom não encontrado');
  END IF;
  IF v_c.valido_de IS NOT NULL AND now() < v_c.valido_de THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Cupom ainda não está válido');
  END IF;
  IF v_c.valido_ate IS NOT NULL AND now() > v_c.valido_ate THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Cupom expirado');
  END IF;
  IF v_c.max_usos IS NOT NULL AND v_c.usos >= v_c.max_usos THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Cupom esgotado');
  END IF;
  IF v_c.curso_id IS NOT NULL AND _curso_id IS NOT NULL AND v_c.curso_id <> _curso_id THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Cupom não vale para este curso');
  END IF;

  IF _curso_id IS NOT NULL THEN
    SELECT preco_centavos INTO v_preco FROM public.cursos WHERE id = _curso_id;
    IF v_preco IS NULL THEN v_preco := 0; END IF;
    IF v_c.desconto_pct IS NOT NULL THEN
      v_desconto := round(v_preco * v_c.desconto_pct / 100.0);
    ELSE
      v_desconto := COALESCE(v_c.desconto_centavos, 0);
    END IF;
    IF v_desconto > v_preco THEN v_desconto := v_preco; END IF;
    v_total := v_preco - v_desconto;
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'codigo', v_c.codigo,
    'desconto_pct', v_c.desconto_pct,
    'desconto_centavos', v_c.desconto_centavos,
    'preco_centavos', v_preco,
    'desconto_aplicado_centavos', v_desconto,
    'total_centavos', v_total
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_cupom(text, uuid) TO anon, authenticated;