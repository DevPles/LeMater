import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { getStorefront } from "@/lib/storefront.functions";
import { addToCart } from "@/lib/checkout.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/biblioteca")({
  head: () => ({
    meta: [
      { title: "Biblioteca Le Mater — jornadas maternas modulares" },
      {
        name: "description",
        content:
          "Monte sua própria jornada. Aulas, trilhas e pacotes para cada fase da maternidade — do desejo ao pós-parto.",
      },
      { property: "og:title", content: "Biblioteca Le Mater" },
      {
        property: "og:description",
        content: "Ecossistema de conteúdos maternos. Compre só o que faz sentido para você.",
      },
    ],
  }),
  ssr: false,
  component: BibliotecaPage,
});

const serif = "'Playfair Display', serif";
const sans = "'DM Sans', sans-serif";
const c = {
  ink: "#0E0E0C",
  paper: "#F7F1E8",
  cream: "#FAF5EE",
  muted: "#7A726A",
  border: "rgba(255,255,255,0.10)",
  gold: "#C9A961",
  navy: "#1A1557",
  rose: "#E8B7A8",
  sage: "#7FA08A",
};

type ItemType = "lesson" | "module" | "pathway" | "bundle";

function price(centavos: number, currency = "BRL") {
  if (!centavos) return "Gratuito";
  return new Intl.NumberFormat(currency === "BRL" ? "pt-BR" : "en-US", {
    style: "currency",
    currency,
  }).format(centavos / 100);
}

function BibliotecaPage() {
  const fetchStorefront = useServerFn(getStorefront);
  const { data, isLoading } = useQuery({
    queryKey: ["storefront"],
    queryFn: () => fetchStorefront(),
  });

  return (
    <main
      style={{
        background: c.ink,
        color: c.paper,
        fontFamily: sans,
        minHeight: "100vh",
      }}
    >
      <Hero />
      {isLoading ? (
        <div style={{ padding: "120px 32px", textAlign: "center", color: c.muted }}>
          Preparando sua biblioteca…
        </div>
      ) : (
        <>
          <Row
            kicker="Jornadas completas"
            title="Trilhas guiadas Le Mater"
            subtitle="Sequências curadas, fase a fase. Para quando você quer ser conduzida."
            items={(data?.pathways ?? []).map((p) => ({
              id: p.id,
              slug: p.slug,
              type: "pathway" as ItemType,
              title: p.title,
              subtitle: p.subtitle ?? p.audience ?? null,
              cover: p.cover_image,
              price_centavos: p.price_centavos,
              currency: p.currency,
            }))}
          />
          <Row
            kicker="Universos temáticos"
            title="Módulos da maternidade"
            subtitle="Mergulhe em um tema. Cada universo reúne aulas conectadas por sentido."
            items={(data?.modules ?? []).map((m) => ({
              id: m.id,
              slug: m.slug,
              type: "module" as ItemType,
              title: m.title,
              subtitle: m.subtitle ?? null,
              cover: m.cover_image,
              price_centavos: null,
              currency: "BRL",
            }))}
          />
          <Row
            kicker="Em destaque"
            title="Aulas avulsas"
            subtitle="Quando você precisa de uma resposta agora. Compre só a aula."
            items={(data?.featured_lessons ?? []).map((l) => ({
              id: l.id,
              slug: l.slug,
              type: "lesson" as ItemType,
              title: l.title,
              subtitle: l.subtitle ?? l.short_description ?? null,
              cover: l.thumbnail ?? l.cover_image,
              price_centavos:
                l.free_or_paid === "free" ? 0 : l.individual_price_centavos,
              currency: l.currency,
            }))}
          />
          <Row
            kicker="Pacotes especiais"
            title="Combos com curadoria"
            subtitle="Conjuntos pensados para sua fase. Preço melhor que comprar separado."
            items={(data?.bundles ?? []).map((b) => ({
              id: b.id,
              slug: b.slug,
              type: "bundle" as ItemType,
              title: b.title,
              subtitle: b.subtitle ?? null,
              cover: b.cover_image,
              price_centavos: b.price_centavos,
              currency: b.currency,
            }))}
          />
          <ClosingBand />
        </>
      )}
    </main>
  );
}

// ---------- HERO ----------
function Hero() {
  return (
    <section
      style={{
        padding: "96px 32px 64px",
        maxWidth: 1200,
        margin: "0 auto",
        textAlign: "center",
        position: "relative",
      }}
    >
      <p
        style={{
          fontFamily: sans,
          fontSize: 13,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: c.gold,
          marginBottom: 28,
        }}
      >
        Biblioteca Le Mater
      </p>
      <h1
        style={{
          fontFamily: serif,
          fontSize: "clamp(40px, 6vw, 72px)",
          fontWeight: 400,
          lineHeight: 1.05,
          color: c.paper,
          marginBottom: 24,
          letterSpacing: "-0.02em",
        }}
      >
        Sua jornada,
        <br />
        <em style={{ color: c.gold, fontStyle: "italic" }}>do seu jeito.</em>
      </h1>
      <p
        style={{
          fontFamily: sans,
          fontSize: 18,
          lineHeight: 1.6,
          maxWidth: 620,
          margin: "0 auto 40px",
          color: "rgba(247,241,232,0.72)",
        }}
      >
        Aulas, módulos, trilhas e pacotes para cada momento da maternidade —
        do desejo de engravidar ao puerpério. Monte sua própria experiência.
      </p>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
        <Link
          to="/carrinho"
          style={{
            background: c.gold,
            color: c.ink,
            fontFamily: sans,
            fontWeight: 600,
            fontSize: 14,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            padding: "16px 32px",
            border: "none",
            borderRadius: 999,
            textDecoration: "none",
          }}
        >
          Ver meu carrinho
        </Link>
        <a
          href="#trilhas"
          style={{
            background: "transparent",
            color: c.paper,
            fontFamily: sans,
            fontWeight: 500,
            fontSize: 14,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            padding: "16px 32px",
            border: `1px solid rgba(247,241,232,0.25)`,
            borderRadius: 999,
            textDecoration: "none",
          }}
        >
          Explorar conteúdos
        </a>
      </div>
    </section>
  );
}

// ---------- ROW ----------
type CardItem = {
  id: string;
  slug: string;
  type: ItemType;
  title: string;
  subtitle: string | null;
  cover: string | null;
  price_centavos: number | null;
  currency: string;
};

function Row({
  kicker,
  title,
  subtitle,
  items,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  items: CardItem[];
}) {
  if (!items.length) return null;
  return (
    <section
      id={kicker.toLowerCase().includes("trilha") ? "trilhas" : undefined}
      style={{
        padding: "56px 32px",
        maxWidth: 1400,
        margin: "0 auto",
      }}
    >
      <div style={{ marginBottom: 32, maxWidth: 720 }}>
        <p
          style={{
            fontSize: 12,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: c.gold,
            marginBottom: 12,
          }}
        >
          {kicker}
        </p>
        <h2
          style={{
            fontFamily: serif,
            fontSize: "clamp(28px, 4vw, 42px)",
            fontWeight: 400,
            color: c.paper,
            marginBottom: 10,
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h2>
        <p style={{ color: "rgba(247,241,232,0.6)", fontSize: 15, lineHeight: 1.5 }}>
          {subtitle}
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        {items.map((it) => (
          <Card key={`${it.type}-${it.id}`} item={it} />
        ))}
      </div>
    </section>
  );
}

// ---------- CARD ----------
function Card({ item }: { item: CardItem }) {
  const qc = useQueryClient();
  const addFn = useServerFn(addToCart);
  const [pending, setPending] = useState(false);

  const addable = item.type === "lesson" || item.type === "pathway" || item.type === "bundle";

  const addMut = useMutation({
    mutationFn: async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        toast.error("Faça login para adicionar ao carrinho");
        window.location.href = "/login?redirect=/biblioteca";
        return;
      }
      await addFn({ data: { item_type: item.type, item_id: item.id } });
    },
    onSuccess: () => {
      toast.success("Adicionado ao carrinho");
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao adicionar"),
    onSettled: () => setPending(false),
  });

  const cover =
    item.cover ||
    `https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=70`;

  return (
    <article
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${c.border}`,
        borderRadius: 18,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Link
        to={item.type === "lesson" ? "/biblioteca/$slug" : "/biblioteca"}
        params={item.type === "lesson" ? { slug: item.slug } : undefined}
        style={{
          position: "relative",
          display: "block",
          aspectRatio: "4 / 5",
          background: `linear-gradient(180deg, transparent 30%, rgba(14,14,12,0.85) 100%), url(${cover}) center/cover`,
          textDecoration: "none",
          color: "inherit",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            fontSize: 10,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: c.gold,
            background: "rgba(14,14,12,0.7)",
            padding: "5px 10px",
            borderRadius: 999,
            fontWeight: 600,
          }}
        >
          {labelFor(item.type)}
        </span>
        <div style={{ position: "absolute", bottom: 16, left: 16, right: 16 }}>
          <h3
            style={{
              fontFamily: serif,
              fontSize: 22,
              fontWeight: 500,
              color: c.paper,
              marginBottom: 6,
              lineHeight: 1.15,
            }}
          >
            {item.title}
          </h3>
          {item.subtitle && (
            <p
              style={{
                fontSize: 13,
                color: "rgba(247,241,232,0.75)",
                lineHeight: 1.4,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {item.subtitle}
            </p>
          )}
        </div>
      </Link>
      <div
        style={{
          padding: "16px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: `1px solid ${c.border}`,
        }}
      >
        <span style={{ fontFamily: serif, fontSize: 18, color: c.paper }}>
          {item.price_centavos === null
            ? "Ver detalhes"
            : price(item.price_centavos, item.currency)}
        </span>
        {addable && item.price_centavos !== null && item.price_centavos > 0 && (
          <button
            disabled={pending || addMut.isPending}
            onClick={() => {
              setPending(true);
              addMut.mutate();
            }}
            style={{
              background: c.gold,
              color: c.ink,
              border: "none",
              borderRadius: 999,
              padding: "9px 18px",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              cursor: pending || addMut.isPending ? "wait" : "pointer",
            }}
          >
            {pending || addMut.isPending ? "Adicionando…" : "Adicionar"}
          </button>
        )}
      </div>
    </article>
  );
}

function labelFor(t: ItemType) {
  return t === "lesson"
    ? "Aula"
    : t === "module"
      ? "Módulo"
      : t === "pathway"
        ? "Trilha"
        : "Pacote";
}

// ---------- CLOSING ----------
function ClosingBand() {
  return (
    <section
      style={{
        margin: "80px 32px 120px",
        padding: "64px 40px",
        background:
          "linear-gradient(135deg, rgba(201,169,97,0.12), rgba(201,169,97,0.04))",
        border: `1px solid rgba(201,169,97,0.25)`,
        borderRadius: 24,
        maxWidth: 1100,
        marginInline: "auto",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontSize: 12,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: c.gold,
          marginBottom: 16,
        }}
      >
        Jornada completa
      </p>
      <h2
        style={{
          fontFamily: serif,
          fontSize: "clamp(28px, 4vw, 44px)",
          fontWeight: 400,
          color: c.paper,
          marginBottom: 18,
          letterSpacing: "-0.01em",
        }}
      >
        Quer tudo de uma vez?
      </h2>
      <p
        style={{
          fontSize: 16,
          color: "rgba(247,241,232,0.7)",
          maxWidth: 560,
          margin: "0 auto 32px",
          lineHeight: 1.6,
        }}
      >
        Desbloqueie todas as aulas, trilhas e atualizações futuras com o acesso
        completo Le Mater.
      </p>
      <Link
        to="/carrinho"
        style={{
          display: "inline-block",
          background: c.gold,
          color: c.ink,
          fontFamily: sans,
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          padding: "16px 36px",
          borderRadius: 999,
          textDecoration: "none",
        }}
      >
        Conhecer o acesso completo
      </Link>
    </section>
  );
}
