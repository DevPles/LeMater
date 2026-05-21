## Problemas identificados

1. **Linguagem clínica errada para pré-natal** — o formulário usa termos de "doença" (`História da doença atual`, `Hipóteses diagnósticas / CID`, `Avaliação dos exames`), mas a gestante é uma mulher **saudável em acompanhamento**, não uma paciente doente.
2. **Cartão completo (modal) mais pobre que o resumo** — o `CartaoModal` mostra só nascimento/DUM/IG/G-P-A/unidade + listas brutas; o resumo no topo já mostra risco, tipo de gestação, comorbidades, familiares, hábitos, antropometria, ganho ponderal etc. Deveria ser o contrário (modal = visão completa).
3. **Gráficos invisíveis para o médico** — só aparecem se houver medições; quando não há, some tudo e o médico não tem visualização de evolução nem placeholders úteis.
4. **Duplicação** — campos como queixa principal, peso de hoje, PA, FC, AU, BCF aparecem soltos sem agrupar o raciocínio clínico de pré-natal.

## Mudanças (todas em `src/routes/avaliacao.$token.tsx`)

### A. Reescrever `SECOES.medico` para consulta de pré-natal real

```text
1. Acompanhamento da gestação (hoje)
   - Como você está se sentindo? (subjetivo da gestante) [textarea]
   - Queixas/desconfortos do período (náuseas, azia, lombalgia, edema, contrações, sangramento, perdas, MF reduzido…) [textarea]
   - Intercorrências desde a última consulta [textarea]

2. Sinais vitais e antropometria (hoje)
   - PA sis/dia, FC, FR, Temp, SatO₂, Peso de hoje
   - Cálculo de ganho ponderal acumulado (auto, do resumo)

3. Avaliação obstétrica (hoje)
   - Altura uterina, BCF, Movimentos fetais, Apresentação fetal,
     Edema, Dinâmica uterina, Perdas vaginais,
     Toque vaginal (se indicado)

4. Exame físico geral [textarea único]

5. Análise do cartão e exames
   - Avaliação dos exames laboratoriais [textarea, hint "ver resumo"]
   - Avaliação dos exames de imagem [textarea]
   - Situação vacinal [select Em dia/Pendências/Desconhecida]
   - Classificação de risco gestacional hoje
     [select Habitual / Intermediário / Alto risco]
   - Justificativa da classificação [textarea]

6. Plano de cuidado
   - Conduta / orientações da consulta [textarea]
   - Exames solicitados [textarea]
   - Prescrições e suplementação (AF, ferro, cálcio, DHA…) [textarea]
   - Encaminhamentos (alto risco, especialidades, serviço social…) [textarea]
   - Sinais de alarme reforçados [textarea com hint]
   - Próxima consulta sugerida [date]
```

Removidos: `historia_doenca_atual`, `hipoteses_diagnosticas` (substituídos pelos campos acima, com linguagem de pré-natal).

### B. Tornar o `CartaoModal` realmente completo

Reorganizar o modal para conter, na ordem:
1. **Identificação** (nascimento, idade, telefone, unidade, bairro/cidade).
2. **Obstétrico** (DUM, DPP calculada, DPP eco, IG hoje, G/P/A, tipo de gestação, risco).
3. **Antropometria** (peso pré-gest., altura, IMC pré-gest., peso atual, IMC atual, ganho ponderal).
4. **Comorbidades / Hist. familiar / Hábitos / Intercorrências registradas** — chips, vindos do mesmo `resumo` que alimenta o topo.
5. **Gráficos de evolução** — PA, peso, AU, BCF, glicemia (os mesmos do resumo, em tamanho maior). Quando uma série não tem dados: mostrar placeholder "Sem registros — aparecerá aqui quando a gestante registrar".
6. **Últimas medições** detalhadas (lista existente, mantida).
7. **Exames laboratoriais** detalhados.
8. **Exames de imagem** detalhados.
9. **Vacinas** detalhadas.

Resultado: o modal vira a "visão completa" e o resumo no topo passa a ser uma **versão enxuta** (chips essenciais + alertas), sem repetir tudo.

### C. Enxugar o `ResumoCartaoBlock` (não duplicar o modal)

Resumo no topo passa a mostrar **apenas o que o médico precisa olhar de relance** antes de começar a consulta:
- Alertas clínicos ativos (mantém).
- Linha-chefe: Idade • IG • DPP • G/P/A • Risco • Tipo de gestação.
- Antropometria curta: IMC pré / IMC atual / Ganho ponderal.
- Últimos sinais: PA, BCF, AU, Peso (com a semana correspondente).
- 1 linha "Comorbidades relevantes: …" se houver.
- Botão "Ver cartão completo" → abre o modal já com **gráficos** e tudo mais.

Sem gráficos no resumo (eles passam para o modal), evitando o "Sem medições suficientes" exibido no print.

### D. Placeholder de gráfico quando não há série

Função utilitária `ChartCardEmpty({ titulo })` que renderiza o mesmo cartão com mensagem clínica curta ("Sem registros de PA ainda — peça à gestante para registrar no cartão") em vez de sumir. Usada dentro do modal.

### E. Aplicar a mesma higiene de linguagem a nutricionista e psicólogo

- Nutricionista: trocar "Diagnóstico nutricional" por "Avaliação nutricional"; manter o restante (já está adequado).
- Psicólogo: já está OK.

## Arquivos tocados

- `src/routes/avaliacao.$token.tsx` — único arquivo (formulário médico + `ResumoCartaoBlock` + `CartaoModal` + helper de placeholder).

## Fora de escopo

- Sem migração de banco (o RPC já entrega `cartao` + `alertas`).
- Sem mudança no app da gestante nem no painel do profissional.

## Riscos

- Renomear `key` dos campos (`historia_doenca_atual` → novos) descarta respostas em rascunho que estavam com a chave antiga. Aceitável: ainda não há produção dessa aba.
- Gráficos no modal aumentam o peso visual — manter altura ~180px, 2 colunas no desktop, 1 no mobile.
