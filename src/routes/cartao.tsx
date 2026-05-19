import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/cartao")({
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/app/cartao", search });
  },
});
