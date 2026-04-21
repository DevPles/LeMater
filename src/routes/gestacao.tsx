import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";

export const Route = createFileRoute("/gestacao")({
  head: () => ({
    meta: [
      { title: "Minha Gestação por Trimestre — MãeDigital" },
      { name: "description", content: "Acompanhe mês a mês as mudanças no seu corpo durante a gestação e dicas para aliviar os sintomas." },
    ],
  }),
  component: GestacaoPage,
});

type MesInfo = {
  mes: number;
  semanas: string;
  corpo: string[];
  alivio: string[];
};

type Trimestre = {
  numero: number;
  titulo: string;
  descricao: string;
  cor: string;
  meses: MesInfo[];
};

const trimestres: Trimestre[] = [
  {
    numero: 1,
    titulo: "1º Trimestre",
    descricao: "Semanas 1 a 13 — formação e adaptação",
    cor: "bg-coral-light",
    meses: [
      {
        mes: 1,
        semanas: "Semanas 1–4",
        corpo: [
          "Atraso menstrual e possível pequeno sangramento de implantação",
          "Sensibilidade nos seios e cansaço acentuado",
          "Aumento da vontade de urinar",
        ],
        alivio: [
          "Descanse sempre que possível, durma cedo",
          "Use sutiã confortável e sem aro",
          "Beba água em pequenos goles ao longo do dia",
        ],
      },
      {
        mes: 2,
        semanas: "Semanas 5–8",
        corpo: [
          "Náuseas e vômitos, principalmente pela manhã",
          "Aversão ou desejo por certos cheiros e alimentos",
          "Mudanças de humor por causa dos hormônios",
        ],
        alivio: [
          "Coma porções pequenas a cada 2–3 horas",
          "Prefira alimentos secos ao acordar (torrada, bolacha)",
          "Evite frituras e cheiros fortes; experimente gengibre",
        ],
      },
      {
        mes: 3,
        semanas: "Semanas 9–13",
        corpo: [
          "Náuseas começam a diminuir no final do mês",
          "Constipação e azia podem aparecer",
          "Leve aumento da barriga",
        ],
        alivio: [
          "Aumente fibras: frutas, verduras e cereais integrais",
          "Faça refeições leves e evite deitar logo após comer",
          "Caminhadas curtas ajudam o intestino",
        ],
      },
    ],
  },
  {
    numero: 2,
    titulo: "2º Trimestre",
    descricao: "Semanas 14 a 27 — fase mais tranquila",
    cor: "bg-mint-light",
    meses: [
      {
        mes: 4,
        semanas: "Semanas 14–17",
        corpo: [
          "Mais energia e disposição",
          "Barriga começa a aparecer",
          "Pele e cabelos podem ficar mais bonitos",
        ],
        alivio: [
          "Aproveite para fazer exercícios leves liberados pelo médico",
          "Hidrate a pele da barriga para prevenir estrias",
          "Use roupas confortáveis e adaptadas",
        ],
      },
      {
        mes: 5,
        semanas: "Semanas 18–22",
        corpo: [
          "Primeiros movimentos do bebê (chutinhos)",
          "Possíveis dores nas costas e cãibras",
          "Inchaço leve nos pés",
        ],
        alivio: [
          "Alongue-se diariamente, especialmente as pernas",
          "Eleve as pernas ao descansar",
          "Aumente o consumo de água e alimentos com potássio (banana)",
        ],
      },
      {
        mes: 6,
        semanas: "Semanas 23–27",
        corpo: [
          "Barriga cresce mais rápido",
          "Azia, falta de ar e tontura ocasionais",
          "Pode surgir a linha nigra na barriga",
        ],
        alivio: [
          "Coma devagar e em pequenas porções",
          "Durma de lado esquerdo com travesseiro entre as pernas",
          "Levante-se devagar para evitar tontura",
        ],
      },
    ],
  },
  {
    numero: 3,
    titulo: "3º Trimestre",
    descricao: "Semanas 28 a 40 — preparando para o parto",
    cor: "bg-coral-light",
    meses: [
      {
        mes: 7,
        semanas: "Semanas 28–31",
        corpo: [
          "Cansaço volta a aumentar",
          "Falta de ar e dificuldade para dormir",
          "Movimentos do bebê bem fortes",
        ],
        alivio: [
          "Faça pausas durante o dia e descanse",
          "Use travesseiros para apoiar barriga e costas",
          "Pratique respiração profunda e relaxamento",
        ],
      },
      {
        mes: 8,
        semanas: "Semanas 32–35",
        corpo: [
          "Inchaço maior em pés e mãos",
          "Contrações de treinamento (Braxton Hicks)",
          "Pressão na bexiga e idas frequentes ao banheiro",
        ],
        alivio: [
          "Evite ficar muito tempo em pé ou sentada",
          "Reduza o sal e mantenha hidratação",
          "Procure o serviço de saúde se as contrações forem regulares e dolorosas",
        ],
      },
      {
        mes: 9,
        semanas: "Semanas 36–40",
        corpo: [
          "Bebê encaixa na pelve, alívio na respiração",
          "Cólicas, dor lombar e perda do tampão mucoso",
          "Ansiedade pelo parto",
        ],
        alivio: [
          "Prepare a mala da maternidade e o plano de parto",
          "Caminhadas leves ajudam o trabalho de parto",
          "Procure a maternidade ao sentir contrações regulares ou bolsa rota",
        ],
      },
    ],
  },
];

function GestacaoPage() {
  const [trimestreAtivo, setTrimestreAtivo] = useState(2);

  const atual = trimestres.find((t) => t.numero === trimestreAtivo)!;

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold font-display text-foreground">
          Minha Gestação
        </h1>
        <p className="text-sm text-muted-foreground">
          O que acontece no seu corpo, mês a mês
        </p>
      </motion.div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        {trimestres.map((t) => (
          <button
            key={t.numero}
            onClick={() => setTrimestreAtivo(t.numero)}
            className={`rounded-2xl p-3 text-center transition-all ${
              trimestreAtivo === t.numero
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card text-foreground hover:bg-muted"
            }`}
          >
            <p className="text-xs opacity-80">Trimestre</p>
            <p className="text-2xl font-bold font-display">{t.numero}º</p>
          </button>
        ))}
      </div>

      <motion.div
        key={atual.numero}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${atual.cor} rounded-2xl p-5 mb-5`}
      >
        <h2 className="text-xl font-bold font-display text-foreground">
          {atual.titulo}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{atual.descricao}</p>
      </motion.div>

      <div className="space-y-4">
        {atual.meses.map((mes, idx) => (
          <motion.div
            key={mes.mes}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-card rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="text-lg font-bold font-display text-foreground">
                Mês {mes.mes}
              </h3>
              <span className="text-xs text-muted-foreground">{mes.semanas}</span>
            </div>

            <div className="mb-4">
              <p className="text-sm font-semibold text-foreground mb-2">
                No seu corpo
              </p>
              <ul className="space-y-1">
                {mes.corpo.map((item) => (
                  <li
                    key={item}
                    className="text-sm text-muted-foreground pl-3 border-l-2 border-primary/40"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground mb-2">
                Como aliviar
              </p>
              <ul className="space-y-1">
                {mes.alivio.map((item) => (
                  <li
                    key={item}
                    className="text-sm text-muted-foreground pl-3 border-l-2 border-accent"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
