
-- 1. app_acesso_pago primeiro (referenciada pelas policies de materiais)
CREATE TABLE IF NOT EXISTS public.app_acesso_pago (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  origem TEXT NOT NULL DEFAULT 'manual',
  expira_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_acesso_pago ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario le proprio acesso pago"
  ON public.app_acesso_pago FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin acesso pago insert"
  ON public.app_acesso_pago FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin acesso pago update"
  ON public.app_acesso_pago FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin acesso pago delete"
  ON public.app_acesso_pago FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER app_acesso_pago_updated_at
  BEFORE UPDATE ON public.app_acesso_pago
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2. materiais
CREATE TABLE IF NOT EXISTS public.materiais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL DEFAULT 'geral',
  tipo TEXT NOT NULL CHECK (tipo IN ('pdf','video_externo','video_upload','artigo')),
  area TEXT NOT NULL CHECK (area IN ('gratis','pago')),
  conteudo_url TEXT,
  conteudo_html TEXT,
  capa_url TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  publicado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publico le materiais gratis publicados"
  ON public.materiais FOR SELECT TO anon, authenticated
  USING (area = 'gratis' AND publicado = true);

CREATE POLICY "Aluno com acesso le materiais pagos"
  ON public.materiais FOR SELECT TO authenticated
  USING (
    area = 'pago' AND publicado = true
    AND EXISTS (SELECT 1 FROM public.app_acesso_pago a WHERE a.user_id = auth.uid() AND a.ativo = true)
  );

CREATE POLICY "Admin le todos materiais"
  ON public.materiais FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin insere materiais"
  ON public.materiais FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin atualiza materiais"
  ON public.materiais FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin remove materiais"
  ON public.materiais FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER materiais_updated_at
  BEFORE UPDATE ON public.materiais
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3. leads_gratis
CREATE TABLE IF NOT EXISTS public.leads_gratis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES public.materiais(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leads_gratis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer um envia lead gratis"
  ON public.leads_gratis FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admin le leads gratis"
  ON public.leads_gratis FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. hotmart_compras
CREATE TABLE IF NOT EXISTS public.hotmart_compras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_comprador TEXT NOT NULL,
  nome_comprador TEXT,
  transaction_id TEXT,
  produto TEXT,
  evento TEXT NOT NULL,
  status TEXT NOT NULL,
  raw_payload JSONB NOT NULL,
  processado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hotmart_compras_email_idx ON public.hotmart_compras (email_comprador);

ALTER TABLE public.hotmart_compras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin le compras hotmart"
  ON public.hotmart_compras FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('materiais-pdf', 'materiais-pdf', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('materiais-video', 'materiais-video', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('materiais-capas', 'materiais-capas', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Capas publicas leitura"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'materiais-capas');

CREATE POLICY "Capas admin insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'materiais-capas' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Capas admin update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'materiais-capas' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Capas admin delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'materiais-capas' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "PDFs leitura aluno ou admin"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'materiais-pdf' AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (SELECT 1 FROM public.app_acesso_pago a WHERE a.user_id = auth.uid() AND a.ativo = true)
    )
  );

CREATE POLICY "PDFs admin insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'materiais-pdf' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "PDFs admin update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'materiais-pdf' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "PDFs admin delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'materiais-pdf' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Videos leitura aluno ou admin"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'materiais-video' AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (SELECT 1 FROM public.app_acesso_pago a WHERE a.user_id = auth.uid() AND a.ativo = true)
    )
  );

CREATE POLICY "Videos admin insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'materiais-video' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Videos admin update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'materiais-video' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Videos admin delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'materiais-video' AND has_role(auth.uid(), 'admin'::app_role));
