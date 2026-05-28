import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app_/videos")({
  beforeLoad: () => {
    throw redirect({ to: "/atlas" });
  },
  component: () => null,
});
