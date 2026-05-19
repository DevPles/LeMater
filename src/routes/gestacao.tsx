import { Navigate, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/gestacao")({
  component: () => <Navigate to="/app/gestacao" replace />,
});
