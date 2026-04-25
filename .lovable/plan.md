## Plano: videochamada nativa que funciona em celular e PC desde já

Substituir o Jitsi por uma sala de vídeo nossa, feita com **WebRTC nativo do navegador + Supabase Realtime para sinalização**. Funciona em Chrome/Edge/Firefox no PC e em Safari/Chrome no celular (Android e iPhone) sem precisar instalar nada.

## Como vai funcionar para o usuário

**No PC** (profissional ou gestante):
- Abre `/sala/{id}`, navegador pede permissão de câmera/microfone, clica em "Entrar".
- Vê o vídeo do outro grande no centro, próprio vídeo num quadradinho no canto inferior direito.
- Barra inferior com 3 botões grandes: **Microfone**, **Câmera**, **Encerrar**.
- Topo: nome do outro participante, cronômetro `00:42`, badge `REC` quando estiver gravando.

**No celular** (Android / iPhone, navegador):
- Mesma tela, layout responsivo: vídeo remoto ocupa a tela toda, mini-vídeo no canto, controles na parte de baixo (área segura do iPhone respeitada).
- Funciona em modo retrato e paisagem.
- iOS exige HTTPS (já temos no domínio Lovable) e que o usuário toque um botão antes de começar (já fazemos com o "Entrar na sala") — ambas condições atendidas.

## Compatibilidade real (testado em produção por milhões de apps)

| Dispositivo | Chamada de vídeo | Áudio | Gravação |
|---|---|---|---|
| Chrome/Edge/Firefox PC | ✅ | ✅ | ✅ (lado profissional) |
| Safari macOS | ✅ | ✅ | ✅ |
| Chrome Android | ✅ | ✅ | ✅ |
| Safari iPhone/iPad (iOS 14.3+) | ✅ | ✅ | ⚠️ (gravação mais limitada — fica do lado do profissional, que normalmente está no desktop) |

## Como funciona por baixo (técnico)

```text
Profissional (PC ou celular)        Gestante (celular ou PC)
        |                                    |
        |-- entra em /sala/{roomId} ---------|
        |                                    |
        |   Supabase Realtime channel "room_<roomId>"
        |   <-------- sinalização --------->
        |   (offer / answer / ICE candidates via broadcast)
        |                                    |
        |======= WebRTC P2P (vídeo + áudio) =|
        |                                    |
        |  MediaRecorder grava local+remoto
        |  Upload .webm -> bucket consultation-recordings
```

1. **Mídia local**: `getUserMedia({ video: { facingMode: 'user' }, audio: true })` — pede câmera frontal e microfone (uma vez).
2. **Sinalização**: cada sala usa um channel Supabase Realtime (`room_<roomId>`). Os 2 lados trocam SDP `offer`/`answer` e ICE candidates por `broadcast`. Já temos Supabase Realtime configurado.
3. **Conexão P2P**: `RTCPeerConnection` com STUN público do Google (`stun:stun.l.google.com:19302`). O segundo a entrar gera a offer; o primeiro responde.
4. **Gravação** (lado do profissional, quando o navegador suporta `MediaRecorder`):
   - Combina os tracks locais + remotos num único `MediaStream`.
   - `MediaRecorder` grava em `.webm` (ou `.mp4` no Safari).
   - Upload final para `consultation-recordings` (bucket já existe), grava `recording_path`, `recording_duration_seg`, marca slot como `realizado`.
   - Se o navegador não suportar gravação, a chamada acontece normalmente, só não grava (mostra aviso discreto).

## UI da nova sala

```text
+-------------------------------------------------+
| PE  SALA DE CONSULTA       [00:42] [REC] [Sair] |
+-------------------------------------------------+
|                                                 |
|                                       +-------+ |
|        VÍDEO REMOTO (full)            | EU    | |
|                                       | (mini)| |
|                                       +-------+ |
|                                                 |
+-------------------------------------------------+
|       [ MIC ]   [ CÂMERA ]   [ ENCERRAR ]       |
+-------------------------------------------------+
```

Tudo com tokens do sistema: `bg-card`, `bg-primary`, `bg-coral-light`, `bg-destructive`. Mesma paleta creme/coral do resto do app.

## Quando publicar nas lojas (Google Play / App Store)

Quando o app for empacotado via **Capacitor** (caminho padrão), essa sala continua funcionando sem reescrever nada:

- Capacitor roda o React dentro de um WebView (Chrome WebView no Android, WKWebView no iOS).
- WebRTC é totalmente suportado nos dois.
- Só adiciona-se permissões de câmera/mic no `AndroidManifest.xml` e `Info.plist`.
- Esforço quando chegar a hora: ~1 dia, sem mexer em nada da videochamada.

## Limitação honesta única

WebRTC P2P puro funciona em ~95% das redes. Em redes corporativas com firewall muito fechado pode falhar — nesses casos raros seria preciso um servidor TURN (pago, ~5 dólares/mês). Não é problema para gestantes em casa / 4G / Wi-Fi residencial. Se aparecer no futuro, adiciona-se TURN sem mexer no resto.

## Arquivos a alterar

- **`src/routes/sala.$roomId.tsx`** — reescrita completa: remove tudo do Jitsi (script externo, `JitsiMeetExternalAPI`, `getDisplayMedia`), adiciona WebRTC + signaling Supabase + UI nova responsiva PC/mobile.

## Resumo

Saída: Jitsi (iframe pesado, complexo, prompt chato de "compartilhar aba", design não combina).
Entrada: WebRTC nativo + Supabase Realtime — funciona já em PC e celular hoje, com a cara do sistema, sem dependências, sem chaves, e continua funcionando quando virar app nas lojas.
