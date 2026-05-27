## Finalizar sistema de vendas multi-nível

### 1. Flush das ofertas/áudios do curso após salvar
Em `NovoConteudoModal.tsx`, dentro de `salvarCurso` (logo após `cursoRow = await upCurso(...)` na linha 371), chamar em paralelo:
```ts
await Promise.all([
  ofertasCursoRef.current?.flush(cursoRow.id),
  audiosCursoRef.current?.flush(cursoRow.id),
]);
```
Funciona tanto na criação quanto na edição (o early-return `if (editando) return` vem depois).

### 2. Ofertas e áudios por aula
Cada aula precisa de seus próprios refs. No estado `AulaLocal`, adicionar:
- `ofertasRef: React.RefObject<OfertasEditorHandle>`
- `audiosRef: React.RefObject<AudiosEditorHandle>`

Criados em `aulaVazia()` via `createRef()`. No JSX do bloco de aula (dentro de `FormCurso`), renderizar:
- `<OfertasEditor ref={a.ofertasRef} produtoTipo="aula" produtoId={a.id ?? null} titulo="Venda desta aula" />` — só aparece quando `!ehGratis && !a.previa_gratis`.
- `<AudiosEditor ref={a.audiosRef} vinculoTipo="aula" vinculoId={a.id ?? null} />`

Após `upAula(...)` retornar a `aulaRow`, chamar:
```ts
await Promise.all([
  a.ofertasRef.current?.flush(aulaRow.id),
  a.audiosRef.current?.flush(aulaRow.id),
]);
```

Remover do payload de aula os campos antigos `preco_centavos`, `preco_label`, `links_compra` (deixa de ler/escrever na UI; banco continua compatível).

### 3. Ofertas do serviço
Já existe `ofertasServicoRef`. Em `FormMaterial` quando `isServico`, renderizar `<OfertasEditor ref={ofertasServicoRef} produtoTipo="servico" produtoId={material.id ?? null} />` e chamar `flush(materialRow.id)` após salvar.

### 4. Vitrine pública (`CursoModal.tsx`)
- Substituir leitura de `curso.links_compra` / `preco_centavos` pelo carregamento de ofertas via `getPublicOffers({ produto_tipo: "curso", produto_id, pais })`.
- País inferido do `navigator.language` (BR/ES/US) com seletor manual no topo do bloco de compra.
- Renderizar uma lista de botões "Comprar — {label} — {moeda} {preco}". Plataforma `mercadopago` com `tipo_link=nativo` → fluxo interno (mantém o atual `iniciarCheckoutMercadoPago` se existir, senão abre placeholder); demais → `window.open(url_externo, "_blank")`.
- Para cada aula listada, mesmo padrão com `getPublicAudios({ vinculo_tipo: "aula", vinculo_id })` e `getPublicOffers({ produto_tipo: "aula", ... })` — botão "Comprar aula avulsa".
- Nova seção "Ouça também" com os áudios do curso (`getPublicAudios({ vinculo_tipo: "curso", ... })`), renderizando título + duração + link/iframe Spotify quando aplicável.

### 5. Limpeza
Sem migration nova — campos antigos (`links_compra`, `link_compra_externo`, `plataforma_venda`, `produto_externo_id` no curso/aula) ficam no banco mas saem da UI. Webhooks continuam usando `product_offers.produto_externo_id` para resolver o produto.

### Arquivos tocados
- `src/components/admin/NovoConteudoModal.tsx` (flush curso + aulas + serviço, refs por aula, JSX de oferta/áudio por aula)
- `src/components/CursoModal.tsx` (vitrine: ofertas + áudios públicos)

### Fora de escopo
- Não reescrever webhooks.
- Não mexer em `cursos.functions.ts` / `orders.server.ts`.
- Não criar nova migration.
