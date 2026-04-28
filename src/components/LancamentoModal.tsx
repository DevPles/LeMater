import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "med" | "exame" | "vacina" | "historico";

const HISTORICO_TIPOS: { value: string; label: string }[] = [
  { value: "normal", label: "PN — Parto normal" },
  { value: "cesarea", label: "PC — Parto cesárea" },
  { value: "forceps", label: "PF — Parto fórceps" },
  { value: "aborto", label: "AB — Aborto" },
  { value: "nati_morto", label: "Natimorto" },
];

const PARAM_OPTIONS = [
  "Pressão arterial sistólica",
  "Pressão arterial diastólica",
  "Peso (kg)",
  "Altura uterina (cm)",
  "BCF (bpm)",
  "Glicemia capilar",
  "Temperatura",
  "Estatura",
  "Outro",
];

type Props = {
  open: boolean;
  onClose: () => void;
  gestanteId: string;
  semanaAtual: number | null;
  onSaved?: () => void;
  initialTab?: Tab;
};

export function LancamentoModal({
  open,
  onClose,
  gestanteId,
  semanaAtual,
  onSaved,
  initialTab = "med",
}: Props) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [feedback, setFeedback] = useState<{ tipo: "ok" | "err"; msg: string } | null>(null);

  function flash(tipo: "ok" | "err", msg: string) {
    setFeedback({ tipo, msg });
    setTimeout(() => setFeedback(null), 2500);
  }

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
      registrado_por: gestanteId,
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
      onSaved?.();
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
      registrado_por: gestanteId,
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
      onSaved?.();
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
      registrado_por: gestanteId,
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
      onSaved?.();
    }
  }

  async function salvarHistoricoEventos(eventos: Record<string, any>[]) {
    if (!eventos.length) {
      flash("err", "Preencha ao menos um campo.");
      return;
    }
    const { data: prof, error: errLoad } = await supabase
      .from("profiles")
      .select("partos_classificacao, numero_partos, numero_abortos, numero_gestacoes")
      .eq("user_id", gestanteId)
      .maybeSingle();
    if (errLoad) {
      console.error(errLoad);
      flash("err", "Falha ao carregar perfil.");
      return;
    }
    const atual = Array.isArray(prof?.partos_classificacao) ? (prof!.partos_classificacao as any[]) : [];
    const stamped = eventos.map((e) => ({ registrado_em: new Date().toISOString(), ...e }));
    const novaLista = [...atual, ...stamped];

    let addPartos = 0;
    let addAbortos = 0;
    for (const e of eventos) {
      const t = String(e.tipo || "");
      if (t === "normal" || t === "cesarea" || t === "forceps") addPartos++;
      if (t === "aborto") addAbortos++;
    }
    const novoPartos = (prof?.numero_partos ?? 0) + addPartos;
    const novoAbortos = (prof?.numero_abortos ?? 0) + addAbortos;
    const novoGest = Math.max(prof?.numero_gestacoes ?? 0, novoPartos + novoAbortos);

    const { error } = await supabase
      .from("profiles")
      .update({
        partos_classificacao: novaLista as any,
        numero_partos: novoPartos,
        numero_abortos: novoAbortos,
        numero_gestacoes: novoGest,
      })
      .eq("user_id", gestanteId);
    if (error) {
      console.error(error);
      flash("err", "Falha ao salvar histórico.");
    } else {
      flash("ok", `Histórico registrado (${eventos.length}).`);
      onSaved?.();
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "med", label: "Medição" },
    { id: "exame", label: "Exame" },
    { id: "vacina", label: "Vacina" },
    { id: "historico", label: "Histórico" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 p-0 md:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 260 }}
            className="bg-card w-full md:max-w-md rounded-t-3xl md:rounded-3xl max-h-[90vh] overflow-y-auto border border-border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
              <div>
                <h3 className="font-display font-bold text-base text-foreground">Novo lançamento</h3>
                <p className="text-[11px] text-muted-foreground">
                  {semanaAtual !== null ? `Semana gestacional: ${semanaAtual}` : "Semana gestacional não calculada"}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="w-8 h-8 rounded-full bg-muted text-foreground text-base font-bold leading-none flex items-center justify-center hover:bg-muted/70"
              >
                ×
              </button>
            </div>

            <div className="flex gap-1 p-3 border-b border-border">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 text-[11px] font-bold uppercase tracking-wide px-3 py-2 rounded-full transition ${
                    tab === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {feedback && (
              <div
                className={`mx-3 mt-3 text-[11px] font-semibold rounded-lg px-3 py-1.5 ${
                  feedback.tipo === "ok"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {feedback.msg}
              </div>
            )}

            <div className="p-4">
              {tab === "med" && <FormaMedicao onSubmit={salvarMedicao} semanaAtual={semanaAtual} />}
              {tab === "exame" && <FormaExame onSubmit={salvarExame} />}
              {tab === "vacina" && <FormaVacina onSubmit={salvarVacina} />}
              {tab === "historico" && <FormaHistorico onSubmit={salvarHistoricoEventos} />}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wide font-bold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const inputClass = "mt-1 w-full text-xs rounded-lg border border-border bg-background p-2 focus:outline-none focus:ring-2 focus:ring-primary/40";
const btnSalvar = "w-full mt-3 px-4 py-2.5 rounded-full text-xs font-bold bg-primary text-primary-foreground hover:opacity-90";

function FormaMedicao({ onSubmit, semanaAtual }: { onSubmit: (f: FormData) => Promise<void>; semanaAtual: number | null }) {
  const [parametro, setParametro] = useState(PARAM_OPTIONS[0]);
  const [outro, setOutro] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("parametro", parametro === "Outro" ? outro : parametro);
        setBusy(true);
        await onSubmit(fd);
        setBusy(false);
        (e.currentTarget as HTMLFormElement).reset();
        setOutro("");
      }}
      className="space-y-2"
    >
      <Campo label="Parâmetro">
        <select value={parametro} onChange={(e) => setParametro(e.target.value)} className={inputClass}>
          {PARAM_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </Campo>
      {parametro === "Outro" && (
        <Campo label="Nome do parâmetro">
          <input value={outro} onChange={(e) => setOutro(e.target.value)} className={inputClass} required />
        </Campo>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Campo label="Valor">
          <input name="valor" type="number" step="0.01" className={inputClass} required />
        </Campo>
        <Campo label="Semana gest.">
          <input name="semana" type="number" defaultValue={semanaAtual ?? ""} className={inputClass} />
        </Campo>
      </div>
      <Campo label="Observação (opcional)">
        <input name="obs" className={inputClass} />
      </Campo>
      <button type="submit" disabled={busy} className={btnSalvar}>
        {busy ? "Salvando..." : "Registrar medição"}
      </button>
    </form>
  );
}

function FormaExame({ onSubmit }: { onSubmit: (f: FormData) => Promise<void> }) {
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
        <input name="tipo" placeholder="Ex.: Hemograma, Glicemia de jejum..." className={inputClass} required />
      </Campo>
      <Campo label="Resultado">
        <input name="resultado" className={inputClass} required />
      </Campo>
      <Campo label="Status">
        <select name="status" className={inputClass}>
          <option value="normal">Normal</option>
          <option value="alterado">Alterado</option>
          <option value="pendente">Pendente</option>
        </select>
      </Campo>
      <Campo label="Observação (opcional)">
        <input name="obs" className={inputClass} />
      </Campo>
      <button type="submit" disabled={busy} className={btnSalvar}>
        {busy ? "Salvando..." : "Registrar exame"}
      </button>
    </form>
  );
}

function FormaVacina({ onSubmit }: { onSubmit: (f: FormData) => Promise<void> }) {
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
      <Campo label="Vacina">
        <input name="vacina" placeholder="Ex.: dTpa, Influenza, Hepatite B..." className={inputClass} required />
      </Campo>
      <div className="grid grid-cols-2 gap-2">
        <Campo label="Lote">
          <input name="lote" className={inputClass} />
        </Campo>
        <Campo label="Fabricante">
          <input name="fabricante" className={inputClass} />
        </Campo>
      </div>
      <Campo label="Observação (opcional)">
        <input name="obs" className={inputClass} />
      </Campo>
      <button type="submit" disabled={busy} className={btnSalvar}>
        {busy ? "Salvando..." : "Registrar vacina"}
      </button>
    </form>
  );
}

function FormaHistorico({ onSubmit }: { onSubmit: (f: FormData) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [tipo, setTipo] = useState(HISTORICO_TIPOS[0].value);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("tipo", tipo);
        setBusy(true);
        await onSubmit(fd);
        setBusy(false);
        (e.currentTarget as HTMLFormElement).reset();
        setTipo(HISTORICO_TIPOS[0].value);
      }}
      className="space-y-2"
    >
      <Campo label="Tipo de evento">
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputClass}>
          {HISTORICO_TIPOS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </Campo>
      <Campo label="Ano (opcional)">
        <input name="ano" type="number" min={1900} max={new Date().getFullYear()} placeholder="Ex.: 2022" className={inputClass} />
      </Campo>
      <Campo label="Observação (opcional)">
        <input name="obs" className={inputClass} />
      </Campo>
      <button type="submit" disabled={busy} className={btnSalvar}>
        {busy ? "Salvando..." : "Registrar histórico"}
      </button>
    </form>
  );
}
