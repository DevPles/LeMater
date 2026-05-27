
-- =====================================================
-- 1. Adiciona campos de venda em materiais e adiciona tipo "servico" em appointment_slots
-- =====================================================
ALTER TABLE public.materiais
  ADD COLUMN IF NOT EXISTS preco_centavos integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS produto_externo_id text;

ALTER TABLE public.appointment_slots
  ADD COLUMN IF NOT EXISTS preco_centavos integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS produto_externo_id text,
  ADD COLUMN IF NOT EXISTS requer_pagamento boolean NOT NULL DEFAULT false;

-- =====================================================
-- 2. Ofertas de venda (polimórfica)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.product_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_tipo text NOT NULL CHECK (produto_tipo IN ('curso','aula','material','servico')),
  produto_id uuid NOT NULL,
  pais text NOT NULL DEFAULT 'BR' CHECK (pais IN ('BR','PT','EU','US','OUTROS')),
  plataforma text NOT NULL CHECK (plataforma IN ('mercadopago','hotmart','kiwify','eduzz','stripe','teachable','gumroad','manual')),
  tipo_link text NOT NULL DEFAULT 'externo' CHECK (tipo_link IN ('nativo','externo')),
  url_externo text,
  produto_externo_id text,
  preco_centavos integer NOT NULL DEFAULT 0,
  moeda text NOT NULL DEFAULT 'BRL' CHECK (moeda IN ('BRL','USD','EUR')),
  label text,
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_offers_produto ON public.product_offers(produto_tipo, produto_id);
CREATE INDEX IF NOT EXISTS idx_offers_plat_ext ON public.product_offers(plataforma, produto_externo_id);

GRANT SELECT ON public.product_offers TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_offers TO authenticated;
GRANT ALL ON public.product_offers TO service_role;

ALTER TABLE public.product_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publico le ofertas ativas" ON public.product_offers
  FOR SELECT TO anon, authenticated USING (ativo = true OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admin cria ofertas" ON public.product_offers
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admin edita ofertas" ON public.product_offers
  FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admin remove ofertas" ON public.product_offers
  FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_offers_touch BEFORE UPDATE ON public.product_offers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =====================================================
-- 3. Pedidos unificados (substitui hotmart_compras como fonte da verdade)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_tipo text NOT NULL CHECK (produto_tipo IN ('curso','aula','material','servico')),
  produto_id uuid NOT NULL,
  comprador_email text NOT NULL,
  comprador_nome text,
  comprador_user_id uuid,
  plataforma text NOT NULL CHECK (plataforma IN ('mercadopago','hotmart','kiwify','eduzz','stripe','teachable','gumroad','manual')),
  transaction_id_externo text,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovado','recusado','reembolsado','cancelado')),
  valor_centavos integer NOT NULL DEFAULT 0,
  moeda text NOT NULL DEFAULT 'BRL',
  cupom_codigo text,
  pais text,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  aprovacao_manual boolean NOT NULL DEFAULT false,
  aprovado_em timestamptz,
  aprovado_por uuid,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orders_plat_tx_unique UNIQUE (plataforma, transaction_id_externo)
);

CREATE INDEX IF NOT EXISTS idx_orders_produto ON public.orders(produto_tipo, produto_id);
CREATE INDEX IF NOT EXISTS idx_orders_email ON public.orders(comprador_email);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(comprador_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comprador ve proprios pedidos" ON public.orders
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(),'admin'::app_role)
    OR comprador_user_id = auth.uid()
    OR comprador_email = (SELECT email FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  );
CREATE POLICY "Admin gerencia pedidos - insert" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admin gerencia pedidos - update" ON public.orders
  FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admin gerencia pedidos - delete" ON public.orders
  FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_orders_touch BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =====================================================
-- 4. Função de liberação (idempotente)
-- =====================================================
CREATE OR REPLACE FUNCTION public.liberar_acesso_por_pedido(_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_user_id uuid;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = _order_id;
  IF v_order.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'msg', 'pedido nao encontrado');
  END IF;
  IF v_order.status <> 'aprovado' THEN
    RETURN jsonb_build_object('ok', false, 'msg', 'pedido nao aprovado');
  END IF;

  -- Tenta achar user_id pelo email se ainda nao tem
  v_user_id := v_order.comprador_user_id;
  IF v_user_id IS NULL THEN
    SELECT user_id INTO v_user_id FROM public.profiles
    WHERE lower(email) = lower(v_order.comprador_email) LIMIT 1;
    IF v_user_id IS NOT NULL THEN
      UPDATE public.orders SET comprador_user_id = v_user_id WHERE id = _order_id;
    END IF;
  END IF;

  -- Se ainda sem user_id (comprou sem ter conta), so registra; libera no primeiro login via trigger
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'msg', 'pedido aprovado, aguardando cadastro do comprador');
  END IF;

  IF v_order.produto_tipo = 'curso' THEN
    INSERT INTO public.curso_matriculas (curso_id, user_id, origem, ativo, liberado_por)
    VALUES (v_order.produto_id, v_user_id, v_order.plataforma, true, v_order.aprovado_por)
    ON CONFLICT DO NOTHING;
  ELSIF v_order.produto_tipo = 'aula' THEN
    INSERT INTO public.aula_matriculas (aula_id, user_id, origem, ativo, liberado_por)
    VALUES (v_order.produto_id, v_user_id, v_order.plataforma, true, v_order.aprovado_por)
    ON CONFLICT DO NOTHING;
  ELSIF v_order.produto_tipo = 'material' THEN
    INSERT INTO public.material_acessos (material_id, user_id, liberado_por)
    VALUES (v_order.produto_id, v_user_id, v_order.aprovado_por)
    ON CONFLICT DO NOTHING;
  ELSIF v_order.produto_tipo = 'servico' THEN
    UPDATE public.appointment_slots
       SET status = 'reservado',
           gestante_id = v_user_id,
           reservado_em = COALESCE(reservado_em, now())
     WHERE id = v_order.produto_id
       AND (gestante_id IS NULL OR gestante_id = v_user_id);
  END IF;

  RETURN jsonb_build_object('ok', true, 'msg', 'liberado');
END;
$$;

CREATE OR REPLACE FUNCTION public.revogar_acesso_por_pedido(_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = _order_id;
  IF v_order.id IS NULL OR v_order.comprador_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false);
  END IF;

  IF v_order.produto_tipo = 'curso' THEN
    UPDATE public.curso_matriculas SET ativo = false
     WHERE curso_id = v_order.produto_id AND user_id = v_order.comprador_user_id;
  ELSIF v_order.produto_tipo = 'aula' THEN
    UPDATE public.aula_matriculas SET ativo = false
     WHERE aula_id = v_order.produto_id AND user_id = v_order.comprador_user_id;
  ELSIF v_order.produto_tipo = 'material' THEN
    DELETE FROM public.material_acessos
     WHERE material_id = v_order.produto_id AND user_id = v_order.comprador_user_id;
  ELSIF v_order.produto_tipo = 'servico' THEN
    UPDATE public.appointment_slots
       SET status = 'disponivel', gestante_id = NULL, reservado_em = NULL
     WHERE id = v_order.produto_id;
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- =====================================================
-- 5. Trigger: ao novo usuario, libera pedidos pendentes vinculados ao email
-- =====================================================
CREATE OR REPLACE FUNCTION public.liberar_pedidos_orfaos_do_usuario()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
BEGIN
  IF NEW.email IS NULL THEN RETURN NEW; END IF;
  FOR r IN
    SELECT id FROM public.orders
    WHERE comprador_user_id IS NULL
      AND status = 'aprovado'
      AND lower(comprador_email) = lower(NEW.email)
  LOOP
    UPDATE public.orders SET comprador_user_id = NEW.user_id WHERE id = r.id;
    PERFORM public.liberar_acesso_por_pedido(r.id);
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_liberar_pedidos_orfaos ON public.profiles;
CREATE TRIGGER trg_liberar_pedidos_orfaos
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.liberar_pedidos_orfaos_do_usuario();

-- =====================================================
-- 6. Backfill: importa links_compra existentes para product_offers
-- =====================================================
INSERT INTO public.product_offers (produto_tipo, produto_id, pais, plataforma, tipo_link, url_externo, preco_centavos, moeda, label)
SELECT
  'curso',
  c.id,
  CASE
    WHEN upper(coalesce(l->>'pais','')) IN ('BR','BRASIL') THEN 'BR'
    WHEN upper(coalesce(l->>'pais','')) IN ('PT','PORTUGAL') THEN 'PT'
    WHEN upper(coalesce(l->>'pais','')) IN ('US','EUA','USA') THEN 'US'
    WHEN upper(coalesce(l->>'pais','')) IN ('EU','EUROPA') THEN 'EU'
    ELSE 'BR'
  END,
  CASE lower(coalesce(l->>'plataforma',''))
    WHEN 'hotmart' THEN 'hotmart'
    WHEN 'kiwify' THEN 'kiwify'
    WHEN 'eduzz' THEN 'eduzz'
    WHEN 'stripe' THEN 'stripe'
    WHEN 'teachable' THEN 'teachable'
    WHEN 'gumroad' THEN 'gumroad'
    WHEN 'mercado pago' THEN 'mercadopago'
    WHEN 'mercadopago' THEN 'mercadopago'
    ELSE 'manual'
  END,
  'externo',
  l->>'url',
  COALESCE(c.preco_centavos, 0),
  'BRL',
  l->>'plataforma'
FROM public.cursos c, jsonb_array_elements(COALESCE(c.links_compra,'[]'::jsonb)) l
WHERE (l->>'url') IS NOT NULL AND length(l->>'url') > 5;

-- Oferta nativa para cursos com preco no Brasil
INSERT INTO public.product_offers (produto_tipo, produto_id, pais, plataforma, tipo_link, preco_centavos, moeda, label)
SELECT 'curso', c.id, 'BR', 'mercadopago', 'nativo', c.preco_centavos, 'BRL', 'Comprar com Pix/Cartão'
FROM public.cursos c
WHERE c.preco_centavos > 0
  AND NOT EXISTS (SELECT 1 FROM public.product_offers o WHERE o.produto_tipo='curso' AND o.produto_id=c.id AND o.plataforma='mercadopago');

INSERT INTO public.product_offers (produto_tipo, produto_id, pais, plataforma, tipo_link, url_externo, preco_centavos, moeda, label)
SELECT
  'aula',
  a.id,
  'BR',
  CASE lower(coalesce(l->>'plataforma',''))
    WHEN 'hotmart' THEN 'hotmart'
    WHEN 'kiwify' THEN 'kiwify'
    WHEN 'eduzz' THEN 'eduzz'
    WHEN 'stripe' THEN 'stripe'
    WHEN 'teachable' THEN 'teachable'
    WHEN 'gumroad' THEN 'gumroad'
    ELSE 'manual'
  END,
  'externo',
  l->>'url',
  COALESCE(a.preco_centavos, 0),
  'BRL',
  l->>'plataforma'
FROM public.curso_aulas a, jsonb_array_elements(COALESCE(a.links_compra,'[]'::jsonb)) l
WHERE (l->>'url') IS NOT NULL AND length(l->>'url') > 5;

INSERT INTO public.product_offers (produto_tipo, produto_id, pais, plataforma, tipo_link, preco_centavos, moeda, label)
SELECT 'aula', a.id, 'BR', 'mercadopago', 'nativo', a.preco_centavos, 'BRL', 'Comprar aula avulsa'
FROM public.curso_aulas a
WHERE a.preco_centavos > 0
  AND NOT EXISTS (SELECT 1 FROM public.product_offers o WHERE o.produto_tipo='aula' AND o.produto_id=a.id AND o.plataforma='mercadopago');

-- Materiais pagos
INSERT INTO public.product_offers (produto_tipo, produto_id, pais, plataforma, tipo_link, url_externo, preco_centavos, moeda, label)
SELECT
  'material', m.id, 'BR',
  CASE lower(coalesce(m.plataforma_venda,''))
    WHEN 'hotmart' THEN 'hotmart'
    WHEN 'kiwify' THEN 'kiwify'
    WHEN 'eduzz' THEN 'eduzz'
    WHEN 'stripe' THEN 'stripe'
    WHEN 'teachable' THEN 'teachable'
    WHEN 'gumroad' THEN 'gumroad'
    ELSE 'manual'
  END,
  'externo', m.link_compra, COALESCE(m.preco_centavos, 0), 'BRL', m.plataforma_venda
FROM public.materiais m
WHERE m.link_compra IS NOT NULL AND length(m.link_compra) > 5;
