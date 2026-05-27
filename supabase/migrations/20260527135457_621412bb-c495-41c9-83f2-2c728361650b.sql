
CREATE TABLE IF NOT EXISTS public.aula_matriculas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id uuid NOT NULL REFERENCES public.curso_aulas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  origem text NOT NULL DEFAULT 'manual',
  ativo boolean NOT NULL DEFAULT true,
  expira_em timestamptz,
  liberado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (aula_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aula_matriculas TO authenticated;
GRANT ALL ON public.aula_matriculas TO service_role;
CREATE INDEX IF NOT EXISTS idx_aula_matriculas_user ON public.aula_matriculas(user_id);
CREATE INDEX IF NOT EXISTS idx_aula_matriculas_aula ON public.aula_matriculas(aula_id);
ALTER TABLE public.aula_matriculas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aluno vê matrículas de aula" ON public.aula_matriculas FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin insere matrícula de aula" ON public.aula_matriculas FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin edita matrícula de aula" ON public.aula_matriculas FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin remove matrícula de aula" ON public.aula_matriculas FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.pode_ver_aula(_user uuid, _aula uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.curso_aulas a
    JOIN public.curso_modulos m ON m.id = a.modulo_id
    JOIN public.cursos c ON c.id = m.curso_id
    WHERE a.id = _aula AND (
      a.previa_gratis = true
      OR (_user IS NOT NULL AND public.has_role(_user, 'admin'::app_role))
      OR (_user IS NOT NULL AND EXISTS (SELECT 1 FROM public.curso_matriculas mt WHERE mt.curso_id = c.id AND mt.user_id = _user AND mt.ativo = true AND (mt.expira_em IS NULL OR mt.expira_em > now())))
      OR (_user IS NOT NULL AND EXISTS (SELECT 1 FROM public.aula_matriculas am WHERE am.aula_id = a.id AND am.user_id = _user AND am.ativo = true AND (am.expira_em IS NULL OR am.expira_em > now())))
      OR (_user IS NOT NULL AND EXISTS (SELECT 1 FROM public.app_acesso_pago ap WHERE ap.user_id = _user AND ap.ativo = true))
    )
  )
$function$;
