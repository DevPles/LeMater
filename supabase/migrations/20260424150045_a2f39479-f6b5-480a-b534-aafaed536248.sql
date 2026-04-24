-- ============= Grupos dinâmicos =============
CREATE TABLE public.notification_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  filtros JSONB NOT NULL DEFAULT '{}'::jsonb,
  criado_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin lê grupos" ON public.notification_groups
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin cria grupos" ON public.notification_groups
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin edita grupos" ON public.notification_groups
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin remove grupos" ON public.notification_groups
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER notification_groups_updated_at
  BEFORE UPDATE ON public.notification_groups
  FOR EACH ROW EXECUTE FUNCTION public.touch_app_content_updated_at();

-- ============= Campanhas =============
CREATE TABLE public.notification_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.notification_groups(id) ON DELETE SET NULL,
  filtros_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  canal TEXT NOT NULL CHECK (canal IN ('push','whatsapp','ambos')),
  titulo TEXT,
  mensagem TEXT NOT NULL,
  template_origem TEXT,
  total_destinatarios INT NOT NULL DEFAULT 0,
  enviado_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin lê campanhas" ON public.notification_campaigns
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin cria campanhas" ON public.notification_campaigns
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============= Entregas individuais =============
CREATE TABLE public.notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.notification_campaigns(id) ON DELETE CASCADE,
  gestante_id UUID NOT NULL,
  canal TEXT NOT NULL CHECK (canal IN ('push','whatsapp')),
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente','enviado','entregue','lido','falha')),
  enviado_em TIMESTAMPTZ,
  lido_em TIMESTAMPTZ,
  erro TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin lê todas entregas" ON public.notification_deliveries
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = gestante_id);

CREATE POLICY "Admin cria entregas" ON public.notification_deliveries
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin atualiza entregas" ON public.notification_deliveries
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============= Índices =============
CREATE INDEX IF NOT EXISTS idx_profiles_telefone
  ON public.profiles(telefone) WHERE telefone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_campaign
  ON public.notification_deliveries(campaign_id);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_gestante
  ON public.notification_deliveries(gestante_id);

CREATE INDEX IF NOT EXISTS idx_notification_campaigns_created
  ON public.notification_campaigns(created_at DESC);