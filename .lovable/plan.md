## Como os marcos da Agenda vão ser checados

Hoje, na aba **Agenda** do "Meu cronograma", os itens (1ª consulta, USG de datação, translucência, morfológica, TOTG, etc.) ficam riscados **apenas pelo passar das semanas** — não importa se a gestante realmente foi à consulta ou fez o exame. Vamos trocar isso: o marco só é dado como cumprido quando existe um registro real no prontuário, lançado pelo profissional.

### Comportamento novo

Cada marco passa a ter 3 estados visuais:

- **Concluído (✓ verde, riscado)** — existe registro do profissional dentro da janela aceitável daquele marco.
- **Atrasado (laranja, com aviso)** — a semana já passou e não há registro. Ex: "esperado até a semana 8".
- **A fazer (estilo atual)** — semana ainda não chegou.

O destaque "agora" (dourado) continua aparecendo quando a gestante está na semana do marco e ainda não há registro.

Cada marco mostra também, quando concluído, uma linha pequena: *"Registrado por Dr(a). Nome em 12/03"*.

### De onde vem cada check (origem dos dados)

Vamos cruzar com tabelas que **já existem** no prontuário — não cria tabela nova:

| Marco | Fonte de verdade | Como casa |
|---|---|---|
| 1ª consulta de pré-natal (sem 6) | `appointment_slots` + `consultation_notes` | Existe consulta com status atendida do tipo pré-natal até a semana 10 |
| USG de datação (sem 8) | `image_exam_results` | tipo_exame = "usg_datacao", até semana 12 |
| Translucência nucal (sem 12) | `image_exam_results` | tipo_exame = "translucencia_nucal", semanas 11–14 |
| Exames do 2º trimestre (sem 16) | `exam_results` | tipos hemograma/urina/glicemia, semanas 14–20 |
| USG morfológica (sem 20) | `image_exam_results` | tipo_exame = "usg_morfologica", semanas 18–24 |
| Teste tolerância glicose (sem 24) | `exam_results` | tipo_exame = "totg", semanas 24–28 |
| Início 3º tri / dTpa (sem 28) | `exam_results` ou consulta | vacina dTpa registrada, semanas 27–36 |
| USG de crescimento (sem 32) | `image_exam_results` | tipo_exame = "usg_crescimento", semanas 30–36 |
| Streptococcus B (sem 36) | `exam_results` | tipo_exame = "estreptococo_b", semanas 35–37 |
| Termo precoce (sem 37) | derivado da semana | informativo, não precisa registro |
| DPP (sem 40) | derivado da DUM | informativo |

A regra fica em um arquivo único `src/lib/pregnancy-milestones.ts` (lista de marcos com `tipo_exame_key`, `janela_semanas`, `fonte`), para ser fácil ajustar nomes de exames depois.

### Onde o profissional registra

Ele já tem essa capacidade no app — não precisa criar tela nova. Os pontos de entrada existentes são:
- `ConsultationNotesPanel` (anotações de consulta)
- `DadosClinicosTab` / `ProntuarioConsultaModal` (exames laboratoriais e de imagem)

Só vamos garantir que esses formulários **incluam um campo "tipo de exame"** padronizado (dropdown com as chaves usadas pelos marcos — `usg_datacao`, `translucencia_nucal`, `usg_morfologica`, `totg`, etc.), para o cruzamento funcionar de forma confiável. Hoje o campo já existe, só precisa virar uma lista controlada.

### Mudanças no código

1. **Criar** `src/lib/pregnancy-milestones.ts`
   - Move a lista `MILESTONES` para cá e adiciona, em cada item, `match: { fonte: "exam_results" | "image_exam_results" | "consultation", key: string, janelaSemanas: [min,max] }`.

2. **Criar** server function `getMilestoneCompletions(userId)` em `src/lib/membro.functions.ts` (ou novo `milestones.functions.ts`)
   - Faz 3 queries paralelas (exam_results, image_exam_results, consultas atendidas) filtradas por gestante.
   - Retorna, para cada `milestone.key`, `{ concluido: boolean, data?: string, profissional?: string }`.

3. **Atualizar** `src/components/PregnancyTimeline.tsx`
   - Chama o server function via `useQuery`.
   - Substitui a lógica de status pelo cruzamento real: `concluido > atrasado > agora > futuro`.
   - Renderiza badge de atrasado e linha "Registrado por … em …" quando aplicável.

4. **Padronizar tipos de exame** em `DadosClinicosTab` / `ProntuarioConsultaModal`
   - Trocar input livre por `<select>` com as chaves canônicas (mantém compatibilidade com registros antigos via mapeamento de strings).

Nenhuma alteração de schema, nenhuma tabela nova, nenhum botão para a gestante marcar — quem dá o check é o profissional ao registrar no prontuário.