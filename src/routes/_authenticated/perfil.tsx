import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/perfil")({
  beforeLoad: () => {
    throw redirect({ to: "/app/perfil" });
  },
});
