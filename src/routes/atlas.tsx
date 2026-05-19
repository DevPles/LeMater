import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/atlas" as any)({
  beforeLoad: () => {
    throw redirect({ to: "/cursos" });
  },
  component: () => null,
});