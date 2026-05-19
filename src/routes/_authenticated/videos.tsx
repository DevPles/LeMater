import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/videos")({
  beforeLoad: () => {
    throw redirect({ to: "/app/videos" });
  },
});
