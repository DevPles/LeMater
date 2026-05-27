## Visão geral

Hoje o módulo está fragmentado: campos de preço/links existem mas o checkout só funciona para curso completo via Mercado Pago, aulas avulsas não cobram, materiais e serviços não têm fluxo de venda, e os webhooks externos não liberam nada automaticamente. Vamos unificar tudo em **um único motor de vendas** que entende 4 tipos de produto e libera acesso pelo mesmo caminho.

## Arquitetura nova

```text
┌─ Produto (cursos | aulas | materiais | serviços/slots)
│   └─ Preço base + preço por país (BRL/EUR/USD)
│   └─ Lista de "ofertas" = {país, plataforma, url_externa | "checkout_nativo"}
│
├─ Pedidos (orders) — fonte única da verdade
│   ├─ status: pendente | aprovado | recusado | reembolsado
│   ├─ origem: mercadopago | hotmart | kiwify | eduzz | stripe | teachable | gumroad | manual
│   └─ vínculo: produto + comprador (email/user_id)
│
└─ Webhook único → cria/atualiza pedido → libera acesso
    ├─ curso  → curso_matriculas
    ├─ aula   → aula_matriculas
    ├─ material → material_acessos
    └─ serviço → confirma appointment_slot
```

## O que será feito

### 1. Banco (migração única)
- **`product_offers`** — nova tabela polimórfica (`produto_tipo`, `produto_id`, `pais`, `plataforma`, `tipo_link` = nativo/externo, `url_externo`, `produto_externo_id`, `preco_centavos`, `moeda`). Substitui os 3 campos JSONB soltos (`links_compra`, `link_compra_externo`, `plataforma_venda`) por linhas indexáveis.
- **`orders`** — pedido unificado: `id, produto_tipo, produto_id, comprador_email, comprador_user_id, plataforma, transaction_id_externo, status, valor_centavos, moeda, cupom_codigo, raw_payload, created_at, aprovado_em`. Substitui `hotmart_compras`.
- **Materiais e serviços** ganham `preco_centavos`, `links_compra` espelhando o padrão dos cursos (na verdade tudo passa a ler de `product_offers`).
- Função `liberar_acesso_por_pedido(order_id)` (SECURITY DEFINER) — recebe um pedido aprovado e cria a matrícula/acesso correspondente; idempotente.
- RLS + GRANTs apropriados (admin gerencia, comprador vê os próprios pedidos).

### 2. Webhooks externos (`/api/public/hooks/...`)
Cinco endpoints novos, cada um com verificação HMAC própria, normalizando para um pedido unificado:
- `hooks/hotmart` (token Hottok)
- `hooks/kiwify` (assinatura HMAC)
- `hooks/eduzz` (assinatura)
- `hooks/stripe` (Stripe-Signature)
- `hooks/teachable` (HMAC)
- `hooks/gumroad` (ping signature)

Cada handler: valida assinatura → casa produto por `produto_externo_id` → upsert em `orders` → se status terminal "aprovado" chama `liberar_acesso_por_pedido` → 200. Em caso de reembolso, desativa a matrícula.

### 3. Checkout nativo (Mercado Pago)
- Server fn `criarCheckoutPedido({ produto_tipo, produto_id, cupom?, comprador_email })` — funciona para os 4 tipos (não só curso). Cria pedido `pendente` antes de redirecionar e usa `external_reference = order_id`.
- Webhook MP existente (`/api/public/hooks/mercadopago`) já recebe; vai passar a usar `liberar_acesso_por_pedido` em vez da lógica hard-coded de curso.

### 4. Admin (Atlas → módulo "Catálogo")
Reescrever `NovoConteudoModal` + `CursosTab` (e adicionar editor de materiais/serviços com o mesmo padrão):
- **Painel "Ofertas de venda"** por produto, com botões: *+ Adicionar oferta*. Cada oferta = `{país (BR/PT/EU/US/Outros), plataforma (Mercado Pago / Hotmart / Kiwify / Eduzz / Stripe / Teachable / Gumroad), preço, link externo OU "usar checkout nativo", produto_externo_id (opcional)}`.
- Validação: pelo menos 1 oferta para cobrar; aulas avulsas aceitam preço independente do curso.
- Aba "Pedidos" no admin: lista `orders` com filtros (status, plataforma, produto), botão **Aprovar manualmente** e **Reembolsar** (chama `liberar_acesso_por_pedido` / revoga).
- Aba "Integrações" mostrando, por plataforma, a **URL do webhook** e o **secret HMAC** já gerado, prontos para colar no painel da Hotmart/Kiwify/etc.

### 5. Vitrine (cliente)
Card de produto bloqueado mostra:
- **Brasil** (detectado por `navigator.language` ou país do perfil) → botão "Comprar agora" (checkout MP nativo) + botões secundários "Comprar na Hotmart / Kiwify / Eduzz" se houver ofertas BR externas.
- **Outros países** → botões correspondentes (Stripe / Teachable / Gumroad).
- Aula bloqueada exibe preço próprio + botões próprios (hoje só mostra preço do curso).
- Materiais e serviços passam pelo mesmo componente de "ofertas".

### 6. Secrets
Vou pedir via `add_secret` quando ativarmos cada plataforma:
`HOTMART_HOTTOK`, `KIWIFY_WEBHOOK_SECRET`, `EDUZZ_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`, `TEACHABLE_WEBHOOK_SECRET`, `GUMROAD_WEBHOOK_SECRET`. Mercado Pago já existe.

## Detalhes técnicos

- Stack: TanStack Start server functions para admin/checkout, `src/routes/api/public/hooks/*.ts` para webhooks (assinatura sempre validada antes de qualquer escrita).
- `orders.transaction_id_externo` é UNIQUE por (plataforma, transaction_id) → reentregas do webhook são idempotentes.
- `liberar_acesso_por_pedido` usa `ON CONFLICT DO NOTHING` em todas as tabelas-alvo, então liberar 2x é seguro.
- Migração faz **backfill**: lê os JSONB `links_compra` atuais dos cursos/aulas e popula `product_offers` para não perder nada.
- Webhook URL pública estável: `https://project--f70afa81-002d-4470-8211-2a90bfccffdd.lovable.app/api/public/hooks/<plataforma>` — copio na aba Integrações.

## Entrega faseada

1. **Fase 1 (migração + backend)**: tabelas `product_offers` e `orders`, função de liberação, server fns admin (CRUD ofertas, listar pedidos, aprovar manual).
2. **Fase 2 (webhooks)**: 6 endpoints com HMAC + adaptação do MP existente.
3. **Fase 3 (admin)**: novo modal unificado de ofertas, aba Pedidos, aba Integrações com URLs e secrets.
4. **Fase 4 (vitrine)**: detecção de país, botões dinâmicos, suporte a aula/material/serviço bloqueados.

## Pontos para confirmar antes de implementar

1. **Aula avulsa**: ao comprar uma aula, libera só ela (`aula_matriculas`) e ela aparece destrancada dentro do curso — ok?
2. **Serviço/consulta**: a venda é amarrada a um `appointment_slot` específico (gestante escolhe horário → paga → confirma)? Ou é "pacote" pré-pago que depois reserva?
3. **Detecção de país do comprador**: usar `profiles.cidade`/país do perfil quando logado e cair em `navigator.language` para anônimos — ok? Ou prefere um seletor manual ("Estou em: BR / PT / US / Outro")?

Posso prosseguir nessa direção?