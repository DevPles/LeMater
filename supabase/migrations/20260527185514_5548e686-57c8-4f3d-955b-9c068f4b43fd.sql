
-- =====================================================================
-- FASE 1 — Fundação modular Le Mater
-- =====================================================================

-- ---------- MODULES ----------
CREATE TABLE public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  description text,
  emotional_context text,
  cover_image text,
  cover_video text,
  color text,
  "order" integer NOT NULL DEFAULT 0,
  visibility text NOT NULL DEFAULT 'public', -- public | premium | hidden
  active boolean NOT NULL DEFAULT true,
  seo_title text,
  seo_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.modules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modules TO authenticated;
GRANT ALL ON public.modules TO service_role;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active modules" ON public.modules FOR SELECT TO anon, authenticated
  USING ((active = true AND visibility <> 'hidden') OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin writes modules" ON public.modules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ---------- LESSONS ----------
CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  short_description text,
  full_description text,
  transformation text,
  benefits jsonb NOT NULL DEFAULT '[]'::jsonb,
  objectives jsonb NOT NULL DEFAULT '[]'::jsonb,
  audience text,
  thumbnail text,
  cover_image text,
  cover_video_url text,
  trailer_url text,
  duration_sec integer NOT NULL DEFAULT 0,
  difficulty text NOT NULL DEFAULT 'iniciante',
  tags text[] NOT NULL DEFAULT '{}',
  visibility text NOT NULL DEFAULT 'public', -- public | premium | hidden
  free_or_paid text NOT NULL DEFAULT 'paid', -- free | paid
  individual_price_centavos integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  preview_enabled boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  seo_title text,
  seo_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lessons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active lessons" ON public.lessons FOR SELECT TO anon, authenticated
  USING ((active = true AND visibility <> 'hidden') OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin writes lessons" ON public.lessons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX lessons_tags_idx ON public.lessons USING GIN (tags);

-- ---------- LESSON ↔ MODULE (N:N) ----------
CREATE TABLE public.lesson_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, module_id)
);
GRANT SELECT ON public.lesson_modules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_modules TO authenticated;
GRANT ALL ON public.lesson_modules TO service_role;
ALTER TABLE public.lesson_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads lesson_modules" ON public.lesson_modules FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin writes lesson_modules" ON public.lesson_modules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ---------- MEDIA ITEMS ----------
CREATE TABLE public.media_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
  module_id uuid REFERENCES public.modules(id) ON DELETE CASCADE,
  type text NOT NULL, -- video_main | cover_video | trailer | spotify | audio | pdf | image | checklist | embed | extra
  provider text,      -- youtube | vimeo | spotify | upload | external
  url text,
  embed_url text,
  thumbnail text,
  title text,
  description text,
  duration_sec integer,
  "order" integer NOT NULL DEFAULT 0,
  visibility text NOT NULL DEFAULT 'public',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (lesson_id IS NOT NULL OR module_id IS NOT NULL)
);
GRANT SELECT ON public.media_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_items TO authenticated;
GRANT ALL ON public.media_items TO service_role;
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active media" ON public.media_items FOR SELECT TO anon, authenticated
  USING (active = true OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin writes media" ON public.media_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ---------- PATHWAYS ----------
CREATE TABLE public.pathways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  description text,
  cover_image text,
  cover_video text,
  color text,
  audience text,
  recommended_week_min integer,
  recommended_week_max integer,
  price_centavos integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  visibility text NOT NULL DEFAULT 'public',
  active boolean NOT NULL DEFAULT true,
  "order" integer NOT NULL DEFAULT 0,
  seo_title text,
  seo_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pathways TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pathways TO authenticated;
GRANT ALL ON public.pathways TO service_role;
ALTER TABLE public.pathways ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active pathways" ON public.pathways FOR SELECT TO anon, authenticated
  USING ((active = true AND visibility <> 'hidden') OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin writes pathways" ON public.pathways FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.pathway_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pathway_id uuid NOT NULL REFERENCES public.pathways(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pathway_id, lesson_id)
);
GRANT SELECT ON public.pathway_lessons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pathway_lessons TO authenticated;
GRANT ALL ON public.pathway_lessons TO service_role;
ALTER TABLE public.pathway_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads pathway_lessons" ON public.pathway_lessons FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin writes pathway_lessons" ON public.pathway_lessons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ---------- BUNDLES ----------
CREATE TABLE public.bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  description text,
  cover_image text,
  price_centavos integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  visibility text NOT NULL DEFAULT 'public',
  active boolean NOT NULL DEFAULT true,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bundles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bundles TO authenticated;
GRANT ALL ON public.bundles TO service_role;
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active bundles" ON public.bundles FOR SELECT TO anon, authenticated
  USING ((active = true AND visibility <> 'hidden') OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin writes bundles" ON public.bundles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.bundle_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid NOT NULL REFERENCES public.bundles(id) ON DELETE CASCADE,
  item_type text NOT NULL, -- lesson | module | pathway | service
  item_id uuid NOT NULL,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bundle_id, item_type, item_id)
);
GRANT SELECT ON public.bundle_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bundle_items TO authenticated;
GRANT ALL ON public.bundle_items TO service_role;
ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads bundle_items" ON public.bundle_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin writes bundle_items" ON public.bundle_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ---------- SERVICE PRODUCTS (estrutura prevista, sem implementação agora) ----------
CREATE TABLE public.service_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  description text,
  cover_image text,
  duration_min integer,
  professional_id uuid,
  price_centavos integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  bookable boolean NOT NULL DEFAULT false,
  visibility text NOT NULL DEFAULT 'hidden',
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.service_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_products TO authenticated;
GRANT ALL ON public.service_products TO service_role;
ALTER TABLE public.service_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active services" ON public.service_products FOR SELECT TO anon, authenticated
  USING ((active = true AND visibility <> 'hidden') OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin writes services" ON public.service_products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ---------- ORDER ITEMS, PAYMENTS, PAYMENT EVENTS ----------
-- (tabela orders já existe; criamos os complementos)
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  item_type text NOT NULL, -- lesson | module | pathway | bundle | service
  item_id uuid NOT NULL,
  title text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price_centavos integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner or admin reads order_items" ON public.order_items FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.comprador_user_id = auth.uid()));
CREATE POLICY "Admin writes order_items" ON public.order_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  user_id uuid,
  gateway text NOT NULL, -- mercadopago | stripe | hotmart | kiwify | eduzz | manual | external
  external_id text,
  status text NOT NULL DEFAULT 'pendente', -- pendente | aprovado | recusado | reembolsado | cancelado
  amount_centavos integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  payer_email text,
  payer_name text,
  checkout_url text,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner or admin reads payments" ON public.payments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin writes payments" ON public.payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES public.payments(id) ON DELETE CASCADE,
  gateway text NOT NULL,
  event_type text NOT NULL,
  raw_payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_events TO authenticated;
GRANT ALL ON public.payment_events TO service_role;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin reads payment_events" ON public.payment_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ---------- ENTITLEMENTS ----------
CREATE TABLE public.entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_type text NOT NULL, -- lesson | module | pathway | bundle | service | all_access
  item_id uuid,            -- null para all_access
  source text NOT NULL,    -- purchase | subscription | coupon | manual | bundle | gift
  source_ref uuid,         -- order_id / payment_id / cupom_id / etc
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  granted_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX entitlements_uniq_idx ON public.entitlements (user_id, item_type, COALESCE(item_id, '00000000-0000-0000-0000-000000000000'::uuid), source);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entitlements TO authenticated;
GRANT ALL ON public.entitlements TO service_role;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner or admin reads entitlements" ON public.entitlements FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin writes entitlements" ON public.entitlements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ---------- CART ----------
CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_type text NOT NULL, -- lesson | module | pathway | bundle | service
  item_id uuid NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  UNIQUE (user_id, item_type, item_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User manages own cart" ON public.cart_items FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin reads carts" ON public.cart_items FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ---------- USER JOURNEYS ----------
CREATE TABLE public.user_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  cover_image text,
  is_public boolean NOT NULL DEFAULT false,
  share_slug text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_journeys TO authenticated;
GRANT SELECT ON public.user_journeys TO anon;
GRANT ALL ON public.user_journeys TO service_role;
ALTER TABLE public.user_journeys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads shared journeys" ON public.user_journeys FOR SELECT TO anon, authenticated
  USING (is_public = true OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Owner writes journey" ON public.user_journeys FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owner updates journey" ON public.user_journeys FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Owner deletes journey" ON public.user_journeys FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.user_journey_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid NOT NULL REFERENCES public.user_journeys(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  item_id uuid NOT NULL,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_journey_items TO authenticated;
GRANT SELECT ON public.user_journey_items TO anon;
GRANT ALL ON public.user_journey_items TO service_role;
ALTER TABLE public.user_journey_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reads journey items" ON public.user_journey_items FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.user_journeys j WHERE j.id = journey_id AND (j.is_public = true OR j.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))));
CREATE POLICY "Owner writes journey items" ON public.user_journey_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_journeys j WHERE j.id = journey_id AND j.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_journeys j WHERE j.id = journey_id AND j.user_id = auth.uid()));

-- ---------- ENGAJAMENTO ----------
CREATE TABLE public.lesson_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  watched_sec integer NOT NULL DEFAULT 0,
  source text,
  viewed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.lesson_views TO authenticated;
GRANT ALL ON public.lesson_views TO service_role;
ALTER TABLE public.lesson_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner or admin reads views" ON public.lesson_views FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Owner writes views" ON public.lesson_views FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE TABLE public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  progress_pct numeric NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages progress" ON public.lesson_progress FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- ---------- TRIGGERS updated_at ----------
CREATE TRIGGER touch_modules_updated      BEFORE UPDATE ON public.modules         FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_lessons_updated      BEFORE UPDATE ON public.lessons         FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_media_items_updated  BEFORE UPDATE ON public.media_items     FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_pathways_updated     BEFORE UPDATE ON public.pathways        FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_bundles_updated      BEFORE UPDATE ON public.bundles         FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_services_updated     BEFORE UPDATE ON public.service_products FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_payments_updated     BEFORE UPDATE ON public.payments        FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_entitlements_updated BEFORE UPDATE ON public.entitlements    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_journeys_updated     BEFORE UPDATE ON public.user_journeys   FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_progress_updated     BEFORE UPDATE ON public.lesson_progress FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------- FUNÇÕES DE ACESSO ----------
CREATE OR REPLACE FUNCTION public.has_entitlement(_user uuid, _type text, _id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.entitlements e
    WHERE e.user_id = _user
      AND e.active = true
      AND (e.expires_at IS NULL OR e.expires_at > now())
      AND (
        (e.item_type = 'all_access')
        OR (e.item_type = _type AND e.item_id = _id)
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.lesson_access(_user uuid, _lesson uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.lessons l
    WHERE l.id = _lesson AND l.active = true AND (
      (l.free_or_paid = 'free')
      OR (l.preview_enabled = true)
      OR (_user IS NOT NULL AND public.has_role(_user, 'admin'::app_role))
      OR public.has_entitlement(_user, 'lesson', _lesson)
      OR EXISTS (
        SELECT 1 FROM public.lesson_modules lm
        WHERE lm.lesson_id = _lesson AND public.has_entitlement(_user, 'module', lm.module_id)
      )
      OR EXISTS (
        SELECT 1 FROM public.pathway_lessons pl
        WHERE pl.lesson_id = _lesson AND public.has_entitlement(_user, 'pathway', pl.pathway_id)
      )
      OR EXISTS (
        SELECT 1 FROM public.bundle_items bi
        WHERE public.has_entitlement(_user, 'bundle', bi.bundle_id) AND (
          (bi.item_type = 'lesson' AND bi.item_id = _lesson)
          OR (bi.item_type = 'module' AND EXISTS (SELECT 1 FROM public.lesson_modules lm2 WHERE lm2.lesson_id = _lesson AND lm2.module_id = bi.item_id))
          OR (bi.item_type = 'pathway' AND EXISTS (SELECT 1 FROM public.pathway_lessons pl2 WHERE pl2.lesson_id = _lesson AND pl2.pathway_id = bi.item_id))
        )
      )
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.recommend_lessons(_user uuid, _limit integer DEFAULT 12)
RETURNS TABLE (lesson_id uuid, score numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH user_tags AS (
    SELECT DISTINCT unnest(l.tags) AS tag
    FROM public.lesson_views v
    JOIN public.lessons l ON l.id = v.lesson_id
    WHERE v.user_id = _user
  ),
  week AS (
    SELECT GREATEST(0, LEAST(42, floor((CURRENT_DATE - p.dum) / 7.0)::int)) AS w
    FROM public.profiles p WHERE p.user_id = _user AND p.dum IS NOT NULL LIMIT 1
  )
  SELECT l.id,
    (COALESCE((SELECT count(*) FROM unnest(l.tags) t WHERE t IN (SELECT tag FROM user_tags)), 0)::numeric
     + CASE WHEN EXISTS (SELECT 1 FROM week) THEN 1 ELSE 0 END) AS score
  FROM public.lessons l
  WHERE l.active = true AND l.visibility = 'public'
    AND NOT EXISTS (SELECT 1 FROM public.lesson_views v WHERE v.user_id = _user AND v.lesson_id = l.id)
  ORDER BY score DESC, l.created_at DESC
  LIMIT _limit;
$$;
