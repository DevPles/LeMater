REVOKE EXECUTE ON FUNCTION public.has_entitlement(uuid, text, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.lesson_access(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.recommend_lessons(uuid, integer) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_entitlement(uuid, text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.lesson_access(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.recommend_lessons(uuid, integer) TO authenticated, service_role;