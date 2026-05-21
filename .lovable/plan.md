## Objetivo

Hoje o formulário médico em `/avaliacao/$token` repete dezenas de campos que a gestante já preencheu (idade, G/P/A, comorbidades, tabagismo, alergias, peso/altura/IMC, IG etc.). O médico deve receber esses dados — **mais os gráficos de evolução e os alertas clínicos ativos** — como contexto já preenchido, e o formulário só deve perguntar o que pertence à consulta de hoje.

## O que já existe no app (e está disponível para o RPC `get_evaluation_request_public`)

- `profiles`: nome, data_nascimento, dum, cidade, bairro, unidade_saude, G/P/A.
- `profiles.partos_classificacao` (array JSON do "Histórico" do Cartão) — armazena:
  - **Dados gerais**: risco, peso_anterior, altura, imc_anterior, dpp, dpp_eco, tipo_gestacao.
  - **Ant. clínicos**: diabetes, HAS, cardiopatia, tromboembolismo, infecção urinária, etc.
  - **Ant. familiares**: diabetes, HAS, gemelar.
  - **Gestação atual**: tabagismo, etilismo, outras drogas, violência doméstica, HIV/sífilis/toxoplasmose, anemia, pré-eclâmpsia, DM gestacional, etc.
- `clinical_measurements`: PA, FC, BCF, AU, peso, altura, glicemia, temperatura, SatO₂ — séries temporais por semana gestacional.
- `vaccinations`, `exam_results`, `image_exam_results`.
- **Alertas clínicos**: RPC `get_active_alerts` já calcula alertas ativos a partir de dados clínicos, exames e calendário vacinal (usado em `/app/alertas`).

## Mudanças

### 1. Migration — expor alertas no link público da avaliação

Atualizar `public.get_evaluation_request_public(_token uuid)` para incluir, dentro do objeto `cartao`, um campo `alertas` com a lista de alertas ativos da gestante daquele token (mesma lógica do RPC `get_active_alerts`, mas chamada server-side com o `gestante_id` do request — assim continua sem exigir login). Sem alteração de tabelas, só do retorno do RPC.

### 2. `src/routes/avaliacao.$token.tsx` — formulário médico

**Reestruturar `SECOES.medico`** em duas zonas:

```text
[Resumo do cartão — somente leitura, no topo]

Alertas clínicos ativos
- Cards/chips coloridos por severidade vindos de cartao.alertas
  (ex.: "PA elevada na sem. 28", "Hemograma 3T pendente", "Vacina dTpa em atraso")

Gráficos de evolução (recharts, mesmos do cartão)
- Pressão arterial (sistólica/diastólica × semana) com faixas de referência
- Peso × semana, com ganho ponderal acumulado
- Altura uterina × semana
- BCF × semana
- Glicemia × semana (se houver registros)
  Renderizados em pequeno formato (sparkline-like, ~160px de altura),
  com botão "expandir" abrindo o gráfico em tamanho cheio dentro
  do CartaoModal já existente.

Identificação: nome, idade, IG (sem.), DPP, DUM, unidade de saúde
Obstétrico: G/P/A, tipo de gestação, risco
Comorbidades: lista derivada de ant_clinico (chips)
Hist. familiar: lista derivada de ant_fam (chips)
Hábitos: tabagismo, etilismo, outras drogas (de gest_atual)
Intercorrências já registradas na gestação atual (chips)
Últimos sinais vitais: PA, FC, peso, BCF, AU (com semana/data)
Antropometria: peso pré-gest., altura, IMC, ganho ponderal calculado
Vacinas: resumo
Exames recentes: lab + imagem (com data e status)

Botão "Ver cartão completo" mantém o modal atual.
```

```text
[Formulário da consulta — o que o médico precisa preencher hoje]

Consulta do dia
- Queixa principal
- História da doença atual
- Intercorrências desde a última consulta

Sinais vitais e exame físico de hoje
- PA sistólica/diastólica, FC, FR, Temp, SatO₂
- Peso de hoje, exame físico geral

Avaliação obstétrica de hoje
- AU, BCF, movimentos fetais, apresentação, edema,
  dinâmica uterina, perdas vaginais, toque (se realizado)

Avaliação dos exames disponíveis no cartão
- Análise dos laboratoriais (hint "veja o cartão")
- Análise dos exames de imagem
- Situação vacinal

Conduta
- Hipóteses diagnósticas / CID
- Exames solicitados
- Prescrições
- Suplementação
- Orientações
- Encaminhamentos
- Sinais de alarme orientados
- Data de retorno
```

Removidos do formulário (passam a aparecer apenas no resumo): idade materna, gestação atual tipo, classificação de risco, antecedentes pessoais/familiares/obstétricos, alergias, medicamentos em uso, tabagismo, etilismo, drogas, peso/altura/IMC pré-gestacionais, IG em semanas, tipo sanguíneo (não temos no app — fica fora).

### 3. `montarPrefill` — estender para ler `partos_classificacao`

Agrupar os eventos do array por `categoria`/`tipo` (pegando a versão mais recente de cada chave) para extrair:

- `resumo.risco`, `resumo.tipo_gestacao`, `resumo.dpp_eco`, `resumo.peso_anterior`, `resumo.altura`, `resumo.imc_anterior`.
- `resumo.comorbidades`: labels legíveis dos itens marcados em ant_clinico.
- `resumo.familiares`: idem ant_fam.
- `resumo.habitos`: tabagismo/etilismo/outras drogas.
- `resumo.intercorrencias`: itens marcados em gest_atual.
- `resumo.ganho_peso`: `peso_atual − peso_anterior` quando ambos existirem.
- `resumo.imc_atual`: a partir de peso atual e altura.

Esse "resumo" alimenta o card de contexto. Campos do formulário só recebem prefill quando fizerem parte da entrada de hoje (PA, FC, peso, AU, BCF) com a última medição e selo "do cartão", continuando editáveis.

### 4. Séries para os gráficos

Reaproveitar o cálculo já presente em `app_.cartao.tsx`: filtrar `cartao.medicoes` por parâmetro (peso, sistólica/diastólica, AU, BCF, glicemia) e ordenar por `semana_gestacional`. Renderizar com `recharts` (`LineChart`/`ComposedChart`) já usado no projeto. Adicionar linhas de referência (PA 140/90, BCF 110-160) para leitura clínica rápida.

### 5. Card de alertas

Cada item de `cartao.alertas` vira um chip com cor por severidade (`baixa`, `media`, `alta`, `critica`) usando tokens do design system. Sem ícones (regra do projeto).

### 6. Aplicar o mesmo princípio (mais leve) a nutricionista e psicólogo

- Nutricionista: resumo recebe peso pré/atual, altura, IMC pré/atual, ganho ponderal, gráfico de peso × semana, alertas relevantes. Formulário mantém só o que é da consulta (hábitos, recordatório 24h, bioquímica, plano, metas, retorno).
- Psicólogo: resumo mostra histórico psiquiátrico e uso de substâncias (vindo de `gest_atual`) + alertas. Formulário mantém estado emocional do dia, escalas, conduta.

## Arquivos tocados

- **Migration**: atualizar `get_evaluation_request_public` para incluir `alertas`.
- `src/routes/avaliacao.$token.tsx` — única alteração de código (resumo + gráficos + alertas + prefill estendido + reformulação das seções).

## Sem mudanças

- Sem alteração no painel da gestante (`AvaliacoesPanel.tsx`).
- Sem alteração no Cartão.
- Tabelas e RLS intocadas (só o corpo do RPC).

## Riscos

- `partos_classificacao` guarda `valor` como `"sim"/"nao"` por chave; mapear de volta para o label legível duplicando as listas `ANT_CLINICOS`, `ANT_FAMILIARES`, `GEST_ATUAL` em `avaliacao.$token.tsx` (evitar importar do componente da gestante).
- Como o array é cumulativo, considerar **a versão mais recente** de cada `(categoria, key)` ao montar o resumo.
- `get_active_alerts` espera contexto de usuário; ao chamá-lo dentro do RPC `SECURITY DEFINER` com o `gestante_id` do request, validar que a função aceita parâmetro explícito — caso contrário, replicar a lógica essencial (PA, vacinas em atraso, exames pendentes) dentro do próprio `get_evaluation_request_public`.
