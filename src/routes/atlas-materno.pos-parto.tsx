import { createFileRoute } from "@tanstack/react-router";
import { AtlasGratuitoPage } from "@/components/AtlasGratuitoPage";

export const Route = createFileRoute("/atlas-materno/pos-parto")({
  head: () => ({
    meta: [
      { title: "Checklist gratuito: cuidados essenciais no puerpério · Le Mater" },
      { name: "description", content: "Cuide da recuperação, da saúde emocional e dos sinais importantes no pós-parto." },
    ],
    links: [{ rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@300;400;500&display=swap" }],
  }),
  component: () => (
    <AtlasGratuitoPage
      categoria="Puerpério"
      slug="pos-parto"
      titulo="Checklist gratuito: cuidados essenciais no puerpério"
      intro={[
        "O puerpério é a fase mais silenciada da maternidade. O foco vai todo para o bebê, e a mulher que acabou de parir fica orientada apenas com frases soltas e conselhos contraditórios.",
        "Este checklist foi feito para devolver organização ao seu pós-parto: o que observar no corpo, o que faz parte do esperado, o que merece atenção, e como cuidar da saúde emocional desde os primeiros dias.",
      ]}
      aprendizados={[
        "Sinais físicos esperados na recuperação pós-parto",
        "Quando uma alteração precisa ser reavaliada",
        "Cuidados práticos com mamas, períneo e cesárea",
        "Como reconhecer sinais de sobrecarga emocional",
        "Pequenas rotinas que protegem a saúde mental materna",
      ]}
      programa={{
        titulo: "Pós-Parto Le Mater",
        descricao: "Acompanhamento estruturado do puerpério, recuperação física, saúde emocional e adaptação à maternidade.",
        rota: "/programas/pos-parto",
      }}
    />
  ),
});
