import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/videochamada")({
  beforeLoad: () => {
    throw redirect({ to: "/app/videochamada" });
  },
});
