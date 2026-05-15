import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { useAutoTranslate } from "@/hooks/useAutoTranslate";
import appCss from "../styles.css?url";
import { LangProvider } from "@/lib/translate.context";

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
      { title: "LeMater · Saúde materna com credencial clínica" },
      { name: "description", content: "Programas, app e teleconsulta materna por Rayssa Leslie." },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "LeMater · Saúde materna com credencial clínica" },
      { name: "twitter:title", content: "LeMater · Saúde materna com credencial clínica" },
      { property: "og:description", content: "Programas, app e teleconsulta materna por Rayssa Leslie." },
      { name: "twitter:description", content: "Programas, app e teleconsulta materna por Rayssa Leslie." },
      { name: "twitter:card", content: "summary_large_image" },
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
