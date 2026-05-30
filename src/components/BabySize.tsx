import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LiquidCard } from "@/components/LiquidCard";

const babySizes: Record<number, { size: string; name: string }> = {
  8: { size: "1,6 cm", name: "Uva" },
  12: { size: "5,4 cm", name: "Limão" },
  16: { size: "11,6 cm", name: "Pêra" },
  20: { size: "16,4 cm", name: "Banana" },
  24: { size: "30 cm", name: "Espiga" },
  28: { size: "37,6 cm", name: "Berinjela" },
  32: { size: "42,4 cm", name: "Coco" },
  36: { size: "47,4 cm", name: "Melão" },
  40: { size: "51,2 cm", name: "Melancia" },
};

type Dica = { titulo: string; texto: string };

const dicasPorSemana: { ate: number; categoria: string; dicas: Dica[] }[] = [
  {
    ate: 10,
    categoria: "Primeiras semanas",
    dicas: [
      { titulo: "Coraçãozinho batendo", texto: "Por dentro, o coração do seu bebê já bate forte e rápido — quase o dobro do seu. Cada batida é uma promessa de vida nova chegando." },
      { titulo: "Pequeno como um grão", texto: "Ele ainda é minúsculo, mas já tem o esboço dos olhinhos, das mãozinhas e dos pezinhos. Tudo começa agora." },
      { titulo: "Cuide de você", texto: "Beba bastante água, descanse e tome o ácido fólico todos os dias. Você está construindo um universo dentro de si." },
    ],
  },
  {
    ate: 14,
    categoria: "Final do 1º trimestre",
    dicas: [
      { titulo: "Carinhas e caretas", texto: "Seu bebê já faz pequenas expressões! Boceja, franze a testa e até chupa o dedinho de vez em quando." },
      { titulo: "Enjoo passando", texto: "Se os enjoos foram fortes, eles tendem a aliviar agora. Aproveite para comer com mais calma e variedade." },
      { titulo: "Converse com ele", texto: "Mesmo pequeno, ele já começa a sentir vibrações. Cantar baixinho ou conversar fortalece o vínculo desde já." },
    ],
  },
  {
    ate: 20,
    categoria: "Início do 2º trimestre",
    dicas: [
      { titulo: "Primeiros mexidos", texto: "Em breve você vai sentir aquelas borboletinhas — são os primeiros chutinhos. Um momento que ninguém esquece." },
      { titulo: "Ele já te escuta", texto: "A audição se desenvolveu! Sua voz é o som mais bonito do mundo para ele. Leia, cante, conte histórias." },
      { titulo: "Hidrate a barriga", texto: "Use óleo ou hidratante na barriga, seios e quadris. Ajuda a pele a acompanhar o crescimento e alivia coceiras." },
    ],
  },
  {
    ate: 27,
    categoria: "2º trimestre",
    dicas: [
      { titulo: "Ele dorme e acorda", texto: "Seu bebê já tem ciclos de sono e vigília. Quando você descansa, ele costuma acordar e dançar lá dentro." },
      { titulo: "Hora do morfológico", texto: "Esse é o exame em que você pode descobrir o sexo (se ainda não souber) e ver cada detalhe do desenvolvimento." },
      { titulo: "Caminhadas leves", texto: "Movimentar o corpo melhora o sono, o humor e prepara o físico para o parto. Sempre no seu ritmo." },
    ],
  },
  {
    ate: 31,
    categoria: "Início do 3º trimestre",
    dicas: [
      { titulo: "Ganhando peso", texto: "Agora ele engorda rapidinho, criando aquelas dobrinhas fofas. A pele vai ficando rosada e lisinha." },
      { titulo: "Enxoval em mente", texto: "Comece a separar bodies, fraldas RN e PP, mantas e produtos de higiene. Lave tudo com sabão neutro." },
      { titulo: "Curso de gestantes", texto: "Vale muito a pena participar de um curso de preparação para o parto e amamentação — sozinha ou com seu acompanhante." },
    ],
  },
  {
    ate: 34,
    categoria: "3º trimestre",
    dicas: [
      { titulo: "Posição de cabeça pra baixo", texto: "Muitos bebês já estão se virando para a posição de parto. Você pode sentir mais pressão lá embaixo." },
      { titulo: "Mala da maternidade", texto: "É hora de começar a montar a mala. Deixe pronta perto da porta — o bebê pode decidir vir antes do esperado." },
      { titulo: "Plano de parto", texto: "Converse com seu médico sobre suas preferências: ambiente, acompanhante, alívio da dor, contato pele a pele." },
    ],
  },
  {
    ate: 37,
    categoria: "Reta final",
    dicas: [
      { titulo: "Quase pronto!", texto: "Os pulmõezinhos estão amadurecendo. A partir da semana 37 ele já é considerado a termo — pode nascer a qualquer momento." },
      { titulo: "Mala pronta na porta", texto: "Sua mala, a do bebê e os documentos (RG, cartão do pré-natal, exames) precisam estar acessíveis. Avise quem vai te levar." },
      { titulo: "Sinais de trabalho de parto", texto: "Fique atenta a contrações regulares, perda do tampão mucoso e ruptura da bolsa. Na dúvida, ligue para a maternidade." },
    ],
  },
  {
    ate: 99,
    categoria: "Pronta para conhecê-lo",
    dicas: [
      { titulo: "A qualquer momento", texto: "O bebê pode chegar a qualquer dia agora. Respire fundo, descanse e mantenha o celular sempre carregado." },
      { titulo: "O que levar pra você", texto: "Camisolas com abertura na frente, sutiãs de amamentação, calcinhas descartáveis, absorventes pós-parto, chinelo, escova de dente, hidratante labial e carregador de celular." },
      { titulo: "O que levar pro bebê", texto: "Bodies e macacões RN e P, fraldas RN, mantinha, toalha com capuz, lenços umedecidos, manta para a saída e a roupinha especial do primeiro dia." },
      { titulo: "Documentos essenciais", texto: "RG, CPF, cartão do plano (se tiver), cartão da gestante com todos os exames e o plano de parto, se você fez um." },
      { titulo: "Respira, mamãe", texto: "Seu corpo sabe o que fazer. Confie nele, em você e na equipe que vai te acolher. Logo você terá seu bebê nos braços." },
    ],
  },
];

function getClosestSize(week: number) {
  const keys = Object.keys(babySizes).map(Number).sort((a, b) => a - b);
  const closest = keys.reduce((prev, curr) =>
    Math.abs(curr - week) < Math.abs(prev - week) ? curr : prev
  );
  return babySizes[closest];
}

function getDicas(week: number) {
  return dicasPorSemana.find((d) => week <= d.ate) ?? dicasPorSemana[0];
}

export function BabySize({ week }: { week: number }) {
  const size = getClosestSize(week);
  const [aberto, setAberto] = useState(false);
  const grupo = getDicas(week);

  return (
    <>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="w-full text-left focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-2xl"
          aria-label="Ver dicas do bebê"
        >
          <LiquidCard className="p-5" bgOpacity={0.28}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-accent-foreground font-medium">Tamanho do bebê</p>
              <span className="text-[10px] uppercase tracking-wider font-bold text-primary">Toque para dicas</span>
            </div>
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center border"
                style={{
                  background:
                    "linear-gradient(180deg, oklch(1 0 0 / 0.7) 0%, oklch(0.92 0.05 25 / 0.35) 100%)",
                  borderColor: "oklch(1 0 0 / 0.7)",
                  WebkitBackdropFilter: "blur(12px) saturate(160%)",
                  backdropFilter: "blur(12px) saturate(160%)",
                  boxShadow:
                    "inset 0 1px 0 0 oklch(1 0 0 / 0.9), inset 0 -1px 0 0 oklch(1 0 0 / 0.2)",
                }}
              >
                <span className="text-lg font-bold text-accent-foreground font-display">{size.name.charAt(0)}</span>
              </div>
              <div>
                <p className="text-lg font-bold font-display text-foreground">{size.size}</p>
                <p className="text-xs text-muted-foreground">comprimento aproximado ({size.name})</p>
              </div>
            </div>
          </LiquidCard>
        </button>
      </motion.div>

      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-0 md:p-4 pb-28 md:pb-4"
            onClick={() => setAberto(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 260 }}
              className="bg-card w-full md:max-w-md rounded-3xl md:rounded-3xl max-h-[75vh] overflow-y-auto border border-border shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-card border-b border-border p-4 flex items-start justify-between gap-3 z-10">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-primary">Semana {week} • {grupo.categoria}</p>
                  <h3 className="font-display font-bold text-lg text-foreground leading-tight">
                    Seu bebê é do tamanho de uma {size.name.toLowerCase()}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{size.size} de comprimento aproximado</p>
                </div>
                <button
                  onClick={() => setAberto(false)}
                  aria-label="Fechar"
                  className="w-8 h-8 rounded-full bg-muted text-foreground text-base font-bold leading-none flex items-center justify-center hover:bg-muted/70 shrink-0"
                >
                  ×
                </button>
              </div>

              <div className="p-4 space-y-3">
                {grupo.dicas.map((d, i) => {
                  const tints = [
                    "oklch(0.88 0.07 25)",   // soft rose
                    "oklch(0.90 0.08 70)",   // warm peach/gold
                    "oklch(0.90 0.06 160)",  // mint
                    "oklch(0.88 0.07 250)",  // soft sky
                    "oklch(0.88 0.08 320)",  // lavender
                  ];
                  const tint = tints[i % tints.length];
                  return (
                    <motion.div
                      key={d.titulo}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <LiquidCard className="p-4" bgOpacity={0.32} tint={tint}>
                        <p className="font-display font-bold text-sm text-foreground mb-1">{d.titulo}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{d.texto}</p>
                      </LiquidCard>
                    </motion.div>
                  );
                })}

                {week >= 32 && (
                  <LiquidCard className="p-4" bgOpacity={0.32} tint="oklch(0.90 0.09 85)">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-primary mb-1">Lembrete carinhoso</p>
                    <p className="text-xs text-foreground leading-relaxed">
                      Quanto mais perto da reta final, mais importante é deixar tudo organizado. Mala pronta, contatos da maternidade salvos e seu acompanhante avisado. Você está quase lá. 💛
                    </p>
                  </LiquidCard>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
