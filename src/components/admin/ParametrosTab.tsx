import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

type ReferenceRange = {
  id: string;
  parametro: string;
  semana_min: number;
  semana_max: number;
  valor_min: number | null;
  valor_max: number | null;
  unidade: string | null;
  severidade: string;
  mensagem: string;
  fonte: string | null;
};

type ExamCriteria = {
  id: string;
  tipo_exame: string;
  resultado_alterado: string;
  severidade: string;
  mensagem: string;
  fonte: string | null;
};

type ImageSchedule = {
  id: string;
  tipo_exame: string;
  semana_min: number;
  semana_max: number;
  obrigatorio: boolean;
  mensagem: string;
  fonte: string | null;
};

type VaccineRow = {
  id: string;
  vacina: string;
  semana_min: number;
  semana_max: number | null;
  obrigatoria?: boolean;
  mensagem: string;
  fonte: string | null;
};

type SubTab = "vitais" | "lab" | "imagem" | "pni" | "extras";

export function ParametrosTab() {
  const [tab, setTab] = useState<SubTab>("vitais");

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-1">
        <p className="text-xs text-amber-900">
          <strong>Base de regras clínicas — fonte única da verdade.</strong> Os alertas exibidos para
          a gestante são calculados em tempo real cruzando os <em>dados clínicos inseridos</em> com
          as regras definidas aqui. Não há criação manual de alertas.
        </p>
        <p className="text-[11px] text-amber-900/80">
          Faixas pré-carregadas conforme <strong>Ministério da Saúde</strong> (Caderno de Atenção
          Básica nº 32), <strong>OMS</strong>, <strong>FEBRASGO</strong>, <strong>PNI</strong> e{" "}
          <strong>SBIm</strong>. Edite ou adicione conforme o protocolo da sua unidade.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { v: "vitais" as const, l: "Sinais Vitais" },
          { v: "lab" as const, l: "Laboratoriais" },
          { v: "imagem" as const, l: "Exames de Imagem" },
          { v: "pni" as const, l: "Vacinas PNI" },
          { v: "extras" as const, l: "Vacinas Extras" },
        ].map((t) => (
          <button
            key={t.v}
            type="button"
            onClick={() => setTab(t.v)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              tab === t.v
                ? "bg-[#234735] text-white border-[#234735]"
                : "bg-background text-muted-foreground border-border hover:border-[#234735]/50"
            }`}
          >
            {t.l}
          </button>
        ))}
      </div>

      {tab === "vitais" && <RangesEditor />}
      {tab === "lab" && <ExamsEditor />}
      {tab === "imagem" && <ImageScheduleEditor />}
      {tab === "pni" && <VaccinesEditor table="vaccine_schedule" titulo="Calendário PNI (obrigatório)" includeObrigatoria />}
      {tab === "extras" && <VaccinesEditor table="vaccine_schedule_extra" titulo="Vacinas Extras (recomendadas)" />}
    </div>
  );
}

/* =========== Sinais Vitais (reference_ranges) =========== */
function RangesEditor() {
  const [list, setList] = useState<ReferenceRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    parametro: "",
    semana_min: 0,
    semana_max: 42,
    valor_min: "",
    valor_max: "",
    unidade: "",
    severidade: "atencao",
    mensagem: "",
    fonte: "",
  });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("reference_ranges").select("*").order("parametro");
    if (data) setList(data as ReferenceRange[]);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!form.parametro || !form.mensagem) return alert("Preencha parâmetro e mensagem.");
    const { error } = await supabase.from("reference_ranges").insert({
      parametro: form.parametro,
      semana_min: form.semana_min,
      semana_max: form.semana_max,
      valor_min: form.valor_min ? Number(form.valor_min) : null,
      valor_max: form.valor_max ? Number(form.valor_max) : null,
      unidade: form.unidade || null,
      severidade: form.severidade,
      mensagem: form.mensagem,
      fonte: form.fonte || null,
    });
    if (error) return alert(error.message);
    setForm({
      parametro: "",
      semana_min: 0,
      semana_max: 42,
      valor_min: "",
      valor_max: "",
      unidade: "",
      severidade: "atencao",
      mensagem: "",
      fonte: "",
    });
    await load();
  };

  const remove = async (id: string) => {
    if (!(await appConfirm("Remover esta faixa?")) return;
    await supabase.from("reference_ranges").delete().eq("id", id);
    await load();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-sm text-foreground">Nova faixa de sinal vital</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <Input label="Parâmetro" value={form.parametro} onChange={(v) => setForm({ ...form, parametro: v })} placeholder="pa_sistolica, peso, glicemia, bcf..." />
          <Input label="Unidade" value={form.unidade} onChange={(v) => setForm({ ...form, unidade: v })} placeholder="mmHg, kg, mg/dL..." />
          <SelectInput
            label="Severidade"
            value={form.severidade}
            onChange={(v) => setForm({ ...form, severidade: v })}
            options={[
              { value: "atencao", label: "Atenção" },
              { value: "urgente", label: "Urgente" },
            ]}
          />
          <NumberInput label="Semana min" value={form.semana_min} onChange={(v) => setForm({ ...form, semana_min: v })} />
          <NumberInput label="Semana max" value={form.semana_max} onChange={(v) => setForm({ ...form, semana_max: v })} />
          <Input label="Fonte" value={form.fonte} onChange={(v) => setForm({ ...form, fonte: v })} placeholder="MS, OMS, FEBRASGO..." />
          <Input label="Valor mínimo" value={form.valor_min} onChange={(v) => setForm({ ...form, valor_min: v })} placeholder="opcional" />
          <Input label="Valor máximo" value={form.valor_max} onChange={(v) => setForm({ ...form, valor_max: v })} placeholder="opcional" />
          <div />
          <div className="sm:col-span-3">
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Mensagem do alerta</label>
            <textarea
              rows={2}
              value={form.mensagem}
              onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
              className="w-full text-sm rounded-xl border border-border bg-background p-3"
              placeholder="Ex: Pressão arterial acima do esperado. Procure avaliação."
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={create} className="px-4 py-2 rounded-full text-xs font-bold bg-[#234735] text-white hover:bg-[#241e7a]">
            Adicionar faixa
          </button>
        </div>
      </div>

      <ListContainer title={`Faixas cadastradas (${list.length})`} loading={loading} empty={list.length === 0}>
        {list.map((r) => (
          <li key={r.id} className="p-3 flex items-center justify-between gap-3">
            <div className="text-xs">
              <p className="font-bold text-foreground">
                {r.parametro} <span className="font-normal text-muted-foreground">({r.unidade ?? "-"})</span>
              </p>
              <p className="text-muted-foreground">
                Semanas {r.semana_min}-{r.semana_max} • Faixa normal {r.valor_min ?? "—"} a {r.valor_max ?? "—"} • {r.severidade}
              </p>
              <p className="text-muted-foreground italic mt-0.5">{r.mensagem}</p>
              {r.fonte && <p className="text-[10px] text-muted-foreground/70 mt-0.5">Fonte: {r.fonte}</p>}
            </div>
            <button onClick={() => remove(r.id)} className="text-[10px] font-semibold text-red-700 hover:text-red-900">
              Remover
            </button>
          </li>
        ))}
      </ListContainer>
    </motion.div>
  );
}

/* =========== Critérios laboratoriais =========== */
function ExamsEditor() {
  const [list, setList] = useState<ExamCriteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    tipo_exame: "",
    resultado_alterado: "",
    severidade: "atencao",
    mensagem: "",
    fonte: "",
  });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("exam_criteria").select("*").order("tipo_exame");
    if (data) setList(data as ExamCriteria[]);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!form.tipo_exame || !form.resultado_alterado || !form.mensagem) return alert("Preencha todos os campos.");
    const { error } = await supabase.from("exam_criteria").insert(form);
    if (error) return alert(error.message);
    setForm({ tipo_exame: "", resultado_alterado: "", severidade: "atencao", mensagem: "", fonte: "" });
    await load();
  };

  const remove = async (id: string) => {
    if (!(await appConfirm("Remover?")) return;
    await supabase.from("exam_criteria").delete().eq("id", id);
    await load();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-sm text-foreground">Novo critério laboratorial</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Tipo de exame" value={form.tipo_exame} onChange={(v) => setForm({ ...form, tipo_exame: v })} placeholder="hemograma, sifilis, hiv, glicemia_jejum..." />
          <Input label="Resultado alterado" value={form.resultado_alterado} onChange={(v) => setForm({ ...form, resultado_alterado: v })} placeholder="reagente, positivo, >200" />
          <SelectInput
            label="Severidade"
            value={form.severidade}
            onChange={(v) => setForm({ ...form, severidade: v })}
            options={[
              { value: "atencao", label: "Atenção" },
              { value: "urgente", label: "Urgente" },
            ]}
          />
          <Input label="Fonte" value={form.fonte} onChange={(v) => setForm({ ...form, fonte: v })} placeholder="MS, FEBRASGO..." />
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Mensagem</label>
            <textarea
              rows={2}
              value={form.mensagem}
              onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
              className="w-full text-sm rounded-xl border border-border bg-background p-3"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={create} className="px-4 py-2 rounded-full text-xs font-bold bg-[#234735] text-white hover:bg-[#241e7a]">
            Adicionar critério
          </button>
        </div>
      </div>

      <ListContainer title={`Critérios cadastrados (${list.length})`} loading={loading} empty={list.length === 0}>
        {list.map((c) => (
          <li key={c.id} className="p-3 flex items-center justify-between gap-3">
            <div className="text-xs">
              <p className="font-bold text-foreground">{c.tipo_exame}</p>
              <p className="text-muted-foreground">
                Alterado quando: <strong>{c.resultado_alterado}</strong> • {c.severidade}
              </p>
              <p className="text-muted-foreground italic mt-0.5">{c.mensagem}</p>
              {c.fonte && <p className="text-[10px] text-muted-foreground/70 mt-0.5">Fonte: {c.fonte}</p>}
            </div>
            <button onClick={() => remove(c.id)} className="text-[10px] font-semibold text-red-700 hover:text-red-900">
              Remover
            </button>
          </li>
        ))}
      </ListContainer>
    </motion.div>
  );
}

/* =========== Janelas de exames de imagem =========== */
function ImageScheduleEditor() {
  const [list, setList] = useState<ImageSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    tipo_exame: "",
    semana_min: 0,
    semana_max: 42,
    obrigatorio: true,
    mensagem: "",
    fonte: "",
  });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("image_exam_schedule").select("*").order("semana_min");
    if (data) setList(data as ImageSchedule[]);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!form.tipo_exame || !form.mensagem) return alert("Preencha tipo e mensagem.");
    const { error } = await supabase.from("image_exam_schedule").insert(form);
    if (error) return alert(error.message);
    setForm({ tipo_exame: "", semana_min: 0, semana_max: 42, obrigatorio: true, mensagem: "", fonte: "" });
    await load();
  };

  const remove = async (id: string) => {
    if (!(await appConfirm("Remover?")) return;
    await supabase.from("image_exam_schedule").delete().eq("id", id);
    await load();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-sm text-foreground">Nova janela ideal de exame de imagem</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <Input label="Tipo de exame" value={form.tipo_exame} onChange={(v) => setForm({ ...form, tipo_exame: v })} placeholder="USG morfológica, dopplervelocimetria..." />
          <NumberInput label="Semana mín. ideal" value={form.semana_min} onChange={(v) => setForm({ ...form, semana_min: v })} />
          <NumberInput label="Semana máx. ideal" value={form.semana_max} onChange={(v) => setForm({ ...form, semana_max: v })} />
          <Input label="Fonte" value={form.fonte} onChange={(v) => setForm({ ...form, fonte: v })} placeholder="MS, FEBRASGO..." />
          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <input
              type="checkbox"
              checked={form.obrigatorio}
              onChange={(e) => setForm({ ...form, obrigatorio: e.target.checked })}
            />
            Obrigatório (gera alerta se não realizado)
          </label>
          <div />
          <div className="sm:col-span-3">
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Mensagem</label>
            <textarea
              rows={2}
              value={form.mensagem}
              onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
              className="w-full text-sm rounded-xl border border-border bg-background p-3"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={create} className="px-4 py-2 rounded-full text-xs font-bold bg-[#234735] text-white hover:bg-[#241e7a]">
            Adicionar janela
          </button>
        </div>
      </div>

      <ListContainer title={`Janelas cadastradas (${list.length})`} loading={loading} empty={list.length === 0}>
        {list.map((i) => (
          <li key={i.id} className="p-3 flex items-center justify-between gap-3">
            <div className="text-xs">
              <p className="font-bold text-foreground">
                {i.tipo_exame}{" "}
                {!i.obrigatorio && <span className="font-normal text-muted-foreground">(opcional)</span>}
              </p>
              <p className="text-muted-foreground">
                Janela ideal: semanas {i.semana_min} a {i.semana_max}
              </p>
              <p className="text-muted-foreground italic mt-0.5">{i.mensagem}</p>
              {i.fonte && <p className="text-[10px] text-muted-foreground/70 mt-0.5">Fonte: {i.fonte}</p>}
            </div>
            <button onClick={() => remove(i.id)} className="text-[10px] font-semibold text-red-700 hover:text-red-900">
              Remover
            </button>
          </li>
        ))}
      </ListContainer>
    </motion.div>
  );
}

/* =========== Vacinas (PNI ou Extras) =========== */
function VaccinesEditor({
  table,
  titulo,
  includeObrigatoria,
}: {
  table: "vaccine_schedule" | "vaccine_schedule_extra";
  titulo: string;
  includeObrigatoria?: boolean;
}) {
  const [list, setList] = useState<VaccineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    vacina: "",
    semana_min: 0,
    semana_max: "",
    obrigatoria: true,
    mensagem: "",
    fonte: "",
  });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from(table).select("*").order("semana_min");
    if (data) setList(data as VaccineRow[]);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, [table]);

  const create = async () => {
    if (!form.vacina || !form.mensagem) return alert("Preencha vacina e mensagem.");
    const payload: Record<string, unknown> = {
      vacina: form.vacina,
      semana_min: form.semana_min,
      semana_max: form.semana_max ? Number(form.semana_max) : null,
      mensagem: form.mensagem,
      fonte: form.fonte || null,
    };
    if (includeObrigatoria) payload.obrigatoria = form.obrigatoria;
    const { error } = await supabase.from(table).insert(payload as never);
    if (error) return alert(error.message);
    setForm({ vacina: "", semana_min: 0, semana_max: "", obrigatoria: true, mensagem: "", fonte: "" });
    await load();
  };

  const remove = async (id: string) => {
    if (!(await appConfirm("Remover?")) return;
    await supabase.from(table).delete().eq("id", id);
    await load();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-sm text-foreground">{titulo}</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <Input label="Vacina" value={form.vacina} onChange={(v) => setForm({ ...form, vacina: v })} placeholder="dTpa, hepatite_b, influenza..." />
          <NumberInput label="Semana mín." value={form.semana_min} onChange={(v) => setForm({ ...form, semana_min: v })} />
          <Input label="Semana máx. (opcional)" value={form.semana_max} onChange={(v) => setForm({ ...form, semana_max: v })} />
          <Input label="Fonte" value={form.fonte} onChange={(v) => setForm({ ...form, fonte: v })} placeholder="PNI, SBIm..." />
          {includeObrigatoria && (
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <input
                type="checkbox"
                checked={form.obrigatoria}
                onChange={(e) => setForm({ ...form, obrigatoria: e.target.checked })}
              />
              Obrigatória (gera alerta se em atraso)
            </label>
          )}
          <div className="sm:col-span-3">
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Mensagem</label>
            <textarea
              rows={2}
              value={form.mensagem}
              onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
              className="w-full text-sm rounded-xl border border-border bg-background p-3"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={create} className="px-4 py-2 rounded-full text-xs font-bold bg-[#234735] text-white hover:bg-[#241e7a]">
            Adicionar vacina
          </button>
        </div>
      </div>

      <ListContainer title={`Cadastradas (${list.length})`} loading={loading} empty={list.length === 0}>
        {list.map((v) => (
          <li key={v.id} className="p-3 flex items-center justify-between gap-3">
            <div className="text-xs">
              <p className="font-bold text-foreground">
                {v.vacina}{" "}
                {includeObrigatoria && v.obrigatoria === false && (
                  <span className="font-normal text-muted-foreground">(não obrigatória)</span>
                )}
              </p>
              <p className="text-muted-foreground">
                A partir da semana {v.semana_min}
                {v.semana_max ? ` até ${v.semana_max}` : ""}
              </p>
              <p className="text-muted-foreground italic mt-0.5">{v.mensagem}</p>
              {v.fonte && <p className="text-[10px] text-muted-foreground/70 mt-0.5">Fonte: {v.fonte}</p>}
            </div>
            <button onClick={() => remove(v.id)} className="text-[10px] font-semibold text-red-700 hover:text-red-900">
              Remover
            </button>
          </li>
        ))}
      </ListContainer>
    </motion.div>
  );
}

/* =========== Helpers =========== */
function ListContainer({
  title,
  loading,
  empty,
  children,
}: {
  title: string;
  loading: boolean;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-4 py-2 bg-muted/40 border-b border-border">
        <p className="text-xs font-bold uppercase tracking-wide">{title}</p>
      </div>
      {loading ? (
        <p className="p-6 text-sm text-center text-muted-foreground">Carregando...</p>
      ) : empty ? (
        <p className="p-6 text-sm text-center text-muted-foreground">Nada cadastrado.</p>
      ) : (
        <ul className="divide-y divide-border">{children}</ul>
      )}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground mb-1 block">{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 text-sm rounded-xl border border-border bg-background px-3"
      />
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground mb-1 block">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-9 text-sm rounded-xl border border-border bg-background px-3"
      />
    </div>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground mb-1 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 text-sm rounded-xl border border-border bg-background px-3"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
