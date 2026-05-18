import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type CSSProperties } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  listMateriaisVitrine,
  getMaterialAccess,
  type VitrineMaterial,
  type MaterialAccess,
} from "@/lib/materiais.functions";
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

function tipoLabel(t: VitrineMaterial["tipo"]) {
  return t === "pdf" ? "PDF" : t === "video_externo" ? "Vídeo" : t === "video_upload" ? "Vídeo" : "Artigo";
}

function AtlasPage() {
  const { isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();
  const listFn = useServerFn(listMateriaisVitrine);
  const accessFn = useServerFn(getMaterialAccess);
  const [items, setItems] = useState<VitrineMaterial[] | null>(null);
  const [openMat, setOpenMat] = useState<VitrineMaterial | null>(null);
  const [acesso, setAcesso] = useState<MaterialAccess | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    listFn().then((d) => {
      // Biblioteca pessoal: somente itens que o usuário pode consumir
      setItems((d as VitrineMaterial[]).filter((m) => m.pode_consumir));
    }).catch((e) => setErr(e?.message ?? "Erro"));
  }, [user?.id]);

  const abrir = async (m: VitrineMaterial) => {
    setOpenMat(m); setAcesso(null); setErr(null);
    try {
      const r = await accessFn({ data: { material_id: m.id } });
      setAcesso(r);
    } catch (e: any) {
      setErr(e?.message ?? "Erro");
    }
  };

  if (loading) return <div style={{ fontFamily: sans, padding: 40, background: c.cream, minHeight: "100vh" }}>Carregando…</div>;

  return (
    <div style={{ fontFamily: sans, background: c.cream, color: c.ink, minHeight: "100vh" }}>
      <TopBar onSair={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }} isAdmin={isAdmin} />
      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "120px 32px 80px" }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: c.sage, marginBottom: 12 }}>Sua biblioteca</div>
          <h1 style={{ fontFamily: serif, fontSize: 48, fontWeight: 300, margin: 0 }}>Atlas Materno</h1>
          <p style={{ color: c.muted, marginTop: 12 }}>Todos os conteúdos liberados para você.</p>
        </div>

        {err && <p style={{ color: "#B23A48" }}>{err}</p>}
        {items === null ? <p style={{ color: c.muted }}>Carregando materiais…</p>
          : items.length === 0 ? (
            <div style={{ background: "white", padding: 48, border: `1px solid ${c.border}`, textAlign: "center" }}>
              <p style={{ fontFamily: serif, fontSize: 22, color: c.muted, margin: "0 0 16px" }}>
                Você ainda não tem conteúdos liberados.
              </p>
              <Link to="/conteudos-gratis" style={{ ...btn(c.sageDark), textDecoration: "none", display: "inline-block" }}>
                Ver catálogo
              </Link>
            </div>
          ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {items.map((m) => (
              <article key={m.id} style={{ background: "white", border: `1px solid ${c.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {m.capa_url && <img src={m.capa_url} alt="" style={{ width: "100%", height: 160, objectFit: "cover" }} />}
                <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                  <span style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: c.muted }}>{m.categoria} · {tipoLabel(m.tipo)}</span>
                  <h2 style={{ fontFamily: serif, fontSize: 22, fontWeight: 400, margin: 0, lineHeight: 1.25 }}>{m.titulo}</h2>
                  {m.descricao && <p style={{ fontSize: 14, color: c.muted, margin: 0, lineHeight: 1.5 }}>{m.descricao}</p>}
                  <button onClick={() => abrir(m)} style={{ ...btn(c.sageDark), marginTop: "auto", alignSelf: "flex-start" }}>Abrir</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {openMat && (
        <div onClick={() => { setOpenMat(null); setAcesso(null); }} style={{ position: "fixed", inset: 0, background: "rgba(28,28,26,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: c.cream, maxWidth: 1000, width: "100%", maxHeight: "92vh", overflow: "auto", padding: 32, border: `1px solid ${c.border}`, position: "relative" }}>
            <button onClick={() => { setOpenMat(null); setAcesso(null); }} style={{ position: "absolute", top: 12, right: 16, background: "none", border: "none", cursor: "pointer", fontSize: 22, color: c.muted }}>×</button>
            <h2 style={{ fontFamily: serif, fontSize: 28, fontWeight: 400, margin: "0 0 20px" }}>{openMat.titulo}</h2>
            {!acesso ? (
              <p style={{ color: c.muted }}>Carregando…</p>
            ) : acesso.kind === "artigo" ? (
              <div style={{ lineHeight: 1.7, fontSize: 15 }} dangerouslySetInnerHTML={{ __html: acesso.html }} />
            ) : acesso.kind === "pdf" ? (
              <>
                <a href={acesso.url} target="_blank" rel="noreferrer" download style={{ ...btn(c.sageDark), textDecoration: "none", display: "inline-block", marginBottom: 16 }}>Baixar PDF</a>
                <iframe src={acesso.url} style={{ width: "100%", height: "75vh", border: "none" }} />
              </>
            ) : acesso.kind === "video_externo" ? (
              <div style={{ aspectRatio: "16/9" }}>
                <iframe src={acesso.embedUrl} style={{ width: "100%", height: "100%", border: "none" }} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
              </div>
            ) : acesso.kind === "video_upload" ? (
              <>
                <video src={acesso.url} controls style={{ width: "100%", maxHeight: "75vh", background: "black" }} />
                <a href={acesso.url} target="_blank" rel="noreferrer" download style={{ ...btn(c.sageDark), textDecoration: "none", display: "inline-block", marginTop: 16 }}>Baixar</a>
              </>
            ) : (
              <a href={acesso.url} target="_blank" rel="noopener noreferrer" style={{ ...btn(c.sageDark), textDecoration: "none", display: "inline-block" }}>Abrir na plataforma</a>
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
        <Link to="/conteudos-gratis" style={navLink}>Catálogo</Link>
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
