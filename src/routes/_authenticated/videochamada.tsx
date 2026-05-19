import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/videochamada")({
  beforeLoad: () => {
    throw redirect({ to: "/app/videochamada" });
  },
});
