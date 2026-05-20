import { Outlet, Link, Navigate, createRootRoute, HeadContent, Scripts, useLocation } from "@tanstack/react-router";
import { useAutoTranslate } from "@/hooks/useAutoTranslate";
import appCss from "../styles.css?url";
import { LangProvider } from "@/lib/translate.context";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  const location = useLocation();
  const legacyAppRoutes: Record<string, string> = {
    "/home": "/app/home",
    "/gestacao": "/app/gestacao",
    "/cartao": "/app/cartao",
    "/alertas": "/app/alertas",
    "/perfil": "/app/perfil",
    "/profissional": "/app/profissional",
    "/videos": "/app/videos",
    "/videochamada": "/app/videochamada",
    "/reset-password": "/app/reset-password",
    "/admin": "/app/admin",
    "/membro": "/app/membro",
  };
  const redirectTo = legacyAppRoutes[location.pathname];

  if (redirectTo) return <Navigate to={redirectTo} replace />;

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
      { title: "LeMater · Aplicativo e Jornada de Saúde Materna" },
      { name: "description", content: "Acompanhamento Materno com Aplicativo, Atlas Materno, Carteira Digital da Gestante e Teleconsulta de Enfermagem com Rayssa Leslie." },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "LeMater · Aplicativo e Jornada de Saúde Materna" },
      { name: "twitter:title", content: "LeMater · Aplicativo e Jornada de Saúde Materna" },
      { property: "og:description", content: "Acompanhamento Materno com Aplicativo, Atlas Materno, Carteira Digital da Gestante e Teleconsulta de Enfermagem com Rayssa Leslie." },
      { name: "twitter:description", content: "Acompanhamento Materno com Aplicativo, Atlas Materno, Carteira Digital da Gestante e Teleconsulta de Enfermagem com Rayssa Leslie." },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/hsIaJ1cV77Y8R02Q0Rs8lMxhMw62/social-images/social-1779131613877-CAPA_HOTMARKT.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/hsIaJ1cV77Y8R02Q0Rs8lMxhMw62/social-images/social-1779131613877-CAPA_HOTMARKT.webp" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: () => (
    <LangProvider>
      <RootComponent />
    </LangProvider>
  ),
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
  const { translating } = useAutoTranslate();

  return (
    <>
      <Outlet />
      <Toaster />
      {translating && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(255,255,255,0.4)",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(1px)",
          pointerEvents: "none"
        }}>
          <div style={{
            background: "white",
            padding: "8px 16px",
            borderRadius: 20,
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            fontWeight: 500,
            color: "#5C8A6E"
          }}>
            <div className="animate-spin w-3 h-3 border-2 border-sage-500 border-t-transparent rounded-full" />
            Translating...
          </div>
        </div>
      )}
    </>
  );
}
