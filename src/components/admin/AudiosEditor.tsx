import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  type CSSProperties,
} from "react";
import { useServerFn } from "@tanstack/react-start";
import { listAudiosByVinculo, saveAudio, deleteAudio } from "@/lib/audios.functions";

/**
 * Editor de áudios (Spotify / podcasts / meditações) vinculados a curso, módulo, aula etc.
 * Mesmo padrão do OfertasEditor: chame ref.current.flush(novoId) após o parent salvar.
 */

export type AudioVinculo = "curso" | "modulo" | "aula" | "servico" | "pacote";
export type TipoAudio =
  | "podcast"
  | "meditacao"
  | "aula_audio"
  | "explicacao"
  | "exercicio"
  | "relaxamento"
  | "bonus";
export type Liberacao = "com_compra" | "apos_aula" | "bonus" | "sempre";

export type AudioRow = {
  id?: string;
  titulo: string;
  descricao: string;
  capa_url: string;
  spotify_url: string;
  audio_url: string;
  tipo_audio: TipoAudio;
  duracao_seg: number;
  ordem: number;
  ativo: boolean;
  gratuito: boolean;
  liberacao: Liberacao;
};

export type AudiosEditorHandle = {
  flush: (vinculoId: string) => Promise<void>;
};

const c = {
  warm: "#F5EDE0",
  sage: "#5C8A6E",
  ink: "#1C1C1A",
  muted: "#6B6560",
  border: "#E8DDD2",
  danger: "#B23A48",
};
const sans = "'DM Sans', sans-serif";
const inp: CSSProperties = {
  width: "100%",
  background: "white",
  border: `1px solid ${c.border}`,
  padding: "8px 10px",
  fontSize: 13,
  fontFamily: sans,
  color: c.ink,
  outline: "none",
};

const TIPOS: { value: TipoAudio; label: string }[] = [
  { value: "podcast", label: "Podcast" },
  { value: "meditacao", label: "Meditação guiada" },
  { value: "aula_audio", label: "Aula em áudio" },
  { value: "explicacao", label: "Explicação complementar" },
  { value: "exercicio", label: "Exercício guiado" },
  { value: "relaxamento", label: "Trilha de relaxamento" },
  { value: "bonus", label: "Conteúdo bônus" },
];

const LIBERACOES: { value: Liberacao; label: string }[] = [
  { value: "sempre", label: "Sempre disponível" },
  { value: "com_compra", label: "Liberado com a compra" },
  { value: "apos_aula", label: "Após assistir a aula" },
  { value: "bonus", label: "Como bônus" },
];

const novo = (): AudioRow => ({
  titulo: "",
  descricao: "",
  capa_url: "",
  spotify_url: "",
  audio_url: "",
  tipo_audio: "podcast",
  duracao_seg: 0,
  ordem: 0,
  ativo: true,
  gratuito: false,
  liberacao: "com_compra",
});

type Props = {
  vinculoTipo: AudioVinculo;
  vinculoId: string | null;
  titulo?: string;
};

const AudiosEditor = forwardRef<AudiosEditorHandle, Props>(function AudiosEditor(
  { vinculoTipo, vinculoId, titulo = "Áudios e Conteúdos Externos" },
  ref,
) {
  const fnList = useServerFn(listAudiosByVinculo);
  const fnSave = useServerFn(saveAudio);
  const fnDel = useServerFn(deleteAudio);

  const [audios, setAudios] = useState<AudioRow[]>([]);
  const [removidos, setRemovidos] = useState<string[]>([]);

  useEffect(() => {
    if (!vinculoId) return;
    (async () => {
      const { audios: rows } = await fnList({
        data: { vinculo_tipo: vinculoTipo, vinculo_id: vinculoId },
      });
      setAudios(
        (rows ?? []).map((r: any) => ({
          id: r.id,
          titulo: r.titulo ?? "",
          descricao: r.descricao ?? "",
          capa_url: r.capa_url ?? "",
          spotify_url: r.spotify_url ?? "",
          audio_url: r.audio_url ?? "",
          tipo_audio: (r.tipo_audio ?? "podcast") as TipoAudio,
          duracao_seg: r.duracao_seg ?? 0,
          ordem: r.ordem ?? 0,
          ativo: r.ativo ?? true,
          gratuito: r.gratuito ?? false,
          liberacao: (r.liberacao ?? "com_compra") as Liberacao,
        })),
      );
    })();
  }, [vinculoId, vinculoTipo, fnList]);

  useImperativeHandle(ref, () => ({
    flush: async (id: string) => {
      for (const removedId of removidos) {
        try { await fnDel({ data: { id: removedId } }); } catch {}
      }
      setRemovidos([]);
      for (let i = 0; i < audios.length; i++) {
        const a = audios[i];
        if (!a.titulo.trim()) continue;
        await fnSave({
          data: {
            id: a.id,
            vinculo_tipo: vinculoTipo,
            vinculo_id: id,
            titulo: a.titulo.trim(),
            descricao: a.descricao.trim() || null,
            capa_url: a.capa_url.trim() || null,
            spotify_url: a.spotify_url.trim() || null,
            audio_url: a.audio_url.trim() || null,
            tipo_audio: a.tipo_audio,
            duracao_seg: Math.max(0, Math.floor(a.duracao_seg)),
            ordem: i,
            ativo: a.ativo,
            gratuito: a.gratuito,
            liberacao: a.liberacao,
          },
        });
      }
    },
  }), [audios, removidos, fnSave, fnDel, vinculoTipo]);

  const update = (idx: number, patch: Partial<AudioRow>) => {
    setAudios((prev) => {
      const arr = [...prev];
      arr[idx] = { ...arr[idx], ...patch };
      return arr;
    });
  };
  const remove = (idx: number) => {
    setAudios((prev) => {
      const arr = [...prev];
      const [r] = arr.splice(idx, 1);
      if (r?.id) setRemovidos((rm) => [...rm, r.id!]);
      return arr;
    });
  };

  return (
    <div style={{ background: c.warm, border: `1px solid ${c.border}`, padding: 14 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: c.muted, marginBottom: 12, fontFamily: sans }}>
        {titulo}
      </div>

      {audios.length === 0 && (
        <div style={{ fontSize: 12, color: c.muted, marginBottom: 10, fontFamily: sans }}>
          Nenhum áudio vinculado.
        </div>
      )}

      {audios.map((a, i) => (
        <div
          key={a.id ?? `new-${i}`}
          style={{
            background: "white",
            border: `1px solid ${c.border}`,
            padding: 10,
            marginBottom: 10,
            display: "grid",
            gap: 8,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8 }}>
            <label style={{ display: "block" }}>
              <div style={{ fontSize: 10, color: c.muted, marginBottom: 2 }}>Título</div>
              <input value={a.titulo} onChange={(e) => update(i, { titulo: e.target.value })} style={inp} />
            </label>
            <label style={{ display: "block" }}>
              <div style={{ fontSize: 10, color: c.muted, marginBottom: 2 }}>Tipo</div>
              <select value={a.tipo_audio} onChange={(e) => update(i, { tipo_audio: e.target.value as TipoAudio })} style={inp}>
                {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </label>
            <label style={{ display: "block" }}>
              <div style={{ fontSize: 10, color: c.muted, marginBottom: 2 }}>Duração (segundos)</div>
              <input
                type="number"
                min={0}
                value={a.duracao_seg}
                onChange={(e) => update(i, { duracao_seg: parseInt(e.target.value) || 0 })}
                style={inp}
              />
            </label>
          </div>

          <label style={{ display: "block" }}>
            <div style={{ fontSize: 10, color: c.muted, marginBottom: 2 }}>Descrição curta</div>
            <textarea value={a.descricao} onChange={(e) => update(i, { descricao: e.target.value })} style={{ ...inp, minHeight: 50 }} />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <label style={{ display: "block" }}>
              <div style={{ fontSize: 10, color: c.muted, marginBottom: 2 }}>Capa (URL)</div>
              <input value={a.capa_url} onChange={(e) => update(i, { capa_url: e.target.value })} style={inp} placeholder="https://…" />
            </label>
            <label style={{ display: "block" }}>
              <div style={{ fontSize: 10, color: c.muted, marginBottom: 2 }}>Link Spotify</div>
              <input value={a.spotify_url} onChange={(e) => update(i, { spotify_url: e.target.value })} style={inp} placeholder="https://open.spotify.com/…" />
            </label>
            <label style={{ display: "block" }}>
              <div style={{ fontSize: 10, color: c.muted, marginBottom: 2 }}>Link MP3/streaming alternativo</div>
              <input value={a.audio_url} onChange={(e) => update(i, { audio_url: e.target.value })} style={inp} placeholder="https://…" />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <label style={{ display: "block" }}>
              <div style={{ fontSize: 10, color: c.muted, marginBottom: 2 }}>Liberação</div>
              <select value={a.liberacao} onChange={(e) => update(i, { liberacao: e.target.value as Liberacao })} style={inp}>
                {LIBERACOES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </label>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-end", justifyContent: "space-between" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: c.ink }}>
                <input type="checkbox" checked={a.gratuito} onChange={(e) => update(i, { gratuito: e.target.checked })} />
                Gratuito
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: c.ink }}>
                <input type="checkbox" checked={a.ativo} onChange={(e) => update(i, { ativo: e.target.checked })} />
                Ativo
              </label>
              <button
                type="button"
                onClick={() => remove(i)}
                style={{ background: "transparent", border: `1px solid ${c.border}`, color: c.danger, padding: "6px 12px", cursor: "pointer", fontSize: 11, fontFamily: sans, letterSpacing: "0.08em", textTransform: "uppercase" }}
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setAudios((p) => [...p, novo()])}
        style={{
          background: c.sage,
          color: "white",
          border: "none",
          padding: "8px 14px",
          cursor: "pointer",
          fontSize: 11,
          fontFamily: sans,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        + Adicionar áudio
      </button>
    </div>
  );
});

export default AudiosEditor;
