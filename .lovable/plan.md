# Reestruturação: de "cursos" para ecossistema modular Le Mater

Hoje a plataforma gira em volta de `cursos → curso_modulos → curso_aulas`, com matrículas no curso inteiro. Você quer o oposto: **aula como produto principal**, **módulos como agrupadores emocionais** (uma aula em vários), **trilhas/jornadas** prontas, **carrinho** que monta jornada própria, **engine de recomendação** por fase, e vitrine estilo Netflix/Spotify materno.

Isso é uma mudança grande — backend + admin + área da aluna + vitrine pública + checkout. Vou propor uma execução em **5 fases independentes**, cada uma entregável e usável. Você aprova fase a fase; nada quebra o que existe hoje (cursos atuais continuam funcionando até serem migrados).

---

## Fase 1 — Fundação de dados (modules / lessons / pathways / cart / entitlements)

Novas tabelas em paralelo às atuais (sem dropar nada):

- `modules` — agrupador emocional. Campos: id, slug, title, subtitle, description, emotional_context, cover_image, cover_video, color, order, visibility (`public|premium|hidden`), active, seo_title, seo_description.
- `lessons` — produto independente. Campos: id, slug, title, subtitle, short_description, full_description, transformation (texto longo: "você aprenderá / como ajuda"), benefits (jsonb array), objectives (jsonb array), video_url, trailer_url, cover_video_url, thumbnail, audio_url, spotify_url, pdf_url, materiais_extras (jsonb), duration_sec, difficulty, tags (text[]), visibility, free_or_paid, individual_price_centavos, currency, preview_enabled, active.
- `lesson_modules` — N:N entre aula e módulo (`lesson_id`, `module_id`, `order`).
- `pathways` — trilhas curadas (Tentante, Parto Humanizado, Pós-Parto Real, etc.). Campos: id, slug, title, subtitle, description, cover, color, audience, recommended_week_min/max, price_centavos, currency.
- `pathway_lessons` — aulas de cada trilha.
- `bundles` — pacotes (módulo cheio, jornada completa, combos), com `bundle_items` (lesson/module/pathway/service).
- `entitlements` — fonte única de "o que esta usuária tem acesso a". Campos: user_id, item_type (`lesson|module|pathway|bundle|all_access`), item_id, source (`purchase|subscription|coupon|manual|bundle|gift`), granted_at, expires_at, active. Substitui no tempo `curso_matriculas`, `aula_matriculas`, `app_acesso_pago` por uma só visão.
- `lesson_offers` / `module_offers` / `pathway_offers` — reaproveita o padrão do `product_offers` existente (por país + plataforma: mercadopago/stripe/hotmart/kiwify/eduzz/link externo).
- `cart_items` — carrinho persistente da usuária. `user_id`, `item_type`, `item_id`, `added_at`, `notes`.
- `user_journeys` — "Minha Jornada" salva (lista de itens + título).
- `lesson_views` / `lesson_progress` — analítica para a engine de recomendação.
- Funções SQL: `has_entitlement(_user, _type, _id)`, `recommend_lessons(_user, _limit)`, `lesson_access(_user, _lesson)` (RPC para checar acesso considerando entitlements + bundles + trilhas).
- RLS + GRANTs em todas, seguindo o padrão do projeto.

**Importante:** não mexo nas tabelas atuais `cursos/curso_modulos/curso_aulas` nesta fase. Faço uma view de compatibilidade para os componentes legados continuarem renderizando enquanto migramos.

## Fase 2 — Admin: criar/editar módulos, aulas, trilhas, ofertas

No `/app/admin`, adicionar abas/tabs:

- **Módulos** — CRUD com capa/vídeo, cor, contexto emocional, ordem, visibilidade, SEO.
- **Aulas** — CRUD focado em aula como produto: mídia (vídeo principal, trailer, cover_video autoplay, thumbnail, áudio, Spotify embed, PDF), descrição emocional + benefícios + objetivos + transformação prometida, tags, dificuldade, vínculo N:N com módulos, ofertas por país/plataforma (lista moderna de gateways).
- **Trilhas** — CRUD + drag-and-drop de aulas, capa, preço, público-alvo, faixa de semanas recomendada.
- **Pacotes/Bundles** — combinar lessons + modules + pathways + serviços, com preço próprio.
- **Ofertas & Gateways** — editor unificado (Mercado Pago, Stripe, Hotmart, Kiwify, Eduzz, link manual). Lista expansível: ao selecionar gateway, abre campos específicos.
- **Entitlements** — liberar acesso manual, ver quem tem acesso a quê, revogar.
- Migração assistida: botão "importar curso existente → módulo + aulas" (mantém histórico, gera entitlements pros alunos atuais).

## Fase 3 — Vitrine pública (Netflix/Spotify materno)

Nova rota `/biblioteca` (ou substitui `/app/videos` na área logada):

- **Home modular**: hero rotativo com cover_video autoplay sem áudio, prateleiras horizontais por módulo, "Para você" (recomendações), "Continue assistindo", "Novidades", "Trilhas em destaque".
- **Página de módulo** `/m/$slug`: capa cinematográfica, descrição emocional, grade de aulas, trilhas relacionadas.
- **Página de aula** `/aula/$slug`: hero com cover_video autoplay, trailer, "Você aprenderá", "Como isso ajuda você", duração, nível, áudio/Spotify embed, PDF/extras, CTA de compra (ou "Assistir agora" se tem entitlement), aulas relacionadas ("Usuárias que assistiram também...").
- **Página de trilha** `/jornada/$slug`: storytelling + lista de aulas + preço de trilha vs comprar avulso.
- Visual: Playfair Display + DM Sans, paleta navy `#1a1557` / gold `#f0c040` / cream, sem ícones (memória do projeto), muito vídeo, microanimações.

## Fase 4 — Carrinho inteligente + "Minha Jornada" + checkout

- Carrinho persistente (`cart_items`) acessível em qualquer página.
- **Modal de item no carrinho** — não mostra só nome+preço: capa, vídeo preview, duração, nível, "Você aprenderá" (bullets), "Como isso ajuda você" (bullets), para quem é indicado, o que desbloqueia depois.
- **Upsell inteligente**: ao juntar N aulas de um mesmo módulo → "Desbloqueie o módulo completo por +R$ X" / "Vire Jornada Completa por +R$ Y" (calculado server-side).
- **Checkout multi-item**: itens agrupados por gateway. Brasil → Mercado Pago (PIX/boleto/cartão). Internacional → Stripe. Hotmart/Kiwify/Eduzz para itens com link externo (abre em nova aba, registra pedido pendente).
- **Minha Jornada**: usuária salva carrinhos como "jornadas" personalizadas, compartilha, retoma depois.
- Após pagamento aprovado (webhook), gera `entitlements` automaticamente para cada item.

## Fase 5 — Recomendação + Personalização

- Engine `recommend_lessons(_user)` baseada em: semana gestacional do profile, aulas vistas/concluídas, tags em comum, compras anteriores, fase declarada (tentante/grávida/puerpério).
- Componente "Para você" na home + na página de cada aula ("Quem assistiu isto também viu").
- Notificações/cards contextuais: "Você está em 32 semanas → mala da maternidade, contrações, golden hour".
- Onboarding leve: 3 perguntas (fase, objetivo, tempo disponível) → primeira trilha sugerida.

---

## Arquitetura técnica (resumo)

- **DB**: migrations Postgres com RLS + GRANTs, RPCs `security definer` para acesso/recomendação.
- **Backend**: novos arquivos `src/lib/modules.functions.ts`, `lessons.functions.ts`, `pathways.functions.ts`, `cart.functions.ts`, `entitlements.functions.ts`, `recommendations.functions.ts` (todos `createServerFn` no padrão do projeto). Webhooks de pagamento ampliados em `src/routes/api/public/` para gravar entitlements multi-item.
- **Frontend**: novas rotas `/biblioteca`, `/m/$slug`, `/aula/$slug`, `/jornada/$slug`, `/carrinho`, `/minha-jornada`; novos componentes (LessonHero, ModuleShelf, CartSheet, JourneyBuilder, OfferList, GatewaySelector); admin novas abas em `app.admin.tsx`.
- **Compatibilidade**: `cursos` atual continua funcionando; entitlement de "curso" vira entitlement de "módulo" equivalente na migração; nada quebra para alunos atuais.
- **Sem ícones** em nenhuma tela (memória do projeto). Paleta navy/gold/cream, Playfair + DM Sans.

---

## Decisões que preciso confirmar antes de começar

1. **Posso manter as tabelas `cursos/curso_*` em coexistência e migrar gradualmente?** (recomendo sim — evita perder acessos/vendas em andamento). Ou prefere apagar e refazer do zero?
2. **Por qual fase começo?** Recomendação: **Fase 1 (DB) + Fase 2 (admin)** juntas, porque sem dado novo nem admin não há como popular a vitrine. Depois Fase 3 (vitrine), Fase 4 (carrinho/checkout), Fase 5 (recomendação).
3. **Gateways no go-live**: começo só com **Mercado Pago (BR) + Stripe (intl) + link externo** (Hotmart/Kiwify/Eduzz como link)? Integração nativa de Hotmart/Kiwify/Eduzz já existe parcial via webhook — mantenho.
4. **All-access / assinatura mensal** entra agora ou fica para depois? (afeta `entitlements.item_type = 'all_access'` e cobrança recorrente Stripe/MP).

Me responda essas 4 e eu começo pela Fase 1 imediatamente — migration completa de `modules`, `lessons`, `lesson_modules`, `pathways`, `bundles`, `entitlements`, `cart_items` com RLS + GRANTs + RPCs.  
  
  
resposta:   
Sim, mantenha as tabelas atuais cursos/curso_modulos/curso_aulas em coexistência.

Não quero apagar nada agora.

A migração deve ser gradual, segura e compatível com o que já existe.

Os cursos atuais continuam funcionando, mas a nova arquitetura deve nascer em paralelo com:

- modules;
- lessons;
- pathways;
- bundles;
- entitlements;
- cart_items;
- user_journeys.

Depois fazemos migração assistida dos cursos antigos para módulos/aulas, sem quebrar acessos, matrículas, vendas ou histórico.

2. Comece pela Fase 1 e Fase 2 juntas.

Primeiro quero a fundação de dados e o admin funcionando.

Sem banco novo e sem painel administrativo não adianta criar vitrine.

Então a prioridade é:

- migrations completas;
- RLS;
- GRANTs;
- RPCs;
- CRUD de módulos;
- CRUD de aulas;
- vínculo aula-módulo;
- criação de trilhas;
- criação de bundles;
- ofertas por país e gateway;
- liberação manual de acesso;
- visualização de entitlements.

Depois seguimos para:

- Fase 3: vitrine pública;
- Fase 4: carrinho inteligente e checkout;
- Fase 5: recomendação e personalização.

3. No go-live, comece com Mercado Pago para Brasil, Stripe para internacional e links externos.

Estrutura inicial:

Brasil:

- Mercado Pago;
- PIX via Mercado Pago;
- boleto;
- cartão;
- link manual opcional.

Internacional:

- Stripe.

Links externos:

- Hotmart;
- Kiwify;
- PayPal;
- outros links externos.

Importante:

Hotmart, Kiwify e Eduzz devem começar como checkout externo/link externo, sem obrigar integração nativa agora.

A integração nativa pode ficar para uma etapa futura.

4. Assinatura mensal e all-access devem ficar para depois.

Não quero colocar recorrência agora.

Nesta primeira etapa, foque em:

- compra avulsa de aula;
- compra de módulo;
- compra de trilha;
- compra de bundle;
- acesso manual;
- acesso por pagamento aprovado.

Mas deixe o banco preparado para assinatura futura.

Pode manter no entitlements:

item_type = all_access

Mas sem implementar cobrança recorrente agora.

5. Ajuste importante antes de começar.

Quero que a arquitetura inclua também:

- orders;
- order_items;
- payments;
- payment_events.

Não quero que entitlements sejam usados como pedido de compra.

A lógica correta deve ser:

order criada;  
pagamento processado;  
webhook confirmado;  
entitlement liberado.

6. Carrinho multi-gateway.

Não misture itens de gateways diferentes no mesmo pagamento.

Se o carrinho tiver itens de gateways diferentes, o sistema deve separar por grupo de pagamento.

Exemplo:

Itens Mercado Pago:  
geram um checkout Mercado Pago.

Itens Stripe:  
geram um checkout Stripe.

Itens Hotmart/Kiwify/Eduzz:  
abrem checkout externo e ficam como pedido externo pendente.

7. Adicione media_items.

Não quero que a tabela lessons vire uma tabela gigante e desorganizada.

Cada aula deve poder ter vários conteúdos de mídia:

- vídeo principal;
- vídeo de capa;
- trailer;
- Spotify;
- áudio;
- PDF;
- material extra;
- checklist;
- imagem;
- embed externo.

Criar tabela:

media_items

com:

- id;
- lesson_id;
- type;
- provider;
- url;
- thumbnail;
- title;
- description;
- duration_sec;
- order;
- visibility;
- active.

8. Adicione suporte futuro a serviços.

A plataforma também venderá:

- consultas;
- mentorias;
- teleconsultas;
- acompanhamento;
- serviços profissionais.

Então a arquitetura deve prever:

service_products

ou

bookable_products

com possibilidade de agenda, duração, preço, profissional e checkout.

Não precisa implementar tudo agora, mas a estrutura deve estar prevista.

9. Mantenha o padrão visual premium.

Sem layout de LMS antigo.

Sem tela amadora.

Sem excesso de cards simples.

A experiência deve lembrar:

- Netflix;
- Spotify;
- Apple Fitness;
- Masterclass;
- Kajabi premium.

Visual:

- editorial;
- elegante;
- maternal;
- premium;
- leve;
- com vídeo;
- com carrinho moderno;
- com sensação de jornada personalizada.

10. Não usar ícones desnecessários.

Mantenha o visual limpo, premium, editorial e profissional.

Pode começar pela Fase 1 + Fase 2 com essas correções.