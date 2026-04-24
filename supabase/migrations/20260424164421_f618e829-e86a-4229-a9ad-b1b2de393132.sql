-- =========================================================
-- Catálogo geográfico DRS-XIII: distritos, bairros, UBS
-- =========================================================

-- 1) DISTRITOS
CREATE TABLE public.districts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cidade TEXT NOT NULL,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT districts_cidade_nome_unique UNIQUE (cidade, nome)
);

CREATE INDEX idx_districts_cidade ON public.districts(cidade);

ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leem distritos"
  ON public.districts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin cria distritos"
  ON public.districts FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin edita distritos"
  ON public.districts FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin remove distritos"
  ON public.districts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_districts_touch
  BEFORE UPDATE ON public.districts
  FOR EACH ROW EXECUTE FUNCTION public.touch_app_content_updated_at();


-- 2) BAIRROS
CREATE TABLE public.neighborhoods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cidade TEXT NOT NULL,
  district_id UUID REFERENCES public.districts(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- unicidade tratando district_id NULL com índice parcial duplo
CREATE UNIQUE INDEX neighborhoods_unique_with_district
  ON public.neighborhoods(cidade, district_id, nome)
  WHERE district_id IS NOT NULL;

CREATE UNIQUE INDEX neighborhoods_unique_no_district
  ON public.neighborhoods(cidade, nome)
  WHERE district_id IS NULL;

CREATE INDEX idx_neighborhoods_cidade ON public.neighborhoods(cidade);
CREATE INDEX idx_neighborhoods_district ON public.neighborhoods(district_id);

ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leem bairros"
  ON public.neighborhoods FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin cria bairros"
  ON public.neighborhoods FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin edita bairros"
  ON public.neighborhoods FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin remove bairros"
  ON public.neighborhoods FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_neighborhoods_touch
  BEFORE UPDATE ON public.neighborhoods
  FOR EACH ROW EXECUTE FUNCTION public.touch_app_content_updated_at();


-- 3) UNIDADES DE SAÚDE
CREATE TABLE public.health_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cidade TEXT NOT NULL,
  district_id UUID REFERENCES public.districts(id) ON DELETE SET NULL,
  neighborhood_id UUID REFERENCES public.neighborhoods(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  cnes TEXT,
  tipo TEXT,
  endereco TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT health_units_cidade_nome_unique UNIQUE (cidade, nome)
);

CREATE INDEX idx_health_units_cidade ON public.health_units(cidade);
CREATE INDEX idx_health_units_district ON public.health_units(district_id);
CREATE INDEX idx_health_units_neighborhood ON public.health_units(neighborhood_id);
CREATE INDEX idx_health_units_ativo ON public.health_units(ativo);

ALTER TABLE public.health_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leem UBS"
  ON public.health_units FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin cria UBS"
  ON public.health_units FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin edita UBS"
  ON public.health_units FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin remove UBS"
  ON public.health_units FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_health_units_touch
  BEFORE UPDATE ON public.health_units
  FOR EACH ROW EXECUTE FUNCTION public.touch_app_content_updated_at();


-- 4) VÍNCULOS EM PROFILES
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES public.districts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS health_unit_id UUID REFERENCES public.health_units(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_district ON public.profiles(district_id);
CREATE INDEX IF NOT EXISTS idx_profiles_health_unit ON public.profiles(health_unit_id);
