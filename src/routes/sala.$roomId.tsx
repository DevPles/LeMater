import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/sala/$roomId")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/app/sala/$roomId", params: { roomId: params.roomId } });
  },
});
