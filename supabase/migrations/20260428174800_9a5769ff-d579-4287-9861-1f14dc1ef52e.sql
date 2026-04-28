
-- Tabela para guardar senhas em texto quando o admin as define/redefine.
-- Senhas criadas pelo próprio usuário (signup público) NÃO aparecem aqui.
CREATE TABLE IF NOT EXISTS public.admin_managed_passwords (
  user_id uuid PRIMARY KEY,
  password_plaintext text NOT NULL,
  set_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_managed_passwords ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ler
CREATE POLICY "Admin lê senhas gerenciadas"
  ON public.admin_managed_passwords
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem inserir/atualizar/remover (em geral via service role)
CREATE POLICY "Admin grava senhas gerenciadas"
  ON public.admin_managed_passwords
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin atualiza senhas gerenciadas"
  ON public.admin_managed_passwords
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin remove senhas gerenciadas"
  ON public.admin_managed_passwords
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
