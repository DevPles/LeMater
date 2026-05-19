import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/cartao")({
  beforeLoad: () => {
    throw redirect({ to: "/app/cartao" });
  },
});
