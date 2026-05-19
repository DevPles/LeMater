import { createFileRoute } from "@tanstack/react-router";
import { AtlasFase } from "./-atlas-fase";

export const Route = createFileRoute("/_authenticated/app/atlas-materno/bebe")({
  component: () => (
    <AtlasFase
      screenKey="atlas-bebe"
      titulo="Primeiros meses do bebê"
      topicos={[
        { titulo: "Amamentação", texto: "Pega correta, livre demanda e cuidados com mamilo." },
        { titulo: "Sono do recém-nascido", texto: "Cochilos curtos, posição segura e rotina gradual." },
        { titulo: "Cólicas e refluxo", texto: "Como aliviar e quando procurar o pediatra." },
      ]}
    />
  ),
});
