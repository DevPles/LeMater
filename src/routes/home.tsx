import { Navigate, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/home")({
  component: () => <Navigate to="/app/home" replace />,
});
