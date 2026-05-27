# Redesign do sistema de vendas (curso / aula / serviço)

## Objetivo

Unificar a venda em **3 níveis independentes** (curso inteiro, aula avulsa, serviço de consultoria), cada um com seu próprio bloco de "Ofertas" — onde admin escolhe **País + Plataforma de pagamento + Link/ID externo + Preço/Moeda**. O usuário final vê apenas as ofertas do seu país.

A tabela `product_offers` e os serverFns `listOffersByProduct / saveOffer / deleteOffer` já existem (criados nas iterações anteriores). Este plano substitui o JSON `links_compra` embutido no formulário pelo bloco reutilizável de ofertas e refaz o fluxo no admin + na vitrine.

## Fluxo no admin

### 1. Criar/editar Curso

Etapa única (sem wizard chato):

- Dados básicos (título, slug, descrição, capa, trailer).
- **Bloco "Venda do curso completo"** (componente novo `OfertasEditor`)
  - Toggle: "Este curso pode ser comprado inteiro?" (sim/não)
  - Se sim → lista de ofertas (uma linha por país × plataforma)
    - País (BR / Internacional / ALL)
    - Plataforma (Mercado Pago, Hotmart, Kiwify, Eduzz, Stripe)
    - Tipo de link (nativo do app / externo)
    - URL de checkout (se externo) ou ID externo do produto (para casar webhook)
    - Preço em centavos + moeda (BRL/USD/EUR)
    - Label opcional (ex.: "Pix à vista", "12x sem juros")
    - Ativo (on/off), ordem
  - Botão "Adicionar oferta"
- Salvar curso → grava cursos + grava cada oferta com `produto_tipo='curso', produto_id=<curso.id>`.

### 2. Criar/editar Aula (dentro do curso)

- Dados da aula (título, vídeo, materiais).
- Toggle: "Aula pode ser comprada avulsa?"
  - Se sim → mesmo `OfertasEditor` mas com `produto_tipo='aula', produto_id=<aula.id>`.
  - Se não → aula só acessível por matrícula do curso completo.
- `previa_gratis` mantém comportamento atual.

### 3. Criar/editar Serviço (slot de consultoria)

- Mesmo padrão: bloco de ofertas com `produto_tipo='servico', produto_id=<slot.id>`.
- Toggle "Requer pagamento" → quando ligado, exige pelo menos 1 oferta ativa.

## Componente compartilhado `OfertasEditor`

Arquivo novo: `src/components/admin/OfertasEditor.tsx`

Props:

```ts
{ produtoTipo: 'curso'|'aula'|'servico', produtoId: string|null, moedaPadrao?: string }
```

Comportamento:

- Se `produtoId` for `null` (criação) → mantém lista em memória; salva após o pai retornar o id.
- Se `produtoId` existir → carrega via `listOffersByProduct`, grava cada linha em `saveOffer`, deleta em `deleteOffer`.
- Validação: pelo menos 1 oferta ativa quando o toggle de venda está ligado; URL obrigatória para plataformas externas; ID externo obrigatório para Hotmart/Kiwify/Eduzz/Stripe (necessário para webhook resolver o produto).

## Vitrine / Checkout (lado do usuário)

- `CursoModal` e página de curso: chamar `listOffersByProduct` (criar versão pública sem `assertAdmin` → `getPublicOffers`) filtrando por `produto_id` + `pais` do usuário (auto-detect via locale, com seletor BR/Internacional).
- Mostra cada oferta como botão de compra. Se `tipo_link='nativo'` (Mercado Pago) → fluxo interno; se `externo` → abre URL em nova aba.
- Mesma lógica para aulas avulsas (na lista de aulas, ao lado da prévia) e para slots de consultoria na agenda.

## Banco

`product_offers` já está adequada. Apenas adicionar:

- Migração leve: índice `(produto_tipo, produto_id, pais, ativo)` se ainda não existir.
- Função RPC `get_public_offers(_tipo text, _id uuid, _pais text)` retornando apenas ofertas ativas (para evitar expor `produto_externo_id` desnecessário ao público — retornar só campos de exibição + url).

## Limpeza

- Remover dos formulários os campos antigos `links_compra`, `link_compra_externo`, `plataforma_venda`, `produto_externo_id` em `cursos`/`curso_aulas`/`materiais` (deixar colunas no DB por compatibilidade, mas parar de ler/escrever na UI nova).
- `NovoConteudoModal.tsx`: remover os blocos atuais de seleção de país/plataforma duplicados e substituir pelo `OfertasEditor` em 3 pontos (curso, aula, serviço/material).
- `VendasTab.tsx`: nada muda no resto, só passa a usar `product_offers` como fonte de verdade.

## Arquivos afetados

Novos:

- `src/components/admin/OfertasEditor.tsx`
- `src/lib/offers.functions.ts` (apenas `getPublicOffers` — os de admin já existem em `orders.functions.ts`)
- 1 migração: índice + função `get_public_offers`.

Editados:

- `src/components/admin/NovoConteudoModal.tsx` — substitui blocos de venda por `OfertasEditor` (curso, aula, material/serviço).
- `src/components/CursoModal.tsx` e rotas de curso/aula/serviço — usar `getPublicOffers` para renderizar botões de compra.
- `src/lib/orders.server.ts` — webhooks já usam `resolveProdutoByExternalId` em `product_offers` (ok).

## Pontos a confirmar antes de eu começar

1. **Moedas**: além de BRL/USD/EUR, precisa de outra? (ex.: GBP)  
resposta 1: real, euro, dolar
2. **País**: usar códigos ISO (`BR`, `US`, `PT`…) ou apenas dois buckets `BR` / `INT` como hoje?  
resposta 1: brasil, espanha, eua
3. **Mercado Pago nativo**: manter como única plataforma com checkout dentro do app, ou tratar todas como link externo nesta primeira versão?  
resposta 1: todas devem ser tratadas como nativa se possivel 
4. **Aulas avulsas**: ao comprar uma aula, o acesso é só àquela aula (`aula_matriculas`) — confirma que está ok manter esse comportamento já existente?  
resposta 1: ao comprar o usuario so tem acesso a aquilo que comprou 
    
    
  ADICIONAR AO REDESENHO DO MÓDULO DE CURSOS
  Os cursos também devem permitir uma apresentação multimídia premium.
  Na criação ou edição do curso, adicionar a seção:
  "Apresentação do Curso"
  Campos obrigatórios e opcionais:
  - imagem de capa do curso;
  - vídeo de capa do curso;
  - título comercial;
  - subtítulo;
  - descrição curta;
  - descrição completa;
  - trailer do curso;
  - áudio de apresentação;
  - links externos de áudio.
  A imagem de capa será usada nos cards, vitrine, checkout e página do curso.
  O vídeo de capa poderá ser usado como trailer ou apresentação inicial do curso.
  O sistema deve permitir:
  - upload de vídeo;
  - URL externa de vídeo;
  - incorporação de vídeo;
  - thumbnail automática;
  - thumbnail manual.
  Também criar uma seção chamada:
  "Áudios e Conteúdos Externos"
  Nessa seção, o admin poderá adicionar itens que levem para o Spotify ou outras plataformas de áudio.
  Cada item de áudio deve ter:
  - título;
  - descrição;
  - capa;
  - link do Spotify;
  - tipo de áudio;
  - duração;
  - ordem;
  - status;
  - gratuito ou pago;
  - liberar junto com o curso;
  - liberar apenas após compra da aula;
  - liberar como bônus.
  Tipos de áudio:
  - podcast;
  - meditação guiada;
  - aula em áudio;
  - explicação complementar;
  - exercício guiado;
  - trilha de relaxamento;
  - conteúdo bônus.
  Na página do curso, exibir uma área elegante chamada:
  "Ouça também"
  Com lista de áudios vinculados ao curso.
  Cada item deve mostrar:
  - capa;
  - título;
  - descrição curta;
  - duração;
  - botão "Ouvir no Spotify";
  - indicação se é bônus, gratuito ou exclusivo.
  O sistema deve permitir vincular áudios a:
  - curso completo;
  - módulo;
  - aula;
  - serviço;
  - pacote premium.
  No checkout, quando o curso incluir áudios bônus, mostrar:
  "Também incluso neste curso"
  com os itens de áudio vinculados.
  Objetivo:
  transformar o curso em uma experiência multimídia completa, com vídeo, imagem, áudio, Spotify, aulas, materiais e serviços integrados em uma única jornada premium.