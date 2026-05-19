import { createFileRoute } from "@tanstack/react-router";
import { AtlasFase } from "./-atlas-fase";

export const Route = createFileRoute("/_authenticated/app/atlas-materno/gestacao")({
  component: () => (
    <AtlasFase
      screenKey="atlas-gestacao"
      titulo="Durante a gestação"
      topicos={[
        { titulo: "1º trimestre", texto: "Confirmação, primeiros exames e adaptação do corpo." },
        { titulo: "2º trimestre", texto: "Morfológico, primeiros movimentos do bebê e mais disposição." },
        { titulo: "3º trimestre", texto: "Preparação para o parto, plano de parto e mala da maternidade." },
      ]}
    />
  ),
});
