## Plano — Parâmetros clínicos baseados em referências oficiais

### Problema atual
A aba **Parâmetros Clínicos** existe mas as tabelas (`reference_ranges`, `exam_criteria`, `vaccine_schedule`) estão **vazias**. Sem regras cadastradas, a engine `get_active_alerts` não tem o que comparar contra os dados clínicos lançados, então nenhum alerta é gerado mesmo quando há dados fora do padrão.

### Solução
Pré-popular o banco com os **valores de referência oficiais** usados no pré-natal pelo Ministério da Saúde (Caderno de Atenção Básica nº 32 — Atenção ao Pré-natal de Baixo Risco), OMS e FEBRASGO. A tela de Parâmetros continua editável, mas já vem com o **padrão clínico de normalidade pronto**, e a partir daí a engine de alertas passa a funcionar de verdade contra qualquer medição/exame inserido.

---

### 1. Seed de Faixas de referência (`reference_ranges`)

Sinais vitais e medidas antropométricas com faixas validadas pelas diretrizes:

| parametro | unidade | semanas | min | max | severidade | fonte |
|---|---|---|---|---|---|---|
| `pa_sistolica` | mmHg | 0–42 | 90 | 139 | atenção | MS / FEBRASGO |
| `pa_sistolica` | mmHg | 0–42 | — | 159 (>=160) | urgente | hipertensão grave |
| `pa_diastolica` | mmHg | 0–42 | 60 | 89 | atenção | MS |
| `pa_diastolica` | mmHg | 0–42 | — | 109 (>=110) | urgente | crise hipertensiva |
| `bcf` (batimento fetal) | bpm | 12–42 | 110 | 160 | urgente | OMS |
| `glicemia_jejum` | mg/dL | 0–42 | 70 | 92 | atenção | IADPSG/MS |
| `glicemia_jejum` | mg/dL | 0–42 | — | 125 (>=126) | urgente | DM gestacional |
| `temperatura` | °C | 0–42 | 35.5 | 37.7 | atenção | febre materna |
| `frequencia_cardiaca` | bpm | 0–42 | 60 | 100 | atenção | — |
| `altura_uterina` | cm | 20–36 | semana−3 | semana+3 | atenção | curva MS (faixa por semana) |
| `ganho_peso_semanal` | kg/semana | 14–42 | 0.2 | 0.5 | atenção | IOM |
| `hemoglobina` | g/dL | 0–42 | 11 | 15 | atenção | OMS — anemia gestacional |
| `proteinuria` | mg/24h | 20–42 | — | 299 (>=300) | urgente | pré-eclâmpsia |

Para `altura_uterina` vou inserir várias linhas (uma por faixa de semana — 20-22, 23-25, 26-28, …) para refletir a curva oficial.

### 2. Seed de Critérios de exames (`exam_criteria`)

Exames do pré-natal cujo resultado alterado deve gerar alerta:

| tipo_exame | resultado_alterado | severidade |
|---|---|---|
| `sifilis_vdrl` | reagente | urgente |
| `hiv` | reagente | urgente |
| `hepatite_b_hbsag` | reagente | urgente |
| `toxoplasmose_igm` | reagente | urgente |
| `urocultura` | positiva | atenção |
| `glicemia_jejum` | >=92 | atenção |
| `tsh` | >2.5 | atenção |
| `coombs_indireto` | positivo | urgente |
| `hemograma_hb` | <11 | atenção |
| `streptococcus_b` | positivo | atenção |

### 3. Seed do Calendário vacinal (`vaccine_schedule`)

PNI/MS — vacinas recomendadas na gestação:

| vacina | semana_min | semana_max | obrigatória |
|---|---|---|---|
| `dTpa` | 20 | 36 | sim |
| `hepatite_b` | 0 | 42 | sim (3 doses) |
| `influenza` | 0 | 42 | sim (sazonal) |
| `covid_19` | 0 | 42 | sim |

### 4. Mudanças na UI da aba "Parâmetros Clínicos"

- **Banner explicativo** no topo: "Faixas pré-carregadas conforme MS / OMS / FEBRASGO. Edite ou adicione conforme protocolo da sua unidade."
- Coluna **"Fonte"** opcional na listagem (campo existente: usa `mensagem` para incluir a referência).
- Botão **"Restaurar valores oficiais"** que reexecuta o seed (idempotente, via upsert por `parametro + faixa de semanas`).
- Lista agrupada por categoria: Sinais vitais / Antropometria / Laboratorial.

### 5. Fluxo de alerta — confirmação

Sem mudança na lógica: a função `get_active_alerts(_gestante_id)` já cruza `clinical_measurements` × `reference_ranges`. Após o seed, qualquer medição lançada em **Dados Clínicos → Medições** com valor fora da faixa vai aparecer automaticamente em `/alertas` da gestante e na sub-aba "Alertas calculados" do admin.

---

### Detalhes técnicos

- Migração SQL com `INSERT ... ON CONFLICT DO NOTHING` usando uma constraint única em `(parametro, semana_min, semana_max, severidade)` para idempotência. Adicionar essa unique constraint primeiro.
- Mensagens em português, prontas para mostrar à gestante (ex: "Pressão arterial elevada — agende consulta nas próximas 48h").
- Campo `mensagem` carrega também a fonte: "MS — Caderno 32 / 2012".
- Para `altura_uterina` o "valor_min/max por semana" é representado por múltiplas linhas (uma faixa de 3 semanas cada) em vez de cálculo dinâmico — mantém a engine SQL simples.

### Arquivos afetados

- **Nova migração**: `supabase/migrations/..._seed_reference_ranges.sql` — unique constraint + seeds de `reference_ranges`, `exam_criteria`, `vaccine_schedule`.
- **Editado**: `src/components/admin/ParametrosTab.tsx` — banner com fontes, agrupamento visual por categoria, botão "Restaurar valores oficiais" (chama uma RPC `reseed_reference_ranges` ou re-roda os mesmos inserts via cliente).
- Sem mudança em: `alertas.tsx`, `DadosClinicosTab.tsx`, função `get_active_alerts` (já estão prontos para consumir os dados).
