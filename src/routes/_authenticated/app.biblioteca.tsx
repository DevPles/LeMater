import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMinhaBiblioteca } from "@/lib/minha-biblioteca.functions";

export const Route = createFileRoute("/_authenticated/app/biblioteca")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Minha Biblioteca · Le Mater" }],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap",
      },
    ],
  }),
  component: MinhaBibliotecaPage,
});

const serif = "'Playfair Display', serif";
const sans = "'DM Sans', sans-serif";
const c = {
  ink: "#0E0E0C",
  paper: "#F7F1E8",
  muted: "rgba(247,241,232,0.65)",
  border: "rgba(255,255,255,0.10)",
  gold: "#C9A961",
};

type LessonCard = {
  id: string;
  slug?: string;
  title: string;
  subtitle?: string | null;
  short_description?: string | null;
  thumbnail?: string | null;
  cover_image?: string | null;
  duration_sec?: number | null;
  tags?: string[] | null;
};

type ModuleCard = {
  id: string;
  slug?: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  cover_image?: string | null;
  color?: string | null;
};

function fmtDur(sec?: number | null) {
  if (!sec) return null;
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${r}min` : `${h}h`;
}

function MinhaBibliotecaPage() {
  const fetchBib = useServerFn(getMinhaBiblioteca);
  const { data, isLoading, error } = useQuery({
    queryKey: ["minha-biblioteca"],
    queryFn: () => fetchBib(),
  });

  if (isLoading) {
    return (
      <main style={shellStyle}>
        <p style={{ color: c.muted, padding: 120, textAlign: "center" }}>Carregando sua biblioteca…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={shellStyle}>
        <p style={{ color: "#ff7676", padding: 120, textAlign: "center" }}>
          Erro: {(error as Error).message}
        </p>
      </main>
    );
  }

  const lessons = (data?.lessons ?? []) as LessonCard[];
  const modules = (data?.modules ?? []) as ModuleCard[];
  const continueWatching = (data?.continue_watching ?? []) as LessonCard[];
  const isEmpty =
    !data?.all_access && !lessons.length && !modules.length && !data?.pathways?.length;

  return (
    <main style={shellStyle}>
      <header style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 32px 32px" }}>
        <Link to="/app/membro" style={{ color: c.gold, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>
          ← Minha área
        </Link>
        <h1
          style={{
            fontFamily: serif,
            fontSize: "clamp(40px, 6vw, 64px)",
            fontWeight: 400,
            margin: "20px 0 8px",
            letterSpacing: "-0.02em",
          }}
        >
          Minha Biblioteca
        </h1>
        <p style={{ color: c.muted, fontSize: 17, maxWidth: 620, lineHeight: 1.5 }}>
          {data?.all_access
            ? "Você tem acesso completo a todo o acervo Le Mater."
            : "Seus conteúdos liberados. Cada aula é um encontro com você mesma."}
        </p>
      </header>

      {isEmpty ? (
        <EmptyState />
      ) : (
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px 120px" }}>
          {!!continueWatching.length && (
            <Row title="Continue de onde parou" items={continueWatching} />
          )}
          {!!modules.length && <ModuleRow title="Seus módulos" items={modules} />}
          {!!data?.pathways?.length && (
            <ModuleRow title="Suas trilhas" items={data.pathways as ModuleCard[]} />
          )}
          {!!lessons.length && <Row title="Todas as suas aulas" items={lessons} />}
        </div>
      )}
    </main>
  );
}

const shellStyle: React.CSSProperties = {
  background: c.ink,
  color: c.paper,
  minHeight: "100vh",
  fontFamily: sans,
};

function Row({ title, items }: { title: string; items: LessonCard[] }) {
  return (
    <section style={{ marginBottom: 56 }}>
      <h2 style={{ fontFamily: serif, fontSize: 26, fontWeight: 400, marginBottom: 20, letterSpacing: "-0.01em" }}>
        {title}
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 20,
        }}
      >
        {items.map((l) => (
          <Link
            key={l.id}
            to="/biblioteca/$slug"
            params={{ slug: l.slug ?? l.id }}
            style={{
              textDecoration: "none",
              color: c.paper,
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${c.border}`,
              borderRadius: 14,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              transition: "transform .2s ease, border-color .2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLAnchorElement).style.borderColor = c.gold;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLAnchorElement).style.borderColor = c.border;
            }}
          >
            <div
              style={{
                aspectRatio: "16/10",
                background: l.thumbnail || l.cover_image
                  ? `url(${l.thumbnail ?? l.cover_image}) center/cover`
                  : "linear-gradient(135deg, #2a2a26, #0e0e0c)",
              }}
            />
            <div style={{ padding: "16px 18px 20px" }}>
              <h3 style={{ fontFamily: serif, fontSize: 19, fontWeight: 400, marginBottom: 6, letterSpacing: "-0.01em" }}>
                {l.title}
              </h3>
              {l.subtitle && (
                <p style={{ fontSize: 13, color: c.muted, lineHeight: 1.45, marginBottom: 10 }}>{l.subtitle}</p>
              )}
              <div style={{ fontSize: 11, color: c.gold, letterSpacing: 1.5, textTransform: "uppercase" }}>
                {fmtDur(l.duration_sec) ?? "Aula"}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ModuleRow({ title, items }: { title: string; items: ModuleCard[] }) {
  return (
    <section style={{ marginBottom: 56 }}>
      <h2 style={{ fontFamily: serif, fontSize: 26, fontWeight: 400, marginBottom: 20, letterSpacing: "-0.01em" }}>
        {title}
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 20,
        }}
      >
        {items.map((m) => (
          <div
            key={m.id}
            style={{
              background: m.cover_image
                ? `linear-gradient(180deg, rgba(14,14,12,0.35), rgba(14,14,12,0.92)), url(${m.cover_image}) center/cover`
                : `linear-gradient(135deg, ${m.color ?? "#3a3a34"}, #0e0e0c)`,
              borderRadius: 16,
              padding: 28,
              minHeight: 200,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              border: `1px solid ${c.border}`,
            }}
          >
            <h3 style={{ fontFamily: serif, fontSize: 24, fontWeight: 400, marginBottom: 6, letterSpacing: "-0.01em" }}>
              {m.title}
            </h3>
            {m.subtitle && <p style={{ fontSize: 13, color: c.muted, lineHeight: 1.5 }}>{m.subtitle}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "40px 32px 120px",
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: c.gold, marginBottom: 14 }}>
        Sua biblioteca está esperando
      </p>
      <h2 style={{ fontFamily: serif, fontSize: 32, fontWeight: 400, marginBottom: 14, letterSpacing: "-0.01em" }}>
        Você ainda não tem aulas liberadas
      </h2>
      <p style={{ color: c.muted, fontSize: 16, lineHeight: 1.6, marginBottom: 28 }}>
        Explore o acervo público da Le Mater e escolha o que faz sentido para o seu momento.
      </p>
      <Link
        to="/biblioteca"
        style={{
          display: "inline-block",
          background: c.gold,
          color: c.ink,
          padding: "14px 32px",
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          textDecoration: "none",
        }}
      >
        Conhecer a biblioteca
      </Link>
    </div>
  );
}
