import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/cartao")({
  beforeLoad: () => {
    throw redirect({ to: "/app/cartao" });
  },
});
