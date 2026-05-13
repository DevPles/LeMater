import { createFileRoute } from "@tanstack/react-router";
import { AtlasGratuitoPage } from "@/components/AtlasGratuitoPage";

export const Route = createFileRoute("/atlas-materno/gestacao")({
  head: () => ({
    meta: [
      { title: "Mapa gratuito: primeiros passos depois do positivo · Le Mater" },
      { name: "description", content: "Organize os primeiros passos da gestação, exames, consultas e sinais importantes de acompanhamento." },
    ],
    links: [{ rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@300;400;500&display=swap" }],
  }),
  component: () => (
    <AtlasGratuitoPage
      categoria="Gestação"
      slug="gestacao"
      titulo="Mapa gratuito: primeiros passos depois do positivo"
      intro={[
        "O positivo chega e, junto com ele, uma enxurrada de informações desencontradas. Qual exame fazer primeiro? Quando marcar a primeira consulta? O que é normal sentir nas primeiras semanas?",
        "Este mapa organiza, semana a semana, o que esperar do começo da gestação e o que merece atenção. Ele não substitui o acompanhamento profissional — ele te ajuda a chegar mais preparada nele.",
      ]}
      aprendizados={[
        "O que confirmar nos primeiros 15 dias após o positivo",
        "Exames de primeiro trimestre e por que cada um existe",
        "Sinais comuns versus sinais que pedem avaliação rápida",
        "Como organizar o cartão da gestante desde o início",
        "Hábitos que apoiam o desenvolvimento saudável do bebê",
      ]}
      programa={{
        titulo: "Programa Gestação Le Mater",
        descricao: "Acompanhamento completo trimestre a trimestre, com pré-natal orientado, leitura de exames e preparação para o parto.",
        rota: "/programas/gestacao",
      }}
    />
  ),
});
