import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/profissional")({
  beforeLoad: () => {
    throw redirect({ to: "/app/profissional" });
  },
});
