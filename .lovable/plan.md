## O que vamos construir

Quando o profissional publicar um horário e a gestante reservar, ambos terão um botão **"Entrar na sala"** que abre uma videochamada Jitsi embutida no app. A gravação começa automaticamente quando os dois entram, é salva no storage do sistema e fica disponível para o admin e o profissional que atendeu.

---

## Fluxo do usuário

**Profissional** (na aba Agenda)
1. Publica horário (já existe).
2. Quando aparece "reservado", surge botão **Entrar na sala** (até 15 min antes ou durante o horário).
3. Entra na sala Jitsi embutida → gravação inicia automaticamente quando a gestante também entra.
4. Ao encerrar, gravação é enviada ao storage e marca o slot como "realizado".

**Gestante** (em Consulta → Meus agendamentos)
1. Reserva horário disponível (já existe).
2. Aparece botão **Entrar na consulta** no card.
3. Vê aviso: "Esta consulta será gravada para fins clínicos".
4. Entra na sala Jitsi → conversa com o profissional.

**Admin** (nova aba "Consultas Gravadas")
- Lista todas as gravações: data, profissional, gestante, duração.
- Botão para reproduzir/baixar cada gravação.

---

## Mudanças no banco

Adicionar à tabela `appointment_slots`:
- `room_id` — ID único da sala Jitsi (gerado na reserva).
- `recording_path` — caminho do arquivo no storage após upload.
- `recording_duration_seg` — duração em segundos.
- `gravacao_iniciada_em` / `gravacao_finalizada_em` — timestamps.

Novo bucket de storage **`consultation-recordings`** (privado), com políticas:
- Admin pode ler tudo.
- Profissional pode ler apenas gravações das próprias consultas.
- Gestante NÃO tem acesso ao arquivo.
- Apenas usuários autenticados envolvidos no slot podem fazer upload.

---

## Detalhes técnicos

**Sala Jitsi**: usar `<iframe>` apontando para `https://meet.jit.si/maedigital-{room_id}` ou o SDK `external_api.js` para controle programático (mute, hangup, eventos `videoConferenceJoined`/`Left`).

**Gravação local (MediaRecorder API)**:
- Capturar stream do iframe não é trivial → solução: usar o **External API do Jitsi** que dispara evento `recordingStatusChanged`, mas a gravação nativa do Jitsi requer Jibri (servidor próprio).
- Alternativa pragmática usada aqui: capturar `getDisplayMedia({ video: true, audio: true })` no navegador do **profissional** ao entrar na sala (ele compartilha a aba da consulta). MediaRecorder gera um Blob WebM que é enviado ao storage via signed URL ao encerrar.
- Aviso de consentimento exibido para a gestante antes da entrada.

**Upload**: chunks WebM acumulados em memória → ao encerrar (`hangup` ou tab close), `supabase.storage.from('consultation-recordings').upload(path, blob)` → atualiza `appointment_slots.recording_path`.

**Geração de room_id**: ao reservar (`book_slot`), a função RPC já gera `gen_random_uuid()` e grava em `room_id`.

**Janela de entrada**: botão "Entrar" só ativo entre `data_hora - 15min` e `data_hora + duracao_min + 30min`.

---

## Arquivos afetados

- **Migration** — colunas em `appointment_slots`, bucket `consultation-recordings` + RLS, atualização da função `book_slot` para gerar `room_id`.
- **Nova rota** `src/routes/sala.$roomId.tsx` — sala Jitsi embutida + lógica de gravação (acessível para profissional e gestante do slot).
- **`src/routes/videochamada.tsx`** — adicionar botão "Entrar na consulta" nos slots reservados da gestante.
- **`src/routes/profissional.tsx`** — adicionar botão "Entrar na sala" nos slots reservados.
- **Nova aba admin** `src/components/admin/GravacoesTab.tsx` — lista/reproduz gravações.
- **`src/routes/admin.tsx`** — registrar a nova aba.
- **`src/components/admin/AdminLayout.tsx`** — incluir item "Gravações" no menu.

---

## Limitações honestas

- A gravação depende de o **profissional** clicar em "Compartilhar tela" e selecionar a aba da consulta (limitação de browser por segurança). Mostrarei instrução clara.
- Vídeos longos (>30min em HD) podem ficar grandes (~200-500MB). Vou comprimir com codec VP8/Opus em qualidade média.
- Se o profissional fechar o navegador abruptamente sem encerrar, a gravação é perdida. Faço auto-save a cada 60s em chunks como mitigação.
- Jitsi público (meet.jit.si) é gratuito mas não é HIPAA/LGPD-compliant para dados sensíveis em escala. Para produção em saúde, considerar self-host ou Daily.co no futuro.