## Visão geral

Dois caminhos no site:

- **Acessar Atlas Materno** → área paga (cliente Hotmart). Login obrigatório. Acesso liberado automaticamente por webhook da Hotmart na compra aprovada / removido em reembolso/cancelamento.
- **Conteúdos** → área aberta de leads. Sem login. Para baixar/assistir cada material, o visitante informa **nome + e-mail + telefone**; o lead é salvo no banco e o material é liberado na hora.

Painel `/admin` para você gerenciar tudo, com login restrito (`contato@lemater.com`).

---

## 1. Banco de dados (Lovable Cloud)

Tabelas novas:

- `app_role` enum: `admin`, `aluno`
- `user_roles` (user_id, role) — segue o padrão seguro já usado no projeto, com função `has_role()`
- `materiais`
  - `titulo`, `descricao`, `categoria` (concepção/gestação/pós-parto/bebê/outro)
  - `tipo` (`pdf`, `video_externo`, `video_upload`, `artigo`)
  - `area` (`gratis` | `pago`) — define onde aparece
  - `conteudo_url` (PDFs e vídeos com upload usam Storage; vídeos externos guardam o link YouTube/Vimeo; artigos guardam HTML)
  - `conteudo_html` (para artigos)
  - `capa_url`, `ordem`, `publicado` (bool)
- `leads_gratis` — nome, email, telefone, material_id, criado_em (cada download capturado vira um registro)
- `hotmart_compras` — email_comprador, transaction_id, status (`ativo`/`cancelado`/`reembolsado`), produto, raw_payload, processado_em
- `app_acesso_pago` — user_id, ativo, origem (`hotmart`/`manual`), expira_em (opcional)

Storage buckets:
- `materiais-pdf` (privado — servido por URL assinada para pagantes; público para os de área grátis)
- `materiais-video` (privado para área paga)
- `materiais-capas` (público)

RLS:
- `materiais`: leitura pública apenas dos `area='gratis' AND publicado=true`. Pagos só com `has_role('admin')` ou `app_acesso_pago.ativo=true` para o usuário logado. Admin escreve tudo.
- `leads_gratis`: insert público (com validação no servidor); leitura só admin.
- `hotmart_compras`, `app_acesso_pago`, `user_roles`: só admin lê/escreve.

---

## 2. Autenticação

- Email + senha apenas (sem Google, sem cadastro aberto).
- **Cadastro público desativado** (`disable_signup: true`). Contas só nascem por:
  - webhook Hotmart (cria conta + role `aluno` + `app_acesso_pago.ativo=true` e dispara reset de senha por e-mail), ou
  - admin criando manualmente.
- Conta admin `contato@lemater.com` será criada via migration (insert direto em `auth.users` com a senha `rape1226` hasheada) e adicionada em `user_roles` com role `admin`.
- `auto_confirm_email: true` para o admin e para contas geradas pelo webhook (assim o aluno entra direto sem precisar confirmar).

---

## 3. Rotas novas

Públicas:
- `/login` — formulário e-mail/senha. Após login: admin → `/admin`; aluno → `/atlas` (área paga).
- `/conteudos` — já existe (será adaptada para listar `materiais` com `area='gratis'`).
- `/conteudos/$id` — página do material grátis com formulário (nome/email/telefone) que libera o conteúdo na mesma página depois do envio.

Layout protegido `_authenticated` (gate por `beforeLoad`):
- `/atlas` — área paga: lista materiais `area='pago'` para usuários com `app_acesso_pago.ativo=true`.
- `/atlas/$id` — visualizador (PDF embed / player de vídeo / artigo).

Layout `_authenticated/_admin` (gate adicional `has_role('admin')`):
- `/admin` — dashboard (contadores: leads, alunos ativos, materiais publicados).
- `/admin/materiais` — CRUD de materiais (upload PDF/vídeo, link externo, editor de artigo, marcar grátis/pago, publicar).
- `/admin/leads` — lista/exporta leads da área grátis.
- `/admin/alunos` — lista compradores Hotmart, status, botão liberar/revogar acesso manualmente, botão reenviar e-mail de definição de senha.
- `/admin/compras` — log do webhook Hotmart.

Header (`ConteudoNav` + `site.tsx`):
- Botão "Acessar Atlas Materno" → se logado com acesso pago vai para `/atlas`; senão `/login`.
- Botão "Conteúdos" → `/conteudos`.
- Botão "ACESSE APP" passa a ser "ENTRAR" → `/login`.

---

## 4. Server-side (TanStack server functions + 1 webhook)

`createServerFn` em `src/lib/`:
- `materiais.functions.ts`: `listGratis`, `getGratis`, `listPago` (auth), `getPago` (auth + acesso), `getSignedUrl` (auth + acesso para PDFs/vídeos privados); admin: `upsertMaterial`, `deleteMaterial`, `togglePublicado`.
- `leads.functions.ts`: `registrarLead` (público, validado com Zod: nome 2–100, e-mail válido, telefone 10–15 dígitos) — retorna URL do material liberado.
- `admin.functions.ts`: `listLeads`, `listAlunos`, `liberarAcessoManual`, `revogarAcesso`, `reenviarSenha` (usa `supabaseAdmin`).

Webhook Hotmart — server route pública:
- `src/routes/api/public/hotmart-webhook.ts`
- Verifica HOTTOK (header `X-Hotmart-Hottok`) contra secret `HOTMART_WEBHOOK_SECRET`.
- Eventos tratados: `PURCHASE_APPROVED` / `PURCHASE_COMPLETE` → cria/atualiza usuário + role `aluno` + `app_acesso_pago.ativo=true` + envia e-mail de definição de senha. `PURCHASE_REFUNDED` / `PURCHASE_CANCELED` / `PURCHASE_CHARGEBACK` → `app_acesso_pago.ativo=false`.
- URL estável fornecida ao usuário para colar na Hotmart: `https://project--f70afa81-002d-4470-8211-2a90bfccffdd.lovable.app/api/public/hotmart-webhook`.

Secret necessária: `HOTMART_WEBHOOK_SECRET` (eu pedirei via `add_secret` antes de finalizar o webhook).

---

## 5. Design e UI

Reaproveita 100% o sistema atual (paleta navy/gold, Playfair + DM Sans, sem ícones — respeitando a memória do projeto). Painel admin usa o mesmo design, com cards e tabelas em tom sóbrio (sem ícones), botões dourados, header `ConteudoNav` reutilizado nas áreas logadas.

---

## 6. Ordem de execução

1. Migration: enums, tabelas, RLS, buckets, função `has_role`, criação do admin `contato@lemater.com`.
2. Rotas `/login`, `_authenticated`, `_authenticated/_admin`.
3. Painel `/admin/materiais` + server fns + uploads.
4. Reescrever `/conteudos` lendo do banco + `registrarLead`.
5. `/atlas` listando materiais pagos.
6. Webhook Hotmart + tela `/admin/alunos` e `/admin/compras`.
7. Pedir o secret `HOTMART_WEBHOOK_SECRET` e entregar a URL para colar na Hotmart.