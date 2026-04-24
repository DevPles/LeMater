-- Permite que o catálogo geográfico (cidades, distritos, bairros, UBS) seja
-- lido também por usuários NÃO autenticados, já que o cadastro de gestante
-- usa esse catálogo ANTES do login (durante o registro).
-- Estes dados são públicos e não contêm informação sensível.

-- districts
DROP POLICY IF EXISTS "Autenticados leem distritos" ON public.districts;
CREATE POLICY "Catálogo público de distritos"
  ON public.districts FOR SELECT
  TO anon, authenticated
  USING (true);

-- neighborhoods
DROP POLICY IF EXISTS "Autenticados leem bairros" ON public.neighborhoods;
CREATE POLICY "Catálogo público de bairros"
  ON public.neighborhoods FOR SELECT
  TO anon, authenticated
  USING (true);

-- health_units
DROP POLICY IF EXISTS "Autenticados leem UBS" ON public.health_units;
CREATE POLICY "Catálogo público de UBS"
  ON public.health_units FOR SELECT
  TO anon, authenticated
  USING (true);