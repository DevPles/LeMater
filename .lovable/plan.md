## Visão Confirmada

O painel **Admin** vai operar com **três missões integradas**:

1. **Base de Regras Clínicas** (fonte única da verdade) — admin cadastra parâmetros, critérios e calendários que servem de referência para TODA a engine de alertas.
2. **Inserção de Dados Clínicos** (já existe) — profissionais lançam medições/exames/vacinas das gestantes, que são automaticamente comparadas com a base.
3. **Inteligência Epidemiológica** (nova) — relatórios agregados da DRS-XIII Ribeirão Preto + cidades vizinhas, com cruzamentos por bairro, UBS, faixa etária, trimestre, condição clínica, vacinação, paridade e classificação de partos.

O **loop fechado** já funciona: `dado inserido → comparado com regras → alerta automático`. Falta expandir a base de regras (imagem + vacinas extras) e construir a camada epidemiológica real.

---

## Estrutura final do Admin (6 abas)

```text
┌─ Gestão (lista de gestantes — atual)
├─ Relatórios Epidemiológicos (NOVA, dados reais agregados da DRS-XIII)
├─ Parâmetros Clínicos (expandir: vitais + lab + imagem + PNI + extras)
├─ Dados Clínicos (atual: lançamento por gestante)
├─ Profissionais (atual)
└─ Telas (atual: editor de conteúdo)
```

---

## Fase A — Expansão do schema clínico

### A1. Perfil da gestante: dados demográficos e obstétricos
Adicionar à `profiles`:
- `bairro` (text)
- `cidade` (text, default 'Ribeirão Preto')
- `unidade_saude` (text — UBS/USF de referência)
- `data_nascimento` (date — para faixa etária real)
- `numero_gestacoes` (int) / `numero_partos` (int) / `numero_abortos` (int) — fórmula GPA
- `partos_classificacao` (jsonb — array: `[{tipo: 'normal'|'cesarea'|'forceps', ano: 2022}, ...]`)

### A2. Tabela `image_exam_schedule` (janelas ideais de exames de imagem)
```text
id | tipo_exame ('USG morfológica', 'USG obstétrica', etc.)
   | semana_min | semana_max | obrigatorio (bool) | mensagem
```
Seed com janelas oficiais (MS/FEBRASGO):
- USG 1º trimestre + translucência nucal: 11–14 sem
- USG morfológica: 20–24 sem
- USG obstétrica 3º trim: 32–36 sem
- Dopplervelocimetria: 26–28 sem (alto risco)

### A3. Tabela `image_exam_results` (resultado com upload)
```text
id | gestante_id | tipo_exame | data_exame | status ('normal'|'alterado'|'pendente')
   | laudo_texto | imagem_url (storage) | observacao | registrado_por
```
Bucket Storage: `image-exams` (privado, RLS por gestante/profissional).

### A4. Calendário de vacinas — duas tabelas separadas (conforme aprovado)
- **`vaccine_schedule_pni`** (já existe como `vaccine_schedule`, renomear/marcar) — vacinas obrigatórias do Programa Nacional de Imunizações.
- **`vaccine_schedule_extra`** (nova) — vacinas particulares/recomendadas (meningo ACWY, varicela, HPV pós-parto, etc.).

Ambas seguem o mesmo schema: `vacina, semana_min, semana_max, mensagem, fonte`. A engine `get_active_alerts` consulta ambas, mas só gera alerta para PNI atrasada (extras viram "sugestão").

---

## Fase B — Editor "Parâmetros Clínicos" expandido

`ParametrosTab.tsx` ganha **5 sub-abas**:

```text
[Sinais Vitais] [Laboratoriais] [Imagem] [Vacinas PNI] [Vacinas Extras]
```

Cada sub-aba: tabela editável (CRUD admin) com fonte oficial visível (MS Caderno 32, OMS, FEBRASGO, PNI). Botão "Restaurar valores oficiais" recarrega seed.

---

## Fase C — Upload de imagens de exame

### C1. Storage bucket
```sql
insert into storage.buckets (id, name, public) 
values ('image-exams', 'image-exams', false);
```
RLS: gestante vê próprios laudos; profissional/admin inserem e visualizam.

### C2. Componente `ImageExamForm` em `DadosClinicosTab`
- Seleciona tipo de exame (do `image_exam_schedule`)
- Upload de PDF/JPG/PNG → assinado e salvo
- Campo laudo (texto) + status
- Lista exames anteriores com botão "Ver imagem" (URL assinada temporária)

### C3. Integração com alertas
Engine ganha 4ª branch:
```text
UNION ALL
SELECT exames de imagem fora da janela ideal (não realizados após semana_max)
```

---

## Fase D — Relatórios Epidemiológicos (aba nova)

`RelatoriosEpidemiologicosTab.tsx` substitui dados mockados do bloco "Análise" atual por queries reais agregadas. Recortes:

### D1. Filtros globais
- Cidade (multi-select: Ribeirão Preto + cidades DRS-XIII: Sertãozinho, Cravinhos, Jardinópolis, Brodowski, Serrana, Dumont, Pontal, Pradópolis, Guatapará, Barrinha, Luís Antônio, Santa Rosa de Viterbo, São Simão, Cajuru, Cássia dos Coqueiros, Santo Antônio da Alegria, Altinópolis, Batatais)
- Bairro (depende de cidade)
- Unidade de saúde
- Faixa etária (< 18 / 18-34 / ≥ 35)
- Trimestre (1º / 2º / 3º — calculado da DUM)
- Período (data início/fim por DUM ou DPP)

### D2. Painéis (Recharts)
1. **Demografia**: distribuição por cidade, bairro, UBS, idade, paridade (G/P/A)
2. **Risco clínico**: % com alerta ativo, top condições (HAS, DM, pré-eclâmpsia anterior...)
3. **Cobertura vacinal**: % cumprimento PNI por vacina, por UBS
4. **Exames**: % cobertura de USG morfológica na janela, exames laboratoriais alterados
5. **Sinais vitais agregados**: média de PA, FCF, glicemia por trimestre
6. **Histórico obstétrico**: distribuição de tipos de parto (normal/cesárea/fórceps), nº médio de gestações
7. **Série temporal**: novos cadastros por mês, alertas gerados por semana

### D3. Tudo via `createServerFn` agregando da `profiles + clinical_measurements + exam_results + vaccinations + get_active_alerts`. Exportação Excel mantida.

---

## Fase E — Limpeza
- Remover do `admin.tsx` os mocks `gestantesMock`, `EXAMES_LISTA`, `VACINAS_LISTA`, `CONDICOES_ALTO_RISCO`, `SINAIS_CRITICOS` — substituir aba "Gestão" por listagem real de `profiles` com role 'gestante'.
- Manter funcionalidade de WhatsApp e push (com mensagens automáticas baseadas em `get_active_alerts` reais).

---

## Detalhes técnicos

**Migrations** (1 única migration consolidada):
1. ALTER `profiles` ADD bairro, cidade, unidade_saude, data_nascimento, numero_gestacoes, numero_partos, numero_abortos, partos_classificacao
2. CREATE `image_exam_schedule` + RLS (admin CRUD, autenticados leem)
3. CREATE `image_exam_results` + RLS (gestante vê próprios, profissional/admin inserem)
4. CREATE `vaccine_schedule_extra` + RLS (mesmo padrão de `vaccine_schedule`)
5. RENAME `vaccine_schedule` → `vaccine_schedule_pni` (e atualizar `get_active_alerts`)
6. CREATE bucket `image-exams` + storage policies
7. SEED janelas oficiais de imagem + lista de cidades DRS-XIII (em constante TS)
8. UPDATE `get_active_alerts` para incluir branch de exames de imagem fora da janela

**Server functions novas** (`src/utils/admin.functions.ts`):
- `getEpidemiologicalReport(filters)` → agrega dados de todas as tabelas
- `uploadImageExam` → assina URL para upload privado
- `getImageExamSignedUrl(examId)` → URL assinada temporária para visualização

**Componentes novos**:
- `src/components/admin/RelatoriosEpidemiologicosTab.tsx`
- `src/components/admin/ImageExamUploader.tsx`
- Sub-abas em `ParametrosTab.tsx` (Vitais/Lab/Imagem/PNI/Extras)

**Componentes editados**:
- `src/components/admin/DadosClinicosTab.tsx` (adicionar seção Imagem)
- `src/components/admin/ParametrosTab.tsx` (5 sub-abas)
- `src/routes/admin.tsx` (nova aba, remover mocks, listagem real)
- `src/routes/cadastro.tsx` ou modal de cadastro (campos demográficos novos)

**Constante**:
- `src/lib/drs-xiii.ts` — lista das 26 cidades da DRS-XIII Ribeirão Preto.

---

## Ordem de execução

1. **Migration consolidada** (schema + storage + seed + função atualizada)
2. **Fase B**: editor expandido de Parâmetros (5 sub-abas)
3. **Fase C**: upload de imagens em Dados Clínicos
4. **Fase A1** (UI): atualizar cadastro/modal de gestante com novos campos demográficos
5. **Fase D**: aba Relatórios Epidemiológicos com queries reais
6. **Fase E**: limpeza de mocks na aba Gestão

Tamanho: 1 migration grande + ~6 arquivos novos + ~4 editados.
