
-- 1. Novas colunas em materiais
ALTER TABLE public.materiais
  ADD COLUMN IF NOT EXISTS acesso text NOT NULL DEFAULT 'publico',
  ADD COLUMN IF NOT EXISTS link_compra text,
  ADD COLUMN IF NOT EXISTS plataforma_venda text,
  ADD COLUMN IF NOT EXISTS preco_label text,
  ADD COLUMN IF NOT EXISTS cta_label text;

ALTER TABLE public.materiais
  DROP CONSTRAINT IF EXISTS materiais_acesso_check;
ALTER TABLE public.materiais
  ADD CONSTRAINT materiais_acesso_check CHECK (acesso IN ('publico','restrito'));

-- 2. Tabela material_acessos
CREATE TABLE IF NOT EXISTS public.material_acessos (
  material_id uuid NOT NULL,
  user_id uuid NOT NULL,
  liberado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (material_id, user_id)
);

ALTER TABLE public.material_acessos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin gerencia acessos - select" ON public.material_acessos;
CREATE POLICY "Admin gerencia acessos - select" ON public.material_acessos
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin gerencia acessos - insert" ON public.material_acessos;
CREATE POLICY "Admin gerencia acessos - insert" ON public.material_acessos
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin gerencia acessos - delete" ON public.material_acessos;
CREATE POLICY "Admin gerencia acessos - delete" ON public.material_acessos
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Função pode_ver_material
CREATE OR REPLACE FUNCTION public.pode_ver_material(_user uuid, _mat uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.materiais m
    WHERE m.id = _mat
      AND m.publicado = true
      AND (
        (m.acesso = 'publico' AND m.area = 'gratis')
        OR (m.acesso = 'publico' AND m.link_compra IS NOT NULL)
        OR (m.acesso = 'publico' AND m.area = 'pago' AND EXISTS (
             SELECT 1 FROM public.app_acesso_pago a
             WHERE a.user_id = _user AND a.ativo = true
           ))
        OR EXISTS (
             SELECT 1 FROM public.material_acessos ma
             WHERE ma.material_id = _mat AND ma.user_id = _user
           )
        OR (_user IS NOT NULL AND public.has_role(_user, 'admin'::app_role))
      )
  )
$$;

-- 4. Recriar policies SELECT de materiais
DROP POLICY IF EXISTS "Aluno com acesso le materiais pagos" ON public.materiais;
DROP POLICY IF EXISTS "Publico le materiais gratis publicados" ON public.materiais;

-- Anônimo + autenticado: grátis públicos ou pagos públicos com link de compra (vitrine)
CREATE POLICY "Publico le vitrine"
ON public.materiais
FOR SELECT
TO anon, authenticated
USING (
  publicado = true
  AND acesso = 'publico'
  AND (area = 'gratis' OR link_compra IS NOT NULL)
);

-- Autenticado: regras completas via função
CREATE POLICY "Autenticado le materiais permitidos"
ON public.materiais
FOR SELECT
TO authenticated
USING (public.pode_ver_material(auth.uid(), id));
