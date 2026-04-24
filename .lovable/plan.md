# Catálogo geográfico DRS-XIII (cidade → distrito → bairro → UBS)

## Objetivo

Substituir os campos livres atuais (`profiles.cidade/bairro/unidade_saude`) por uma hierarquia oficial e navegável: **cidade → (distrito, se houver) → bairro → UBS**. O cadastro vira encadeado, com selects dependentes alimentados pelo banco. O usuário ainda pode digitar manualmente quando algo não estiver na lista (ex.: UBS nova).

---

## 1. Modelo de dados

Quatro tabelas novas em `public`, todas com RLS:

```text
districts
  id (uuid)
  cidade (text)              -- ex: "Ribeirão Preto"
  nome (text)                -- ex: "Sede", "Bonfim Paulista"
  UNIQUE (cidade, nome)

neighborhoods
  id (uuid)
  cidade (text)
  district_id (uuid NULL)    -- nullable: bairro pode não pertencer a distrito
  nome (text)                -- ex: "Centro", "Campos Elíseos"
  UNIQUE (cidade, district_id, nome)

health_units                 -- UBS / UBSF / NASF
  id (uuid)
  cidade (text)
  district_id (uuid NULL)
  neighborhood_id (uuid NULL)
  nome (text)                -- ex: "UBS Vila Albertina"
  cnes (text NULL)           -- código CNES quando conhecido
  tipo (text NULL)           -- "UBS", "UBSF", "USF", "AME"...
  endereco (text NULL)
  ativo (boolean default true)
  UNIQUE (cidade, nome)
```

E duas novas colunas opcionais em `profiles` para guardar o vínculo estruturado (mantemos `cidade/bairro/unidade_saude` como texto para compatibilidade e exibição):

```text
profiles
  + district_id (uuid NULL)
  + health_unit_id (uuid NULL)
```

### RLS

- `SELECT`: liberado para `authenticated` (gestante precisa ler para preencher cadastro).
- `INSERT/UPDATE/DELETE`: apenas `admin` (via `has_role`).

---

## 2. Conteúdo inicial (seed)

Conforme combinado, popular **todas as 26 cidades da DRS-XIII**. Estratégia para manter qualidade:

- **Ribeirão Preto** (sede): cobertura completa — distritos `Sede` e `Bonfim Paulista`, ~80 bairros principais, ~50 UBS/UBSF reais com CNES quando disponível (fonte: portal SMS-RP / CNES DataSUS).
- **Demais 25 cidades**: cidade + 1 distrito padrão "Sede" + UBS principais conhecidas (geralmente 1–8 por município, fonte CNES DataSUS). Cidades com distritos relevantes (ex.: Cruz das Posses em Sertãozinho) ganham distrito próprio.
- Bairros das cidades menores: deixados vazios inicialmente — admin completa via UI conforme demanda. O cadastro permite digitar bairro livre se a lista estiver vazia.

Seed entra como `INSERT … ON CONFLICT DO NOTHING` em uma migration única, isolada do schema, para poder reexecutar sem risco.

---

## 3. Topbar de filtros do admin

Reordenar e encadear (já está parcialmente feito):

`Cidade → Distrito → Bairro → UBS → demais filtros`

- Distrito **só aparece** se a(s) cidade(s) selecionada(s) tiverem mais de um distrito cadastrado.
- Bairro lista apenas bairros das cidades (e distrito, se filtrado) selecionados.
- UBS lista apenas unidades das cidades/distrito/bairro selecionados.
- Mudança em nível superior reseta automaticamente os inferiores.

Adicionar `distrito` e `health_unit_id` ao `AdminFiltersContext`.

---

## 4. Cadastro da gestante (`RegistrationModal`)

Substituir os campos atuais por um bloco encadeado:

```text
[ Cidade        ▼ ]   ← combobox com busca, lista DRS-XIII
[ Distrito      ▼ ]   ← aparece só se a cidade tiver >1 distrito
[ Bairro        ▼ ]   ← combobox com busca; rodapé "+ Adicionar novo bairro"
[ UBS           ▼ ]   ← combobox com busca; rodapé "+ Outra UBS (digitar)"
```

Comportamento:

- ViaCEP continua preenchendo `cidade` e `bairro` automaticamente. Se o bairro retornado existir na lista da cidade → seleciona. Se não existir → entra como texto livre e mostra hint discreto "bairro novo, será revisado".
- Selecionar cidade carrega distritos/bairros/UBS via TanStack Query (cache compartilhado, `staleTime` longo).
- "+ Outra UBS" abre input livre — gravamos em `unidade_saude` (texto) e deixamos `health_unit_id` nulo. Admin recebe esses casos numa visão "UBS pendentes de catalogação" (futuro, fora do escopo agora).
- Removemos o mapeamento hardcoded bairro→UBS atual do modal (hoje em `RegistrationModal.tsx` linhas 77–96).

---

## 5. Tela admin para gerenciar o catálogo

Nova subseção na sidebar dentro de **Configuração**:

```text
Configuração
 └─ Localidades & UBS
      ├─ Cidades (read-only, lista DRS-XIII)
      ├─ Distritos
      ├─ Bairros
      └─ UBS / unidades de saúde
```

Cada aba: tabela com busca, criar/editar/desativar, vínculo com nível pai. Permite ao admin manter o catálogo vivo sem deploy.

---

## 6. Migração de dados existentes

Script idempotente dentro da migration:

1. Para cada `profiles.cidade` distinto que bata com DRS-XIII, manter como está.
2. Tentar casar `profiles.bairro` com `neighborhoods.nome` da mesma cidade → preencher `neighborhoods` se faltar e setar `district_id` quando óbvio (ex.: "Bonfim Paulista" em RP vira distrito).
3. Tentar casar `profiles.unidade_saude` com `health_units.nome` da cidade → setar `profiles.health_unit_id`. Quando não casar, deixar nulo (texto preservado em `unidade_saude`).

Sem perda de dados — campos texto continuam autoritativos até o vínculo estruturado ser preenchido.

---

## Detalhes técnicos

- **Tabelas e seed**: uma migration de schema (DDL + RLS + índices em `cidade`, `district_id`, `neighborhood_id`) + uma migration separada só com os `INSERT ON CONFLICT` do seed, para facilitar reexecução/correção.
- **Hooks de leitura**: `useCidades()`, `useDistritos(cidade)`, `useBairros(cidade, districtId?)`, `useUbs(cidade, districtId?, neighborhoodId?)` — todos com TanStack Query, `staleTime: 10min`, chave incluindo os filtros.
- **Combobox**: usar shadcn `Command` + `Popover` (já no projeto) para busca rápida em listas longas, sem ícones (constraint do projeto).
- **Tipos**: novos tipos virão do `types.ts` regenerado após a migration. Componentes consomem via tipos do client Supabase.
- **Compatibilidade**: filtros antigos do admin continuam funcionando contra `cidade/bairro/unidade_saude` (texto) — o novo `health_unit_id` é usado para precisão quando disponível, com fallback no texto.
- **Sem ícones** em qualquer UI nova (memória do projeto).

---

## O que NÃO entra agora

- Importação massiva de bairros das 25 cidades menores (fica para o admin completar sob demanda).
- Tela de "UBS pendentes de catalogação" baseada nos textos livres salvos por gestantes.
- Geocoding/mapa por UBS.
- Vínculo profissional ↔ UBS.

---

## Ordem de execução

1. Migration: criar tabelas + RLS + índices + colunas em `profiles`.
2. Migration: seed das 26 cidades, distritos, bairros principais e UBS conhecidas.
3. Hooks de leitura + types regenerados.
4. Atualizar `AdminFiltersContext` + topbar (adicionar distrito e UBS encadeados ao banco).
5. Refatorar `RegistrationModal` para selects encadeados com fallback manual.
6. Subseção admin "Localidades & UBS" para CRUD.
