import { createFileRoute } from "@tanstack/react-router";
import { AtlasFase } from "./-atlas-fase";

export const Route = createFileRoute("/_authenticated/app/atlas-materno/pos-parto")({
  component: () => (
    <AtlasFase
      screenKey="atlas-pos-parto"
      titulo="Puerpério"
      topicos={[
        { titulo: "Recuperação física", texto: "Loquiação, pontos e retorno gradual às atividades." },
        { titulo: "Saúde mental", texto: "Baby blues, sinais de depressão pós-parto e rede de apoio." },
        { titulo: "Consulta de revisão", texto: "30 a 45 dias após o parto — não pule essa avaliação." },
      ]}
    />
  ),
});
