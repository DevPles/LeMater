import { Navigate, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sala/$roomId")({
  component: SalaRedirect,
});

function SalaRedirect() {
  const { roomId } = Route.useParams();
  return <Navigate to="/app/sala/$roomId" params={{ roomId }} replace />;
}
