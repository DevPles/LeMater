import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/gestacao")({
  beforeLoad: () => {
    throw redirect({ to: "/app/gestacao" });
  },
});
