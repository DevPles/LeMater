import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { ProfissionalNav } from "@/components/ProfissionalNav";
import { FlyingStork } from "@/components/FlyingStork";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "App · Le Mater" }] }),
  component: AppLayout,
});

function AppLayout() {
  const loc = useLocation();
  const isProfissional = loc.pathname.startsWith("/app/profissional");
  const isSala = loc.pathname.startsWith("/app/sala/");

  return (
    <div className="min-h-screen bg-background relative">
      <FlyingStork />
      <div className="relative z-10 pb-32">
        <Outlet />
      </div>
      {!isSala && (isProfissional ? <ProfissionalNav /> : <BottomNav />)}
    </div>
  );
}
