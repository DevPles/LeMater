import { Navigate, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/profissional")({
  component: () => <Navigate to="/app/profissional" replace />,
});
