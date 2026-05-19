import { createFileRoute } from "@tanstack/react-router";
import { AtlasFase } from "./-atlas-fase";

export const Route = createFileRoute("/_authenticated/app/atlas-materno/concepcao")({
  component: () => (
    <AtlasFase
      screenKey="atlas-concepcao"
      titulo="Antes de engravidar"
      topicos={[
        { titulo: "Pré-concepcional", texto: "Consultas, ácido fólico e revisão de medicamentos." },
        { titulo: "Vacinas em dia", texto: "Hepatite B, tríplice viral e dTpa antes de tentar engravidar." },
        { titulo: "Ciclo fértil", texto: "Aprenda a identificar o período fértil e sinais do corpo." },
      ]}
    />
  ),
});
