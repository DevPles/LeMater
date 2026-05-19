import { Navigate, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/reset-password")({
  component: () => <Navigate to="/app/reset-password" replace />,
});
