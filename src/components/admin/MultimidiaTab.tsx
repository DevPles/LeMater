import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  vidEngravidar, vidPreNatal, vidExercicios, vidAlimentacao,
  vidPartoHumanizado, vidPlanoParto, vidPuerperio, vidAmamentacao,
  vidPrimeirosCuidados, vidSonoBebe,
} from "@/lib/atlas-cover-video";

import amamentacao2 from "@/assets/curso-videos/amamentacao-2.mp4.asset.json";
import amamentacao3 from "@/assets/curso-videos/amamentacao-3.mp4.asset.json";
import amamentacao4 from "@/assets/curso-videos/amamentacao-4.mp4.asset.json";
import amamentacao5 from "@/assets/curso-videos/amamentacao-5.mp4.asset.json";
import amamentacao6 from "@/assets/curso-videos/amamentacao-6.mp4.asset.json";
import amamentacao7 from "@/assets/curso-videos/amamentacao-7.mp4.asset.json";
import amamentacao8 from "@/assets/curso-videos/amamentacao-8.mp4.asset.json";
import amamentacao9 from "@/assets/curso-videos/amamentacao-9.mp4.asset.json";
import amamentacao10 from "@/assets/curso-videos/amamentacao-10.mp4.asset.json";
import amamentacao11 from "@/assets/curso-videos/amamentacao-11.mp4.asset.json";

type BuiltinVideo = { nome: string; url: string; keywords: string[] };
const BUILTIN_VIDEOS: BuiltinVideo[] = [
  { nome: "Engravidar / Concepção", url: vidEngravidar, keywords: ["conceb", "concep", "engravid", "fertil"] },
  { nome: "Pré-natal / Gestação", url: vidPreNatal, keywords: ["gesta", "pre-natal", "pré-natal", "pre natal", "grávid", "gravid"] },
  { nome: "Exercícios na gestação", url: vidExercicios, keywords: ["exerc", "movimento", "yoga", "atividade"] },
  { nome: "Alimentação", url: vidAlimentacao, keywords: ["aliment", "nutri", "comida", "dieta"] },
  { nome: "Parto humanizado", url: vidPartoHumanizado, keywords: ["parto", "humaniz", "trabalho de parto"] },
  { nome: "Plano de parto", url: vidPlanoParto, keywords: ["plano de parto", "plano-de-parto", "plano parto"] },
  { nome: "Puerpério", url: vidPuerperio, keywords: ["puerp", "pos-parto", "pós-parto", "pos parto"] },
  { nome: "Amamentação", url: vidAmamentacao, keywords: ["amament", "leite", "peito"] },
  { nome: "Primeiros cuidados", url: vidPrimeirosCuidados, keywords: ["cuidad", "bebê", "bebe", "recem", "recém"] },
  { nome: "Sono do bebê", url: vidSonoBebe, keywords: ["sono", "dormir"] },
  { nome: "Amamentação · Janela ao amanhecer", url: amamentacao2.url, keywords: ["amament", "leite", "peito"] },
  { nome: "Amamentação · Pele a pele", url: amamentacao3.url, keywords: ["amament", "leite", "peito"] },
  { nome: "Amamentação · Momento aconchego", url: amamentacao4.url, keywords: ["amament", "leite", "peito"] },
  { nome: "Amamentação · Cadeira de balanço", url: amamentacao5.url, keywords: ["amament", "leite", "peito"] },
  { nome: "Amamentação · Bomba e ordenha", url: amamentacao6.url, keywords: ["amament", "leite", "peito", "ordenha", "bomba"] },
  { nome: "Amamentação · Pega correta", url: amamentacao7.url, keywords: ["amament", "leite", "peito", "pega"] },
  { nome: "Amamentação · Sono após mamar", url: amamentacao8.url, keywords: ["amament", "leite", "peito"] },
  { nome: "Amamentação · Manhã serena", url: amamentacao9.url, keywords: ["amament", "leite", "peito"] },
  { nome: "Amamentação · Apoio da família", url: amamentacao10.url, keywords: ["amament", "leite", "peito", "famil"] },
  { nome: "Amamentação · Consultora de lactação", url: amamentacao11.url, keywords: ["amament", "leite", "peito", "lactac", "consult"] },
];

const c = {
  cream: "#FAF5EE", warm: "#F5EDE0", sage: "#5C8A6E", sageDark: "#2D5A42",
  ink: "#1C1C1A", muted: "#6B6560", border: "#E8DDD2", danger: "#B23A48", gold: "#C9A35B",
};
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";
const BUCKET = "materiais-video";

type Tema = { id: string; slug: string; titulo: string };
type VideoFile = {
  name: string;
  path: string;
  size: number;
  updated_at: string | null;
  contentType: string | null;
};

export default function MultimidiaTab() {
  const [temas, setTemas] = useState<Tema[]>([]);
  const [temaId, setTemaId] = useState<string>("__geral");
  const [files, setFiles] = useState<VideoFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    supabase
      .from("cursos")
      .select("id, slug, titulo")
      .order("titulo")
      .then(({ data }) => setTemas((data ?? []) as Tema[]));
  }, []);

  const folder = useMemo(() => {
    if (temaId === "__geral") return "geral";
    const t = temas.find((x) => x.id === temaId);
    return t?.slug ?? temaId;
  }, [temaId, temas]);

  const reload = async () => {
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(folder, { limit: 200, sortBy: { column: "updated_at", order: "desc" } });
    if (error) setErr(error.message);
    setFiles(
      (data ?? [])
        .filter((f) => f.name && !f.name.endsWith("/"))
        .map((f: any) => ({
          name: f.name,
          path: `${folder}/${f.name}`,
          size: f.metadata?.size ?? 0,
          updated_at: f.updated_at ?? f.created_at ?? null,
          contentType: f.metadata?.mimetype ?? null,
        }))
    );
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, [folder]);

  const onUpload = async (file: File) => {
    setUploading(true);
    setProgress(0);
    setErr(null);
    setMsg(null);
    const cleanName = file.name.replace(/\s+/g, "-");
    const path = `${folder}/${Date.now()}-${cleanName}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "video/mp4",
    });
    setUploading(false);
    setProgress(100);
    if (error) setErr(error.message);
    else setMsg("Vídeo enviado.");
    if (inputRef.current) inputRef.current.value = "";
    reload();
  };

  const onDownload = async (f: VideoFile) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(f.path, 60 * 10, {
      download: f.name,
    });
    if (error || !data?.signedUrl) {
      setErr(error?.message || "Erro ao gerar link de download.");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const onCopyUrl = async (f: VideoFile) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(f.path, 60 * 60 * 24);
    if (error || !data?.signedUrl) {
      setErr(error?.message || "Erro ao gerar link.");
      return;
    }
    await navigator.clipboard.writeText(data.signedUrl);
    setMsg("Link copiado (válido por 24h).");
  };

  const onCopyPath = async (f: VideoFile) => {
    await navigator.clipboard.writeText(f.path);
    setMsg("Caminho copiado.");
  };

  const onDelete = async (f: VideoFile) => {
    if (!(await appConfirm(`Remover "${f.name}"? Esta ação é permanente.`))) return;
    const { error } = await supabase.storage.from(BUCKET).remove([f.path]);
    if (error) setErr(error.message);
    else setMsg("Vídeo removido.");
    reload();
  };

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "flex-end", marginBottom: 18, padding: 14, background: c.warm, border: `1px solid ${c.border}` }}>
        <label style={selWrap}>
          <span style={selLabel}>Tema</span>
          <select value={temaId} onChange={(e) => setTemaId(e.target.value)} style={sel}>
            <option value="__geral">Geral (sem tema)</option>
            {temas.map((t) => (
              <option key={t.id} value={t.id}>{t.titulo}</option>
            ))}
          </select>
        </label>
        <div style={{ flex: 1 }} />
        <label style={btnPrimary(c.sageDark)}>
          {uploading ? `Enviando… ${progress}%` : "Enviar vídeo"}
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            style={{ display: "none" }}
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
            }}
          />
        </label>
      </div>

      <p style={{ color: c.muted, fontSize: 13, margin: "0 0 12px" }}>
        Biblioteca de vídeos para usar como capa de aula ou como vídeo principal da aula.
        Organize por tema e copie o link para colar no editor da aula.
      </p>

      {msg && <div style={banner(c.sage)}>{msg}</div>}
      {err && <div style={banner(c.danger)}>{err}</div>}

      {(() => {
        const haystack = (() => {
          if (temaId === "__geral") return "";
          const t = temas.find((x) => x.id === temaId);
          return `${t?.slug ?? ""} ${t?.titulo ?? ""}`.toLowerCase();
        })();
        const matches = temaId === "__geral"
          ? BUILTIN_VIDEOS
          : BUILTIN_VIDEOS.filter((v) => v.keywords.some((k) => haystack.includes(k)));
        const list = matches.length ? matches : BUILTIN_VIDEOS;
        const copyBuiltin = async (url: string) => {
          const full = typeof window !== "undefined" ? new URL(url, window.location.origin).toString() : url;
          await navigator.clipboard.writeText(full);
          setMsg("Link do vídeo integrado copiado.");
        };
        return (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: c.muted, marginBottom: 8, fontFamily: sans }}>
              Vídeos integrados {temaId === "__geral" ? "(biblioteca padrão)" : matches.length ? "· sugeridos para este tema" : "· biblioteca completa"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              {list.map((v) => (
                <div key={v.url} style={{ background: "white", border: `1px solid ${c.border}`, padding: 10 }}>
                  <video src={v.url} muted playsInline preload="metadata" style={{ width: "100%", height: 120, objectFit: "cover", background: "#000" }} onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play().catch(() => {})} onMouseLeave={(e) => { const el = e.currentTarget as HTMLVideoElement; el.pause(); el.currentTime = 0; }} />
                  <div style={{ fontFamily: serif, fontSize: 16, color: c.ink, marginTop: 8 }}>{v.nome}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    <button onClick={() => copyBuiltin(v.url)} style={btnSm(c.sage)}>Copiar link</button>
                    <a href={v.url} target="_blank" rel="noreferrer" style={{ ...btnSm(c.sageDark), textDecoration: "none", display: "inline-block" }}>Abrir</a>
                    <a href={v.url} download={`${v.nome.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.mp4`} style={{ ...btnSm(c.gold), textDecoration: "none", display: "inline-block" }}>Baixar</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: c.muted, marginBottom: 8, fontFamily: sans }}>
        Enviados pelo time
      </div>


      <div style={{ background: "white", border: `1px solid ${c.border}` }}>
        {loading ? (
          <div style={{ padding: 24, color: c.muted, fontFamily: sans }}>Carregando…</div>
        ) : files.length === 0 ? (
          <div style={{ padding: 24, color: c.muted, fontFamily: sans }}>
            Nenhum vídeo neste tema ainda. Envie o primeiro acima.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: sans }}>
            <thead>
              <tr style={{ background: c.cream }}>
                <Th>Arquivo</Th>
                <Th>Tamanho</Th>
                <Th>Atualizado</Th>
                <Th>Ações</Th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.path} style={{ borderTop: `1px solid ${c.border}` }}>
                  <Td>
                    <div style={{ fontFamily: serif, fontSize: 18, color: c.ink }}>{f.name}</div>
                    <div style={{ fontSize: 11, color: c.muted, marginTop: 2 }}>{f.path}</div>
                  </Td>
                  <Td>{formatSize(f.size)}</Td>
                  <Td>{f.updated_at ? new Date(f.updated_at).toLocaleString("pt-BR") : "—"}</Td>
                  <Td>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button onClick={() => onDownload(f)} style={btnSm(c.sageDark)}>Baixar</button>
                      <button onClick={() => onCopyUrl(f)} style={btnSm(c.sage)}>Copiar link</button>
                      <button onClick={() => onCopyPath(f)} style={btnSm(c.gold)}>Copiar caminho</button>
                      <button onClick={() => onDelete(f)} style={btnSm(c.danger)}>Remover</button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function formatSize(bytes: number) {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

const Th = ({ children }: any) => (
  <th style={{ textAlign: "left", padding: "12px 14px", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: c.muted, fontWeight: 500 }}>{children}</th>
);
const Td = ({ children }: any) => <td style={{ padding: "14px 14px", color: c.ink, verticalAlign: "top" }}>{children}</td>;

const selWrap: CSSProperties = { display: "flex", flexDirection: "column", gap: 4 };
const selLabel: CSSProperties = { fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: c.muted };
const sel: CSSProperties = { background: "white", border: `1px solid ${c.border}`, padding: "8px 12px", fontFamily: sans, fontSize: 13, color: c.ink, minWidth: 220 };

function btnPrimary(bg: string): CSSProperties {
  return { background: bg, color: "white", fontSize: 12, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", padding: "12px 22px", border: "none", cursor: "pointer", fontFamily: sans, display: "inline-flex", alignItems: "center", justifyContent: "center" };
}
function btnSm(bg: string): CSSProperties {
  return { background: bg, color: "white", fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", padding: "6px 12px", border: "none", cursor: "pointer", fontFamily: sans };
}
function banner(bg: string): CSSProperties {
  return { background: bg, color: "white", padding: "10px 14px", fontFamily: sans, fontSize: 13, marginBottom: 12 };
}
