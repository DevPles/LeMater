import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { waitForActiveSession } from "@/lib/auth-routing";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const session = await waitForActiveSession(undefined, 5000);
    if (!session) throw redirect({ to: "/login" });
  },
  component: () => <Outlet />,
});
