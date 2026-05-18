## O que vou fazer

### 1. Admin: um cadastro só de "Conteúdos"
- Substituir as abas separadas **Cursos** e **Materiais** por uma única aba **Conteúdos** com seletor de tipo no topo do formulário:
  - **Curso** → campos atuais de curso (módulos, aulas, preço, link de venda, instrutor)
  - **Material** → campos atuais de material (PDF, vídeo, artigo, área grátis/pago)
  - **Serviço** → cadastro de oferta de serviço (título, descrição, preço, link de compra/agendamento, plataforma)
- Lista única na aba mostrando todos os itens com coluna "Tipo".
- Aba **Acessos** continua igual (libera curso ou material para um usuário).
- Aba antiga "Serviços" se já existir como tal continua; o que muda é a entrada principal.

### 2. Cursos abrem em modal com player
- Cards na vitrine `/cursos` (e listagens) abrem **modal sobre a página** em vez de navegar pra landing.
- Dentro do modal: cabeçalho com título/descrição + lista de módulos/aulas na lateral + player central (vídeo YouTube/Vimeo/upload, PDF, artigo HTML).
- Se o usuário ainda não tem acesso: o modal mostra a landing/sales view (descrição, ementa, instrutor, botão Comprar) — sem player.
- A página `/cursos/$slug` continua existindo (deep-link/SEO), mas o fluxo principal vira modal.
- A rota `/cursos/$slug/aprender` continua para quem quiser tela cheia.

### 3. Atlas Materno: card como padrão visual
- Atlas Materno **continua existindo** como está hoje.
- Replicar o estilo dos cards do Atlas (imagem 48 — numeração grande "01/02", fundo alternando verde/bege, label em caixa alta, título serifado grande, descrição, divisor com "CONTEÚDO GRATUITO" e CTA full-width) em:
  - Vitrine `/cursos`
  - Página `/conteudos-gratis`
  - Lista de cursos liberados em `/membro`
- Mesma paleta cream/sage/sageDark já em uso. Apenas um componente reutilizável `<ContentCard variant="atlas" />`.

## Mudanças técnicas

- `src/components/admin/ConteudosTab.tsx` (novo) — formulário unificado com seletor de tipo; reutiliza lógica de `CursosTab` e `MateriaisTab`.
- `src/routes/_authenticated/admin.tsx` — substituir as abas "Cursos" e "Materiais" pela aba "Conteúdos".
- `src/components/ContentCard.tsx` (novo) — card visual padrão estilo Atlas, usado em cursos/conteúdos/membro.
- `src/components/CursoModal.tsx` (novo) — modal de player de curso (lista de aulas + player).
- `src/routes/cursos.tsx` — usar `ContentCard` + abrir `CursoModal` ao clicar.
- `src/routes/conteudos-gratis.tsx` — usar `ContentCard`.
- `src/routes/_authenticated/membro.tsx` — usar `ContentCard` na seção de cursos.
- Sem migração de banco. As tabelas `cursos`, `materiais` e (se houver) serviços já cobrem tudo — o seletor de tipo apenas decide qual delas é alimentada no form.

## Pontos que vou manter como estão

- Página `/atlas-materno` (atlas público) e `/_authenticated/atlas` (biblioteca).
- Rotas `/cursos/$slug` (landing SEO) e `/cursos/$slug/aprender` (player full-screen).
- Permissões: continua usando `pode_ver_aula`, matrículas e `app_acesso_pago`.

Confirma para eu implementar?
