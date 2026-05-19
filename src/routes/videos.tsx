import { Navigate, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/videos")({
  component: () => <Navigate to="/app/videos" replace />,
});
