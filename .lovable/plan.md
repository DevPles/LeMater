## Reestruturação da página /site → seção "Atlas Materno"

Transformar a vitrine atual de produtos com preço em uma experiência consultiva: cards por momento da usuária, conteúdo gratuito como porta de entrada e recomendação sutil do programa pago.

### 1. Refatorar a seção `Produtos` em `src/routes/site.tsx`

Manter título superior:
- "Quatro fases. Uma jornada completa."

Adicionar subtítulo discreto logo abaixo:
- "Escolha seu momento, acesse um conteúdo gratuito e descubra o caminho Le Mater recomendado para você."

Substituir os 4 `ProdutoCard` (com preço R$ 297) por 4 novos cards `MomentoCard` no mesmo grid 2x2, mantendo:
- fundo off-white / verde escuro alternado no hover
- numeração suave em serifa
- estética editorial premium
- sem ícones, sem emojis, sem preço

Estrutura de cada card:
- Número (01–04)
- Categoria pequena (uppercase, letterspacing) — ex: "Concepção"
- Título em serifa — ex: "Estou tentando engravidar"
- Texto principal (descritivo)
- Linha "Conteúdo gratuito:" + nome do material
- Botão primário (sage dark): `ACESSAR CONTEÚDO GRATUITO` → navega para rota interna
- Linha discreta: "Caminho recomendado: …"
- Botão secundário discreto (link sublinhado, sem fundo): `VER CAMINHO COMPLETO` → rota do programa

Conteúdo dos 4 cards conforme briefing:

| # | Título | Categoria | Conteúdo gratuito | Rota gratuita | Caminho recomendado | Rota programa |
|---|---|---|---|---|---|---|
| 01 | Estou tentando engravidar | Concepção | Guia gratuito: 7 sinais de que você pode estar errando sua janela fértil | /atlas-materno/concepcao | Ajuda na Concepção Le Mater | /programas/concepcao |
| 02 | Estou grávida | Gestação | Mapa gratuito: primeiros passos depois do positivo | /atlas-materno/gestacao | Programa Gestação Le Mater | /programas/gestacao |
| 03 | Estou no pós-parto | Puerpério | Checklist gratuito: cuidados essenciais no puerpério | /atlas-materno/pos-parto | Pós-Parto Le Mater | /programas/pos-parto |
| 04 | Quero cuidar melhor do bebê | Bebê e primeiros cuidados | Guia gratuito: primeiros cuidados com o recém-nascido | /atlas-materno/bebe | Bebê e Primeiros Cuidados Le Mater | /programas/bebe-primeiros-cuidados |

### 2. Substituir bloco inferior "Combo Completo"

Remover preço riscado (R$ 1.188) e preço grande (R$ 797). Novo bloco:
- Título: "Plano Completo Le Mater"
- Descrição: "Para quem deseja acesso aos principais conteúdos da jornada materna, organização digital, cartão da gestante e recomendações inteligentes por fase."
- Três microbenefícios em texto simples (linha horizontal, separados por divisores sutis, sem ícones):
  - Conteúdos por fase
  - Cartão digital da gestante
  - Recomendações inteligentes
- Botão: `CONHECER PLANO COMPLETO` → /planos/completo
- Texto discreto abaixo: "Ideal para quem quer uma experiência materna mais organizada, do início da jornada aos primeiros cuidados com o bebê."

### 3. Criar 4 páginas internas gratuitas

Novos arquivos de rota TanStack Start (file-based):
- `src/routes/atlas-materno.concepcao.tsx`
- `src/routes/atlas-materno.gestacao.tsx`
- `src/routes/atlas-materno.pos-parto.tsx`
- `src/routes/atlas-materno.bebe.tsx`

Para evitar duplicação, criar componente compartilhado `src/components/AtlasGratuitoPage.tsx` que recebe props e cada rota apenas instancia com seu conteúdo.

Estrutura visual de cada página (mesma identidade — Cormorant Garamond + DM Sans, off-white #FAF5EE, sage dark #2D5A42):
- Nav superior reutilizando o estilo (link "voltar ao Atlas Materno")
- Tag de categoria + título grande em serifa
- Texto breve educativo (2–3 parágrafos consultivos, sem promessas)
- Bloco "O que você vai aprender" com 4–6 itens em lista discreta (bullets sage)
- Formulário (card warm) com campos:
  - Nome (text)
  - Email (email)
  - WhatsApp (tel, máscara simples)
  - Momento atual (select — Tentando engravidar / Grávida / Pós-parto / Com bebê)
- Botão: `LIBERAR CONTEÚDO GRATUITO`
- Validação client-side com zod (nome, email válido, whatsapp não-vazio, momento)
- Persistir lead na tabela `atlas_leads` (Lovable Cloud)
- Após submit: estado de sucesso ("Conteúdo enviado para seu email")
- Bloco final "Próximo passo recomendado":
  - Card discreto (warm bg) com nome do programa relacionado, descrição curta, botão `CONHECER PROGRAMA COMPLETO` → rota /programas/...

### 4. Banco de dados (Lovable Cloud)

Criar tabela `atlas_leads` para captura dos leads:
- nome, email, whatsapp, momento, origem (slug do guia)
- RLS: insert público (qualquer visitante pode submeter), select restrito a admin

### 5. Rotas dos programas pagos e plano completo

As rotas `/programas/*` e `/planos/completo` referenciadas pelos botões "VER CAMINHO COMPLETO" / "CONHECER PLANO COMPLETO" não existem ainda. Como o briefing foca em transformar /site (Atlas Materno) e nas páginas de conteúdo gratuito, **esta entrega não cria as páginas de programa pago nem o plano completo** — os botões apontarão para essas rotas, mas elas precisarão ser construídas em uma próxima etapa.

### Restrições respeitadas

- Sem ícones, sem emojis
- Sem preço nos cards do Atlas Materno
- Sem "Comprar agora" / linguagem agressiva
- Sem promessas de gravidez ou cura
- Identidade visual atual preservada (off-white, verde escuro, serifa, cards grandes, numeração suave, header e footer atuais)

### Detalhes técnicos

- `src/routes/site.tsx`: editar componente `Produtos()` e bloco do combo
- Navegação interna do menu permanece em estado (`go("produtos")`); os botões dos cards usam `<Link to="/atlas-materno/...">` do `@tanstack/react-router` (rotas reais, fora do switch interno)
- Componente compartilhado `AtlasGratuitoPage` recebe: `categoria`, `titulo`, `intro`, `aprendizados[]`, `slug`, `programa: { titulo, descricao, rota }`
- Validação com `zod`, submit via `supabase.from('atlas_leads').insert(...)`
- Cada nova rota define `head()` com title e description próprios (SEO)

### Pergunta antes de implementar

Confirmar: prossigo criando a tabela `atlas_leads` no banco para capturar os leads dos formulários, ou os formulários devem por enquanto apenas exibir mensagem de sucesso sem persistir nada?
