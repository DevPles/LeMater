## Problema

1. **Cores fora da identidade**: o conteúdo do `/app/admin` usa uma paleta creme/sage/Cormorant Garamond, que não bate com o resto do sistema (navy `#1a1557` + gold `#f0c040`, Playfair Display + DM Sans). Só a sidebar está na marca.
2. **Painel vazio**: o Dashboard mostra apenas 3 contadores estáticos (Leads, Alunos ativos, Materiais). Sem tendências, sem receita, sem vendas, sem listas recentes.

## Escopo do redesenho

### 1. Alinhamento visual de `/app/admin` (`src/routes/_authenticated/app.admin.tsx`)

- Remover o objeto `c` com sage/cream e o `Cormorant Garamond`. Passar a usar:
  - **Fundo**: `#faf8f3` (mesmo do `AdminLayout` interno e do `app/admin` atual da sidebar).
  - **Acento navy** `#1a1557` e **gold** `#f0c040` para títulos, botões primários, badges.
  - **Bordas**: `#e8ddd2` / `border-border`.
  - **Tipografia**: `Playfair Display` (h1/h2) + `DM Sans` (corpo) — já carregadas globalmente.
- Header, botões (`btn`, `btnSm`), `Stat`, tabelas, modais, inputs passam a usar essa paleta.
- Remover link `<link rel="stylesheet">` do Cormorant no `head()` da rota.

### 2. Dashboard com informação de verdade

Novo server fn `dashboardOverview` em `src/lib/admin.functions.ts` (mantém o `dashboardStats` antigo para não quebrar nada). Retorna em uma única chamada:

- **KPIs (cards)**:
  - Gestantes cadastradas (profiles com role gestante)
  - Alunos com acesso pago ativo
  - Leads grátis (total) + delta últimos 7 dias
  - Pedidos pagos no mês + variação vs mês anterior
  - Receita no mês (soma `valor_centavos` status pago, em BRL)
  - Cursos publicados / Materiais publicados
  - Matrículas ativas em cursos
  - Compras Hotmart processadas (total)
- **Gráficos** (Recharts, já no projeto):
  - Barras: pedidos pagos por dia (últimos 14 dias)
  - Barras: leads por dia (últimos 14 dias)
  - Pizza: vendas por plataforma (hotmart / mercadopago / manual / outros)
- **Listas**:
  - Últimos 8 pedidos (data, comprador, produto, plataforma, valor, status) — com badge de status colorido.
  - Últimos 8 leads (data, nome, email, material).

Tudo navegável: cada card/lista tem botão "Ver tudo" que chama `setTab(...)` para a aba correspondente (vendas, leads, alunos, etc.).

### 3. Implementação

- **Backend**: agregações em paralelo via `supabaseAdmin` (`count + head`, `select` com `gte` para janelas, agrupamento client-side para a série diária — dados pequenos).
- **Frontend**: novo componente `DashboardTab` reescrito no mesmo arquivo, usando `Recharts` para os gráficos e tokens de cor da marca.
- **Sem mudanças** em RLS, em outras abas, na sidebar `AdminLayout` separado (`src/components/admin/AdminLayout.tsx`), ou no fluxo de auth.

## Arquivos afetados

- `src/lib/admin.functions.ts` — adiciona `dashboardOverview`.
- `src/routes/_authenticated/app.admin.tsx` — repalleta tudo + reescreve `DashboardTab` + atualiza estilos compartilhados (`btn`, `Th`, `Td`, `inp`, `modalBg`, `h1`).

## Observações

- A regra de não usar ícones (memória do projeto) será respeitada — sem Lucide, sem SVG icon libs. Indicadores usam texto, badges coloridos e gráficos Recharts.
- Permanece consistente com a sidebar navy/gold já existente, dando coesão à tela inteira.
