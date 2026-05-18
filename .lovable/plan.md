## Objetivo

Criar um sistema completo de **cursos** (criação no Admin + venda + consumo pelo aluno), separado dos "materiais avulsos" que já existem.

Hoje só existe a tabela `materiais` (PDF/vídeo/artigo único). Não há conceito de curso com módulos, aulas, matrícula, progresso ou checkout próprio.

---

## 1. Banco de dados (migração)

Novas tabelas:

- **`cursos`** — `titulo`, `slug`, `descricao_curta`, `descricao_longa`, `capa_url`, `trailer_url`, `categoria`, `nivel`, `carga_horaria_min`, `preco_centavos`, `preco_label`, `link_compra_externo` (Hotmart/Kiwify), `plataforma_venda`, `publicado`, `ordem`, `instrutor_nome`, `instrutor_bio`, `instrutor_foto`.
- **`curso_modulos`** — `curso_id`, `titulo`, `descricao`, `ordem`.
- **`curso_aulas`** — `modulo_id`, `titulo`, `descricao`, `tipo` (video/pdf/texto), `video_url`, `pdf_url`, `conteudo_html`, `duracao_min`, `ordem`, `previa_gratis` (bool, para amostra pública).
- **`curso_matriculas`** — `curso_id`, `user_id`, `origem` (manual/hotmart/admin), `ativo`, `expira_em`.
- **`curso_progresso`** — `user_id`, `aula_id`, `concluida_em`.

RLS:
- Admin: CRUD total em `cursos`, `curso_modulos`, `curso_aulas`, `curso_matriculas`.
- Público (anon + auth): leitura de cursos `publicado=true` (vitrine) e aulas com `previa_gratis=true`.
- Aluno: leitura das aulas só se tiver matrícula ativa OU acesso pago global (`app_acesso_pago.ativo`).
- Aluno: CRUD do próprio progresso.

Função `pode_ver_aula(_user, _aula)` análoga à `pode_ver_material`.

Webhook Hotmart existente (`hotmart_compras`) passa a criar `curso_matriculas` quando o produto for mapeado para um `curso_id`.

---

## 2. Server functions (`src/lib/cursos.functions.ts`)

- `listCursosVitrine()` — pública, retorna cursos publicados (admin vê tudo).
- `getCursoBySlug(slug)` — detalhes públicos + módulos/aulas (aulas pagas só com flag `bloqueada=true` se não matriculado).
- `getCursoPlayer(slug)` — autenticado, valida matrícula/admin, retorna conteúdo completo + progresso.
- `marcarAulaConcluida(aulaId)` — aluno.
- Admin: `createCurso`, `updateCurso`, `deleteCurso`, `createModulo`, `updateModulo`, `deleteModulo`, `createAula`, `updateAula`, `deleteAula`, `reorderItems`, `liberarMatricula(userId, cursoId)`, `revogarMatricula`.

---

## 3. Rotas frontend

**Públicas:**
- `/cursos` — vitrine de todos os cursos publicados.
- `/cursos/$slug` — landing page de venda (hero, instrutor, conteúdo programático, depoimentos, CTA "Comprar" → `link_compra_externo` ou "Acessar" se já matriculado).

**Autenticadas:**
- `/_authenticated/meus-cursos` — lista de cursos em que o aluno tem matrícula ativa.
- `/_authenticated/cursos/$slug/aula/$aulaId` — player (vídeo + descrição + lista lateral de aulas + botão "Marcar como concluída" + barra de progresso).

**Admin (`/admin`):**
- Nova aba **CURSOS** no topo, ao lado de MATERIAIS.
- Lista de cursos com Editar/Excluir/Publicar.
- Editor de curso: form com dados gerais + gestão de módulos (drag-order) + aulas dentro de cada módulo + upload de capa/vídeo/PDF.
- Aba **MATRÍCULAS** dentro do curso: buscar usuário e liberar/revogar acesso manual.

---

## 4. Integração com o que já existe

- Página `/membro`: adicionar seção **"Meus Cursos"** acima de "Conteúdos Pagos", listando matrículas ativas com link para o player.
- Página `/conteudos-gratis`: aba **CURSOS** passa a listar os cursos da nova tabela (não mais `materiais` filtrados por `area='curso'`).
- Header público ganha link **CURSOS** apontando para `/cursos`.

---

## 5. Storage

Reusar buckets existentes:
- `materiais-capas` (público) → capas de curso.
- `materiais-video` (privado) → vídeos de aulas, servidos via signed URL na server function do player.
- `materiais-pdf` (privado) → PDFs de aulas.

---

## Detalhes técnicos

- Todas as queries via `createServerFn` + `requireSupabaseAuth` quando autenticado, `supabaseAdmin` para vitrine pública.
- Player de vídeo: detectar YouTube/Vimeo/MP4 nativo (igual ao já feito em `/membro`).
- Marcação de progresso: upsert em `curso_progresso` no clique do botão e ao terminar o vídeo (90%).
- Ordem de implementação: (1) migração + RLS, (2) server functions, (3) admin CRUD, (4) vitrine + landing, (5) player + meus-cursos, (6) integração `/membro` e header.

---

## Escopo deixado de fora (próxima rodada, se quiser)

- Checkout integrado (Stripe/Paddle nativo do Lovable) — por ora mantém venda externa via `link_compra_externo` (Hotmart/Kiwify).
- Certificado de conclusão.
- Avaliações/quizzes ao final de cada módulo.
- Cupons de desconto.