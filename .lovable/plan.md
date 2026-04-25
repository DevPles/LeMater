## Objetivo

Substituir a integração Jitsi por **LiveKit Cloud**, que oferece 10.000 minutos grátis por mês, SDK React oficial, funciona perfeitamente em mobile (iOS/Android) e roda **embutido dentro do próprio app** (sem abrir outra aba).

## Por que LiveKit

- **10.000 minutos/mês grátis** (≈ 166 horas de chamada)
- SDK React pronto (`@livekit/components-react`) — não precisa montar UI do zero
- Servidores TURN/STUN globais incluídos → funciona em 4G/5G e Wi-Fi corporativo
- Open source: dá pra migrar pra self-hosted depois sem trocar código
- Áudio/vídeo HD, baixa latência

## O que você precisa fazer (1 vez)

1. Criar conta grátis em https://cloud.livekit.io
2. Criar um projeto (ex: "MaeDigital")
3. Copiar 3 valores do painel: **API Key**, **API Secret** e **WebSocket URL** (algo como `wss://maedigital-xyz.livekit.cloud`)
4. Me passar via tela de secrets do Lovable

## Arquitetura

```text
Gestante (browser)                    Profissional (browser)
       |                                       |
       |  1. Pede token ao backend             |
       v                                       v
  [Server function: gerarTokenLiveKit]  ←  RLS valida quem pode entrar
       |                                       |
       |  2. Conecta com token + WS URL        |
       v                                       v
              [LiveKit Cloud]
         (servidor de mídia + TURN)
```

- **Backend** gera token JWT assinado com a API Secret (nunca exposto ao cliente)
- **Frontend** usa o token para entrar na sala via WebRTC
- **RLS** garante que só profissional dono e gestante reservada entram

## Mudanças no código

### 1. Dependências
Instalar:
- `livekit-client` (cliente WebRTC)
- `@livekit/components-react` (componentes React prontos)
- `@livekit/components-styles` (CSS dos componentes)
- `livekit-server-sdk` (geração de token no backend)

### 2. Secrets (você cadastra)
- `LIVEKIT_API_KEY` (server-only)
- `LIVEKIT_API_SECRET` (server-only)
- `VITE_LIVEKIT_URL` (público, WS URL — pode ir no client)

### 3. Server function nova: `src/utils/livekit.functions.ts`
- `gerarTokenSala({ roomId })` → valida sessão do usuário, confere via Supabase se ele é o profissional dono ou a gestante reservada do slot, gera token JWT do LiveKit com identidade e nome corretos, retorna `{ token, wsUrl }`
- Usa `requireSupabaseAuth` middleware
- Tempo de validade do token: 2h

### 4. Refatorar `src/routes/sala.$roomId.tsx`
- Remover todo código Jitsi (script loader, JitsiMeetExternalAPI, etc.)
- Manter tela de pré-entrada (com nome, horário, dicas)
- Ao clicar "Entrar", chamar a server function pra pegar token
- Renderizar `<LiveKitRoom>` do SDK com:
  - `<VideoConference />` (UI completa pronta: vídeos, mic, câmera, chat, hangup, tile view)
  - Tema customizado pra combinar com o app (cores coral/blush)
  - Callback `onDisconnected` → volta pra rota apropriada
- Manter cronômetro de duração no header
- Manter validação de permissão (gestante reservada ou profissional dono)

### 5. UI customizada
Em vez do `<VideoConference />` padrão do LiveKit (que tem visual genérico), usar componentes individuais para manter identidade visual:
- `<ParticipantTile />` para cada participante
- `<ControlBar controls={{ microphone: true, camera: true, leave: true, chat: false, screenShare: false }} />`
- Sem botão de gravação (seguindo decisão anterior)

### 6. Limpeza
- `src/routes/profissional.tsx`: remover referência a `recording_path` no tipo `Slot` (já não usamos)
- Verificar se há outros lugares que carregam o script Jitsi e remover

## Detalhes técnicos importantes

- **Permissões mobile**: LiveKit pede acesso a câmera/mic via `getUserMedia` padrão; iOS Safari exige interação do usuário (clique no botão "Entrar") — já garantido pelo fluxo atual
- **TURN automático**: LiveKit Cloud já provê servidores TURN, então funciona em 4G sem configuração adicional
- **Identidade do participante**: usar `user_id` do Supabase como `identity` no token (único) e `nome` do profile como `name` (exibido)
- **Nome da sala LiveKit**: usar `slot.room_id` (UUID já existente no banco)
- **Tokens não vão pro banco**: gerados sob demanda a cada entrada na sala
- **Sem cron/limpeza**: LiveKit fecha sala automaticamente quando todos saem

## Fluxo do usuário (sem mudanças visíveis grandes)

1. Profissional/gestante abre `/sala/{roomId}` → vê tela de pré-entrada (igual hoje)
2. Clica "Entrar na sala" → backend gera token (≈ 200ms)
3. Tela transiciona pra interface de vídeo embutida
4. Vê o outro participante quando ele entrar, fala, encerra
5. Ao clicar "Sair" → volta pra `/profissional` ou `/videochamada`

## Custo real esperado

Com plano grátis (10.000 min/mês):
- 100 consultas de 30min = 3.000 min → **dentro do grátis**
- 300 consultas de 30min = 9.000 min → **dentro do grátis**
- Acima disso: $0.005/participante-minuto (≈ R$0,025/min com 2 pessoas)

## Riscos e mitigações

- **Risco**: Usuário com rede muito restrita (firewall corporativo bloqueando UDP completo). **Mitigação**: LiveKit faz fallback automático pra TCP/443 (TURN over TLS), que passa em quase qualquer rede.
- **Risco**: iOS Safari < 14 não suporta. **Mitigação**: 99%+ dos iPhones em uso já estão em iOS 15+; mostramos mensagem clara se navegador incompatível.
- **Risco**: Conta LiveKit fica suspensa. **Mitigação**: monitoramos no painel; se acontecer, ativar billing leva 5 min e mantém serviço.

## Próximos passos após aprovação

1. Você cria a conta no LiveKit Cloud
2. Eu peço os 3 secrets via tela de secrets
3. Você cola os valores
4. Eu instalo as deps, crio a server function e refatoro a sala
5. Testamos juntos no PC e celular