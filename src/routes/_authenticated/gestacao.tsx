import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/gestacao")({
  beforeLoad: () => {
    throw redirect({ to: "/app/gestacao" });
  },
});
