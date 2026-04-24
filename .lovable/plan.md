## Visão do redesign

Hoje o Admin é um amontoado de 6 abas, cada uma com filtros próprios (ou nenhum), **mocks misturados com dados reais**, e push/WhatsApp atrelado **gestante por gestante**. Vou reorganizar em torno de **quatro princípios**:

1. **Zero dados mocados** — tudo passa a vir exclusivamente do banco. Os arrays `gestantesMock`, `EXAMES_LISTA`, `VACINAS_LISTA`, `CONDICOES_ALTO_RISCO`, `SINAIS_CRITICOS` são **deletados** do `admin.tsx`. Listas de exames/vacinas/condições passam a vir das tabelas de regras (`reference_ranges`, `exam_criteria`, `vaccine_schedule`, `vaccine_schedule_extra`, `image_exam_schedule`). Listas de cidades/bairros vêm do dataset real (`profiles`) — `DRS_XIII_CIDADES` permanece só como referência para autocomplete no cadastro.
2. **Filtros globais unificados** — uma única barra de filtros (cidade, bairro, UBS, faixa etária, trimestre, condição clínica, tipo de alerta, período) que se aplica a TODAS as áreas: gestão, relatórios, epidemiologia e comunicação. O admin filtra uma vez e o sistema inteiro passa a operar sobre aquele recorte.
3. **Sidebar de navegação** — substitui as abas horizontais (que já não cabem em 1067px). Mais escalável.
4. **Comunicação em massa por grupos dinâmicos** — área dedicada para criar grupos de envio (push e WhatsApp) baseados em filtros de alerta, salvar grupos recorrentes ("Gestantes 3º trim com PA alterada", "Atrasadas em USG morfológica", "Adolescentes < 18 sem dTpa") e disparar campanhas em lote.

---

## Política de dados (estrita)

| Categoria | Antes | Depois |
|---|---|---|
| Lista de gestantes | `gestantesMock` (10 fakes) | `profiles` filtrado por role `gestante` |
| Idade | hardcoded no mock | calculada de `data_nascimento` |
| Semanas gestacionais | hardcoded | calculada de `dum` |
| Cidade / bairro / UBS | mock | `profiles.cidade/bairro/unidade_saude` |
| Risco | string fixa | derivado de `get_active_alerts` (severidade máx) |
| Sinais clínicos / condições | arrays constantes | medições reais + critérios em `reference_ranges` |
| Exames pendentes | array fixo | cruzamento `exam_criteria`/`image_exam_schedule` × `exam_results`/`image_exam_results` |
| Vacinas pendentes | array fixo | cruzamento `vaccine_schedule` × `vaccinations` |
| Cidades para filtro | extraídas do mock | `SELECT DISTINCT cidade FROM profiles` |
| Histórico de push | `useState` em memória | `notification_campaigns` + `notification_deliveries` |

Se uma seção não tiver dados reais ainda (ex.: nenhuma gestante cadastrada), exibe **empty state explicativo** ("Nenhuma gestante cadastrada ainda. Os dados aparecerão aqui assim que as primeiras gestantes se registrarem"), nunca dados de exemplo.

---

## Nova estrutura

```text
┌────────────────────────────┬────────────────────────────────────────┐
│  SIDEBAR                   │  TOPBAR (filtros globais sempre visíveis) │
│  ──────────                │  ────────────────────────────────────────│
│  Visão geral (dashboard)   │  Cidade ▾  Bairro ▾  UBS ▾  Idade ▾     │
│  Gestantes                 │  Trimestre ▾  Condição ▾  Período 📅    │
│  Epidemiologia             │  [Salvar como grupo]  [Limpar]  N=42    │
│  Comunicação ★ NOVA        │                                          │
│   ├ Campanhas              │  ─────────────────────────────────────── │
│   ├ Grupos dinâmicos       │  CONTEÚDO DA SEÇÃO ATIVA                 │
│   └ Histórico              │                                          │
│  Parâmetros clínicos       │                                          │
│  Dados clínicos (auditoria)│                                          │
│  Profissionais             │                                          │
│  Conteúdo das telas        │                                          │
└────────────────────────────┴────────────────────────────────────────┘
```

A topbar de filtros é **um único componente compartilhado**, alimentado por um Context (`AdminFiltersContext`). Cada seção lê o mesmo recorte filtrado — não existe mais filtro local duplicado.

---

## Seção 1 — Visão geral (nova landing do admin)

Dashboard executivo com 4 KPIs grandes + 4 mini-charts, **100% via Supabase**, sempre respondendo aos filtros globais:
- Gestantes no recorte | Alto risco | Alertas ativos hoje | Cobertura vacinal PNI %
- Mini: novos cadastros últimos 30 dias, alertas por tipo (vital/lab/imagem/vacina), distribuição por trimestre, top 5 condições

Atalhos rápidos: "Ver gestantes com alerta", "Disparar campanha para este recorte", "Exportar Excel".

---

## Seção 2 — Gestantes (substitui a aba "Gestão" atual)

- **Deleta `gestantesMock`, `EXAMES_LISTA`, `VACINAS_LISTA`, `CONDICOES_ALTO_RISCO`, `SINAIS_CRITICOS`, type `Gestante`, `parseDpp`, `riscoStyles`, `riscoLabel`, `CIDADES`, `sugerirMensagemPush(g: Gestante)`** do `admin.tsx`.
- Passa a ler `profiles` + `get_active_alerts` reais.
- Tabela com: nome, idade (calc), semanas gestacionais (calc da DUM), cidade/bairro/UBS, paridade (G/P/A), nº alertas ativos, severidade máxima.
- Linha clicável → drawer lateral com detalhes (medições, exames, vacinas, alertas) — auditoria, sem edição.
- Botões: "Adicionar ao grupo de envio" / "Disparar push individual" / "WhatsApp individual" — usando `profiles.telefone` real.
- Empty state quando não há gestantes.

---

## Seção 3 — Epidemiologia

Mantém o `RelatoriosEpidemiologicosTab` atual, mas:
- **Remove os filtros locais duplicados** — passa a consumir o Context global.
- Adiciona corte por **condição clínica** e **tipo de alerta** que vêm do filtro global.
- Botão de exportação Excel passa a respeitar o recorte.

---

## Seção 4 — Comunicação (parte nova mais importante)

### 4a. Grupos dinâmicos
Um grupo é uma **regra salva** (não lista estática). Exemplo: "todas as gestantes com alerta de PA alterada nas últimas 2 semanas em Ribeirão Preto". Toda vez que o admin abre o grupo, ele é **recalculado em tempo real** via `get_active_alerts` + filtros — nunca lista cacheada.

UI:
- Lista de grupos salvos (cards com: nome, regra resumida, quantidade atual de gestantes calculada na hora).
- Botão "Criar grupo do recorte atual" — pega filtros globais + filtros adicionais de comunicação.
- Filtros adicionais exclusivos:
  - Severidade do alerta (atenção/urgente)
  - Origem do alerta (medição/exame/imagem/vacina)
  - Parâmetro específico (ex.: só PA sistólica > 140)
  - "Tem WhatsApp cadastrado" (sim/não)

### 4b. Campanhas
1. Seleciona um grupo (ou usa o recorte atual).
2. Vê preview das gestantes reais que receberão.
3. Escolhe canal: **Push interno**, **WhatsApp**, ou ambos.
4. Compõe mensagem:
   - Templates pré-prontos por tipo de alerta (sugestão automática multi-destinatário).
   - Variáveis: `{{primeiro_nome}}`, `{{semanas}}`, `{{ubs}}`, `{{exame_pendente}}` — substituídas com dados reais.
   - Preview com a primeira gestante real substituída.
5. Confirma → registra em `notification_campaigns` + `notification_deliveries` (uma linha por gestante).
6. WhatsApp em massa via `wa.me` com confirmação a cada envio (sem API oficial — Twilio fica para fase 2).

### 4c. Histórico
Tabela real de campanhas (`notification_campaigns`): data, grupo alvo, canal, mensagem, total enviado, total entregue. Filtro por período e canal. **Substitui completamente o `pushHistorico` em `useState` atual.**

---

## Seção 5 — Parâmetros clínicos
Mantém intocada (5 sub-abas: Vitais, Lab, Imagem, PNI, Extras). Filtros globais não se aplicam aqui (é configuração).

## Seção 6 — Dados clínicos (auditoria)
Mantém intocada (read-only por gestante).

## Seção 7 — Profissionais e Seção 8 — Conteúdo das telas
Mantêm como estão (já são 100% banco).

---

## Mudanças no banco

Uma migração nova:

```sql
-- Grupos dinâmicos (regra salva, não lista estática)
CREATE TABLE notification_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  filtros JSONB NOT NULL,
  criado_por UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Campanhas executadas
CREATE TABLE notification_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES notification_groups,
  filtros_snapshot JSONB NOT NULL,
  canal TEXT NOT NULL CHECK (canal IN ('push','whatsapp','ambos')),
  titulo TEXT,
  mensagem TEXT NOT NULL,
  template_origem TEXT,
  total_destinatarios INT NOT NULL,
  enviado_por UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Entregas individuais (rastreabilidade)
CREATE TABLE notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES notification_campaigns ON DELETE CASCADE,
  gestante_id UUID NOT NULL,
  canal TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  enviado_em TIMESTAMPTZ,
  lido_em TIMESTAMPTZ,
  erro TEXT
);

CREATE INDEX IF NOT EXISTS idx_profiles_telefone ON profiles(telefone) WHERE telefone IS NOT NULL;
```

RLS: tudo só para `admin` (CRUD). Gestante vê apenas suas próprias `notification_deliveries`.

---

## Detalhes técnicos

**Arquivos novos:**
- `src/contexts/AdminFiltersContext.tsx`
- `src/components/admin/AdminLayout.tsx`
- `src/components/admin/AdminTopbarFilters.tsx`
- `src/components/admin/sections/VisaoGeralSection.tsx`
- `src/components/admin/sections/GestantesSection.tsx`
- `src/components/admin/sections/ComunicacaoSection.tsx`
- `src/components/admin/comunicacao/GruposDinamicos.tsx`
- `src/components/admin/comunicacao/Campanhas.tsx`
- `src/components/admin/comunicacao/HistoricoCampanhas.tsx`
- `src/utils/admin-filters.ts` — `applyFiltersToProfiles(filters, profiles, alerts)`
- `src/hooks/useAdminData.ts` — fetch unificado de profiles+alerts+exams+vacc+measurements
- `supabase/migrations/...notification_system.sql`

**Arquivos editados:**
- `src/routes/admin.tsx` — **redução de ~85%**: deleta TODOS os mocks (`gestantesMock`, listas constantes, type `Gestante` e helpers que dependem dele), passa a renderizar só `<AdminLayout>` + roteamento interno por seção.
- `src/components/admin/RelatoriosEpidemiologicosTab.tsx` — remove filtros locais, lê do Context.
- `src/components/admin/DadosClinicosTab.tsx` — seletor de gestante respeita o filtro global.

**Comunicação WhatsApp em massa:** abordagem `wa.me` com botão "Enviar próxima" entre cada gestante. Cada clique grava `notification_deliveries.status = 'enviado'`. Aviso visual: "Twilio para envio automático real pode ser ativado em fase 2."

**Push:** continua in-app (registra `notification_deliveries`). Web Push API com VAPID fica para fase 2.

**Responsividade:** sidebar vira drawer em < 768px. Filtros globais viram sheet lateral com badge "Filtros (3)".

---

## Ordem de execução

1. Migration: `notification_groups`, `notification_campaigns`, `notification_deliveries` + RLS.
2. `AdminFiltersContext` + `useAdminData` + `applyFiltersToProfiles`.
3. `AdminLayout` (sidebar + topbar) e **limpeza completa de mocks** no `admin.tsx`.
4. `VisaoGeralSection` + `GestantesSection` (substituindo os mocks por queries reais).
5. Refator de `RelatoriosEpidemiologicosTab` para consumir Context.
6. `ComunicacaoSection` com Grupos, Campanhas, Histórico.
7. Ajustes mobile + QA visual.

Tamanho total: 1 migration + ~11 arquivos novos + 3 editados. **Resultado final: nenhuma constante de dados clínicos/gestantes hardcoded em todo o app, exceto `DRS_XIII_CIDADES` (referência geográfica fixa) e `RP_BAIRROS` (autocomplete de cadastro).**
