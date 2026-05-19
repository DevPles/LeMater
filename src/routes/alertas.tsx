import { Navigate, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/alertas")({
  component: () => <Navigate to="/app/alertas" replace />,
});
