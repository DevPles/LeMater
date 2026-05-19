import { Navigate, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/videochamada")({
  component: () => <Navigate to="/app/videochamada" replace />,
});
