import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/alertas")({
  beforeLoad: () => {
    throw redirect({ to: "/app/alertas" });
  },
});
