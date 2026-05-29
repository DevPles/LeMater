import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  appointmentId: string;
  gestanteId: string;
  professionalUserId: string;
  /** Compact mode for sidebar inside video room */
  compact?: boolean;
  /** Optional close handler (shows a close button in the header) */
  onClose?: () => void;
};

type Tab = "obs" | "med" | "exame" | "imagem" | "vacina";

type SavedState = "idle" | "saving" | "saved" | "error";

const PARAM_OPTIONS = [
  "Pressão arterial sistólica",
  "Pressão arterial diastólica",
  "Peso (kg)",
  "Altura uterina (cm)",
  "BCF (bpm)",
  "Glicemia capilar",
  "Temperatura",
  "Outro",
];

function semanasFromDum(dum: string | null): number | null {
  if (!dum) return null;
  const diff = Date.now() - new Date(dum).getTime();
  if (diff < 0) return null;
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
}

export function ConsultationNotesPanel({
  appointmentId,
  gestanteId,
  professionalUserId,
  compact = false,
  onClose,
}: Props) {
  const [tab, setTab] = useState<Tab>("obs");
  const [dum, setDum] = useState<string | null>(null);
  const semanaAtual = useMemo(() => semanasFromDum(dum), [dum]);

  // observação clínica
  const [obs, setObs] = useState("");
  const [noteId, setNoteId] = useState<string | null>(null);
  const [savedState, setSavedState] = useState<SavedState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // estado dos formulários
  const [feedback, setFeedback] = useState<{
    tipo: "ok" | "err";
    msg: string;
  } | null>(null);

  // ----- carrega dum + nota existente -----
  useEffect(() => {
    let ativo = true;
    (async () => {
      const { data: prof } = await supabase
        .from("profiles")
        .select("dum")
        .eq("user_id", gestanteId)
        .maybeSingle();
      if (ativo) setDum((prof as { dum: string | null } | null)?.dum ?? null);

      const { data: note } = await supabase
        .from("consultation_notes")
        .select("id, observacoes")
        .eq("appointment_id", appointmentId)
        .eq("professional_user_id", professionalUserId)
        .maybeSingle();
      if (!ativo) return;
      if (note) {
        setNoteId((note as { id: string }).id);
        setObs((note as { observacoes: string | null }).observacoes ?? "");
      }
    })();
    return () => {
      ativo = false;
    };
  }, [appointmentId, gestanteId, professionalUserId]);

  // ----- autosave da observação -----
  useEffect(() => {
    if (savedState === "idle" && obs === "" && !noteId) return;
    const timeout = setTimeout(async () => {
      setSavedState("saving");
      try {
        if (noteId) {
          const { error } = await supabase
            .from("consultation_notes")
            .update({ observacoes: obs })
            .eq("id", noteId);
          if (error) throw error;
        } else {
          const { data, error } = await supabase
            .from("consultation_notes")
            .insert({
              appointment_id: appointmentId,
              gestante_id: gestanteId,
              professional_user_id: professionalUserId,
              observacoes: obs,
            })
            .select("id")
            .single();
          if (error) throw error;
          setNoteId((data as { id: string }).id);
        }
        setSavedState("saved");
        setLastSavedAt(new Date());
      } catch (e) {
        console.error("autosave nota", e);
        setSavedState("error");
      }
    }, 900);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obs]);

  function flash(tipo: "ok" | "err", msg: string) {
    setFeedback({ tipo, msg });
    setTimeout(() => setFeedback(null), 2500);
  }

  // ----- handlers -----
  async function salvarMedicao(form: FormData) {
    const parametro = String(form.get("parametro") || "").trim();
    const valor = Number(form.get("valor"));
    const sem = form.get("semana");
    const observacao = String(form.get("obs") || "").trim();

    if (!parametro || Number.isNaN(valor)) {
      flash("err", "Informe parâmetro e valor numérico.");
      return;
    }
    const { error } = await supabase.from("clinical_measurements").insert({
      gestante_id: gestanteId,
      registrado_por: professionalUserId,
      appointment_id: appointmentId,
      parametro,
      valor,
      semana_gestacional: sem ? Number(sem) : semanaAtual,
      observacao: observacao || null,
    });
    if (error) {
      console.error(error);
      flash("err", "Falha ao salvar medição.");
    } else {
      flash("ok", "Medição registrada.");
    }
  }

  async function salvarExame(form: FormData) {
    const tipo_exame = String(form.get("tipo") || "").trim();
    const resultado = String(form.get("resultado") || "").trim();
    const status = String(form.get("status") || "normal");
    const observacao = String(form.get("obs") || "").trim();
    if (!tipo_exame || !resultado) {
      flash("err", "Informe o tipo e o resultado.");
      return;
    }
    const { error } = await supabase.from("exam_results").insert({
      gestante_id: gestanteId,
      registrado_por: professionalUserId,
      appointment_id: appointmentId,
      tipo_exame,
      resultado,
      status,
      observacao: observacao || null,
    });
    if (error) {
      console.error(error);
      flash("err", "Falha ao salvar exame.");
    } else {
      flash("ok", "Exame registrado.");
    }
  }

  async function salvarImagem(form: FormData) {
    const tipo_exame = String(form.get("tipo") || "").trim();
    const status = String(form.get("status") || "normal");
    const laudo_texto = String(form.get("laudo") || "").trim();
    if (!tipo_exame) {
      flash("err", "Informe o tipo do exame.");
      return;
    }
    const { error } = await supabase.from("image_exam_results").insert({
      gestante_id: gestanteId,
      registrado_por: professionalUserId,
      appointment_id: appointmentId,
      tipo_exame,
      status,
      semana_gestacional: semanaAtual,
      laudo_texto: laudo_texto || null,
    });
    if (error) {
      console.error(error);
      flash("err", "Falha ao salvar exame de imagem.");
    } else {
      flash("ok", "Exame de imagem registrado.");
    }
  }

  async function salvarVacina(form: FormData) {
    const vacina = String(form.get("vacina") || "").trim();
    const lote = String(form.get("lote") || "").trim();
    const fabricante = String(form.get("fabricante") || "").trim();
    const observacao = String(form.get("obs") || "").trim();
    if (!vacina) {
      flash("err", "Informe a vacina.");
      return;
    }
    const { error } = await supabase.from("vaccinations").insert({
      gestante_id: gestanteId,
      registrado_por: professionalUserId,
      appointment_id: appointmentId,
      vacina,
      lote: lote || null,
      fabricante: fabricante || null,
      observacao: observacao || null,
    } as any);
    if (error) {
      console.error(error);
      flash("err", "Falha ao salvar vacina.");
    } else {
      flash("ok", "Vacina registrada.");
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "obs", label: "Observações" },
    { id: "med", label: "Medições" },
    { id: "exame", label: "Exames" },
    { id: "imagem", label: "Imagem" },
    { id: "vacina", label: "Vacinas" },
  ];

  return (
    <div
      className={`flex flex-col bg-card border border-border rounded-2xl overflow-hidden ${
        compact ? "h-full" : ""
      }`}
    >
      <div className="px-3 py-2 border-b border-border bg-muted/40 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-foreground">
            Anotações da consulta
          </p>
          <p className="text-[10px] text-muted-foreground">
            {semanaAtual !== null
              ? `Semana gestacional atual: ${semanaAtual}`
              : "Semana gestacional não calculada (DUM ausente)"}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar anotações"
            className="flex-shrink-0 w-8 h-8 rounded-full bg-background border border-border text-foreground text-base font-bold leading-none flex items-center justify-center hover:bg-muted transition"
          >
            ×
          </button>
        )}
      </div>

      {/* tabs */}
      <div className="flex flex-wrap gap-1 px-2 py-2 border-b border-border bg-background">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full transition ${
              tab === t.id
                ? "bg-[#1a1557] text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {feedback && (
        <div
          className={`mx-3 mt-2 text-[11px] font-semibold rounded-lg px-3 py-1.5 ${
            feedback.tipo === "ok"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}
        >
          {feedback.msg}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {tab === "obs" && (
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Observações clínicas (privadas)
            </label>
            <textarea
              value={obs}
              onChange={(e) => {
                setObs(e.target.value);
                if (savedState !== "saving") setSavedState("idle");
              }}
              rows={compact ? 8 : 6}
              placeholder="Anote queixas, conduta, plano terapêutico, orientações..."
              className="w-full text-xs rounded-lg border border-border bg-background p-3 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
            <p className="text-[10px] text-muted-foreground">
              {savedState === "saving" && "Salvando..."}
              {savedState === "saved" &&
                lastSavedAt &&
                `Salvo às ${lastSavedAt.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })} • visível somente para profissionais e admin`}
              {savedState === "error" &&
                "Erro ao salvar — verifique a conexão"}
              {savedState === "idle" &&
                "Salvamento automático • visível somente para profissionais e admin"}
            </p>
          </div>
        )}

        {tab === "med" && (
          <FormaMedicao
            onSubmit={salvarMedicao}
            semanaAtual={semanaAtual}
          />
        )}

        {tab === "exame" && <FormaExame onSubmit={salvarExame} />}

        {tab === "imagem" && <FormaImagem onSubmit={salvarImagem} />}

        {tab === "vacina" && <FormaVacina onSubmit={salvarVacina} />}
      </div>
    </div>
  );
}

/* ============== Sub-formulários ============== */

function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wide font-bold text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function btnSalvar() {
  return "w-full mt-2 px-4 py-2 rounded-full text-xs font-bold bg-[#1a1557] text-white hover:opacity-90";
}

function inputClass() {
  return "mt-1 w-full text-xs rounded-lg border border-border bg-background p-2 focus:outline-none focus:ring-2 focus:ring-primary/40";
}

function FormaMedicao({
  onSubmit,
  semanaAtual,
}: {
  onSubmit: (f: FormData) => Promise<void>;
  semanaAtual: number | null;
}) {
  const [parametro, setParametro] = useState(PARAM_OPTIONS[0]);
  const [outro, setOutro] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        if (parametro === "Outro") {
          fd.set("parametro", outro);
        } else {
          fd.set("parametro", parametro);
        }
        setBusy(true);
        await onSubmit(fd);
        setBusy(false);
        (e.currentTarget as HTMLFormElement).reset();
        setOutro("");
      }}
      className="space-y-2"
    >
      <Campo label="Parâmetro">
        <select
          value={parametro}
          onChange={(e) => setParametro(e.target.value)}
          className={inputClass()}
        >
          {PARAM_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </Campo>
      {parametro === "Outro" && (
        <Campo label="Nome do parâmetro">
          <input
            value={outro}
            onChange={(e) => setOutro(e.target.value)}
            className={inputClass()}
            required
          />
        </Campo>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Campo label="Valor">
          <input
            name="valor"
            type="number"
            step="0.01"
            className={inputClass()}
            required
          />
        </Campo>
        <Campo label="Semana gest.">
          <input
            name="semana"
            type="number"
            defaultValue={semanaAtual ?? ""}
            className={inputClass()}
          />
        </Campo>
      </div>
      <Campo label="Observação (opcional)">
        <input name="obs" className={inputClass()} />
      </Campo>
      <button type="submit" disabled={busy} className={btnSalvar()}>
        {busy ? "Salvando..." : "Registrar medição"}
      </button>
    </form>
  );
}

function FormaExame({
  onSubmit,
}: {
  onSubmit: (f: FormData) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setBusy(true);
        await onSubmit(fd);
        setBusy(false);
        (e.currentTarget as HTMLFormElement).reset();
      }}
      className="space-y-2"
    >
      <Campo label="Tipo de exame">
        <input
          name="tipo"
          list="sugestoes-exame-lab"
          placeholder="Ex.: Hemograma, Glicemia, TOTG, Estreptococo B..."
          className={inputClass()}
          required
        />
        <datalist id="sugestoes-exame-lab">
          <option value="Hemograma" />
          <option value="Glicemia de jejum" />
          <option value="Urina (EAS)" />
          <option value="TOTG (tolerância à glicose)" />
          <option value="Estreptococo B" />
          <option value="VDRL" />
          <option value="HIV" />
          <option value="Toxoplasmose IgG/IgM" />
        </datalist>
      </Campo>
      <Campo label="Resultado">
        <input name="resultado" className={inputClass()} required />
      </Campo>
      <Campo label="Status">
        <select name="status" className={inputClass()}>
          <option value="normal">Normal</option>
          <option value="alterado">Alterado</option>
          <option value="pendente">Pendente</option>
        </select>
      </Campo>
      <Campo label="Observação (opcional)">
        <input name="obs" className={inputClass()} />
      </Campo>
      <button type="submit" disabled={busy} className={btnSalvar()}>
        {busy ? "Salvando..." : "Registrar exame"}
      </button>
    </form>
  );
}

function FormaImagem({
  onSubmit,
}: {
  onSubmit: (f: FormData) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setBusy(true);
        await onSubmit(fd);
        setBusy(false);
        (e.currentTarget as HTMLFormElement).reset();
      }}
      className="space-y-2"
    >
      <Campo label="Tipo de exame">
        <input
          name="tipo"
          placeholder="Ex.: USG obstétrico, USG morfológico..."
          className={inputClass()}
          required
        />
      </Campo>
      <Campo label="Status">
        <select name="status" className={inputClass()}>
          <option value="normal">Normal</option>
          <option value="alterado">Alterado</option>
          <option value="pendente">Pendente</option>
        </select>
      </Campo>
      <Campo label="Laudo / observação">
        <textarea
          name="laudo"
          rows={3}
          className={`${inputClass()} resize-none`}
        />
      </Campo>
      <button type="submit" disabled={busy} className={btnSalvar()}>
        {busy ? "Salvando..." : "Registrar exame de imagem"}
      </button>
    </form>
  );
}

function FormaVacina({
  onSubmit,
}: {
  onSubmit: (f: FormData) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setBusy(true);
        await onSubmit(fd);
        setBusy(false);
        (e.currentTarget as HTMLFormElement).reset();
      }}
      className="space-y-2"
    >
      <Campo label="Vacina aplicada">
        <input
          name="vacina"
          placeholder="Ex.: dTpa, Influenza, Hepatite B..."
          className={inputClass()}
          required
        />
      </Campo>
      <div className="grid grid-cols-2 gap-2">
        <Campo label="Lote">
          <input name="lote" className={inputClass()} />
        </Campo>
        <Campo label="Fabricante">
          <input name="fabricante" className={inputClass()} />
        </Campo>
      </div>
      <Campo label="Observação (opcional)">
        <input name="obs" className={inputClass()} />
      </Campo>
      <button type="submit" disabled={busy} className={btnSalvar()}>
        {busy ? "Salvando..." : "Registrar vacina"}
      </button>
    </form>
  );
}
