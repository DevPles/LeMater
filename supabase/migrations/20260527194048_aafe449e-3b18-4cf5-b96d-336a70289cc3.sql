
-- Permite pedidos multi-item (carrinho)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_produto_tipo_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_produto_tipo_check
  CHECK (produto_tipo = ANY (ARRAY['curso','aula','material','servico','cart','lesson','module','pathway','bundle','all_access']));

-- produto_id agora pode ser nulo (pedidos de carrinho)
ALTER TABLE public.orders ALTER COLUMN produto_id DROP NOT NULL;

-- Estende liberar_acesso_por_pedido para criar entitlements a partir de order_items
CREATE OR REPLACE FUNCTION public.liberar_acesso_por_pedido(_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_order public.orders%ROWTYPE;
  v_user_id uuid;
  v_item record;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = _order_id;
  IF v_order.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'msg', 'pedido nao encontrado');
  END IF;
  IF v_order.status <> 'aprovado' THEN
    RETURN jsonb_build_object('ok', false, 'msg', 'pedido nao aprovado');
  END IF;

  v_user_id := v_order.comprador_user_id;
  IF v_user_id IS NULL THEN
    SELECT user_id INTO v_user_id FROM public.profiles
    WHERE lower(email) = lower(v_order.comprador_email) LIMIT 1;
    IF v_user_id IS NOT NULL THEN
      UPDATE public.orders SET comprador_user_id = v_user_id WHERE id = _order_id;
    END IF;
  END IF;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'msg', 'pedido aprovado, aguardando cadastro do comprador');
  END IF;

  -- Compatibilidade: tipos legados (uma única compra)
  IF v_order.produto_tipo = 'curso' AND v_order.produto_id IS NOT NULL THEN
    INSERT INTO public.curso_matriculas (curso_id, user_id, origem, ativo, liberado_por)
    VALUES (v_order.produto_id, v_user_id, v_order.plataforma, true, v_order.aprovado_por)
    ON CONFLICT DO NOTHING;
  ELSIF v_order.produto_tipo = 'aula' AND v_order.produto_id IS NOT NULL THEN
    INSERT INTO public.aula_matriculas (aula_id, user_id, origem, ativo, liberado_por)
    VALUES (v_order.produto_id, v_user_id, v_order.plataforma, true, v_order.aprovado_por)
    ON CONFLICT DO NOTHING;
  ELSIF v_order.produto_tipo = 'material' AND v_order.produto_id IS NOT NULL THEN
    INSERT INTO public.material_acessos (material_id, user_id, liberado_por)
    VALUES (v_order.produto_id, v_user_id, v_order.aprovado_por)
    ON CONFLICT DO NOTHING;
  ELSIF v_order.produto_tipo = 'servico' AND v_order.produto_id IS NOT NULL THEN
    UPDATE public.appointment_slots
       SET status = 'reservado',
           gestante_id = v_user_id,
           reservado_em = COALESCE(reservado_em, now())
     WHERE id = v_order.produto_id
       AND (gestante_id IS NULL OR gestante_id = v_user_id);
  -- Novo catálogo modular: aula/módulo/trilha/pacote/all_access direto na ordem
  ELSIF v_order.produto_tipo IN ('lesson','module','pathway','bundle','all_access') AND v_order.produto_id IS NOT NULL THEN
    INSERT INTO public.entitlements (user_id, item_type, item_id, source, source_ref, granted_by)
    VALUES (v_user_id, v_order.produto_tipo, v_order.produto_id, 'order', _order_id, v_order.aprovado_por)
    ON CONFLICT (user_id, item_type, COALESCE(item_id, '00000000-0000-0000-0000-000000000000'::uuid), source) DO UPDATE
      SET active = true, source_ref = EXCLUDED.source_ref, expires_at = NULL;
  END IF;

  -- Carrinho / multi-item: percorre order_items e libera tudo
  IF v_order.produto_tipo = 'cart' OR EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id = _order_id) THEN
    FOR v_item IN SELECT * FROM public.order_items WHERE order_id = _order_id LOOP
      IF v_item.item_type IN ('lesson','module','pathway','bundle','all_access') THEN
        INSERT INTO public.entitlements (user_id, item_type, item_id, source, source_ref, granted_by)
        VALUES (v_user_id, v_item.item_type, v_item.item_id, 'order', _order_id, v_order.aprovado_por)
        ON CONFLICT (user_id, item_type, COALESCE(item_id, '00000000-0000-0000-0000-000000000000'::uuid), source) DO UPDATE
          SET active = true, source_ref = EXCLUDED.source_ref, expires_at = NULL;
      ELSIF v_item.item_type = 'curso' THEN
        INSERT INTO public.curso_matriculas (curso_id, user_id, origem, ativo, liberado_por)
        VALUES (v_item.item_id, v_user_id, v_order.plataforma, true, v_order.aprovado_por)
        ON CONFLICT DO NOTHING;
      ELSIF v_item.item_type = 'aula' THEN
        INSERT INTO public.aula_matriculas (aula_id, user_id, origem, ativo, liberado_por)
        VALUES (v_item.item_id, v_user_id, v_order.plataforma, true, v_order.aprovado_por)
        ON CONFLICT DO NOTHING;
      ELSIF v_item.item_type = 'material' THEN
        INSERT INTO public.material_acessos (material_id, user_id, liberado_por)
        VALUES (v_item.item_id, v_user_id, v_order.aprovado_por)
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;

    -- Limpa o carrinho do comprador após sucesso
    DELETE FROM public.cart_items WHERE user_id = v_user_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'msg', 'liberado');
END;
$function$;

CREATE OR REPLACE FUNCTION public.revogar_acesso_por_pedido(_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = _order_id;
  IF v_order.id IS NULL OR v_order.comprador_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false);
  END IF;

  IF v_order.produto_tipo = 'curso' AND v_order.produto_id IS NOT NULL THEN
    UPDATE public.curso_matriculas SET ativo = false
     WHERE curso_id = v_order.produto_id AND user_id = v_order.comprador_user_id;
  ELSIF v_order.produto_tipo = 'aula' AND v_order.produto_id IS NOT NULL THEN
    UPDATE public.aula_matriculas SET ativo = false
     WHERE aula_id = v_order.produto_id AND user_id = v_order.comprador_user_id;
  ELSIF v_order.produto_tipo = 'material' AND v_order.produto_id IS NOT NULL THEN
    DELETE FROM public.material_acessos
     WHERE material_id = v_order.produto_id AND user_id = v_order.comprador_user_id;
  ELSIF v_order.produto_tipo = 'servico' AND v_order.produto_id IS NOT NULL THEN
    UPDATE public.appointment_slots
       SET status = 'disponivel', gestante_id = NULL, reservado_em = NULL
     WHERE id = v_order.produto_id;
  END IF;

  -- Revoga entitlements criados a partir desta ordem (tipos modulares e carrinho)
  UPDATE public.entitlements SET active = false
   WHERE source = 'order' AND source_ref = _order_id;

  RETURN jsonb_build_object('ok', true);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.liberar_acesso_por_pedido(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.revogar_acesso_por_pedido(uuid) FROM anon;
