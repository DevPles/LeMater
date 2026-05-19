## Objetivo

Trazer de volta todas as páginas do aplicativo mobile (que foram removidas em 15/mai), agora sob o prefixo `/app/*`, sem mexer no site público em `/` nem no dashboard `/membro` já feito.

## Por que dá pra recriar sem perder progresso

Os arquivos de rota foram apagados, mas **os componentes que formavam essas páginas continuam todos no projeto**:

- `BottomNav`, `WeekProgress`, `BabySize`, `FlyingStork`
- `QuickActions`, `TipCard`, `ContentCard`, `NotificacoesCard`
- `LiquidCard`, `LoadingMessage`, `PushOptInBanner`
- `ProntuarioConsultaModal`, `ProfissionalNav`, `ReelRecorder`
- Hooks: `useGestanteProfile`, `usePushSubscription`, `useScreenContent`, `useAutoTranslate`, `useUserRole`
- Server fns: `livekit.functions.ts`, `push.functions.ts`, `materiais.functions.ts`

A recriação é basicamente "montar a rota e colar os componentes existentes". Nada que já está pronto (site, /membro, /atlas, /admin, login) é tocado.

## Estrutura de rotas a criar

Todas dentro de `src/routes/_authenticated/app.*` (protegidas por login, já que o `_authenticated.tsx` cuida do guard):

```text
src/routes/_authenticated/
  app.tsx                          → layout do app (BottomNav + Outlet)
  app.index.tsx                    → /app          (home do app: WeekProgress, BabySize, QuickActions, TipCard, NotificacoesCard)
  app.gestacao.tsx                 → /app/gestacao (linha do tempo da gestação, semana atual, marcos)
  app.alertas.tsx                  → /app/alertas  (lista de alertas/notificações)
  app.cartao.tsx                   → /app/cartao   (cartão da gestante: dados, UBS, tipo sanguíneo, vacinas)
  app.perfil.tsx                   → /app/perfil   (perfil + logout, reaproveita modal de edição)
  app.videos.tsx                   → /app/videos   (lista de vídeos/aulas curtas)
  app.atlas-materno.tsx            → layout aba das 4 fases
  app.atlas-materno.concepcao.tsx  → /app/atlas-materno/concepcao
  app.atlas-materno.gestacao.tsx   → /app/atlas-materno/gestacao
  app.atlas-materno.bebe.tsx       → /app/atlas-materno/bebe
  app.atlas-materno.pos-parto.tsx  → /app/atlas-materno/pos-parto
  app.profissional.tsx             → /app/profissional (agenda do profissional, reaproveita ProfissionalNav)
  app.videochamada.tsx             → /app/videochamada (entrada para sala LiveKit)
  app.sala.$roomId.tsx             → /app/sala/:roomId (sala de videochamada via livekit.functions)
```

`app.tsx` é layout com `<Outlet />` e `<BottomNav />` fixo no rodapé (rota `/app/profissional` e descendentes trocam para `<ProfissionalNav />`).

## Como cada página será montada

| Rota | Componentes / dados |
|---|---|
| `/app` (home) | `WeekProgress`, `BabySize`, `QuickActions`, `TipCard`, `NotificacoesCard`, `FlyingStork`, `PushOptInBanner` — dados via `useGestanteProfile` |
| `/app/gestacao` | `WeekProgress`, `BabySize` + timeline (reaproveita `getDashboardMembro` que já agrega exames/consultas) |
| `/app/alertas` | Lista de notificações da tabela existente; `NotificacoesCard` em loop |
| `/app/cartao` | Dados do perfil gestante (tipo sanguíneo, UBS, vacinas) em layout de cartão |
| `/app/perfil` | Reaproveita `EditarPerfilModal` de `/membro`; botão sair |
| `/app/videos` | Reaproveita `materiais.functions.ts` para listar vídeos curtos |
| `/app/atlas-materno/*` | 4 sub-rotas, cada fase carrega conteúdo via `useScreenContent` |
| `/app/profissional` | Agenda de consultas; usa `useUserRole` para bloquear não-profissionais |
| `/app/videochamada` | Tela de "entrar na sala" → cria/escolhe roomId |
| `/app/sala/$roomId` | LiveKit via `livekit.functions.ts` (já existe) |

## Decisões / convenções

- Visual segue a memória: navy `#1a1557` + gold `#f0c040`, Playfair Display + DM Sans, **sem ícones** (BottomNav vira texto puro como `ProfissionalNav` já faz).
- BottomNav atual será ajustado para os 5 destinos do app (`/app`, `/app/gestacao`, `/app/atlas-materno/gestacao`, `/app/alertas`, `/app/perfil`).
- Página `/membro` continua intocada — `/app` é uma experiência **separada** estilo mobile.
- Acessível desde o `/membro` por um link "Abrir app" no topo.
- Tudo sob `_authenticated`, então redirect para `/login` é automático.

## O que NÃO muda

- `src/routes/index.tsx` (site), `src/routes/atlas*`, `src/routes/login.tsx`, `src/routes/_authenticated/admin.tsx`, `src/routes/_authenticated/membro.tsx`, `src/routes/_authenticated/atlas.$slug.aprender.tsx` — todos preservados.
- Banco de dados: nada de migration. Tudo é apenas frontend + chamadas a server fns já existentes.
- `src/integrations/supabase/*`, `src/start.ts`, `vite.config.ts` — intocados.

## Entregáveis

1. 14 arquivos de rota novos em `src/routes/_authenticated/app.*.tsx`.
2. Pequeno ajuste em `BottomNav.tsx` para apontar para as rotas `/app/*` (sem ícones, só texto, no padrão Le Mater).
3. Link "Abrir app" adicionado na TopBar de `/membro`.

Depois de aprovado, implemento em uma única passada criando os 14 arquivos em paralelo.
