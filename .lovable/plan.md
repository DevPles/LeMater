## Objetivo

Unificar `/conteudos-gratis` em uma **vitrine única** de Conteúdos & Cursos Le Mater, alimentada 100% pelo `/admin → Materiais`, com:

- Materiais grátis (públicos ou restritos a usuários liberados)
- Cursos/produtos pagos vendidos por **link externo** (Hotmart, Kiwify, Teachable, Eduzz, etc.)
- Cursos pagos consumidos **dentro do app** (PDF, vídeo nativo, YouTube/Vimeo, artigo)
- `/atlas` vira a **biblioteca pessoal** (somente itens já liberados para o usuário)

Visitante anônimo vê grátis + vitrine de venda. Usuário logado vê os mesmos cards já desbloqueados conforme permissão.

---

## 1. Banco (migration única)

**Em `materiais`** — novas colunas:
- `acesso text not null default 'publico'` — `publico` | `restrito`
- `link_compra text` — URL da plataforma de venda
- `plataforma_venda text` — `hotmart` | `kiwify` | `teachable` | `eduzz` | `outro`
- `preco_label text` — texto livre, ex. “R$ 197” ou “12x R$ 19,70”
- `cta_label text` — texto customizado do botão (opcional)

**Tabela nova `material_acessos`**:
- `material_id uuid not null`, `user_id uuid not null`, `liberado_por uuid`, `created_at timestamptz default now()`
- PK composta `(material_id, user_id)`
- RLS: admin gerencia tudo; usuário lê apenas suas próprias linhas

**Função `public.pode_ver_material(_user uuid, _mat uuid) returns boolean security definer`**:
Retorna `true` se `materiais.publicado = true` E uma das condições:
- `area='gratis' AND acesso='publico'`
- `area='pago' AND acesso='publico' AND link_compra IS NOT NULL` (vitrine de venda externa, qualquer um vê)
- `area='pago' AND acesso='publico' AND EXISTS app_acesso_pago(_user, ativo)`
- existe linha em `material_acessos(_mat,_user)`
- `_user` é admin

**Atualizar policies de SELECT em `materiais`** (drop + recreate):
- Para `anon` + `authenticated`: `publicado=true AND (acesso='publico' AND (area='gratis' OR link_compra IS NOT NULL))`
- Para `authenticated` (acesso completo): `pode_ver_material(auth.uid(), id) = true`
- Admin: mantém policy existente

---

## 2. Admin (`/admin → Materiais`)

No modal de criar/editar material, adicionar:

- **Capa** — upload para bucket público `materiais-capas` (já existe), opcional
- **Acesso** — select `publico` | `restrito`
- **Plataforma de venda** — select `hotmart`/`kiwify`/`teachable`/`eduzz`/`outro`/vazio
- **Link de compra** — URL (opcional)
- **Preço (texto livre)** — texto
- **Texto do botão (CTA)** — texto opcional
- Quando `Acesso = restrito`: seção **Usuários liberados** com busca em `profiles` (nome/email), botões Liberar / Revogar
- Categorias sugeridas via `datalist`: Concepção, Gestação, Puerpério, Bebê, Cursos

**Novas server functions em `src/lib/admin.functions.ts`**:
- `buscarUsuarios({ termo })` — busca em `profiles` por nome/email (admin only)
- `listMaterialAcessos({ material_id })`
- `liberarAcessoMaterial({ material_id, user_id })`
- `revogarAcessoMaterial({ material_id, user_id })`
- `upsertMaterial` atualizado com os novos campos

---

## 3. Vitrine `/conteudos-gratis` (página única)

Layout no mesmo padrão Atlas Materno. Header + filtros no topo: **Tudo · Grátis · Cursos · Concepção · Gestação · Puerpério · Bebê**.

Lista carregada por `listMateriaisVitrine` (server fn pública, usa `supabaseAdmin` + sessão opcional para incluir restritos liberados). Retorna por material:
- dados básicos + `capa_url`, `preco_label`, `plataforma_venda`, `link_compra`
- flags derivadas: `pode_consumir`, `precisa_lead`, `vende_externo`

**Quatro variações de card** (mesmo visual, CTA muda):
1. **Grátis público** — badge “Grátis” → modal de lead → entrega no modal
2. **Grátis restrito (liberado)** — badge “Liberado” → abre direto
3. **Pago interno (com acesso)** — badge “Seu curso” → abre direto
4. **Pago com link de compra** — badge da plataforma + `preco_label` + botão **Comprar agora** → `window.open(link_compra, '_blank', 'noopener,noreferrer')`
5. **Pago interno sem acesso e sem link** — botão **Entrar / Adquirir** → `/login` ou `/atlas`

Estados: carregando, vazio, erro.

---

## 4. `/atlas` — biblioteca pessoal

Lista somente o que o usuário logado pode consumir (`pode_ver_material` true E não é apenas vitrine de venda). Usa `getMaterialAccess` para entrega. Cards no mesmo layout, sem CTAs de compra.

---

## 5. Entrega do conteúdo

Novo arquivo `src/lib/materiais.functions.ts`:

```
type MaterialAccess =
  | { kind: 'pdf'; url: string }
  | { kind: 'video_upload'; url: string }
  | { kind: 'video_externo'; embedUrl: string; rawUrl: string }
  | { kind: 'artigo'; html: string }       // sanitizado server-side
  | { kind: 'externo'; url: string }       // link de compra
```

- `listMateriaisVitrine` — pública, retorna cards visíveis para anônimo + (se logado) restritos liberados
- `getMaterialGratisAccess({ material_id, lead })` — pública; grava lead em `leads_gratis`; libera apenas `area='gratis' AND acesso='publico' AND publicado=true`; assina URL do bucket privado conforme tipo
- `getMaterialAccess({ material_id })` — autenticada (`requireSupabaseAuth`); valida via `pode_ver_material`; assina URL ou retorna HTML

Sanitização de artigo com `isomorphic-dompurify` (`bun add isomorphic-dompurify`).

Modal de player no front renderiza por `kind`:
- `pdf` → iframe + botão **Baixar PDF**
- `video_upload` → `<video controls>` + botão **Baixar**
- `video_externo` → iframe embed YouTube/Vimeo
- `artigo` → HTML formatado
- `externo` → redireciona imediatamente

---

## 6. Arquivos a criar/editar

- **Migration**: colunas novas + `material_acessos` + RLS + `pode_ver_material` + recriar policies SELECT de `materiais`
- `src/lib/materiais.functions.ts` *(novo)* — listagem vitrine + entrega
- `src/lib/admin.functions.ts` — novas fns admin + `upsertMaterial` ampliado
- `src/routes/conteudos-gratis.tsx` — vitrine única dinâmica + filtros + modais (lead + player)
- `src/routes/_authenticated/atlas.tsx` — biblioteca pessoal usando as novas fns
- `src/routes/_authenticated/admin.tsx` — novos campos no formulário de Material + UI de “Usuários liberados”
- `package.json` — adicionar `isomorphic-dompurify`

---

## 7. Critérios de aceitação

1. Cadastrar grátis público (PDF, vídeo YouTube, vídeo nativo, artigo) → aparece, lead funciona, entrega correta
2. Cadastrar curso pago externo (Hotmart/Kiwify/Teachable) com `link_compra` + preço → card mostra preço e selo, botão Comprar abre link em nova aba
3. Cadastrar pago interno → aparece somente para usuários com `app_acesso_pago.ativo=true` e consome dentro do app
4. Marcar material como `restrito` e liberar manualmente um usuário → só esse usuário e admins veem o card
5. `publicado=false` nunca aparece publicamente
6. `/atlas` mostra somente itens consumíveis pelo usuário logado
7. Tentativa direta de `getMaterialAccess` para material não permitido retorna erro de permissão
8. RLS verificada: anônimo via SDK só lê grátis públicos e pagos com `link_compra`