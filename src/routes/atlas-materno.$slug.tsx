import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/atlas-materno/$slug")({
  beforeLoad: () => {
    throw redirect({ to: "/cursos" });
  },
  component: () => null,
});