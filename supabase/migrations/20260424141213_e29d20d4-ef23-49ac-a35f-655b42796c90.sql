-- Unique constraints para idempotência do seed
ALTER TABLE public.reference_ranges
  ADD CONSTRAINT reference_ranges_unique_rule
  UNIQUE (parametro, semana_min, semana_max, severidade);

ALTER TABLE public.exam_criteria
  ADD CONSTRAINT exam_criteria_unique_rule
  UNIQUE (tipo_exame, resultado_alterado);

ALTER TABLE public.vaccine_schedule
  ADD CONSTRAINT vaccine_schedule_unique_rule
  UNIQUE (vacina, semana_min);

-- ========== FAIXAS DE REFERÊNCIA — Sinais vitais e antropometria ==========

INSERT INTO public.reference_ranges (parametro, unidade, semana_min, semana_max, valor_min, valor_max, severidade, mensagem) VALUES
-- Pressão arterial sistólica
('pa_sistolica', 'mmHg', 0, 42, 90, 139, 'atencao',
 'Pressão arterial sistólica fora do padrão de normalidade (90-139 mmHg). Procure avaliação médica. Fonte: MS — Caderno 32 / FEBRASGO.'),
('pa_sistolica', 'mmHg', 0, 42, NULL, 159, 'urgente',
 'Pressão sistólica >=160 mmHg caracteriza hipertensão grave. Procure atendimento imediato. Fonte: MS / FEBRASGO.'),

-- Pressão arterial diastólica
('pa_diastolica', 'mmHg', 0, 42, 60, 89, 'atencao',
 'Pressão arterial diastólica fora do padrão (60-89 mmHg). Agende avaliação. Fonte: MS — Caderno 32.'),
('pa_diastolica', 'mmHg', 0, 42, NULL, 109, 'urgente',
 'Pressão diastólica >=110 mmHg — crise hipertensiva. Procure pronto-socorro. Fonte: MS / FEBRASGO.'),

-- Batimento cardíaco fetal
('bcf', 'bpm', 12, 42, 110, 160, 'urgente',
 'Batimento cardíaco fetal fora da faixa de 110-160 bpm. Avaliação obstétrica imediata. Fonte: OMS.'),

-- Glicemia de jejum
('glicemia_jejum', 'mg/dL', 0, 42, 70, 92, 'atencao',
 'Glicemia de jejum fora da faixa de normalidade gestacional (70-92 mg/dL). Procure avaliação. Fonte: IADPSG / MS.'),
('glicemia_jejum', 'mg/dL', 0, 42, NULL, 125, 'urgente',
 'Glicemia >=126 mg/dL sugere diabetes gestacional. Avaliação imediata. Fonte: IADPSG / MS.'),

-- Temperatura
('temperatura', '°C', 0, 42, 35.5, 37.7, 'atencao',
 'Temperatura fora do padrão (35,5-37,7 °C). Febre na gestação requer avaliação médica. Fonte: MS.'),

-- Frequência cardíaca materna
('frequencia_cardiaca', 'bpm', 0, 42, 60, 100, 'atencao',
 'Frequência cardíaca materna fora do padrão (60-100 bpm). Fonte: FEBRASGO.'),

-- Hemoglobina
('hemoglobina', 'g/dL', 0, 42, 11, 15, 'atencao',
 'Hemoglobina fora do padrão. Valores <11 g/dL indicam anemia gestacional. Fonte: OMS.'),

-- Ganho de peso semanal (a partir do 2º trimestre)
('ganho_peso_semanal', 'kg/sem', 14, 42, 0.2, 0.5, 'atencao',
 'Ganho de peso semanal fora do recomendado (0,2-0,5 kg/sem no 2º e 3º trimestre). Fonte: IOM / MS.'),

-- Proteinúria 24h
('proteinuria', 'mg/24h', 20, 42, NULL, 299, 'urgente',
 'Proteinúria >=300 mg/24h sugere pré-eclâmpsia. Avaliação imediata. Fonte: FEBRASGO / MS.'),

-- Altura uterina — curva oficial MS (faixa = semana ± 3 cm)
('altura_uterina', 'cm', 20, 22, 17, 25, 'atencao',
 'Altura uterina fora da curva esperada para a idade gestacional. Fonte: MS — Caderno 32.'),
('altura_uterina', 'cm', 23, 25, 20, 28, 'atencao',
 'Altura uterina fora da curva esperada. Fonte: MS — Caderno 32.'),
('altura_uterina', 'cm', 26, 28, 23, 31, 'atencao',
 'Altura uterina fora da curva esperada. Fonte: MS — Caderno 32.'),
('altura_uterina', 'cm', 29, 31, 26, 34, 'atencao',
 'Altura uterina fora da curva esperada. Fonte: MS — Caderno 32.'),
('altura_uterina', 'cm', 32, 34, 29, 37, 'atencao',
 'Altura uterina fora da curva esperada. Fonte: MS — Caderno 32.'),
('altura_uterina', 'cm', 35, 36, 32, 39, 'atencao',
 'Altura uterina fora da curva esperada. Fonte: MS — Caderno 32.')

ON CONFLICT (parametro, semana_min, semana_max, severidade) DO NOTHING;

-- ========== CRITÉRIOS DE EXAMES ==========

INSERT INTO public.exam_criteria (tipo_exame, resultado_alterado, severidade, mensagem) VALUES
('sifilis_vdrl', 'reagente', 'urgente',
 'VDRL reagente — sífilis na gestação requer tratamento imediato para mãe e parceiro. Fonte: MS.'),
('hiv', 'reagente', 'urgente',
 'Sorologia para HIV reagente — encaminhamento imediato a serviço especializado. Fonte: MS.'),
('hepatite_b_hbsag', 'reagente', 'urgente',
 'HBsAg reagente — necessário acompanhamento e profilaxia neonatal. Fonte: MS.'),
('toxoplasmose_igm', 'reagente', 'urgente',
 'IgM reagente para toxoplasmose — investigação de infecção aguda. Fonte: MS.'),
('urocultura', 'positiva', 'atencao',
 'Urocultura positiva — bacteriúria assintomática deve ser tratada na gestação. Fonte: MS.'),
('glicemia_jejum', '>=92', 'atencao',
 'Glicemia de jejum >=92 mg/dL — investigar diabetes gestacional com TOTG. Fonte: IADPSG / MS.'),
('tsh', '>2.5', 'atencao',
 'TSH >2,5 mUI/L na gestação — avaliar função tireoidiana. Fonte: FEBRASGO.'),
('coombs_indireto', 'positivo', 'urgente',
 'Coombs indireto positivo — risco de doença hemolítica perinatal. Encaminhamento imediato. Fonte: MS.'),
('hemograma_hb', '<11', 'atencao',
 'Hemoglobina <11 g/dL — anemia gestacional, iniciar suplementação. Fonte: OMS / MS.'),
('streptococcus_b', 'positivo', 'atencao',
 'Estreptococo do grupo B positivo — antibioticoprofilaxia no parto. Fonte: MS.')

ON CONFLICT (tipo_exame, resultado_alterado) DO NOTHING;

-- ========== CALENDÁRIO VACINAL — PNI/MS ==========

INSERT INTO public.vaccine_schedule (vacina, semana_min, semana_max, obrigatoria, mensagem) VALUES
('dTpa', 20, 36, true,
 'dTpa (difteria, tétano e coqueluche acelular) — dose única a cada gestação, entre 20 e 36 semanas. Fonte: PNI / MS.'),
('hepatite_b', 0, 42, true,
 'Hepatite B — esquema de 3 doses (0, 1 e 6 meses) se não vacinada anteriormente. Fonte: PNI / MS.'),
('influenza', 0, 42, true,
 'Influenza — dose anual, em qualquer idade gestacional, durante a campanha. Fonte: PNI / MS.'),
('covid_19', 0, 42, true,
 'COVID-19 — esquema vacinal conforme calendário vigente para gestantes. Fonte: PNI / MS.')

ON CONFLICT (vacina, semana_min) DO NOTHING;