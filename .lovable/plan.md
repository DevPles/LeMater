
# Cronograma gestacional na Home

Substituir a seção **Dicas da semana** em `src/routes/app_.home.tsx` por um bloco **Meu cronograma** que mostra, em uma única visão, a linha do tempo da gestação (DUM → DPP), onde a gestante está hoje, os marcos clínicos esperados e como o **peso** e a **pressão arterial** dela evoluem em relação à faixa de normalidade por trimestre.

## O que será exibido

1. **Barra Gantt da gestação (40 semanas)**
   - Eixo da DUM até a DPP (DUM + 280 dias).
   - Três faixas coloridas para 1º (sem 1–13), 2º (14–27) e 3º (28–40) trimestres.
   - Marcador "Cadastro" (data de `created_at` do profile).
   - Marcador "Hoje" (linha vertical destacada com a semana atual).
   - Marcador "DPP" no fim.
   - Pontos sobre a barra para consultas já registradas em `clinical_measurements` (agrupadas por `data_medicao`).

2. **Mini-gráfico de Peso (kg × semana)**
   - Pontos reais: `clinical_measurements` onde `parametro = 'peso'`.
   - Área sombreada de normalidade: ganho cumulativo esperado a partir do peso inicial (primeira medição ou peso pré-gestacional se houver), usando as faixas do IOM por trimestre (1º: +0,5 a 2 kg total; 2º/3º: +0,35 a 0,5 kg/sem como aproximação para IMC normal — fórmula simples e clara no código).
   - Linha pontilhada de projeção do peso atual até a DPP, mantendo o ritmo do trimestre vigente.

3. **Mini-gráfico de Pressão Arterial (mmHg × semana)**
   - Duas séries: `pa_sistolica` e `pa_diastolica` de `clinical_measurements`.
   - Faixa de normalidade sombreada: sistólica 90–120, diastólica 60–80 (constante nas 40 semanas).
   - Marcação visual quando algum ponto sai da faixa.

4. **Resumo textual curto** acima dos gráficos: "Semana X de 40 · Trimestre Y · DPP: dd/mm/aaaa".

## Onde mexer

- `src/routes/app_.home.tsx`
  - Remover o bloco "Dicas da semana" (`tipsToShow.map` e heading).
  - Remover o uso de `useScreenContent('home', HOME_DEFAULT)` se não for mais necessário em outra parte (mantém só se ainda usado por outro elemento — verificar; provavelmente removível inteiro).
  - Inserir `<PregnancyTimeline profile={profile} currentWeek={currentWeek} />` no lugar.

- `src/components/PregnancyTimeline.tsx` (novo)
  - Componente client-side.
  - Busca `clinical_measurements` da própria gestante via `supabase.from('clinical_measurements').select(...).eq('gestante_id', profile.user_id).in('parametro', ['peso','pa_sistolica','pa_diastolica']).order('data_medicao')`.
  - Calcula DPP = DUM + 280 dias, semana atual a partir da DUM.
  - Renderiza 3 sub-componentes internos: `GanttTrimestres`, `MiniChartPeso`, `MiniChartPA`.
  - Estados de loading e vazio (sem DUM → mostra CTA para cadastrar DUM; sem medições → mostra só o Gantt + mensagem "registre suas medições para ver os gráficos").

- `src/lib/pregnancy-norms.ts` (novo, pequeno)
  - Funções puras: `weeksBetween(dum, date)`, `trimesterOfWeek(w)`, `expectedWeightGainRange(weekFromStart, startWeek)`, `bpNormalRange()` — para manter o componente fino e testável.

## Detalhes técnicos

- **Biblioteca de gráficos**: `recharts` (já disponível via `src/components/ui/chart.tsx`). Sem novas dependências.
- **Tokens de cor**: usar `--primary` (navy #1a1557), `--accent` (gold #f0c040) e tokens semânticos existentes. Faixa de normalidade com `fill` de baixa opacidade sobre o primary. Sem ícones (respeitando regra do projeto).
- **Tipografia**: Playfair para o título "Meu cronograma", DM Sans para labels — já configurado globalmente.
- **Performance**: 1 query única ao banco, agregação em memória. Sem N+1.
- **Acessibilidade**: aria-label nos gráficos, tooltip do recharts traduzido.
- **RLS**: a política `Gestante vê próprias medições` já cobre o acesso direto pelo client.
- **Sem mudanças no schema**: tudo deriva de `profiles.dum`, `profiles.created_at` e `clinical_measurements`.

## Layout final do bloco (na Home, dentro do mesmo `max-w-md`)

```text
+------------------------------------------+
|  Meu cronograma                          |
|  Semana 36 · 3º trimestre · DPP 12/06/26 |
+------------------------------------------+
|  [Gantt 1ºT |==2ºT==|====3ºT====]        |
|         ^cadastro       ^hoje      ^DPP  |
+------------------------------------------+
|  Peso (kg)                               |
|  [linha real + área esperada + projeção] |
+------------------------------------------+
|  Pressão arterial (mmHg)                 |
|  [sistólica + diastólica + faixa normal] |
+------------------------------------------+
```

## Fora do escopo

- BCF, altura uterina e exames laboratoriais (poderemos adicionar como abas em um próximo passo).
- Edição/registro de medições a partir desse bloco — continua sendo feito no Cartão.
- Reaproveitamento do `app_content`/`HOME_DEFAULT` para dicas (as dicas saem da Home; permanecem disponíveis em outras telas se já estiverem usadas).
