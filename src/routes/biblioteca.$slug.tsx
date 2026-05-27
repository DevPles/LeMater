import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { getLessonDetail } from "@/lib/storefront.functions";
import { addToCart } from "@/lib/checkout.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/biblioteca/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Biblioteca Le Mater` },
      { name: "description", content: "Aula da biblioteca Le Mater." },
    ],
  }),
  ssr: false,
  component: LessonDetailPage,
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

function price(centavos: number, currency = "BRL") {
  if (!centavos) return "Gratuito";
  return new Intl.NumberFormat(currency === "BRL" ? "pt-BR" : "en-US", {
    style: "currency",
    currency,
  }).format(centavos / 100);
}

function LessonDetailPage() {
  const { slug } = Route.useParams();
  const qc = useQueryClient();
  const fetchDetail = useServerFn(getLessonDetail);
  const addFn = useServerFn(addToCart);
  const [pending, setPending] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["lesson-detail", slug],
    queryFn: () => fetchDetail({ data: { slug } }),
  });

  const lesson = data?.lesson as
    | (Record<string, unknown> & {
        id: string;
        title: string;
        subtitle?: string | null;
        short_description?: string | null;
        full_description?: string | null;
        transformation?: string | null;
        benefits?: string[] | null;
        objectives?: string[] | null;
        audience?: string | null;
        cover_image?: string | null;
        thumbnail?: string | null;
        trailer_url?: string | null;
        free_or_paid?: string;
        individual_price_centavos?: number;
        currency?: string;
        duration_sec?: number;
      })
    | null
    | undefined;

  const addMut = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        toast.error("Faça login para comprar");
        window.location.href = `/login?redirect=/biblioteca/${slug}`;
        return;
      }
      await addFn({ data: { item_type: "lesson", item_id: lesson!.id } });
    },
    onSuccess: () => {
      toast.success("Adicionada ao carrinho");
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao adicionar"),
    onSettled: () => setPending(false),
  });

  if (isLoading) {
    return (
      <main style={{ background: c.ink, color: c.paper, minHeight: "100vh", padding: 120, textAlign: "center", fontFamily: sans }}>
        Carregando…
      </main>
    );
  }
  if (!lesson) {
    return (
      <main style={{ background: c.ink, color: c.paper, minHeight: "100vh", padding: 120, textAlign: "center", fontFamily: sans }}>
        <h1 style={{ fontFamily: serif, fontSize: 36, marginBottom: 16 }}>Aula não encontrada</h1>
        <Link to="/biblioteca" style={{ color: c.gold }}>Voltar à biblioteca</Link>
      </main>
    );
  }

  const cover = lesson.cover_image || lesson.thumbnail;
  const benefits = Array.isArray(lesson.benefits) ? lesson.benefits : [];
  const objectives = Array.isArray(lesson.objectives) ? lesson.objectives : [];
  const isPaid = lesson.free_or_paid === "paid" && (lesson.individual_price_centavos ?? 0) > 0;

  return (
    <main style={{ background: c.ink, color: c.paper, minHeight: "100vh", fontFamily: sans }}>
      {/* HERO */}
      <section
        style={{
          background: cover
            ? `linear-gradient(180deg, rgba(14,14,12,0.55) 0%, rgba(14,14,12,0.95) 100%), url(${cover}) center/cover`
            : c.ink,
          padding: "100px 32px 80px",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <Link to="/biblioteca" style={{ color: c.gold, fontSize: 13, letterSpacing: 2, textTransform: "uppercase" }}>
            ← Biblioteca
          </Link>
          <h1
            style={{
              fontFamily: serif,
              fontSize: "clamp(36px, 6vw, 64px)",
              fontWeight: 400,
              marginTop: 24,
              marginBottom: 18,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            {lesson.title}
          </h1>
          {lesson.subtitle && (
            <p style={{ fontSize: 20, color: c.muted, marginBottom: 28, lineHeight: 1.5, maxWidth: 700 }}>
              {lesson.subtitle}
            </p>
          )}
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontFamily: serif, fontSize: 28, color: c.gold }}>
              {isPaid ? price(lesson.individual_price_centavos!, lesson.currency ?? "BRL") : "Gratuito"}
            </span>
            {isPaid && (
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
                  padding: "14px 32px",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  cursor: pending ? "wait" : "pointer",
                }}
              >
                {pending || addMut.isPending ? "Adicionando…" : "Adicionar ao carrinho"}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* CORPO */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "64px 32px 120px" }}>
        {lesson.transformation && (
          <Block kicker="O que muda em você" title="Transformação" body={lesson.transformation} />
        )}
        {lesson.full_description && (
          <Block kicker="Sobre esta aula" title="O que você vai viver" body={lesson.full_description} />
        )}
        {!!benefits.length && (
          <ListBlock kicker="Benefícios" title="O que você leva" items={benefits} />
        )}
        {!!objectives.length && (
          <ListBlock kicker="Objetivos" title="Ao final, você terá" items={objectives} />
        )}
        {lesson.audience && (
          <Block kicker="Para quem" title="Esta aula é para você se…" body={lesson.audience} />
        )}
      </section>
    </main>
  );
}

function Block({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return (
    <div style={{ marginBottom: 56 }}>
      <p style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: c.gold, marginBottom: 10 }}>{kicker}</p>
      <h2 style={{ fontFamily: serif, fontSize: 30, fontWeight: 400, marginBottom: 16, letterSpacing: "-0.01em" }}>{title}</h2>
      <p style={{ fontSize: 17, lineHeight: 1.7, color: "rgba(247,241,232,0.85)", whiteSpace: "pre-wrap" }}>{body}</p>
    </div>
  );
}

function ListBlock({ kicker, title, items }: { kicker: string; title: string; items: string[] }) {
  return (
    <div style={{ marginBottom: 56 }}>
      <p style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: c.gold, marginBottom: 10 }}>{kicker}</p>
      <h2 style={{ fontFamily: serif, fontSize: 30, fontWeight: 400, marginBottom: 20, letterSpacing: "-0.01em" }}>{title}</h2>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 14 }}>
        {items.map((it, i) => (
          <li
            key={i}
            style={{
              fontSize: 16,
              lineHeight: 1.55,
              color: "rgba(247,241,232,0.88)",
              paddingLeft: 18,
              borderLeft: `2px solid ${c.gold}`,
            }}
          >
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
