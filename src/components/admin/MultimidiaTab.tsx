import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { appConfirm } from "@/components/AppDialog";
import { supabase } from "@/integrations/supabase/client";
import {
  vidEngravidar, vidPreNatal, vidExercicios, vidAlimentacao,
  vidPartoHumanizado, vidPlanoParto, vidPuerperio, vidAmamentacao,
  vidPrimeirosCuidados, vidSonoBebe,
} from "@/lib/atlas-cover-video";

import amamentacao2 from "@/assets/curso-videos/amamentacao-2.mp4.asset.json";
import amamentacao3 from "@/assets/curso-videos/amamentacao-3.mp4.asset.json";
import amamentacao4 from "@/assets/curso-videos/amamentacao-4.mp4.asset.json";
import amamentacao5 from "@/assets/curso-videos/amamentacao-5.mp4.asset.json";
import amamentacao6 from "@/assets/curso-videos/amamentacao-6.mp4.asset.json";
import amamentacao7 from "@/assets/curso-videos/amamentacao-7.mp4.asset.json";
import amamentacao8 from "@/assets/curso-videos/amamentacao-8.mp4.asset.json";
import amamentacao9 from "@/assets/curso-videos/amamentacao-9.mp4.asset.json";
import amamentacao10 from "@/assets/curso-videos/amamentacao-10.mp4.asset.json";
import amamentacao11 from "@/assets/curso-videos/amamentacao-11.mp4.asset.json";
import amamentacao12 from "@/assets/curso-videos/amamentacao-12.mp4.asset.json";
import amamentacao13 from "@/assets/curso-videos/amamentacao-13.mp4.asset.json";
import amamentacao14 from "@/assets/curso-videos/amamentacao-14.mp4.asset.json";
import amamentacao15 from "@/assets/curso-videos/amamentacao-15.mp4.asset.json";
import amamentacao16 from "@/assets/curso-videos/amamentacao-16.mp4.asset.json";
import amamentacao17 from "@/assets/curso-videos/amamentacao-17.mp4.asset.json";
import amamentacao18 from "@/assets/curso-videos/amamentacao-18.mp4.asset.json";
import amamentacao19 from "@/assets/curso-videos/amamentacao-19.mp4.asset.json";
import amamentacao20 from "@/assets/curso-videos/amamentacao-20.mp4.asset.json";
import amamentacao21 from "@/assets/curso-videos/amamentacao-21.mp4.asset.json";

import concepcao2 from "@/assets/curso-videos/concepcao-2.mp4.asset.json";
import concepcao3 from "@/assets/curso-videos/concepcao-3.mp4.asset.json";
import concepcao4 from "@/assets/curso-videos/concepcao-4.mp4.asset.json";
import concepcao5 from "@/assets/curso-videos/concepcao-5.mp4.asset.json";
import concepcao6 from "@/assets/curso-videos/concepcao-6.mp4.asset.json";
import concepcao7 from "@/assets/curso-videos/concepcao-7.mp4.asset.json";
import concepcao8 from "@/assets/curso-videos/concepcao-8.mp4.asset.json";
import concepcao9 from "@/assets/curso-videos/concepcao-9.mp4.asset.json";
import concepcao10 from "@/assets/curso-videos/concepcao-10.mp4.asset.json";
import concepcao11 from "@/assets/curso-videos/concepcao-11.mp4.asset.json";
import concepcao12 from "@/assets/curso-videos/concepcao-12.mp4.asset.json";
import concepcao13 from "@/assets/curso-videos/concepcao-13.mp4.asset.json";
import concepcao14 from "@/assets/curso-videos/concepcao-14.mp4.asset.json";
import concepcao15 from "@/assets/curso-videos/concepcao-15.mp4.asset.json";
import concepcao16 from "@/assets/curso-videos/concepcao-16.mp4.asset.json";
import concepcao17 from "@/assets/curso-videos/concepcao-17.mp4.asset.json";
import concepcao18 from "@/assets/curso-videos/concepcao-18.mp4.asset.json";
import concepcao19 from "@/assets/curso-videos/concepcao-19.mp4.asset.json";
import concepcao20 from "@/assets/curso-videos/concepcao-20.mp4.asset.json";
import concepcao21 from "@/assets/curso-videos/concepcao-21.mp4.asset.json";
import concepcaoEua1 from "@/assets/curso-videos/concepcao-eua-1.mp4.asset.json";
import concepcaoEua2 from "@/assets/curso-videos/concepcao-eua-2.mp4.asset.json";
import concepcaoEua3 from "@/assets/curso-videos/concepcao-eua-3.mp4.asset.json";
import concepcaoBrasil1 from "@/assets/curso-videos/concepcao-brasil-1.mp4.asset.json";
import concepcaoBrasil2 from "@/assets/curso-videos/concepcao-brasil-2.mp4.asset.json";
import concepcaoBrasil3 from "@/assets/curso-videos/concepcao-brasil-3.mp4.asset.json";
import concepcaoEspanha1 from "@/assets/curso-videos/concepcao-espanha-1.mp4.asset.json";
import concepcaoEspanha2 from "@/assets/curso-videos/concepcao-espanha-2.mp4.asset.json";
import concepcaoEspanha3 from "@/assets/curso-videos/concepcao-espanha-3.mp4.asset.json";

import gestacaoBrasil1 from "@/assets/curso-videos/gestacao-brasil-1.mp4.asset.json";
import gestacaoBrasil2 from "@/assets/curso-videos/gestacao-brasil-2.mp4.asset.json";
import gestacaoBrasil3 from "@/assets/curso-videos/gestacao-brasil-3.mp4.asset.json";
import gestacaoBrasil4 from "@/assets/curso-videos/gestacao-brasil-4.mp4.asset.json";
import gestacaoBrasil5 from "@/assets/curso-videos/gestacao-brasil-5.mp4.asset.json";
import gestacaoBrasil6 from "@/assets/curso-videos/gestacao-brasil-6.mp4.asset.json";
import gestacaoBrasil7 from "@/assets/curso-videos/gestacao-brasil-7.mp4.asset.json";
import gestacaoEua1 from "@/assets/curso-videos/gestacao-eua-1.mp4.asset.json";
import gestacaoEua2 from "@/assets/curso-videos/gestacao-eua-2.mp4.asset.json";
import gestacaoEua3 from "@/assets/curso-videos/gestacao-eua-3.mp4.asset.json";
import gestacaoEua4 from "@/assets/curso-videos/gestacao-eua-4.mp4.asset.json";
import gestacaoEua5 from "@/assets/curso-videos/gestacao-eua-5.mp4.asset.json";
import gestacaoEua6 from "@/assets/curso-videos/gestacao-eua-6.mp4.asset.json";
import gestacaoEua7 from "@/assets/curso-videos/gestacao-eua-7.mp4.asset.json";
import gestacaoEspanha1 from "@/assets/curso-videos/gestacao-espanha-1.mp4.asset.json";
import gestacaoEspanha2 from "@/assets/curso-videos/gestacao-espanha-2.mp4.asset.json";
import gestacaoEspanha3 from "@/assets/curso-videos/gestacao-espanha-3.mp4.asset.json";
import gestacaoEspanha4 from "@/assets/curso-videos/gestacao-espanha-4.mp4.asset.json";
import gestacaoEspanha5 from "@/assets/curso-videos/gestacao-espanha-5.mp4.asset.json";
import gestacaoEspanha6 from "@/assets/curso-videos/gestacao-espanha-6.mp4.asset.json";
import esteticaBrasil1 from "@/assets/curso-videos/estetica-brasil-1.mp4.asset.json";
import esteticaBrasil2 from "@/assets/curso-videos/estetica-brasil-2.mp4.asset.json";
import esteticaBrasil3 from "@/assets/curso-videos/estetica-brasil-3.mp4.asset.json";
import esteticaBrasil4 from "@/assets/curso-videos/estetica-brasil-4.mp4.asset.json";
import esteticaBrasil5 from "@/assets/curso-videos/estetica-brasil-5.mp4.asset.json";
import esteticaBrasil6 from "@/assets/curso-videos/estetica-brasil-6.mp4.asset.json";
import esteticaBrasil7 from "@/assets/curso-videos/estetica-brasil-7.mp4.asset.json";
import esteticaEua1 from "@/assets/curso-videos/estetica-eua-1.mp4.asset.json";
import esteticaEua2 from "@/assets/curso-videos/estetica-eua-2.mp4.asset.json";
import esteticaEua3 from "@/assets/curso-videos/estetica-eua-3.mp4.asset.json";
import esteticaEua4 from "@/assets/curso-videos/estetica-eua-4.mp4.asset.json";
import esteticaEua5 from "@/assets/curso-videos/estetica-eua-5.mp4.asset.json";
import esteticaEua6 from "@/assets/curso-videos/estetica-eua-6.mp4.asset.json";
import esteticaEua7 from "@/assets/curso-videos/estetica-eua-7.mp4.asset.json";
import esteticaEspanha1 from "@/assets/curso-videos/estetica-espanha-1.mp4.asset.json";
import esteticaEspanha2 from "@/assets/curso-videos/estetica-espanha-2.mp4.asset.json";
import esteticaEspanha3 from "@/assets/curso-videos/estetica-espanha-3.mp4.asset.json";
import esteticaEspanha4 from "@/assets/curso-videos/estetica-espanha-4.mp4.asset.json";
import esteticaEspanha5 from "@/assets/curso-videos/estetica-espanha-5.mp4.asset.json";
import esteticaEspanha6 from "@/assets/curso-videos/estetica-espanha-6.mp4.asset.json";

import puerperioBrasil1 from "@/assets/curso-videos/puerperio-brasil-1.mp4.asset.json";
import puerperioBrasil2 from "@/assets/curso-videos/puerperio-brasil-2.mp4.asset.json";
import puerperioBrasil3 from "@/assets/curso-videos/puerperio-brasil-3.mp4.asset.json";
import puerperioBrasil4 from "@/assets/curso-videos/puerperio-brasil-4.mp4.asset.json";
import puerperioBrasil5 from "@/assets/curso-videos/puerperio-brasil-5.mp4.asset.json";
import puerperioBrasil6 from "@/assets/curso-videos/puerperio-brasil-6.mp4.asset.json";
import puerperioBrasil7 from "@/assets/curso-videos/puerperio-brasil-7.mp4.asset.json";

import puerperioEua1 from "@/assets/curso-videos/puerperio-eua-1.mp4.asset.json";
import puerperioEua2 from "@/assets/curso-videos/puerperio-eua-2.mp4.asset.json";
import puerperioEua3 from "@/assets/curso-videos/puerperio-eua-3.mp4.asset.json";
import puerperioEua4 from "@/assets/curso-videos/puerperio-eua-4.mp4.asset.json";
import puerperioEua5 from "@/assets/curso-videos/puerperio-eua-5.mp4.asset.json";
import puerperioEua6 from "@/assets/curso-videos/puerperio-eua-6.mp4.asset.json";
import puerperioEua7 from "@/assets/curso-videos/puerperio-eua-7.mp4.asset.json";

import puerperioEspanha1 from "@/assets/curso-videos/puerperio-espanha-1.mp4.asset.json";
import puerperioEspanha2 from "@/assets/curso-videos/puerperio-espanha-2.mp4.asset.json";
import puerperioEspanha3 from "@/assets/curso-videos/puerperio-espanha-3.mp4.asset.json";
import puerperioEspanha4 from "@/assets/curso-videos/puerperio-espanha-4.mp4.asset.json";
import puerperioEspanha5 from "@/assets/curso-videos/puerperio-espanha-5.mp4.asset.json";
import puerperioEspanha6 from "@/assets/curso-videos/puerperio-espanha-6.mp4.asset.json";

import partoBrasil1 from "@/assets/curso-videos/parto-brasil-1.mp4.asset.json";
import partoBrasil2 from "@/assets/curso-videos/parto-brasil-2.mp4.asset.json";
import partoBrasil3 from "@/assets/curso-videos/parto-brasil-3.mp4.asset.json";
import partoBrasil4 from "@/assets/curso-videos/parto-brasil-4.mp4.asset.json";
import partoBrasil5 from "@/assets/curso-videos/parto-brasil-5.mp4.asset.json";
import partoBrasil6 from "@/assets/curso-videos/parto-brasil-6.mp4.asset.json";
import partoBrasil7 from "@/assets/curso-videos/parto-brasil-7.mp4.asset.json";

import partoEua1 from "@/assets/curso-videos/parto-eua-1.mp4.asset.json";
import partoEua2 from "@/assets/curso-videos/parto-eua-2.mp4.asset.json";
import partoEua3 from "@/assets/curso-videos/parto-eua-3.mp4.asset.json";
import partoEua4 from "@/assets/curso-videos/parto-eua-4.mp4.asset.json";
import partoEua5 from "@/assets/curso-videos/parto-eua-5.mp4.asset.json";
import partoEua6 from "@/assets/curso-videos/parto-eua-6.mp4.asset.json";
import partoEua7 from "@/assets/curso-videos/parto-eua-7.mp4.asset.json";

import partoEspanha1 from "@/assets/curso-videos/parto-espanha-1.mp4.asset.json";
import partoEspanha2 from "@/assets/curso-videos/parto-espanha-2.mp4.asset.json";
import partoEspanha3 from "@/assets/curso-videos/parto-espanha-3.mp4.asset.json";
import partoEspanha4 from "@/assets/curso-videos/parto-espanha-4.mp4.asset.json";
import partoEspanha5 from "@/assets/curso-videos/parto-espanha-5.mp4.asset.json";
import partoEspanha6 from "@/assets/curso-videos/parto-espanha-6.mp4.asset.json";

type BuiltinVideo = { nome: string; url: string; keywords: string[] };
const BUILTIN_VIDEOS: BuiltinVideo[] = [
  { nome: "Engravidar / Concepção", url: vidEngravidar, keywords: ["conceb", "concep", "engravid", "fertil"] },
  { nome: "Pré-natal / Gestação", url: vidPreNatal, keywords: ["gesta", "pre-natal", "pré-natal", "pre natal", "grávid", "gravid"] },
  { nome: "Exercícios na gestação", url: vidExercicios, keywords: ["exerc", "movimento", "yoga", "atividade"] },
  { nome: "Alimentação", url: vidAlimentacao, keywords: ["aliment", "nutri", "comida", "dieta"] },
  { nome: "Parto humanizado", url: vidPartoHumanizado, keywords: ["parto", "humaniz", "trabalho de parto"] },
  { nome: "Plano de parto", url: vidPlanoParto, keywords: ["plano de parto", "plano-de-parto", "plano parto"] },
  { nome: "Puerpério", url: vidPuerperio, keywords: ["puerp", "pos-parto", "pós-parto", "pos parto"] },
  { nome: "Amamentação", url: vidAmamentacao, keywords: ["amament", "leite", "peito"] },
  { nome: "Primeiros cuidados", url: vidPrimeirosCuidados, keywords: ["cuidad", "bebê", "bebe", "recem", "recém"] },
  { nome: "Sono do bebê", url: vidSonoBebe, keywords: ["sono", "dormir"] },
  { nome: "Amamentação · Janela ao amanhecer", url: amamentacao2.url, keywords: ["amament", "leite", "peito"] },
  { nome: "Amamentação · Pele a pele", url: amamentacao3.url, keywords: ["amament", "leite", "peito"] },
  { nome: "Amamentação · Momento aconchego", url: amamentacao4.url, keywords: ["amament", "leite", "peito"] },
  { nome: "Amamentação · Cadeira de balanço", url: amamentacao5.url, keywords: ["amament", "leite", "peito"] },
  { nome: "Amamentação · Bomba e ordenha", url: amamentacao6.url, keywords: ["amament", "leite", "peito", "ordenha", "bomba"] },
  { nome: "Amamentação · Pega correta", url: amamentacao7.url, keywords: ["amament", "leite", "peito", "pega"] },
  { nome: "Amamentação · Sono após mamar", url: amamentacao8.url, keywords: ["amament", "leite", "peito"] },
  { nome: "Amamentação · Manhã serena", url: amamentacao9.url, keywords: ["amament", "leite", "peito"] },
  { nome: "Amamentação · Apoio da família", url: amamentacao10.url, keywords: ["amament", "leite", "peito", "famil"] },
  { nome: "Amamentação · Consultora de lactação", url: amamentacao11.url, keywords: ["amament", "leite", "peito", "lactac", "consult"] },
  { nome: "Amamentação · Mãe africana", url: amamentacao12.url, keywords: ["amament", "leite", "peito", "africa", "negra"] },
  { nome: "Amamentação · Mãe latina", url: amamentacao13.url, keywords: ["amament", "leite", "peito", "latina", "hispan"] },
  { nome: "Amamentação · Mãe do Oriente Médio", url: amamentacao14.url, keywords: ["amament", "leite", "peito", "oriente", "arabe"] },
  { nome: "Amamentação · Mãe indiana", url: amamentacao15.url, keywords: ["amament", "leite", "peito", "india", "sari"] },
  { nome: "Amamentação · Mãe asiática", url: amamentacao16.url, keywords: ["amament", "leite", "peito", "asiat"] },
  { nome: "Amamentação · Mãe nórdica", url: amamentacao17.url, keywords: ["amament", "leite", "peito", "nordic", "loira"] },
  { nome: "Amamentação · Mãe indígena", url: amamentacao18.url, keywords: ["amament", "leite", "peito", "indigen"] },
  { nome: "Amamentação · Mãe afro-brasileira", url: amamentacao19.url, keywords: ["amament", "leite", "peito", "afro", "tranç"] },
  { nome: "Amamentação · Mãe filipina", url: amamentacao20.url, keywords: ["amament", "leite", "peito", "filipina", "tropic"] },
  { nome: "Amamentação · Mãe ruiva celta", url: amamentacao21.url, keywords: ["amament", "leite", "peito", "ruiva", "celta"] },

  { nome: "Concepção · Casal africano", url: concepcao2.url, keywords: ["conceb", "concep", "engravid", "fertil", "africa"] },
  { nome: "Concepção · Casal latino", url: concepcao3.url, keywords: ["conceb", "concep", "engravid", "fertil", "latin"] },
  { nome: "Concepção · Casal do Oriente Médio", url: concepcao4.url, keywords: ["conceb", "concep", "engravid", "fertil", "oriente"] },
  { nome: "Concepção · Casal indiano", url: concepcao5.url, keywords: ["conceb", "concep", "engravid", "fertil", "india"] },
  { nome: "Concepção · Casal asiático", url: concepcao6.url, keywords: ["conceb", "concep", "engravid", "fertil", "asiat"] },
  { nome: "Concepção · Casal nórdico", url: concepcao7.url, keywords: ["conceb", "concep", "engravid", "fertil", "nordic"] },
  { nome: "Concepção · Casal indígena", url: concepcao8.url, keywords: ["conceb", "concep", "engravid", "fertil", "indigen"] },
  { nome: "Concepção · Casal afro-brasileiro", url: concepcao9.url, keywords: ["conceb", "concep", "engravid", "fertil", "afro"] },
  { nome: "Concepção · Casal filipino", url: concepcao10.url, keywords: ["conceb", "concep", "engravid", "fertil", "filipin"] },
  { nome: "Concepção · Casal celta ruivo", url: concepcao11.url, keywords: ["conceb", "concep", "engravid", "fertil", "celta"] },
  { nome: "Concepção · Casal japonês", url: concepcao12.url, keywords: ["conceb", "concep", "engravid", "fertil", "japon"] },
  { nome: "Concepção · Casal mediterrâneo", url: concepcao13.url, keywords: ["conceb", "concep", "engravid", "fertil", "mediterr", "italian"] },
  { nome: "Concepção · Casal etíope", url: concepcao14.url, keywords: ["conceb", "concep", "engravid", "fertil", "etiop"] },
  { nome: "Concepção · Casal coreano", url: concepcao15.url, keywords: ["conceb", "concep", "engravid", "fertil", "corean"] },
  { nome: "Concepção · Casal persa", url: concepcao16.url, keywords: ["conceb", "concep", "engravid", "fertil", "persa"] },
  { nome: "Concepção · Casal mexicano", url: concepcao17.url, keywords: ["conceb", "concep", "engravid", "fertil", "mexic"] },
  { nome: "Concepção · Casal caribenho", url: concepcao18.url, keywords: ["conceb", "concep", "engravid", "fertil", "caribe"] },
  { nome: "Concepção · Casal polinésio", url: concepcao19.url, keywords: ["conceb", "concep", "engravid", "fertil", "polines"] },
  { nome: "Concepção · Casal eslavo", url: concepcao20.url, keywords: ["conceb", "concep", "engravid", "fertil", "eslav"] },
  { nome: "Concepção · Casal vietnamita", url: concepcao21.url, keywords: ["conceb", "concep", "engravid", "fertil", "vietnam"] },

  { nome: "Concepção · Casal EUA (Brooklyn)", url: concepcaoEua1.url, keywords: ["conceb", "concep", "engravid", "fertil", "eua", "americ"] },
  { nome: "Concepção · Casal EUA (cozinha)", url: concepcaoEua2.url, keywords: ["conceb", "concep", "engravid", "fertil", "eua", "americ"] },
  { nome: "Concepção · Casal EUA (parque)", url: concepcaoEua3.url, keywords: ["conceb", "concep", "engravid", "fertil", "eua", "americ"] },
  { nome: "Concepção · Casal Brasil (São Paulo)", url: concepcaoBrasil1.url, keywords: ["conceb", "concep", "engravid", "fertil", "brasil"] },
  { nome: "Concepção · Casal Brasil (Rio)", url: concepcaoBrasil2.url, keywords: ["conceb", "concep", "engravid", "fertil", "brasil", "rio"] },
  { nome: "Concepção · Casal Brasil (cozinha)", url: concepcaoBrasil3.url, keywords: ["conceb", "concep", "engravid", "fertil", "brasil"] },
  { nome: "Concepção · Casal Espanha (Madrid)", url: concepcaoEspanha1.url, keywords: ["conceb", "concep", "engravid", "fertil", "espanh", "madrid"] },
  { nome: "Concepção · Casal Espanha (Barcelona)", url: concepcaoEspanha2.url, keywords: ["conceb", "concep", "engravid", "fertil", "espanh", "barcelon"] },
  { nome: "Concepção · Casal Espanha (Valencia)", url: concepcaoEspanha3.url, keywords: ["conceb", "concep", "engravid", "fertil", "espanh", "valenc"] },

  { nome: "Gestação segura · Brasil (São Paulo)", url: gestacaoBrasil1.url, keywords: ["gesta", "gravid", "grávid", "pre-natal", "pré-natal", "brasil"] },
  { nome: "Gestação segura · Brasil (yoga Rio)", url: gestacaoBrasil2.url, keywords: ["gesta", "gravid", "grávid", "exerc", "yoga", "brasil"] },
  { nome: "Gestação segura · Brasil (ultrassom)", url: gestacaoBrasil3.url, keywords: ["gesta", "gravid", "grávid", "pre-natal", "pré-natal", "ultrasso", "brasil"] },
  { nome: "Gestação segura · Brasil (caminhada)", url: gestacaoBrasil4.url, keywords: ["gesta", "gravid", "grávid", "caminhad", "exerc", "brasil"] },
  { nome: "Gestação segura · Brasil (nutrição)", url: gestacaoBrasil5.url, keywords: ["gesta", "gravid", "grávid", "aliment", "nutri", "brasil"] },
  { nome: "Gestação segura · Brasil (casal)", url: gestacaoBrasil6.url, keywords: ["gesta", "gravid", "grávid", "casal", "famil", "brasil"] },
  { nome: "Gestação segura · Brasil (vitaminas)", url: gestacaoBrasil7.url, keywords: ["gesta", "gravid", "grávid", "vitamin", "pre-natal", "pré-natal", "brasil"] },
  { nome: "Gestação segura · EUA (Brooklyn)", url: gestacaoEua1.url, keywords: ["gesta", "gravid", "grávid", "eua", "americ"] },
  { nome: "Gestação segura · EUA (obstetra)", url: gestacaoEua2.url, keywords: ["gesta", "gravid", "grávid", "pre-natal", "pré-natal", "obstetr", "eua"] },
  { nome: "Gestação segura · EUA (yoga LA)", url: gestacaoEua3.url, keywords: ["gesta", "gravid", "grávid", "yoga", "exerc", "eua"] },
  { nome: "Gestação segura · EUA (Central Park)", url: gestacaoEua4.url, keywords: ["gesta", "gravid", "grávid", "caminhad", "exerc", "eua"] },
  { nome: "Gestação segura · EUA (nutrição)", url: gestacaoEua5.url, keywords: ["gesta", "gravid", "grávid", "aliment", "nutri", "eua"] },
  { nome: "Gestação segura · EUA (casal Seattle)", url: gestacaoEua6.url, keywords: ["gesta", "gravid", "grávid", "casal", "famil", "eua"] },
  { nome: "Gestação segura · EUA (leitura)", url: gestacaoEua7.url, keywords: ["gesta", "gravid", "grávid", "leitura", "eua"] },
  { nome: "Gestação segura · Espanha (Madrid)", url: gestacaoEspanha1.url, keywords: ["gesta", "gravid", "grávid", "espanh", "madrid"] },
  { nome: "Gestação segura · Espanha (Barcelona clínica)", url: gestacaoEspanha2.url, keywords: ["gesta", "gravid", "grávid", "pre-natal", "pré-natal", "espanh", "barcelon"] },
  { nome: "Gestação segura · Espanha (pilates)", url: gestacaoEspanha3.url, keywords: ["gesta", "gravid", "grávid", "pilates", "exerc", "espanh"] },
  { nome: "Gestação segura · Espanha (Retiro)", url: gestacaoEspanha4.url, keywords: ["gesta", "gravid", "grávid", "caminhad", "exerc", "espanh", "madrid"] },
  { nome: "Gestação segura · Espanha (mediterrânea)", url: gestacaoEspanha5.url, keywords: ["gesta", "gravid", "grávid", "aliment", "nutri", "mediterr", "espanh"] },
  { nome: "Gestação segura · Espanha (casal Barcelona)", url: gestacaoEspanha6.url, keywords: ["gesta", "gravid", "grávid", "casal", "famil", "espanh", "barcelon"] },

  { nome: "Estética gestacional · Brasil (skincare SP)", url: esteticaBrasil1.url, keywords: ["estetic", "cuidad", "skincare", "pele", "gesta", "gravid", "grávid", "brasil"] },
  { nome: "Estética gestacional · Brasil (massagem Rio)", url: esteticaBrasil2.url, keywords: ["estetic", "cuidad", "massag", "spa", "gesta", "gravid", "grávid", "brasil"] },
  { nome: "Estética gestacional · Brasil (máscara facial)", url: esteticaBrasil3.url, keywords: ["estetic", "cuidad", "facial", "mascara", "pele", "gesta", "gravid", "grávid", "brasil"] },
  { nome: "Estética gestacional · Brasil (cabelo BH)", url: esteticaBrasil4.url, keywords: ["estetic", "cuidad", "cabelo", "salao", "gesta", "gravid", "grávid", "brasil"] },
  { nome: "Estética gestacional · Brasil (óleo barriga)", url: esteticaBrasil5.url, keywords: ["estetic", "cuidad", "oleo", "estria", "barriga", "gesta", "gravid", "grávid", "brasil"] },
  { nome: "Estética gestacional · Brasil (manicure SP)", url: esteticaBrasil6.url, keywords: ["estetic", "cuidad", "manicure", "unha", "gesta", "gravid", "grávid", "brasil"] },
  { nome: "Estética gestacional · Brasil (escalda-pés)", url: esteticaBrasil7.url, keywords: ["estetic", "cuidad", "pes", "relax", "gesta", "gravid", "grávid", "brasil"] },
  { nome: "Estética gestacional · EUA (skincare Brooklyn)", url: esteticaEua1.url, keywords: ["estetic", "cuidad", "skincare", "pele", "gesta", "gravid", "grávid", "eua", "americ"] },
  { nome: "Estética gestacional · EUA (massagem LA)", url: esteticaEua2.url, keywords: ["estetic", "cuidad", "massag", "spa", "gesta", "gravid", "grávid", "eua"] },
  { nome: "Estética gestacional · EUA (estrias NYC)", url: esteticaEua3.url, keywords: ["estetic", "cuidad", "estria", "oleo", "barriga", "gesta", "gravid", "grávid", "eua"] },
  { nome: "Estética gestacional · EUA (cabelo Chicago)", url: esteticaEua4.url, keywords: ["estetic", "cuidad", "cabelo", "salao", "gesta", "gravid", "grávid", "eua"] },
  { nome: "Estética gestacional · EUA (facial Seattle)", url: esteticaEua5.url, keywords: ["estetic", "cuidad", "facial", "vapor", "pele", "gesta", "gravid", "grávid", "eua"] },
  { nome: "Estética gestacional · EUA (pedicure Austin)", url: esteticaEua6.url, keywords: ["estetic", "cuidad", "pedicure", "unha", "gesta", "gravid", "grávid", "eua"] },
  { nome: "Estética gestacional · EUA (yoga Miami)", url: esteticaEua7.url, keywords: ["estetic", "cuidad", "yoga", "automass", "gesta", "gravid", "grávid", "eua"] },
  { nome: "Estética gestacional · Espanha (skincare Madrid)", url: esteticaEspanha1.url, keywords: ["estetic", "cuidad", "skincare", "pele", "gesta", "gravid", "grávid", "espanh", "madrid"] },
  { nome: "Estética gestacional · Espanha (spa Barcelona)", url: esteticaEspanha2.url, keywords: ["estetic", "cuidad", "massag", "spa", "gesta", "gravid", "grávid", "espanh", "barcelon"] },
  { nome: "Estética gestacional · Espanha (óleo Valencia)", url: esteticaEspanha3.url, keywords: ["estetic", "cuidad", "oleo", "estria", "barriga", "gesta", "gravid", "grávid", "espanh", "valenc"] },
  { nome: "Estética gestacional · Espanha (cabelo Sevilla)", url: esteticaEspanha4.url, keywords: ["estetic", "cuidad", "cabelo", "salao", "gesta", "gravid", "grávid", "espanh", "sevilla"] },
  { nome: "Estética gestacional · Espanha (facial Madrid)", url: esteticaEspanha5.url, keywords: ["estetic", "cuidad", "facial", "mascara", "pele", "gesta", "gravid", "grávid", "espanh"] },
  { nome: "Estética gestacional · Espanha (pedicure Bilbao)", url: esteticaEspanha6.url, keywords: ["estetic", "cuidad", "pedicure", "unha", "gesta", "gravid", "grávid", "espanh", "bilbao"] },

  { nome: "Puerpério · Brasil (descanso SP)", url: puerperioBrasil1.url, keywords: ["puerp", "pos-parto", "pós-parto", "descans", "recuper", "brasil"] },
  { nome: "Puerpério · Brasil (apoio do parceiro Rio)", url: puerperioBrasil2.url, keywords: ["puerp", "pos-parto", "pós-parto", "apoio", "parceir", "brasil"] },
  { nome: "Puerpério · Brasil (amamentação BH)", url: puerperioBrasil3.url, keywords: ["puerp", "pos-parto", "pós-parto", "amament", "leite", "brasil"] },
  { nome: "Puerpério · Brasil (apoio da avó Curitiba)", url: puerperioBrasil4.url, keywords: ["puerp", "pos-parto", "pós-parto", "famil", "avo", "brasil"] },
  { nome: "Puerpério · Brasil (exercícios leves SP)", url: puerperioBrasil5.url, keywords: ["puerp", "pos-parto", "pós-parto", "exerc", "recuper", "brasil"] },
  { nome: "Puerpério · Brasil (alimentação saudável)", url: puerperioBrasil6.url, keywords: ["puerp", "pos-parto", "pós-parto", "aliment", "nutri", "brasil"] },
  { nome: "Puerpério · Brasil (banho no bebê)", url: puerperioBrasil7.url, keywords: ["puerp", "pos-parto", "pós-parto", "banho", "bebe", "bebe", "brasil"] },
  { nome: "Puerpério · EUA (descanso Brooklyn)", url: puerperioEua1.url, keywords: ["puerp", "pos-parto", "pós-parto", "descans", "recuper", "eua", "americ"] },
  { nome: "Puerpério · EUA (troca de fralda LA)", url: puerperioEua2.url, keywords: ["puerp", "pos-parto", "pós-parto", "fralda", "cuidad", "eua", "americ"] },
  { nome: "Puerpério · EUA (exercícios Seattle)", url: puerperioEua3.url, keywords: ["puerp", "pos-parto", "pós-parto", "exerc", "recuper", "eua"] },
  { nome: "Puerpério · EUA (momento em família Chicago)", url: puerperioEua4.url, keywords: ["puerp", "pos-parto", "pós-parto", "famil", "casal", "eua"] },
  { nome: "Puerpério · EUA (massagem pós-parto Austin)", url: puerperioEua5.url, keywords: ["puerp", "pos-parto", "pós-parto", "massag", "spa", "eua"] },
  { nome: "Puerpério · EUA (pediatra NYC)", url: puerperioEua6.url, keywords: ["puerp", "pos-parto", "pós-parto", "pediatr", "medico", "eua"] },
  { nome: "Puerpério · EUA (smoothie Miami)", url: puerperioEua7.url, keywords: ["puerp", "pos-parto", "pós-parto", "aliment", "nutri", "eua"] },
  { nome: "Puerpério · Espanha (descanso Madrid)", url: puerperioEspanha1.url, keywords: ["puerp", "pos-parto", "pós-parto", "descans", "recuper", "espanh", "madrid"] },
  { nome: "Puerpério · Espanha (pai com bebê Barcelona)", url: puerperioEspanha2.url, keywords: ["puerp", "pos-parto", "pós-parto", "pai", "bebe", "bebe", "espanh"] },
  { nome: "Puerpério · Espanha (amamentação Valencia)", url: puerperioEspanha3.url, keywords: ["puerp", "pos-parto", "pós-parto", "amament", "leite", "espanh"] },
  { nome: "Puerpério · Espanha (celebração Sevilha)", url: puerperioEspanha4.url, keywords: ["puerp", "pos-parto", "pós-parto", "famil", "celebr", "espanh"] },
  { nome: "Puerpério · Espanha (avo em Bilbao)", url: puerperioEspanha5.url, keywords: ["puerp", "pos-parto", "pós-parto", "avo", "famil", "espanh"] },
  { nome: "Puerpério · Espanha (caminhada Madrid)", url: puerperioEspanha6.url, keywords: ["puerp", "pos-parto", "pós-parto", "caminhad", "exerc", "espanh"] },
];

const c = {
  cream: "#FAF5EE", warm: "#F5EDE0", sage: "#5C8A6E", sageDark: "#2D5A42",
  ink: "#1C1C1A", muted: "#6B6560", border: "#E8DDD2", danger: "#B23A48", gold: "#C9A35B",
};
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";
const BUCKET = "materiais-video";

type Tema = { id: string; slug: string; titulo: string };
type VideoFile = {
  name: string;
  path: string;
  size: number;
  updated_at: string | null;
  contentType: string | null;
};

export default function MultimidiaTab() {
  const [temas, setTemas] = useState<Tema[]>([]);
  const [temaId, setTemaId] = useState<string>("__geral");
  const [files, setFiles] = useState<VideoFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    supabase
      .from("cursos")
      .select("id, slug, titulo")
      .order("titulo")
      .then(({ data }) => setTemas((data ?? []) as Tema[]));
  }, []);

  const folder = useMemo(() => {
    if (temaId === "__geral") return "geral";
    const t = temas.find((x) => x.id === temaId);
    return t?.slug ?? temaId;
  }, [temaId, temas]);

  const reload = async () => {
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(folder, { limit: 200, sortBy: { column: "updated_at", order: "desc" } });
    if (error) setErr(error.message);
    setFiles(
      (data ?? [])
        .filter((f) => f.name && !f.name.endsWith("/"))
        .map((f: any) => ({
          name: f.name,
          path: `${folder}/${f.name}`,
          size: f.metadata?.size ?? 0,
          updated_at: f.updated_at ?? f.created_at ?? null,
          contentType: f.metadata?.mimetype ?? null,
        }))
    );
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, [folder]);

  const onUpload = async (file: File) => {
    setUploading(true);
    setProgress(0);
    setErr(null);
    setMsg(null);
    const cleanName = file.name.replace(/\s+/g, "-");
    const path = `${folder}/${Date.now()}-${cleanName}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "video/mp4",
    });
    setUploading(false);
    setProgress(100);
    if (error) setErr(error.message);
    else setMsg("Vídeo enviado.");
    if (inputRef.current) inputRef.current.value = "";
    reload();
  };

  const onDownload = async (f: VideoFile) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(f.path, 60 * 10, {
      download: f.name,
    });
    if (error || !data?.signedUrl) {
      setErr(error?.message || "Erro ao gerar link de download.");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const onCopyUrl = async (f: VideoFile) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(f.path, 60 * 60 * 24);
    if (error || !data?.signedUrl) {
      setErr(error?.message || "Erro ao gerar link.");
      return;
    }
    await navigator.clipboard.writeText(data.signedUrl);
    setMsg("Link copiado (válido por 24h).");
  };

  const onCopyPath = async (f: VideoFile) => {
    await navigator.clipboard.writeText(f.path);
    setMsg("Caminho copiado.");
  };

  const onDelete = async (f: VideoFile) => {
    if (!(await appConfirm(`Remover "${f.name}"? Esta ação é permanente.`))) return;
    const { error } = await supabase.storage.from(BUCKET).remove([f.path]);
    if (error) setErr(error.message);
    else setMsg("Vídeo removido.");
    reload();
  };

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "flex-end", marginBottom: 18, padding: 14, background: c.warm, border: `1px solid ${c.border}` }}>
        <label style={selWrap}>
          <span style={selLabel}>Tema</span>
          <select value={temaId} onChange={(e) => setTemaId(e.target.value)} style={sel}>
            <option value="__geral">Geral (sem tema)</option>
            {temas.map((t) => (
              <option key={t.id} value={t.id}>{t.titulo}</option>
            ))}
          </select>
        </label>
        <div style={{ flex: 1 }} />
        <label style={btnPrimary(c.sageDark)}>
          {uploading ? `Enviando… ${progress}%` : "Enviar vídeo"}
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            style={{ display: "none" }}
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
            }}
          />
        </label>
      </div>

      <p style={{ color: c.muted, fontSize: 13, margin: "0 0 12px" }}>
        Biblioteca de vídeos para usar como capa de aula ou como vídeo principal da aula.
        Organize por tema e copie o link para colar no editor da aula.
      </p>

      {msg && <div style={banner(c.sage)}>{msg}</div>}
      {err && <div style={banner(c.danger)}>{err}</div>}

      {(() => {
        const haystack = (() => {
          if (temaId === "__geral") return "";
          const t = temas.find((x) => x.id === temaId);
          return `${t?.slug ?? ""} ${t?.titulo ?? ""}`.toLowerCase();
        })();
        const matches = temaId === "__geral"
          ? BUILTIN_VIDEOS
          : BUILTIN_VIDEOS.filter((v) => v.keywords.some((k) => haystack.includes(k)));
        const list = matches.length ? matches : BUILTIN_VIDEOS;
        const copyBuiltin = async (url: string) => {
          const full = typeof window !== "undefined" ? new URL(url, window.location.origin).toString() : url;
          await navigator.clipboard.writeText(full);
          setMsg("Link do vídeo integrado copiado.");
        };
        return (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: c.muted, marginBottom: 8, fontFamily: sans }}>
              Vídeos integrados {temaId === "__geral" ? "(biblioteca padrão)" : matches.length ? "· sugeridos para este tema" : "· biblioteca completa"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              {list.map((v) => (
                <div key={v.url} style={{ background: "white", border: `1px solid ${c.border}`, padding: 10 }}>
                  <video src={v.url} muted playsInline preload="metadata" style={{ width: "100%", height: 120, objectFit: "cover", background: "#000" }} onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play().catch(() => {})} onMouseLeave={(e) => { const el = e.currentTarget as HTMLVideoElement; el.pause(); el.currentTime = 0; }} />
                  <div style={{ fontFamily: serif, fontSize: 16, color: c.ink, marginTop: 8 }}>{v.nome}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    <button onClick={() => copyBuiltin(v.url)} style={btnSm(c.sage)}>Copiar link</button>
                    <a href={v.url} target="_blank" rel="noreferrer" style={{ ...btnSm(c.sageDark), textDecoration: "none", display: "inline-block" }}>Abrir</a>
                    <a href={v.url} download={`${v.nome.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.mp4`} style={{ ...btnSm(c.gold), textDecoration: "none", display: "inline-block" }}>Baixar</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: c.muted, marginBottom: 8, fontFamily: sans }}>
        Enviados pelo time
      </div>


      <div style={{ background: "white", border: `1px solid ${c.border}` }}>
        {loading ? (
          <div style={{ padding: 24, color: c.muted, fontFamily: sans }}>Carregando…</div>
        ) : files.length === 0 ? (
          <div style={{ padding: 24, color: c.muted, fontFamily: sans }}>
            Nenhum vídeo neste tema ainda. Envie o primeiro acima.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: sans }}>
            <thead>
              <tr style={{ background: c.cream }}>
                <Th>Arquivo</Th>
                <Th>Tamanho</Th>
                <Th>Atualizado</Th>
                <Th>Ações</Th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.path} style={{ borderTop: `1px solid ${c.border}` }}>
                  <Td>
                    <div style={{ fontFamily: serif, fontSize: 18, color: c.ink }}>{f.name}</div>
                    <div style={{ fontSize: 11, color: c.muted, marginTop: 2 }}>{f.path}</div>
                  </Td>
                  <Td>{formatSize(f.size)}</Td>
                  <Td>{f.updated_at ? new Date(f.updated_at).toLocaleString("pt-BR") : "—"}</Td>
                  <Td>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button onClick={() => onDownload(f)} style={btnSm(c.sageDark)}>Baixar</button>
                      <button onClick={() => onCopyUrl(f)} style={btnSm(c.sage)}>Copiar link</button>
                      <button onClick={() => onCopyPath(f)} style={btnSm(c.gold)}>Copiar caminho</button>
                      <button onClick={() => onDelete(f)} style={btnSm(c.danger)}>Remover</button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function formatSize(bytes: number) {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

const Th = ({ children }: any) => (
  <th style={{ textAlign: "left", padding: "12px 14px", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: c.muted, fontWeight: 500 }}>{children}</th>
);
const Td = ({ children }: any) => <td style={{ padding: "14px 14px", color: c.ink, verticalAlign: "top" }}>{children}</td>;

const selWrap: CSSProperties = { display: "flex", flexDirection: "column", gap: 4 };
const selLabel: CSSProperties = { fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: c.muted };
const sel: CSSProperties = { background: "white", border: `1px solid ${c.border}`, padding: "8px 12px", fontFamily: sans, fontSize: 13, color: c.ink, minWidth: 220 };

function btnPrimary(bg: string): CSSProperties {
  return { background: bg, color: "white", fontSize: 12, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", padding: "12px 22px", border: "none", cursor: "pointer", fontFamily: sans, display: "inline-flex", alignItems: "center", justifyContent: "center" };
}
function btnSm(bg: string): CSSProperties {
  return { background: bg, color: "white", fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", padding: "6px 12px", border: "none", cursor: "pointer", fontFamily: sans };
}
function banner(bg: string): CSSProperties {
  return { background: bg, color: "white", padding: "10px 14px", fontFamily: sans, fontSize: 13, marginBottom: 12 };
}
