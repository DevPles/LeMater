
-- ============== CURSOS ==============
CREATE TABLE public.cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao_curta TEXT,
  descricao_longa TEXT,
  capa_url TEXT,
  trailer_url TEXT,
  categoria TEXT NOT NULL DEFAULT 'geral',
  nivel TEXT NOT NULL DEFAULT 'iniciante',
  carga_horaria_min INTEGER NOT NULL DEFAULT 0,
  preco_centavos INTEGER NOT NULL DEFAULT 0,
  preco_label TEXT,
  link_compra_externo TEXT,
  plataforma_venda TEXT,
  publicado BOOLEAN NOT NULL DEFAULT false,
  ordem INTEGER NOT NULL DEFAULT 0,
  instrutor_nome TEXT,
  instrutor_bio TEXT,
  instrutor_foto TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publico le cursos publicados" ON public.cursos
FOR SELECT TO anon, authenticated
USING (publicado = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin cria cursos" ON public.cursos
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin edita cursos" ON public.cursos
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin remove cursos" ON public.cursos
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_cursos_updated_at BEFORE UPDATE ON public.cursos
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============== MODULOS ==============
CREATE TABLE public.curso_modulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_curso_modulos_curso ON public.curso_modulos(curso_id, ordem);
ALTER TABLE public.curso_modulos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publico le modulos de cursos publicados" ON public.curso_modulos
FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.cursos c WHERE c.id = curso_id AND (c.publicado = true OR public.has_role(auth.uid(), 'admin'::app_role))));

CREATE POLICY "Admin cria modulos" ON public.curso_modulos
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin edita modulos" ON public.curso_modulos
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin remove modulos" ON public.curso_modulos
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_modulos_updated_at BEFORE UPDATE ON public.curso_modulos
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============== AULAS ==============
CREATE TABLE public.curso_aulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id UUID NOT NULL REFERENCES public.curso_modulos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL DEFAULT 'video',
  video_url TEXT,
  pdf_url TEXT,
  conteudo_html TEXT,
  duracao_min INTEGER NOT NULL DEFAULT 0,
  ordem INTEGER NOT NULL DEFAULT 0,
  previa_gratis BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_curso_aulas_modulo ON public.curso_aulas(modulo_id, ordem);
ALTER TABLE public.curso_aulas ENABLE ROW LEVEL SECURITY;

-- ============== MATRICULAS ==============
CREATE TABLE public.curso_matriculas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  origem TEXT NOT NULL DEFAULT 'manual',
  ativo BOOLEAN NOT NULL DEFAULT true,
  expira_em TIMESTAMPTZ,
  liberado_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (curso_id, user_id)
);
CREATE INDEX idx_matriculas_user ON public.curso_matriculas(user_id);
ALTER TABLE public.curso_matriculas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario le propria matricula" ON public.curso_matriculas
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin cria matricula" ON public.curso_matriculas
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin edita matricula" ON public.curso_matriculas
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin remove matricula" ON public.curso_matriculas
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_matriculas_updated_at BEFORE UPDATE ON public.curso_matriculas
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============== FUNCAO pode_ver_aula ==============
CREATE OR REPLACE FUNCTION public.pode_ver_aula(_user uuid, _aula uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.curso_aulas a
    JOIN public.curso_modulos m ON m.id = a.modulo_id
    JOIN public.cursos c ON c.id = m.curso_id
    WHERE a.id = _aula
      AND (
        a.previa_gratis = true
        OR (_user IS NOT NULL AND public.has_role(_user, 'admin'::app_role))
        OR (_user IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.curso_matriculas mt
          WHERE mt.curso_id = c.id AND mt.user_id = _user AND mt.ativo = true
            AND (mt.expira_em IS NULL OR mt.expira_em > now())
        ))
        OR (_user IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.app_acesso_pago ap
          WHERE ap.user_id = _user AND ap.ativo = true
        ))
      )
  )
$$;

CREATE POLICY "Publico le aulas previa" ON public.curso_aulas
FOR SELECT TO anon, authenticated
USING (previa_gratis = true AND EXISTS (
  SELECT 1 FROM public.curso_modulos m JOIN public.cursos c ON c.id = m.curso_id
  WHERE m.id = modulo_id AND c.publicado = true
));
CREATE POLICY "Aluno le aulas permitidas" ON public.curso_aulas
FOR SELECT TO authenticated USING (public.pode_ver_aula(auth.uid(), id));
CREATE POLICY "Admin cria aulas" ON public.curso_aulas
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin edita aulas" ON public.curso_aulas
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin remove aulas" ON public.curso_aulas
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_aulas_updated_at BEFORE UPDATE ON public.curso_aulas
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============== PROGRESSO ==============
CREATE TABLE public.curso_progresso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  aula_id UUID NOT NULL REFERENCES public.curso_aulas(id) ON DELETE CASCADE,
  concluida_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, aula_id)
);
CREATE INDEX idx_progresso_user ON public.curso_progresso(user_id);
ALTER TABLE public.curso_progresso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario gerencia progresso - select" ON public.curso_progresso
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Usuario gerencia progresso - insert" ON public.curso_progresso
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuario gerencia progresso - delete" ON public.curso_progresso
FOR DELETE TO authenticated USING (auth.uid() = user_id);
