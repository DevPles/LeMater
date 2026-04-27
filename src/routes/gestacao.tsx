import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { LiquidCard } from "@/components/LiquidCard";
import { useScreenContent } from "@/hooks/useScreenContent";
import { GESTACAO_DEFAULT } from "@/components/admin/TelasTab";

export const Route = createFileRoute("/gestacao")({
  head: () => ({
    meta: [
      { title: "Minha Gestação por Trimestre — MãeDigital" },
      { name: "description", content: "Acompanhe mês a mês as mudanças no seu corpo durante a gestação e dicas para aliviar os sintomas." },
    ],
  }),
  component: GestacaoPage,
});

type Item = {
  titulo: string;
  descricao: string;
};

type MesInfo = {
  mes: number;
  semanas: string;
  corpo: Item[];
  alivio: Item[];
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
          {
            titulo: "Atraso menstrual e possível sangramento de implantação",
            descricao:
              "O bebê é apenas um conjunto de células que se fixa na parede do útero. Esse processo pode causar um pequeno sangramento rosado.",
          },
          {
            titulo: "Sensibilidade nos seios e cansaço acentuado",
            descricao:
              "Os hormônios (hCG e progesterona) sobem rapidamente para sustentar a gravidez, gerando inchaço nos seios e sono intenso.",
          },
          {
            titulo: "Aumento da vontade de urinar",
            descricao:
              "O útero começa a crescer e o fluxo de sangue nos rins aumenta, fazendo a bexiga encher mais rápido.",
          },
        ],
        alivio: [
          {
            titulo: "Descanse sempre que possível, durma cedo",
            descricao:
              "O cansaço acontece porque seu corpo está construindo a placenta. Dormir bem ajuda nessa demanda extra de energia.",
          },
          {
            titulo: "Use sutiã confortável e sem aro",
            descricao:
              "Os seios estão mais sensíveis por causa do aumento dos ductos mamários. Tecidos macios reduzem o desconforto.",
          },
          {
            titulo: "Beba água em pequenos goles ao longo do dia",
            descricao:
              "Evita sobrecarregar a bexiga e mantém você hidratada para o aumento do volume sanguíneo.",
          },
        ],
      },
      {
        mes: 2,
        semanas: "Semanas 5–8",
        corpo: [
          {
            titulo: "Náuseas e vômitos, principalmente pela manhã",
            descricao:
              "O bebê já tem coração batendo e os hormônios hCG estão no pico, o que afeta o estômago e o olfato.",
          },
          {
            titulo: "Aversão ou desejo por certos cheiros e alimentos",
            descricao:
              "O olfato fica mais sensível como uma proteção natural contra alimentos que poderiam fazer mal ao bebê.",
          },
          {
            titulo: "Mudanças de humor por causa dos hormônios",
            descricao:
              "Estrogênio e progesterona oscilam muito, afetando neurotransmissores ligados ao humor.",
          },
        ],
        alivio: [
          {
            titulo: "Coma porções pequenas a cada 2–3 horas",
            descricao:
              "O estômago vazio piora a náusea, pois o ácido fica sem alimento para digerir.",
          },
          {
            titulo: "Prefira alimentos secos ao acordar",
            descricao:
              "Torradas e bolachas absorvem o ácido produzido durante a noite, reduzindo o enjoo matinal.",
          },
          {
            titulo: "Evite frituras e cheiros fortes; experimente gengibre",
            descricao:
              "Gorduras pesam na digestão e cheiros fortes ativam o reflexo de náusea. O gengibre tem ação comprovada contra enjoo.",
          },
        ],
      },
      {
        mes: 3,
        semanas: "Semanas 9–13",
        corpo: [
          {
            titulo: "Náuseas começam a diminuir no final do mês",
            descricao:
              "A placenta assume a produção hormonal e os níveis de hCG caem, aliviando o estômago.",
          },
          {
            titulo: "Constipação e azia podem aparecer",
            descricao:
              "A progesterona relaxa a musculatura do intestino, deixando a digestão mais lenta. O bebê já tem todos os órgãos formados.",
          },
          {
            titulo: "Leve aumento da barriga",
            descricao:
              "O útero sai da pelve e começa a aparecer no abdômen. O bebê mede cerca de 7 cm.",
          },
        ],
        alivio: [
          {
            titulo: "Aumente fibras: frutas, verduras e cereais integrais",
            descricao:
              "As fibras aceleram o trânsito intestinal, compensando a lentidão causada pela progesterona.",
          },
          {
            titulo: "Faça refeições leves e evite deitar logo após comer",
            descricao:
              "A válvula entre estômago e esôfago fica relaxada; deitar facilita o refluxo (azia).",
          },
          {
            titulo: "Caminhadas curtas ajudam o intestino",
            descricao:
              "O movimento estimula o peristaltismo e melhora a circulação, prevenindo varizes.",
          },
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
          {
            titulo: "Mais energia e disposição",
            descricao:
              "O hCG diminui e o corpo já se adaptou. O bebê mede cerca de 13 cm e mexe bastante (ainda imperceptível).",
          },
          {
            titulo: "Barriga começa a aparecer",
            descricao:
              "O útero cresce acima do osso púbico e o bebê está desenvolvendo músculos e cabelo.",
          },
          {
            titulo: "Pele e cabelos podem ficar mais bonitos",
            descricao:
              "O estrogênio aumenta a circulação na pele e prolonga a fase de crescimento dos fios.",
          },
        ],
        alivio: [
          {
            titulo: "Aproveite para fazer exercícios leves liberados pelo médico",
            descricao:
              "Esta é a fase mais segura e confortável para se movimentar, fortalecendo o corpo para o terceiro trimestre.",
          },
          {
            titulo: "Hidrate a pele da barriga para prevenir estrias",
            descricao:
              "A pele estica rápido conforme o útero cresce; manter a elasticidade reduz o risco de rasgos nas fibras.",
          },
          {
            titulo: "Use roupas confortáveis e adaptadas",
            descricao:
              "Roupas apertadas comprimem o útero e podem dificultar a circulação do sangue para o bebê.",
          },
        ],
      },
      {
        mes: 5,
        semanas: "Semanas 18–22",
        corpo: [
          {
            titulo: "Primeiros movimentos do bebê (chutinhos)",
            descricao:
              "O bebê já tem cerca de 25 cm e força muscular suficiente para que você sinta os movimentos.",
          },
          {
            titulo: "Possíveis dores nas costas e cãibras",
            descricao:
              "O peso do útero altera sua postura. As cãibras vêm da maior demanda de cálcio e magnésio pelo bebê.",
          },
          {
            titulo: "Inchaço leve nos pés",
            descricao:
              "O volume de sangue aumenta cerca de 50% e o útero pressiona as veias das pernas.",
          },
        ],
        alivio: [
          {
            titulo: "Alongue-se diariamente, especialmente as pernas",
            descricao:
              "Alongar relaxa os músculos sobrecarregados pela mudança de postura e previne cãibras noturnas.",
          },
          {
            titulo: "Eleve as pernas ao descansar",
            descricao:
              "Facilita o retorno do sangue ao coração, reduzindo o inchaço causado pela pressão do útero.",
          },
          {
            titulo: "Aumente água e alimentos com potássio (banana)",
            descricao:
              "O potássio equilibra a contração muscular e a água ajuda os rins a eliminar o excesso de líquido.",
          },
        ],
      },
      {
        mes: 6,
        semanas: "Semanas 23–27",
        corpo: [
          {
            titulo: "Barriga cresce mais rápido",
            descricao:
              "O bebê está ganhando peso e gordura, preparando-se para a vida fora do útero. Já mede cerca de 35 cm.",
          },
          {
            titulo: "Azia, falta de ar e tontura ocasionais",
            descricao:
              "O útero empurra o estômago e o diafragma para cima. A pressão arterial cai um pouco nesta fase.",
          },
          {
            titulo: "Pode surgir a linha nigra na barriga",
            descricao:
              "Os hormônios da gravidez aumentam a melanina, escurecendo a linha do umbigo até o púbis.",
          },
        ],
        alivio: [
          {
            titulo: "Coma devagar e em pequenas porções",
            descricao:
              "Como o estômago tem menos espaço, refeições menores evitam refluxo e desconforto.",
          },
          {
            titulo: "Durma de lado esquerdo com travesseiro entre as pernas",
            descricao:
              "Essa posição melhora o fluxo de sangue para a placenta e alivia a coluna.",
          },
          {
            titulo: "Levante-se devagar para evitar tontura",
            descricao:
              "A pressão baixa faz o sangue demorar mais para chegar ao cérebro quando você se move rápido.",
          },
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
          {
            titulo: "Cansaço volta a aumentar",
            descricao:
              "O bebê está crescendo rápido (já tem cerca de 40 cm) e seu corpo gasta muita energia para sustentá-lo.",
          },
          {
            titulo: "Falta de ar e dificuldade para dormir",
            descricao:
              "O útero comprime o diafragma e a barriga dificulta encontrar uma posição confortável.",
          },
          {
            titulo: "Movimentos do bebê bem fortes",
            descricao:
              "Ele tem força e ainda espaço razoável para se mexer, chutar e dar cambalhotas.",
          },
        ],
        alivio: [
          {
            titulo: "Faça pausas durante o dia e descanse",
            descricao:
              "O coração está bombeando para dois; pausas evitam sobrecarga e quedas de pressão.",
          },
          {
            titulo: "Use travesseiros para apoiar barriga e costas",
            descricao:
              "Apoiar o peso do útero alivia ligamentos e nervos pressionados, melhorando o sono.",
          },
          {
            titulo: "Pratique respiração profunda e relaxamento",
            descricao:
              "Aumenta a oxigenação do bebê e treina a respiração que será usada no parto.",
          },
        ],
      },
      {
        mes: 8,
        semanas: "Semanas 32–35",
        corpo: [
          {
            titulo: "Inchaço maior em pés e mãos",
            descricao:
              "O volume sanguíneo está no auge e o útero pesado dificulta o retorno do sangue das pernas.",
          },
          {
            titulo: "Contrações de treinamento (Braxton Hicks)",
            descricao:
              "O útero pratica para o parto. São indolores e irregulares, diferentes do trabalho de parto real.",
          },
          {
            titulo: "Pressão na bexiga e idas frequentes ao banheiro",
            descricao:
              "O bebê começa a se posicionar para baixo, comprimindo a bexiga.",
          },
        ],
        alivio: [
          {
            titulo: "Evite ficar muito tempo em pé ou sentada",
            descricao:
              "Mudar de posição estimula a circulação e impede o acúmulo de líquido nas extremidades.",
          },
          {
            titulo: "Reduza o sal e mantenha hidratação",
            descricao:
              "O sódio retém líquidos. Beber água, paradoxalmente, ajuda os rins a eliminar o excesso.",
          },
          {
            titulo: "Procure o serviço de saúde se as contrações forem regulares e dolorosas",
            descricao:
              "Pode ser sinal de trabalho de parto prematuro, que precisa de avaliação rápida.",
          },
        ],
      },
      {
        mes: 9,
        semanas: "Semanas 36–40",
        corpo: [
          {
            titulo: "Bebê encaixa na pelve, alívio na respiração",
            descricao:
              "A cabeça desce, liberando espaço sob o diafragma. O bebê está pronto para nascer (cerca de 50 cm).",
          },
          {
            titulo: "Cólicas, dor lombar e perda do tampão mucoso",
            descricao:
              "O colo do útero amolece e começa a se abrir, soltando o tampão de muco que o protegia.",
          },
          {
            titulo: "Ansiedade pelo parto",
            descricao:
              "É natural — o corpo libera hormônios de alerta para prepará-la fisicamente e emocionalmente.",
          },
        ],
        alivio: [
          {
            titulo: "Prepare a mala da maternidade e o plano de parto",
            descricao:
              "Reduz a ansiedade e garante que tudo esteja pronto quando o trabalho de parto começar.",
          },
          {
            titulo: "Caminhadas leves ajudam o trabalho de parto",
            descricao:
              "A gravidade auxilia a cabeça do bebê a pressionar o colo, favorecendo a dilatação.",
          },
          {
            titulo: "Procure a maternidade ao sentir contrações regulares ou bolsa rota",
            descricao:
              "Contrações a cada 5 minutos por 1 hora ou perda de líquido indicam que o parto está próximo.",
          },
        ],
      },
    ],
  },
];

function GestacaoPage() {
  const [trimestreAtivo, setTrimestreAtivo] = useState(2);

  const atual = trimestres.find((t) => t.numero === trimestreAtivo)!;
  const { content } = useScreenContent("gestacao", GESTACAO_DEFAULT);

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold font-display text-foreground">
          {content.pageTitle}
        </h1>
        <p className="text-sm text-muted-foreground">
          {content.pageSubtitle}
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
          >
            <LiquidCard className="p-5">
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
            </LiquidCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
