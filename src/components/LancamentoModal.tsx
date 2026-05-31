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
    setTimeout(() => setFeedback(null), tipo === "err" ? 8000 : 2500);
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
    const trimestre = String(form.get("trimestre") || "").trim();
    const dataExame = String(form.get("data_exame") || "").trim();
    const arquivo = form.get("arquivo") as File | null;
    if (!tipo_exame || !resultado) {
      flash("err", "Informe o tipo e o resultado.");
      return;
    }

    let arquivo_path: string | null = null;
    if (arquivo && arquivo.size > 0) {
      const ext = arquivo.name.split(".").pop() || "bin";
      const nome = `${gestanteId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const up = await supabase.storage.from("exam-attachments").upload(nome, arquivo, {
        contentType: arquivo.type || undefined,
        upsert: false,
      });
      if (up.error) {
        console.error(up.error);
        flash("err", "Falha ao enviar arquivo.");
        return;
      }
      arquivo_path = nome;
    }

    const obsFinal = [trimestre ? `Trimestre: ${trimestre}` : "", observacao].filter(Boolean).join(" • ");
    const payload: any = {
      gestante_id: gestanteId,
      registrado_por: gestanteId,
      tipo_exame,
      resultado,
      status,
      observacao: obsFinal || null,
      arquivo_path,
    };
    if (dataExame) payload.data_exame = dataExame;

    const { error } = await supabase.from("exam_results").insert(payload);
    if (error) {
      console.error(error);
      flash("err", "Falha ao salvar exame.");
    } else {
      flash("ok", "Exame registrado.");
      onSaved?.();
    }
  }

  async function salvarExameImagem(form: FormData) {
    const tipo_exame = String(form.get("tipo") || "").trim();
    const ig_usg = String(form.get("ig_usg") || "").trim();
    const peso_fetal = String(form.get("peso_fetal") || "").trim();
    const placenta = String(form.get("placenta") || "").trim();
    const liquido = String(form.get("liquido") || "").trim();
    const laudo_texto = String(form.get("laudo") || "").trim();
    const observacao = String(form.get("obs") || "").trim();
    const dataExame = String(form.get("data_exame") || "").trim();
    const status = String(form.get("status") || "normal");
    const arquivo = form.get("arquivo") as File | null;
    if (!tipo_exame) {
      flash("err", "Informe o tipo de exame.");
      return;
    }

    let imagem_path: string | null = null;
    if (arquivo && arquivo.size > 0) {
      const ext = arquivo.name.split(".").pop() || "bin";
      const nome = `${gestanteId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const up = await supabase.storage.from("image-exams").upload(nome, arquivo, {
        contentType: arquivo.type || undefined,
        upsert: false,
      });
      if (up.error) {
        console.error(up.error);
        flash("err", "Falha ao enviar arquivo.");
        return;
      }
      imagem_path = nome;
    }

    const detalhes = [
      ig_usg && `IG USG: ${ig_usg}`,
      peso_fetal && `Peso fetal: ${peso_fetal}`,
      placenta && `Placenta: ${placenta}`,
      liquido && `Líquido: ${liquido}`,
      laudo_texto && `Laudo: ${laudo_texto}`,
      observacao,
    ].filter(Boolean).join(" • ");

    const payload: any = {
      gestante_id: gestanteId,
      registrado_por: gestanteId,
      tipo_exame,
      status,
      laudo_texto: laudo_texto || null,
      observacao: detalhes || null,
      imagem_path,
      semana_gestacional: semanaAtual ?? null,
    };
    if (dataExame) payload.data_exame = dataExame;

    const { error } = await supabase.from("image_exam_results").insert(payload);
    if (error) {
      console.error(error);
      flash("err", `Falha ao salvar exame de imagem: ${error.message}`);
    } else {
      flash("ok", "Exame de imagem registrado.");
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
              {tab === "exame" && <FormaExame onSubmitLab={salvarExame} onSubmitImg={salvarExameImagem} />}
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
        const form = e.currentTarget;
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("parametro", parametro === "Outro" ? outro : parametro);
        setBusy(true);
        await onSubmit(fd);
        setBusy(false);
        form.reset();
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

const EXAMES_LAB = [
  "Hb/Ht", "Leucograma", "Plaquetas", "Glicemia jejum", "TOTG 75g", "EAS", "Urocultura",
  "VDRL", "Anti-HIV", "HBsAG", "Anti-HCV", "Rubéola", "Toxoplasmose", "CMV", "HTLV",
  "TSH/T4L", "Vitamina D", "PTN 24H", "Bilirrubina Total", "BD/BI", "UR/CR",
  "Ácido Úrico", "TGO/TGP", "LDH", "Coombs Indireto", "Outro",
];

const EXAMES_IMG = [
  "Ultrassonografia obstétrica",
  "Ultrassonografia morfológica 1º trimestre",
  "Ultrassonografia morfológica 2º trimestre",
  "Ultrassonografia transvaginal",
  "Doppler obstétrico",
  "Ecocardiograma fetal",
  "Cardiotocografia",
  "Outro",
];

function FormaExame({ onSubmitLab, onSubmitImg }: { onSubmitLab: (f: FormData) => Promise<void>; onSubmitImg: (f: FormData) => Promise<void> }) {
  const [modo, setModo] = useState<"lab" | "img">("lab");
  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        <button type="button" onClick={() => setModo("lab")} className={`flex-1 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${modo === "lab" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          Laboratorial
        </button>
        <button type="button" onClick={() => setModo("img")} className={`flex-1 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${modo === "img" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          Imagem
        </button>
      </div>
      {modo === "lab" ? <FormaExameLab onSubmit={onSubmitLab} /> : <FormaExameImg onSubmit={onSubmitImg} />}
    </div>
  );
}

function FormaExameLab({ onSubmit }: { onSubmit: (f: FormData) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [tipoSel, setTipoSel] = useState(EXAMES_LAB[0]);
  const [outro, setOutro] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        const form = e.currentTarget;
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("tipo", tipoSel === "Outro" ? outro : tipoSel);
        setBusy(true);
        await onSubmit(fd);
        setBusy(false);
        form.reset();
        setTipoSel(EXAMES_LAB[0]); setOutro("");
      }}
      className="space-y-2"
    >
      <Campo label="Exame">
        <select value={tipoSel} onChange={(e) => setTipoSel(e.target.value)} className={inputClass}>
          {EXAMES_LAB.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
      </Campo>
      {tipoSel === "Outro" && (
        <Campo label="Nome do exame">
          <input value={outro} onChange={(e) => setOutro(e.target.value)} className={inputClass} required />
        </Campo>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Campo label="Trimestre">
          <select name="trimestre" className={inputClass} defaultValue="">
            <option value="">—</option>
            <option value="1º trimestre">1º trimestre</option>
            <option value="2º trimestre">2º trimestre</option>
            <option value="3º trimestre">3º trimestre</option>
          </select>
        </Campo>
        <Campo label="Data do exame">
          <input name="data_exame" type="date" className={inputClass} />
        </Campo>
      </div>
      <Campo label="Resultado">
        <input name="resultado" className={inputClass} required placeholder="Ex.: 12,3 g/dL" />
      </Campo>
      <Campo label="Status">
        <select name="status" className={inputClass}>
          <option value="normal">Normal</option>
          <option value="alterado">Alterado</option>
          <option value="pendente">Pendente</option>
        </select>
      </Campo>
      <Campo label="Anexo (PDF/imagem) — opcional">
        <input name="arquivo" type="file" accept="application/pdf,image/*" className={inputClass} />
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

function FormaExameImg({ onSubmit }: { onSubmit: (f: FormData) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [tipoSel, setTipoSel] = useState(EXAMES_IMG[0]);
  const [outro, setOutro] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        const form = e.currentTarget;
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("tipo", tipoSel === "Outro" ? outro : tipoSel);
        setBusy(true);
        await onSubmit(fd);
        setBusy(false);
        form.reset();
        setTipoSel(EXAMES_IMG[0]); setOutro("");
      }}
      className="space-y-2"
    >
      <Campo label="Tipo de exame">
        <select value={tipoSel} onChange={(e) => setTipoSel(e.target.value)} className={inputClass}>
          {EXAMES_IMG.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
      </Campo>
      {tipoSel === "Outro" && (
        <Campo label="Nome do exame">
          <input value={outro} onChange={(e) => setOutro(e.target.value)} className={inputClass} required />
        </Campo>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Campo label="Data"><input name="data_exame" type="date" className={inputClass} /></Campo>
        <Campo label="IG USG"><input name="ig_usg" placeholder="Ex.: 22s 3d" className={inputClass} /></Campo>
        <Campo label="Peso fetal"><input name="peso_fetal" placeholder="Ex.: 520g" className={inputClass} /></Campo>
        <Campo label="Placenta"><input name="placenta" placeholder="Ex.: posterior" className={inputClass} /></Campo>
      </div>
      <Campo label="Líquido amniótico">
        <input name="liquido" placeholder="Ex.: normal / oligo / poli" className={inputClass} />
      </Campo>
      <Campo label="Laudo (opcional)">
        <textarea name="laudo" rows={2} className={inputClass} />
      </Campo>
      <Campo label="Status">
        <select name="status" className={inputClass}>
          <option value="normal">Normal</option>
          <option value="alterado">Alterado</option>
          <option value="pendente">Pendente</option>
        </select>
      </Campo>
      <Campo label="Anexo (PDF/imagem) — opcional">
        <input name="arquivo" type="file" accept="application/pdf,image/*" className={inputClass} />
      </Campo>
      <Campo label="Observação (opcional)">
        <input name="obs" className={inputClass} />
      </Campo>
      <button type="submit" disabled={busy} className={btnSalvar}>
        {busy ? "Salvando..." : "Registrar exame de imagem"}
      </button>
    </form>
  );
}

function FormaVacina({ onSubmit }: { onSubmit: (f: FormData) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        const form = e.currentTarget;
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setBusy(true);
        await onSubmit(fd);
        setBusy(false);
        form.reset();
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

type EventoHist = Record<string, any>;

const SN_OPTIONS = [
  { value: "", label: "—" },
  { value: "sim", label: "Sim" },
  { value: "nao", label: "Não" },
];

const ANT_CLINICOS = [
  { key: "diabetes", label: "Diabetes" },
  { key: "infeccao_urinaria", label: "Infecção urinária" },
  { key: "infertilidade", label: "Infertilidade" },
  { key: "cardiopatia", label: "Cardiopatia" },
  { key: "tromboembolismo", label: "Tromboembolismo" },
  { key: "hipertensao", label: "Hipertensão arterial" },
  { key: "criterios_pelvicos", label: "Critérios pélvicos uterinos" },
  { key: "cirurgia", label: "Cirurgia" },
];

const ANT_FAMILIARES = [
  { key: "diabetes", label: "Diabetes" },
  { key: "hipertensao", label: "Hipertensão" },
  { key: "gemelar", label: "Gemelar" },
];

const GEST_ATUAL = [
  { key: "tabagismo", label: "Tabagismo" },
  { key: "etilismo", label: "Etilismo" },
  { key: "outras_drogas", label: "Outras drogas" },
  { key: "violencia_domestica", label: "Violência doméstica" },
  { key: "hiv", label: "HIV" },
  { key: "sifilis", label: "Sífilis" },
  { key: "toxoplasmose", label: "Toxoplasmose" },
  { key: "infeccao_urinaria", label: "Infecção urinária" },
  { key: "anemia", label: "Anemia" },
  { key: "insuf_istimocervical", label: "Insuficiência istimocervical" },
  { key: "ameaca_parto_prematuro", label: "Ameaça de parto prematuro" },
  { key: "hemograma_1t", label: "Hemograma 1º Trimestre" },
  { key: "hemograma_2t", label: "Hemograma 2º Trimestre" },
  { key: "hemograma_3t", label: "Hemograma 3º Trimestre" },
  { key: "isoimunizacao_rh", label: "Isoimunização Rh" },
  { key: "oligo_polidramnio", label: "Oligo / polidrâmnio" },
  { key: "rotura_prematura", label: "Rotura prematura das membranas" },
  { key: "ciur", label: "Crescimento intrauterino restrito" },
  { key: "febre", label: "Febre" },
  { key: "hipertensao", label: "Hipertensão arterial" },
  { key: "pre_eclampsia", label: "Pré-eclâmpsia" },
  { key: "eclampsia", label: "Eclâmpsia" },
  { key: "cardiopatia", label: "Cardiopatia" },
  { key: "diabetes_gestacional", label: "Diabetes gestacional" },
  { key: "uso_insulina", label: "Uso de insulina" },
  { key: "exantema", label: "Exantema / rash cutâneo" },
];

type SubAba = "geral" | "gestacoes" | "ant_clinicos" | "ant_familiares" | "gest_atual";

function FormaHistorico({ onSubmit }: { onSubmit: (eventos: EventoHist[]) => Promise<void> }) {
  const [sub, setSub] = useState<SubAba>("geral");
  const subs: { id: SubAba; label: string }[] = [
    { id: "geral", label: "Dados" },
    { id: "gestacoes", label: "Gestações" },
    { id: "ant_clinicos", label: "Ant. clínicos" },
    { id: "ant_familiares", label: "Ant. familiares" },
    { id: "gest_atual", label: "Gestação atual" },
  ];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {subs.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSub(s.id)}
            className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full transition ${
              sub === s.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      {sub === "geral" && <SubGeral onSubmit={onSubmit} />}
      {sub === "gestacoes" && <SubGestacoes onSubmit={onSubmit} />}
      {sub === "ant_clinicos" && <SubChecklist categoria="ant_clinico" itens={ANT_CLINICOS} onSubmit={onSubmit} />}
      {sub === "ant_familiares" && <SubChecklist categoria="ant_fam" itens={ANT_FAMILIARES} onSubmit={onSubmit} />}
      {sub === "gest_atual" && <SubChecklist categoria="gest_atual" itens={GEST_ATUAL} onSubmit={onSubmit} />}
    </div>
  );
}

function SubGeral({ onSubmit }: { onSubmit: (e: EventoHist[]) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        const form = e.currentTarget;
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const eventos: EventoHist[] = [];
        const push = (tipo: string, valor: any) => {
          if (valor !== "" && valor !== null && valor !== undefined) eventos.push({ tipo, valor });
        };
        push("risco", String(fd.get("risco") || ""));
        push("peso_anterior", String(fd.get("peso_anterior") || ""));
        push("altura", String(fd.get("altura") || ""));
        push("imc_anterior", String(fd.get("imc_anterior") || ""));
        push("dpp", String(fd.get("dpp") || ""));
        push("dpp_eco", String(fd.get("dpp_eco") || ""));
        push("tipo_gestacao", String(fd.get("tipo_gestacao") || ""));
        const obs = String(fd.get("obs") || "").trim();
        if (obs) eventos.push({ tipo: "anotacao", observacao: obs });
        setBusy(true);
        await onSubmit(eventos);
        setBusy(false);
        form.reset();
      }}
      className="space-y-2"
    >
      <Campo label="Risco">
        <select name="risco" className={inputClass} defaultValue="">
          <option value="">—</option>
          <option value="habitual">Risco habitual</option>
          <option value="alto">Alto risco</option>
        </select>
      </Campo>
      <div className="grid grid-cols-3 gap-2">
        <Campo label="Peso anterior (kg)"><input name="peso_anterior" type="number" step="0.1" className={inputClass} /></Campo>
        <Campo label="Altura (cm)"><input name="altura" type="number" step="0.1" className={inputClass} /></Campo>
        <Campo label="IMC anterior"><input name="imc_anterior" type="number" step="0.01" className={inputClass} /></Campo>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Campo label="DPP"><input name="dpp" type="date" className={inputClass} /></Campo>
        <Campo label="DPP (eco)"><input name="dpp_eco" type="date" className={inputClass} /></Campo>
      </div>
      <Campo label="Tipo de gestação">
        <select name="tipo_gestacao" className={inputClass} defaultValue="">
          <option value="">—</option>
          <option value="unico">Único</option>
          <option value="gemelar">Gemelar</option>
          <option value="tripla_ou_mais">Tripla ou mais</option>
        </select>
      </Campo>
      <Campo label="Anotação (opcional)"><input name="obs" className={inputClass} /></Campo>
      <button type="submit" disabled={busy} className={btnSalvar}>{busy ? "Salvando..." : "Registrar dados"}</button>
    </form>
  );
}

function SubGestacoes({ onSubmit }: { onSubmit: (e: EventoHist[]) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        const form = e.currentTarget;
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const eventos: EventoHist[] = [];
        const ano = String(fd.get("ano") || "").trim();
        const anoNum = ano ? Number(ano) : undefined;

        // Tipo de evento (parto / cesárea / aborto / fórceps / natimorto)
        const tipoEv = String(fd.get("tipo_evento") || "");
        if (tipoEv) {
          const ev: EventoHist = { tipo: tipoEv };
          if (anoNum) ev.ano = anoNum;
          eventos.push(ev);
        }
        // Contadores
        const num = (k: string) => {
          const v = String(fd.get(k) || "").trim();
          return v ? Number(v) : null;
        };
        const pushNum = (tipo: string, v: number | null) => {
          if (v !== null && !Number.isNaN(v)) eventos.push({ tipo, valor: v, ...(anoNum ? { ano: anoNum } : {}) });
        };
        pushNum("gestas", num("gestas"));
        pushNum("abortos", num("abortos"));
        pushNum("parto_vaginal", num("parto_vaginal"));
        pushNum("nascidos_vivos", num("nascidos_vivos"));
        pushNum("vivem", num("vivem"));
        pushNum("nascidos_mortos", num("nascidos_mortos"));
        pushNum("cesareas", num("cesareas"));

        // Flags S/N
        const flag = (tipo: string, k: string) => {
          const v = String(fd.get(k) || "");
          if (v) eventos.push({ tipo, valor: v, ...(anoNum ? { ano: anoNum } : {}) });
        };
        flag("final_gest_anterior_1ano", "final_1ano");
        flag("ectopica", "ectopica");
        flag("tres_ou_mais_abortos", "tres_abortos");
        flag("bebe_menor_2500", "bebe_2500");
        flag("bebe_menor_4500", "bebe_4500");
        flag("pre_eclampsia_previa", "pre_eclampsia");
        flag("duas_cesareas_previas", "duas_cesareas");

        const obs = String(fd.get("obs") || "").trim();
        if (obs) eventos.push({ tipo: "anotacao_gest", observacao: obs, ...(anoNum ? { ano: anoNum } : {}) });

        setBusy(true);
        await onSubmit(eventos);
        setBusy(false);
        form.reset();
      }}
      className="space-y-2"
    >
      <div className="grid grid-cols-2 gap-2">
        <Campo label="Tipo de evento">
          <select name="tipo_evento" className={inputClass} defaultValue="">
            <option value="">—</option>
            {HISTORICO_TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Campo>
        <Campo label="Ano (opcional)">
          <input name="ano" type="number" min={1900} max={new Date().getFullYear()} className={inputClass} />
        </Campo>
      </div>
      <p className="text-[10px] uppercase font-bold text-muted-foreground pt-2">Contadores</p>
      <div className="grid grid-cols-3 gap-2">
        <Campo label="Gestas"><input name="gestas" type="number" min={0} className={inputClass} /></Campo>
        <Campo label="Abortos"><input name="abortos" type="number" min={0} className={inputClass} /></Campo>
        <Campo label="Parto vaginal"><input name="parto_vaginal" type="number" min={0} className={inputClass} /></Campo>
        <Campo label="Cesáreas"><input name="cesareas" type="number" min={0} className={inputClass} /></Campo>
        <Campo label="Nasc. vivos"><input name="nascidos_vivos" type="number" min={0} className={inputClass} /></Campo>
        <Campo label="Vivem"><input name="vivem" type="number" min={0} className={inputClass} /></Campo>
        <Campo label="Nasc. mortos"><input name="nascidos_mortos" type="number" min={0} className={inputClass} /></Campo>
      </div>
      <p className="text-[10px] uppercase font-bold text-muted-foreground pt-2">Sinais (S/N)</p>
      <div className="grid grid-cols-2 gap-2">
        {[
          ["final_1ano", "Final gest. anterior há 1 ano"],
          ["ectopica", "Ectópica"],
          ["tres_abortos", "3 ou mais abortos"],
          ["bebe_2500", "Bebê < 2.500g"],
          ["bebe_4500", "Bebê < 4.500g"],
          ["pre_eclampsia", "Pré-eclâmpsia"],
          ["duas_cesareas", "2 cesáreas prévias"],
        ].map(([k, l]) => (
          <Campo key={k} label={l}>
            <select name={k} className={inputClass} defaultValue="">
              {SN_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Campo>
        ))}
      </div>
      <Campo label="Anotação (opcional)"><input name="obs" className={inputClass} /></Campo>
      <button type="submit" disabled={busy} className={btnSalvar}>{busy ? "Salvando..." : "Registrar gestações"}</button>
    </form>
  );
}

function SubChecklist({
  categoria,
  itens,
  onSubmit,
}: {
  categoria: string;
  itens: { key: string; label: string }[];
  onSubmit: (e: EventoHist[]) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        const form = e.currentTarget;
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const eventos: EventoHist[] = [];
        for (const it of itens) {
          const v = String(fd.get(it.key) || "");
          if (v) eventos.push({ tipo: `${categoria}:${it.key}`, valor: v });
        }
        const obs = String(fd.get("obs") || "").trim();
        if (obs) eventos.push({ tipo: `${categoria}:anotacao`, observacao: obs });
        setBusy(true);
        await onSubmit(eventos);
        setBusy(false);
        form.reset();
      }}
      className="space-y-2"
    >
      <div className="grid grid-cols-1 gap-1.5 max-h-[40vh] overflow-y-auto pr-1">
        {itens.map((it) => (
          <div key={it.key} className="flex items-center justify-between gap-2 border-b border-border/50 py-1">
            <span className="text-xs text-foreground flex-1">{it.label}</span>
            <select name={it.key} defaultValue="" className="text-xs rounded-md border border-border bg-background px-2 py-1">
              {SN_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        ))}
      </div>
      <Campo label="Anotação (opcional)"><input name="obs" className={inputClass} /></Campo>
      <button type="submit" disabled={busy} className={btnSalvar}>{busy ? "Salvando..." : "Registrar"}</button>
    </form>
  );
}
