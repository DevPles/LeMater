import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/conteudos-gratis")({
  beforeLoad: () => {
    throw redirect({ to: "/cursos" });
  },
  component: () => null,
});
