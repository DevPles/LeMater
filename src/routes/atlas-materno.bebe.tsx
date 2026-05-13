import { createFileRoute } from "@tanstack/react-router";
import { AtlasGratuitoPage } from "@/components/AtlasGratuitoPage";

export const Route = createFileRoute("/atlas-materno/bebe")({
  head: () => ({
    meta: [
      { title: "Guia gratuito: primeiros cuidados com o recém-nascido · Le Mater" },
      { name: "description", content: "Banho, amamentação, sono, cólica e rotina nos primeiros dias com o bebê em casa." },
    ],
    links: [{ rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@300;400;500&display=swap" }],
  }),
  component: () => (
    <AtlasGratuitoPage
      categoria="Bebê e primeiros cuidados"
      slug="bebe"
      titulo="Guia gratuito: primeiros cuidados com o recém-nascido"
      intro={[
        "Ninguém ensina o que fazer nos primeiros dias com o bebê em casa. Banho, coto umbilical, cólica, sono curto, mamada que não engata — tudo aparece junto, e quase sempre à noite.",
        "Este guia reúne, em linguagem simples, o que uma Enfermeira Obstetra orientaria nos primeiros dias. É feito para reduzir a insegurança e te ajudar a observar seu bebê com mais clareza.",
      ]}
      aprendizados={[
        "Como organizar o banho, troca e cuidados com o coto umbilical",
        "Sinais de pega correta na amamentação",
        "O que costuma ser cólica e o que costuma ser fome",
        "Padrões comuns de sono nas primeiras semanas",
        "Quando procurar avaliação pediátrica sem hesitar",
      ]}
      programa={{
        titulo: "Bebê e Primeiros Cuidados Le Mater",
        descricao: "Orientação prática sobre banho, amamentação, sono, cólicas e rotina dos primeiros cuidados neonatais.",
        rota: "/programas/bebe-primeiros-cuidados",
      }}
    />
  ),
});
