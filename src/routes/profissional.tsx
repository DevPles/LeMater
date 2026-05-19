import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/profissional")({
  beforeLoad: () => {
    throw redirect({ to: "/app/profissional" });
  },
});
