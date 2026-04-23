

## Entendi agora — Plano revisado

Vou separar em **duas engines distintas**: uma de **alertas clínicos automáticos** (gerados a partir de dados reais da gestante) e um **sistema de agendamento real** (profissionais publicam horários, gestantes reservam).

---

### 1. Alertas automáticos (sem edição manual)

Os alertas serão **derivados** de três fontes de dados clínicos da gestante:

**a) Sinais vitais / dados clínicos fora do padrão**
- PA (pressão arterial), peso, glicemia, batimentos fetais, altura uterina, etc.
- Cada parâmetro tem faixa de normalidade **por semana gestacional**.
- Se o valor inserido sai da faixa → gera alerta automático com severidade (atenção / urgente).

**b) Exames com resultados ruins**
- Hemograma, urina tipo 1, glicemia, sorologias (sífilis, HIV, toxoplasmose), ultrassom, etc.
- Cada exame tem critérios de "resultado alterado" → gera alerta automático.

**c) Vacinas em atraso**
- Calendário vacinal da gestante (dT/dTpa, Hepatite B, Influenza, COVID).
- Se a semana gestacional atual ≥ semana recomendada e a vacina não consta como aplicada → alerta automático.

**Estrutura de banco:**

```text
clinical_measurements   → leituras (tipo, valor, semana, data)
exam_results            → exames (tipo, resultado, status: normal/alterado)
vaccinations            → vacinas aplicadas (tipo, data)
reference_ranges        → faixas de normalidade por parâmetro × semana
exam_criteria           → critérios de "resultado alterado" por tipo de exame
vaccine_schedule        → calendário vacinal recomendado (tipo, semana_min)
```

A página `/alertas` consulta essas tabelas e **calcula os alertas em tempo real** (ou via view/função SQL). **Nenhum alerta é editado manualmente.**

No Admin, em vez de editar alertas, haverá uma aba **"Parâmetros Clínicos"** para configurar as faixas de referência, critérios de exames e calendário vacinal (regras, não alertas individuais).

---

### 2. Sistema de agendamento real

**Fluxo:**

```text
Profissional                          Gestante
    │                                     │
    ├─ Login no portal /profissional      │
    ├─ Cadastra horários disponíveis      │
    │  (data, hora, duração, modalidade)  │
    │                                     │
    │                                     ├─ Acessa /videochamada
    │                                     ├─ Filtra por especialidade
    │                                     ├─ Vê horários livres
    │                                     ├─ Clica e agenda
    │                                     │
    ├─ Vê agenda com pacientes confirmadas│
    └─ Marca como realizado               │
```

**Estrutura de banco:**

```text
professionals       → id, nome, especialidade, CRM/COREN, user_id (auth)
appointment_slots   → professional_id, data_hora, duração,
                      modalidade (vídeo/presencial),
                      status (disponivel | reservado | realizado | cancelado),
                      gestante_id (preenchido ao reservar)
```

**Páginas novas:**
- `/profissional/login` — login dedicado para profissionais
- `/profissional` — dashboard do profissional (ver agenda, criar slots, marcar realizado)
- `/videochamada` (refatorada) — gestante vê apenas slots `disponivel`, filtra por especialidade, agenda

**Função segura** `book_slot(slot_id)` no banco — garante que duas gestantes não reservem o mesmo horário (atomic update com `WHERE status = 'disponivel'`).

---

### 3. Refatoração do Admin

**Removido:**
- Aba de edição manual de alertas
- Aba de edição manual de agendamentos

**Mantido:**
- Home (saudação, dicas)
- Vídeos (lista editorial)
- Cartão / Gestação (rótulos e dados clínicos da gestante demo)

**Adicionado:**
- **Parâmetros Clínicos** — gerenciar faixas de referência, critérios de exames, calendário vacinal
- **Profissionais** — admin cadastra/aprova profissionais (cria conta + vincula a `professionals`)
- **Dados Clínicos da Gestante** — inserir medições, exames e vacinas (que automaticamente alimentam os alertas)

---

### 4. Autenticação

Necessária para separar perfis:
- **Gestante** — vê alertas, agenda consultas
- **Profissional** — gerencia próprios slots
- **Admin** — gerencia tudo

Tabela `user_roles` separada (gestante / profissional / admin) com função `has_role()` (security definer) para RLS.

---

### Detalhes técnicos

- **Banco**: novas tabelas `clinical_measurements`, `exam_results`, `vaccinations`, `reference_ranges`, `exam_criteria`, `vaccine_schedule`, `professionals`, `appointment_slots`, `user_roles` + enum `app_role`.
- **Geração de alertas**: função SQL `get_active_alerts(gestante_id)` que cruza medições/exames/vacinas com as regras → retorna lista de alertas calculados. Sem persistência de alertas individuais.
- **Booking atômico**: função `book_slot(slot_id, gestante_id)` com `UPDATE ... WHERE status='disponivel' RETURNING` para evitar double-booking.
- **RLS**: 
  - `appointment_slots`: gestante lê apenas `disponivel` ou os próprios reservados; profissional gerencia apenas os próprios.
  - `clinical_measurements/exam_results/vaccinations`: gestante lê apenas os próprios; profissional/admin pode inserir.
- **Auth**: email/senha + Google. Login separado por role no redirect pós-login.

---

### Fases de implementação

**Fase A — Auth + Roles**
- Tabela `user_roles`, função `has_role`, telas de login/signup, separação gestante/profissional/admin.

**Fase B — Alertas automáticos**
- Tabelas clínicas + regras + função `get_active_alerts` + refatorar `/alertas` para consumir + aba "Parâmetros Clínicos" e "Dados Clínicos" no Admin.

**Fase C — Agendamento real**
- Tabelas `professionals` + `appointment_slots` + portal `/profissional` + refatorar `/videochamada` para reserva real + aba "Profissionais" no Admin.

**Limpeza**: remover do `TelasTab` as seções de alertas e agendamentos (substituídas pelas engines).

