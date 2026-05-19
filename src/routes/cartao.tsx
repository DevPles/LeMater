import { Navigate, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/cartao")({
  component: () => <Navigate to="/app/cartao" replace />,
});
