## Objetivo

Adicionar uma terceira aba em `/app/videochamada` chamada **Consultas**, onde a gestante gera um link de formulário interno (por especialidade — médico, nutricionista, psicólogo), copia/compartilha esse link com o profissional. O profissional abre o link em uma página pública, informa seu registro profissional, preenche a avaliação, e a resposta passa a constar na lista de consultas dessa mesma aba.

Os formulários são **internos do app** (não Google Forms/Typeform). Isso elimina a dependência de webhook externo e mantém os dados nativos, prontos para serem lidos junto às consultas.

## Fluxo do usuário

1. Gestante abre `/app/videochamada` → aba **Consultas**.
2. Sub-aba **Solicitar**: escolhe especialidade (Médico, Nutricionista, Psicólogo) e, opcionalmente, vincula a uma de suas consultas em "Meus agendamentos". Clica em **Gerar link**.
3. Recebe um cartão com o link público (`/avaliacao/{token}`), botões **Copiar** e **Compartilhar** (Web Share API com fallback p/ WhatsApp).
4. Sub-aba **Recebidas**: lista as avaliações já preenchidas pelos profissionais, com nome, especialidade, registro, data e botão "Ver detalhes" abrindo um modal com todas as respostas. Cada item indica se está vinculado a uma consulta.

## Fluxo do profissional (link público)

1. Abre o link `/avaliacao/{token}`. Página pública (sem login).
2. Tela 1 — identificação: nome completo + tipo de registro (CRM, CRN, CRP) + número + UF. Validação client + server.
3. Tela 2 — formulário específico da especialidade (campos abaixo). Botão **Enviar avaliação**.
4. Tela de sucesso. Token marcado como respondido (não pode ser reenviado).

## Formulários por especialidade (campos)

**Médico (Obstetra/Clínico)** — pressão sistólica, diastólica, FC, peso, altura uterina, BCF, idade gestacional, queixas, exame físico, conduta/orientações, prescrições.

**Nutricionista** — peso atual, ganho ponderal na gestação, IMC, recordatório 24h, intolerâncias/alergias, suplementação atual, plano alimentar/orientações.

**Psicólogo** — humor (escala 1–10), ansiedade (1–10), sono, suporte familiar, rede de apoio, sinais de depressão pós-parto (PHQ-2/EPDS livre-texto), conduta/encaminhamentos.

Cada formulário tem um schema fixo no front + validação Zod no server.

## Mudanças no banco (migração)

Nova tabela `evaluation_requests`:

- `id`, `token` (uuid único usado na URL pública), `gestante_id` (uuid), `appointment_id` (uuid, nullable — vincula a uma consulta de `appointment_slots`), `especialidade` (text: `medico` | `nutricionista` | `psicologo`), `status` (text: `pendente` | `respondida` | `expirada`), `expira_em` (timestamptz, +30 dias), `created_at`.

Nova tabela `evaluation_responses`:

- `id`, `request_id` (FK lógica → `evaluation_requests`), `professional_nome` (text), `professional_registro_tipo` (CRM/CRN/CRP), `professional_registro_numero` (text), `professional_registro_uf` (text), `respostas` (jsonb com os campos específicos), `created_at`.

RLS:

- `evaluation_requests`: gestante lê/cria as próprias (`gestante_id = auth.uid()`); admin lê tudo. Sem leitura pública direta — o acesso ao formulário é via server function que consulta por token.
- `evaluation_responses`: gestante lê as próprias (via JOIN `request_id → gestante_id`); admin lê tudo. Insert apenas via server function (sem policy de insert para `authenticated`/`anon`).

Os inserts pelo profissional (anônimo) acontecem em **server functions** que validam o token, então a tabela `evaluation_responses` não precisa de policy permissiva — usa o cliente admin no servidor.

## Server functions (`src/lib/evaluations.functions.ts`)

- `createEvaluationRequest({ especialidade, appointmentId? })` — protegida por `requireSupabaseAuth`, cria registro com token e devolve o link público.
- `getEvaluationByToken({ token })` — pública, devolve `{ especialidade, gestanteNome, status }` para a página do formulário (sem PII sensível).
- `submitEvaluation({ token, profissional, respostas })` — pública, valida token + status, valida formato do registro por especialidade (CRM/CRN/CRP), grava resposta via `supabaseAdmin`, marca request como `respondida`.
- `listMyEvaluations()` — protegida, lista requests + respostas da gestante para a sub-aba "Recebidas".

## Mudanças no front

- `src/routes/app_.videochamada.tsx`: adicionar terceira pílula na tab bar (`Disponíveis` | `Meus agendamentos` | `Avaliações`). Quando `tab === "avaliacoes"`, renderiza `<AvaliacoesPanel />`.
- `src/components/avaliacoes/AvaliacoesPanel.tsx`: sub-abas Solicitar / Recebidas, listagem, modal de detalhes.
- `src/components/avaliacoes/GerarLinkForm.tsx`: form de geração + cartão de resultado com Copiar/Compartilhar.
- `src/routes/avaliacao.$token.tsx`: rota pública (fora de `_authenticated`) com as duas telas (identificação + formulário) e tela de sucesso.
- `src/components/avaliacoes/forms/{MedicoForm,NutricionistaForm,PsicologoForm}.tsx`: campos específicos.
- `src/components/avaliacoes/RespostaModal.tsx`: visualização da avaliação preenchida.

Tudo segue o design system existente (`LiquidCard`, tokens semânticos, sem ícones, fontes Playfair/DM Sans).

## Sobre o webhook externo

Como combinado, a resposta vai pelo formulário interno → os dados já entram direto na consulta sem precisar de webhook externo. Se mais para frente você quiser permitir formulários externos (Typeform, Google Forms), adiciono `/api/public/avaliacoes/webhook` com verificação de assinatura — mas isso fica para uma segunda iteração.

## Fora do escopo desta entrega

- Envio do link por e-mail/SMS dentro do app (escolhido "Copiar/compartilhar" apenas).
- Edição/exclusão de avaliação já respondida.
- Validação online do registro profissional contra CRM/CRN/CRP (apenas formato).