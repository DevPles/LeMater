import { createFileRoute } from "@tanstack/react-router";
import { AtlasGratuitoPage } from "@/components/AtlasGratuitoPage";

export const Route = createFileRoute("/atlas-materno/concepcao")({
  head: () => ({
    meta: [
      { title: "Guia gratuito: 7 sinais da janela fértil · Le Mater" },
      { name: "description", content: "Entenda seu ciclo, sua janela fértil e os sinais reais do corpo antes de depender só de aplicativos." },
    ],
    links: [{ rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@300;400;500&display=swap" }],
  }),
  component: () => (
    <AtlasGratuitoPage
      categoria="Concepção"
      slug="concepcao"
      titulo="Guia gratuito: 7 sinais de que você pode estar errando sua janela fértil"
      intro={[
        "A maior parte das mulheres que tenta engravidar confia apenas em aplicativos de calendário. Esses apps fazem estimativas, não leem o seu corpo. Quando o ciclo é irregular, a janela fértil sai do lugar — e a tentativa vira um ciclo de frustração que pode ser evitado.",
        "Este guia foi construído por uma Enfermeira Obstetra e reúne os sinais clínicos que o próprio corpo dá quando está se aproximando da ovulação. São observações simples, gratuitas, que você pode começar a fazer hoje.",
      ]}
      aprendizados={[
        "Como reconhecer alterações no muco cervical ao longo do ciclo",
        "O que a temperatura basal realmente indica (e o que ela não indica)",
        "Sinais corporais sutis que costumam passar despercebidos",
        "Por que apps de calendário podem atrasar uma gestação planejada",
        "Quando vale a pena procurar avaliação especializada",
      ]}
      programa={{
        titulo: "Ajuda na Concepção Le Mater",
        descricao: "Acompanhamento estruturado para quem está planejando engravidar: saúde pré-concepcional, ciclo, preparo do corpo e orientação clínica.",
        rota: "/programas/concepcao",
      }}
    />
  ),
});
