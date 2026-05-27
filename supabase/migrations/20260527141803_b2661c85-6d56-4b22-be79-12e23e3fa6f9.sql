
REVOKE EXECUTE ON FUNCTION public.liberar_acesso_por_pedido(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.liberar_acesso_por_pedido(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.revogar_acesso_por_pedido(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.revogar_acesso_por_pedido(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.liberar_pedidos_orfaos_do_usuario() FROM PUBLIC, anon, authenticated;
