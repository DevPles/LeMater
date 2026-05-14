import { Outlet, Link, createRootRoute, HeadContent, Scripts, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { ProfissionalNav } from "@/components/ProfissionalNav";
import { useGestanteProfile } from "@/hooks/useGestanteProfile";
import { useUserRole } from "@/hooks/useUserRole";
import appCss from "../styles.css?url";

// Rotas que profissionais NÃO podem acessar (são exclusivas da gestante)
const PROFISSIONAL_BLOCKED = [
  "/home",
  "/cartao",
  "/alertas",
  "/videochamada",
  "/gestacao",
  "/perfil",
];

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MãeDigital — Carteira Digital da Gestante" },
      { name: "description", content: "\n. Acompanhe sua gestação." },
      { name: "author", content: "\n" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "MãeDigital — Carteira Digital da Gestante" },
      { name: "twitter:title", content: "MãeDigital — Carteira Digital da Gestante" },
      { property: "og:description", content: "\n. Acompanhe sua gestação." },
      { name: "twitter:description", content: "\n. Acompanhe sua gestação." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/hsIaJ1cV77Y8R02Q0Rs8lMxhMw62/social-images/social-1776691083042-WhatsApp_Image_2026-04-19_at_08.00.51.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/hsIaJ1cV77Y8R02Q0Rs8lMxhMw62/social-images/social-1776691083042-WhatsApp_Image_2026-04-19_at_08.00.51.webp" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useGestanteProfile();
  const { isProfissional, isAdmin, loading: roleLoading } = useUserRole();

  const hideAllNav =
    location.pathname === "/" ||
    location.pathname === "/site" ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/sala");

  // Profissional vê apenas a nav restrita (Agenda + Vídeos)
  const showProfissionalNav =
    !hideAllNav && isProfissional && !isAdmin;
  // Gestante vê a BottomNav padrão
  const showGestanteNav = !hideAllNav && !isProfissional;

  // Redireciona profissionais que tentam acessar telas de gestante
  useEffect(() => {
    if (roleLoading || !isProfissional || isAdmin) return;
    if (PROFISSIONAL_BLOCKED.includes(location.pathname)) {
      navigate({ to: "/profissional" });
    }
  }, [roleLoading, isProfissional, isAdmin, location.pathname, navigate]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.remove("theme-boy", "theme-girl");
    if (profile?.bebe_sexo === "masculino") root.classList.add("theme-boy");
    else if (profile?.bebe_sexo === "feminino") root.classList.add("theme-girl");
  }, [profile?.bebe_sexo]);

  return (
    <>
      <Outlet />
      {showGestanteNav && <BottomNav />}
      {showProfissionalNav && <ProfissionalNav />}
    </>
  );
}
