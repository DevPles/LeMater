import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/atlas")({
  beforeLoad: () => {
    throw redirect({ to: "/cursos" });
  },
  component: () => null,
});