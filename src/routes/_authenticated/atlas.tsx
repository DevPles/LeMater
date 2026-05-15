import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type CSSProperties } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getMaterialPagoSignedUrl } from "@/lib/admin.functions";
import lemateLogo from "@/assets/lemater-logo.png";

export const Route = createFileRoute("/_authenticated/atlas")({
  head: () => ({
    meta: [{ title: "Atlas Materno · Área de Membros" }],
    links: [{
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=DM+Sans:wght@300;400;500&display=swap",
    }],
  }),
  component: AtlasPage,
});

const c = { cream: "#FAF5EE", warm: "#F5EDE0", sage: "#5C8A6E", sageDark: "#2D5A42", ink: "#1C1C1A", muted: "#6B6560", border: "#E8DDD2" };
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

type Material = {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria: string;
  tipo: "pdf" | "video_externo" | "video_upload" | "artigo";
  conteudo_html: string | null;
  capa_url: string | null;
};

function AtlasPage() {
  const { hasPaidAccess, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [openUrl, setOpenUrl] = useState<string | null>(null);
  const [openMat, setOpenMat] = useState<Material | null>(null);
  const getUrl = useServerFn(getMaterialPagoSignedUrl);

  useEffect(() => {
    supabase.from("materiais")
      .select("id, titulo, descricao, categoria, tipo, conteudo_html, capa_url")
      .eq("area", "pago").eq("publicado", true)
      .order("ordem").then(({ data }) => {
        setMateriais((data ?? []) as Material[]);
        setLoadingList(false);
      });
  }, []);

  const abrir = async (m: Material) => {
    setOpenId(m.id); setOpenMat(m); setOpenUrl(null);
    if (m.tipo === "artigo") return;
    const r = await getUrl({ data: { material_id: m.id } });
    setOpenUrl(r.url);
  };

  if (loading) return <div style={{ fontFamily: sans, padding: 40, background: c.cream, minHeight: "100vh" }}>Carregando…</div>;

  if (!hasPaidAccess && !isAdmin) {
    return (
      <div style={{ fontFamily: sans, background: c.cream, color: c.ink, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 480, textAlign: "center", background: "white", border: `1px solid ${c.border}`, padding: 40 }}>
          <h1 style={{ fontFamily: serif, fontSize: 32, fontWeight: 400, margin: "0 0 12px" }}>Acesso restrito</h1>
          <p style={{ fontSize: 15, color: c.muted, margin: "0 0 24px", lineHeight: 1.6 }}>
            Sua conta ainda não tem acesso ao Atlas Materno. Adquira pela Hotmart ou aguarde a liberação manual.
          </p>
          <Link to="/" style={{ textDecoration: "none" }}>
            <button style={btn(c.sageDark)}>Voltar ao site</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: sans, background: c.cream, color: c.ink, minHeight: "100vh" }}>
      <TopBar onSair={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }} isAdmin={isAdmin} />
      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "120px 32px 80px" }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: c.sage, marginBottom: 12 }}>Área de membros</div>
          <h1 style={{ fontFamily: serif, fontSize: 48, fontWeight: 300, margin: 0 }}>Atlas Materno</h1>
        </div>

        {loadingList ? <p style={{ color: c.muted }}>Carregando materiais…</p>
          : materiais.length === 0 ? <p style={{ color: c.muted }}>Nenhum material publicado ainda.</p>
          : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {materiais.map((m) => (
              <article key={m.id} style={{ background: "white", border: `1px solid ${c.border}`, padding: 28, display: "flex", flexDirection: "column", gap: 12 }}>
                <span style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: c.muted }}>{m.categoria} · {tipoLabel(m.tipo)}</span>
                <h2 style={{ fontFamily: serif, fontSize: 22, fontWeight: 400, margin: 0, lineHeight: 1.25 }}>{m.titulo}</h2>
                {m.descricao && <p style={{ fontSize: 14, color: c.muted, margin: 0, lineHeight: 1.5 }}>{m.descricao}</p>}
                <button onClick={() => abrir(m)} style={{ ...btn(c.sageDark), marginTop: "auto", alignSelf: "flex-start" }}>Abrir</button>
              </article>
            ))}
          </div>
        )}
      </main>

      {openId && openMat && (
        <div onClick={() => setOpenId(null)} style={{ position: "fixed", inset: 0, background: "rgba(28,28,26,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: c.cream, maxWidth: 1000, width: "100%", maxHeight: "92vh", overflow: "auto", padding: 32, border: `1px solid ${c.border}`, position: "relative" }}>
            <button onClick={() => setOpenId(null)} style={{ position: "absolute", top: 12, right: 16, background: "none", border: "none", cursor: "pointer", fontSize: 20, color: c.muted }}>×</button>
            <h2 style={{ fontFamily: serif, fontSize: 28, fontWeight: 400, margin: "0 0 20px" }}>{openMat.titulo}</h2>
            {openMat.tipo === "artigo" ? (
              <div style={{ lineHeight: 1.7, fontSize: 15 }} dangerouslySetInnerHTML={{ __html: openMat.conteudo_html ?? "" }} />
            ) : !openUrl ? <p style={{ color: c.muted }}>Carregando…</p>
            : openMat.tipo === "pdf" ? (
              <iframe src={openUrl} style={{ width: "100%", height: "75vh", border: "none" }} />
            ) : openMat.tipo === "video_externo" ? (
              <div style={{ aspectRatio: "16/9" }}>
                <iframe src={toEmbed(openUrl)} style={{ width: "100%", height: "100%", border: "none" }} allowFullScreen />
              </div>
            ) : (
              <video src={openUrl} controls style={{ width: "100%", maxHeight: "75vh" }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TopBar({ onSair, isAdmin }: { onSair: () => void; isAdmin: boolean }) {
  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(250,245,238,0.92)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${c.border}`, padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <Link to="/"><img src={lemateLogo} alt="Le Mater" style={{ height: 44 }} /></Link>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {isAdmin && <Link to="/admin" style={navLink}>Admin</Link>}
        <button onClick={onSair} style={{ ...btn(c.sage), padding: "10px 20px" }}>Sair</button>
      </div>
    </nav>
  );
}

const navLink: CSSProperties = { fontFamily: sans, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: c.muted, textDecoration: "none" };

function btn(bg: string): CSSProperties {
  return { background: bg, color: "white", fontSize: 12, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", padding: "12px 24px", border: "none", cursor: "pointer", fontFamily: sans };
}

function tipoLabel(t: string) {
  return t === "pdf" ? "PDF" : t === "video_externo" ? "Vídeo" : t === "video_upload" ? "Vídeo" : "Artigo";
}

function toEmbed(url: string) {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
}
