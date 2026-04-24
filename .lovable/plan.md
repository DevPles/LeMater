## Objetivo

Recriar a Justificativa Técnica e Financeira em formato **DOCX** (editável no Word), com tom **menos agressivo** — mais consultivo, colaborativo e respeitoso, mantendo os números e a defesa do investimento (Setup R$ 19.000 / Mensalidade R$ 1.500).

## Mudanças de tom

Reescrever o conteúdo trocando posicionamento "de defesa/confronto" por linguagem **parceira e didática**:

| Antes (agressivo) | Depois (consultivo) |
|---|---|
| "Por que o investimento se justifica" | "Entendendo o investimento" |
| "Comparativo que prova o valor" | "Referências de mercado para contexto" |
| "Você está pagando MENOS que..." | "Para fins de comparação, o valor-hora equivale a..." |
| "ROI garantido" | "Estimativa de retorno esperado" |
| Frases imperativas e exclamações | Frases afirmativas, neutras, sem "!" |
| "Software House cobraria R$ 176.960" | "Estúdios de software no mercado praticam, em média, valores entre R$ X e R$ Y" |

- Remover negritos excessivos, caixa alta e exclamações.
- Substituir "defesa" por "transparência" e "justificativa" por "memorial descritivo".
- Tratamento institucional ("a Câmara", "o gabinete") em vez de confronto direto.

## Estrutura do documento DOCX

1. **Capa** — Título: "Memorial Descritivo Técnico e Financeiro — GestanteHub". Subtítulo: proposta de parceria. Data e autor.
2. **Apresentação** (1 parágrafo cordial sobre o propósito do documento)
3. **Escopo do Sistema** — descrição neutra dos 5 módulos
4. **Memória de Horas Técnicas** — tabela com módulos × horas (632h total)
5. **Composição do Investimento** — tabela: Desenvolvimento R$ 14.500 / Implantação R$ 4.500 / Mensalidade R$ 1.500
6. **Valor-hora aplicado** — cálculo transparente (R$ 22,94/h) com nota contextual sobre referências de mercado (sem comparações provocativas)
7. **Referências de Mercado** — tabela neutra com faixas de preço (estúdios, profissionais sêniores) apenas como contexto
8. **Estimativa de Retorno** — projeção de economia anual em tom prudente ("estimativa", "potencial")
9. **Cronograma de Pagamento Sugerido** — 4 etapas
10. **Considerações Finais** — disposição para ajustes e diálogo

## Implementação técnica

- Usar o skill **docx** com `docx-js` (Node) para gerar o arquivo.
- Fonte Arial, títulos pretos, sem cores agressivas — paleta sóbria (azul-marinho `#1F3A5F` para títulos, cinza para tabelas).
- Tabelas com `WidthType.DXA`, `ShadingType.CLEAR`, bordas cinza-claro.
- Página US Letter, margens 1".
- Validar o arquivo após gerar.
- Salvar em `/mnt/documents/Memorial_GestanteHub.docx`.
- QA: converter para PDF + imagens via LibreOffice e inspecionar todas as páginas antes de entregar.

## Entrega

Arquivo `Memorial_GestanteHub.docx` editável, anexado via `<lov-artifact>`, pronto para o usuário ajustar nomes/datas no Word antes de enviar ao vereador.