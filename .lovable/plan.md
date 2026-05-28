
# Remodelagem do Atlas — Aula como entidade principal

Objetivo: manter Atlas, cards, vitrine, player, admin e navegação atuais. Mudar apenas a **lógica interna**: a aula vira a peça central, pode pertencer a vários temas, e tem monetização própria. Curso passa a ser **agrupador/tema** (não desaparece, só muda de papel).

Nada novo de "Biblioteca". Nada de nova sidebar. Nada de rota nova.

---

## 1. Banco (migração única, aditiva, sem quebrar nada)

Aproveitar tabelas existentes (`cursos`, `curso_modulos`, `curso_aulas`, `aula_matriculas`, `product_offers`). Adicionar o que falta para suportar "aula multi-tema + monetizada".

```text
ALTER curso_aulas:
  + slug            text unique
  + capa_url        text
  + capa_video_url  text
  + publicado       bool default false
  + gratis          bool default false
  + moeda           text default 'BRL'

NEW aula_temas (N:N aula ↔ curso/tema):
  aula_id   uuid → curso_aulas.id
  tema_id   uuid → cursos.id        (curso reaproveitado como tema)
  ordem     int
  PK (aula_id, tema_id)
```

`product_offers` já suporta `produto_tipo='aula'` + plataforma (mercadopago/stripe/externo) + país/moeda → reaproveitar para preço/gateway por aula.

`aula_matriculas` já existe → continua sendo a fonte de "tem acesso".
`pode_ver_aula(user, aula)` já existe → manter.

**Backfill:** para cada `curso_aulas` existente, popular `aula_temas` com o curso atual da aula (via `modulo_id → curso_id`). Zero perda de dado.

---

## 2. Admin — sem nova aba, mesma `AtlasContentTab`

Em `src/components/admin/AtlasContentTab.tsx` os três pills continuam: **Cursos · Materiais · Serviços**. Mudanças:

- **Cursos** vira "Temas / Coleções" (label visível; tipo no banco continua `curso`). Form ganha um aviso: "Coleção/Tema — agrupa aulas, não precisa ter aulas próprias".
- Adicionar **quarto pill: "Aulas"** → nova subtela `AulasTab` (componente novo, mas **dentro** do Atlas, sem rota nova, sem sidebar nova).
- `NovoConteudoModal`: adicionar opção **"Aula"** ao lado de Curso/Material/Serviço.

### `AulasTab` (novo, mas isolado em `src/components/admin/`)
Lista global de aulas + editor único onde admin define:
- título, slug, descrição, capa, vídeo/conteúdo
- **temas** (multi-select sobre `cursos`) → grava em `aula_temas`
- **grátis / pago** + preço, moeda, país, gateway → grava em `product_offers`
- preview, publicado

O `CursosTab`/editor de curso atual continua funcionando para aulas legadas (via `modulo_id`), mas ganha uma seção "Aulas vinculadas (por tema)" que lê de `aula_temas`.

---

## 3. Vitrine `/atlas` — mesmo arquivo, mesmos cards

`src/routes/atlas.tsx` continua sendo a vitrine. Mudanças cirúrgicas:

1. **Barra de filtros** (chips) no topo: lê `cursos` publicados como temas
   `[ Todos ] [ Concepção ] [ Gestação ] [ Parto ] [ Amamentação ] [ Pós-Parto ]`
2. Toggle de modo (discreto): **Coleções** (default, comportamento atual) · **Aulas** (grid de aulas filtrado por tema).
3. Quando o filtro de tema está ativo, mostrar **aulas daquele tema** usando o mesmo `ContentCard` já existente — sem novo componente, sem nova página.

Card de aula reaproveita `ContentCard`: capa, título, badge ("Grátis" / preço / "Seu acesso"), CTA → abre `CursoModal` adaptado **ou** vai direto pro player existente `/atlas/$slug/aprender` (que já roda aulas).

---

## 4. Server functions — estender, não recriar

Em `src/lib/cursos.functions.ts` (existente) adicionar:
- `listTemasAtlas()` → lista cursos publicados como temas (id, slug, título, contagem de aulas).
- `listAulasVitrine({ temaId? })` → lista aulas publicadas, filtradas, já resolvendo: capa, preço (via `product_offers`), `pode_consumir` (admin / matrícula / grátis), `precisa_login`, `link_compra`.
- `getAulaPublica(slug)` → dados de aula + acesso resolvido para o modal/player.

Reutilizar padrões já existentes em `materiais.functions.ts` (resolução de acesso por usuário, ofertas).

**Não criar** `storefront.functions`, `biblioteca.functions`, `checkout.functions`, etc.

---

## 5. Player — o atual

`src/routes/_authenticated/atlas.$slug.aprender.tsx` continua. Ele já consome aulas por curso. Vai ganhar suporte a abrir aula avulsa (`?aula=slug`) quando vier do filtro por tema — sem rota nova.

---

## 6. Checkout / monetização

Reaproveitar `product_offers` + `orders` + os webhooks já existentes (`hooks/stripe`, `hooks/kiwify`, `hooks/hotmart`, `mercadopago-webhook`). Já liberam acesso via `liberar_acesso_por_pedido`, que sabe lidar com `produto_tipo='aula'` → grava `aula_matriculas`. Nada novo a criar aqui, apenas garantir que ofertas de aula sejam cadastráveis no novo editor.

---

## Fora do escopo (explicitamente NÃO fazer)

- Não criar `/biblioteca`, `/carrinho`, `/app/biblioteca`.
- Não criar tabelas `bundles`, `lessons` novas (as que já existem ficam quietas, sem uso novo nesta fase).
- Não mexer em sidebar do admin, nem em `app.membro`, nem em rotas públicas além de `atlas.tsx`.
- Não duplicar `ContentCard`, `CursoModal`, `SiteNav`, `SiteFooter`.

---

## Ordem de execução

1. Migração SQL (colunas em `curso_aulas` + tabela `aula_temas` + backfill).
2. Server fns novas em `cursos.functions.ts`.
3. `AulasTab` admin + opção "Aula" em `NovoConteudoModal`.
4. Filtros de tema + modo "Aulas" em `atlas.tsx`.
5. Ajuste do player para aceitar aula avulsa por tema.

Cada passo é commit pequeno, reversível, sem tocar no fluxo atual de curso→aulas até o passo final.

---

## Confirmação

Posso seguir com a **migração (passo 1)** já? Ou prefere revisar algum ponto da modelagem antes (ex.: usar `cursos` como tema vs. tabela `atlas_temas` dedicada)?
