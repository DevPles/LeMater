
## Gravação automática de áudio das videochamadas

A infraestrutura já existe: bucket `consultation-recordings`, colunas em `appointment_slots` (`recording_path`, `recording_duration_seg`, `gravacao_iniciada_em`, `gravacao_finalizada_em`) e a aba **Gravações** do admin com listagem, link assinado e download.

## Como vai funcionar

1. Profissional e gestante entram na sala normalmente — sem aviso ou consentimento na interface.
2. Quando os **dois** estão conectados na sala, a gravação de áudio inicia automaticamente do lado do **profissional** apenas (evita duplicar).
3. O áudio capturado é o mix do microfone local + áudio remoto da gestante, via Web Audio API.
4. Nada visível para os participantes durante a chamada.
5. Ao encerrar, aparece um overlay discreto "Salvando consulta..." só do lado do profissional, enquanto faz upload (geralmente poucos segundos).
6. A gravação aparece imediatamente na aba **Gravações** do painel admin com link para escutar/baixar.

## Detalhes técnicos

**Arquivo:** `src/routes/sala.$roomId.tsx`

- Novo componente `AudioRecordingController` renderizado dentro de `<LiveKitRoom>` apenas se `isProfDono === true`.
- Usa `useParticipants()` e `useTracks([Track.Source.Microphone])` do `@livekit/components-react`.
- Quando `participants.length >= 2` E há ao menos uma audio track remota:
  - Cria `AudioContext` e mixa microfone local + audio track remoto via `MediaStreamAudioSourceNode` → `MediaStreamAudioDestinationNode`.
  - Inicia `MediaRecorder(stream, { mimeType })` com detecção de compatibilidade:
    - `audio/webm;codecs=opus` (Chrome, Firefox, Edge, Android)
    - fallback `audio/mp4` (iOS Safari)
  - `update appointment_slots set gravacao_iniciada_em = now()`.
- Em `onDisconnected` ou unmount:
  - `recorder.stop()` → blob.
  - Mostra overlay "Salvando consulta..." (não-fechável).
  - Upload `supabase.storage.from('consultation-recordings').upload('{gestante_id}/{slot_id}-{timestamp}.{ext}', blob)`.
  - `update appointment_slots set recording_path, recording_duration_seg, gravacao_finalizada_em`.
  - Navega para `/profissional`.

**Migração:** storage policy de INSERT no bucket `consultation-recordings` permitindo `profissional` ou `admin` autenticado fazer upload.

**Aba Gravações admin:** já funciona — vai listar e tocar áudios pelo browser nativo.

## Arquivos afetados

- `src/routes/sala.$roomId.tsx`
- Nova migração de storage policy

## Limitações

- Se profissional fechar a aba bruscamente antes do upload, a gravação é perdida.
- iOS Safari grava em m4a, demais em webm/opus — ambos tocam no admin.
