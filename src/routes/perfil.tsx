import { Navigate, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/perfil")({
  component: () => <Navigate to="/app/perfil" replace />,
});
