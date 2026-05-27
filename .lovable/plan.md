## Objetivo

Reformular `NovoConteudoModal` (curso) trocando o formulário longo de scroll único por um **fluxo sequencial em passos**, mantendo **todos os campos atuais** (dados, capa, vídeo loop, trailer, ofertas país×plataforma, áudios, instrutor, PDFs grátis, aulas, ofertas por aula, áudios por aula, ordem/publicado). Material/Serviço continuam no formulário atual (sem mudança).

## Novo fluxo (Curso)

Stepper no topo, navegação Voltar / Avançar / Salvar fixos no rodapé. O painel "Prévia do card" continua à direita.

```text
[1 Identidade] → [2 Mídia] → [3 Acesso & Ofertas] → [4 Instrutor & PDFs] → [5 Aulas] → [6 Publicação]
```

1. **Identidade** — Título, Slug, Descrição curta, Descrição longa, Categoria, Nível, Carga.
2. **Mídia** — Capa (imagem/vídeo fallback), Vídeo de capa em loop, Trailer URL.
3. **Acesso & Ofertas do curso** — `Acesso (grátis/pago)`. Se `pago`: `OfertasEditor` do curso inline (país × plataforma, mesmo componente atual).
4. **Instrutor & PDFs grátis** — Nome, Foto, Bio, PDFs grátis (download), Áudios vinculados ao curso (`AudiosEditor` atual).
5. **Aulas — sequencial** — Sub-wizard interno. Lista compacta à esquerda (Aula 1, Aula 2, …, **+ Adicionar aula**, Remover). À direita, a aula **selecionada** é editada com todos os campos atuais agrupados em três blocos colapsáveis:
   - **Conteúdo da aula**: Título, Descrição, Tipo, Duração, Acesso, e o input específico do tipo (URL vídeo / upload vídeo / PDF / HTML), Anexos.
   - **Venda desta aula** (se acesso = pago): preço (centavos), preço (texto), métodos de pagamento legados (lista atual de `links_compra` com país/plataforma/url/remover), e **`OfertasEditor` da aula** abaixo.
   - **Áudios desta aula**: `AudiosEditor` da aula.
   Navegação interna: "Aula anterior" / "Próxima aula" + indicador "Aula X de N".
6. **Publicação** — Ordem, Publicado (visível ao público), resumo final (contagem de aulas, total de ofertas, pago/grátis) e botão **Salvar** (mesmo `salvarCurso` atual, com flush de ofertas/áudios já existente).

## Regras de UX

- Stepper clicável: cada passo pode ser pulado livremente (sem validação bloqueante além das que já existem no save).
- Estado: **um único `useState` por curso e por lista de aulas** (já existe). Adicionar `useState<number>` para `stepAtual` no shell e `useState<number>` para `aulaSelecionada` no passo 5.
- Rodapé fixo dentro do modal com `Voltar` (desabilita no passo 1), `Avançar` (vira `Salvar` no último passo) e `Cancelar`.
- A coluna de prévia continua existindo em todos os passos, sem alteração.
- No modo edição (`editando=true`) o passo 5 (Aulas) é ocultado — mantém o comportamento atual em que aulas só são criadas na criação inicial.

## Arquivos afetados

- `src/components/admin/NovoConteudoModal.tsx`
  - Manter `NovoConteudoModal` (shell, tabs Curso/Material/Serviço, salvarCurso/upAula/salvarMaterial, refs).
  - Substituir `FormCurso` por uma versão wizard. Extrair em sub-componentes locais no mesmo arquivo:
    - `StepIdentidade`, `StepMidia`, `StepAcessoOfertas`, `StepInstrutorPdfs`, `StepAulas`, `StepPublicacao`.
    - `AulaEditor` interno para o passo 5 (recebe `aula`, `index`, `updateAula`, `removeAula`).
  - Adicionar barra de progresso (texto + traços, sem ícones).
  - Manter `FormMaterial` intacto.
- Sem mudanças em `OfertasEditor.tsx`, `AudiosEditor.tsx`, server functions, banco, ou prévia (`CursoPreview`).

## Estilo

- Tipografia atual (Cormorant Garamond + DM Sans), paleta atual (`c.sage`, `c.gold`, `c.warm`, `c.border`, `c.muted`).
- Sem ícones (regra do projeto). Stepper feito com numerais + rótulo + traço entre passos.
- Sem mudanças de cor, sem novas dependências.

## Riscos / fora de escopo

- Não altera schema, server functions, fluxo de pagamento, nem `CursoModal` da vitrine pública.
- Não altera Material/Serviço.
- Não toca em validação de submit (continua o mesmo `salvarCurso`).
