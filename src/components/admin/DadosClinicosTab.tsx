import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

/**
 * ID da gestante demo do app — mesma referência usada nas telas
 * /alertas e /cartao quando a paciente "Maria Silva" é exibida.
 * Para o MVP, usamos um UUID fixo. Quando houver autenticação real
 * de gestante, este componente passará a listar gestantes do auth.
 */
export const DEMO_GESTANTE_ID = "00000000-0000-0000-0000-000000000001";

type Tab = "medicoes" | "exames" | "vacinas" | "alertas";

export function DadosClinicosTab() {
  const [tab, setTab] = useState<Tab>("medicoes");

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <p className="text-xs text-blue-900">
          <strong>Dados clínicos da gestante demo.</strong> Tudo que for inserido aqui é avaliado
          automaticamente contra as <em>regras</em> definidas em "Parâmetros Clínicos" e gera os
          alertas exibidos na tela <code className="bg-blue-100 px-1 rounded">/alertas</code>.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { v: "medicoes" as const, l: "Medições" },
          { v: "exames" as const, l: "Exames" },
          { v: "vacinas" as const, l: "Vacinas aplicadas" },
          { v: "alertas" as const, l: "Alertas calculados" },
        ].map((t) => (
          <button
            key={t.v}
            type="button"
            onClick={() => setTab(t.v)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              tab === t.v
                ? "bg-[#1a1557] text-white border-[#1a1557]"
                : "bg-background text-muted-foreground border-border hover:border-[#1a1557]/50"
            }`}
          >
            {t.l}
          </button>
        ))}
      </div>

      {tab === "medicoes" && <MedicoesEditor />}
      {tab === "exames" && <ExamesEditor />}
      {tab === "vacinas" && <VacinasEditor />}
      {tab === "alertas" && <AlertasCalculados />}
    </div>
  );
}

/* ============ Medições ============ */
type Medicao = {
  id: string;
  parametro: string;
  valor: number;
  semana_gestacional: number | null;
  data_medicao: string;
  observacao: string | null;
};

function MedicoesEditor() {
  const [list, setList] = useState<Medicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    parametro: "",
    valor: "",
    semana_gestacional: "",
    observacao: "",
  });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("clinical_measurements")
      .select("*")
      .eq("gestante_id", DEMO_GESTANTE_ID)
      .order("data_medicao", { ascending: false })
      .limit(50);
    if (data) setList(data as Medicao[]);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!form.parametro || !form.valor) return alert("Preencha parâmetro e valor.");
    const { error } = await supabase.from("clinical_measurements").insert({
      gestante_id: DEMO_GESTANTE_ID,
      parametro: form.parametro,
      valor: Number(form.valor),
      semana_gestacional: form.semana_gestacional ? Number(form.semana_gestacional) : null,
      observacao: form.observacao || null,
    });
    if (error) return alert(error.message);
    setForm({ parametro: "", valor: "", semana_gestacional: "", observacao: "" });
    await load();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <FormCard title="Nova medição clínica">
        <Field label="Parâmetro" value={form.parametro} onChange={(v) => setForm({ ...form, parametro: v })} placeholder="pa_sistolica, peso, glicemia, bcf..." />
        <Field label="Valor" value={form.valor} onChange={(v) => setForm({ ...form, valor: v })} placeholder="120, 68.5, 142..." />
        <Field label="Semana gestacional" value={form.semana_gestacional} onChange={(v) => setForm({ ...form, semana_gestacional: v })} placeholder="24" />
        <Field label="Observação" value={form.observacao} onChange={(v) => setForm({ ...form, observacao: v })} placeholder="opcional" />
        <SubmitButton onClick={create} label="Registrar medição" />
      </FormCard>

      <ListCard title={`Últimas medições (${list.length})`} loading={loading} empty={list.length === 0}>
        {list.map((m) => (
          <li key={m.id} className="p-3 text-xs">
            <p className="font-bold text-foreground">
              {m.parametro}: <span className="font-normal">{m.valor}</span>
              {m.semana_gestacional !== null && (
                <span className="text-muted-foreground"> • semana {m.semana_gestacional}</span>
              )}
            </p>
            <p className="text-muted-foreground">
              {new Date(m.data_medicao).toLocaleDateString("pt-BR")}
              {m.observacao ? ` — ${m.observacao}` : ""}
            </p>
          </li>
        ))}
      </ListCard>
    </motion.div>
  );
}

/* ============ Exames ============ */
type Exame = {
  id: string;
  tipo_exame: string;
  resultado: string;
  status: string;
  data_exame: string;
  observacao: string | null;
};

function ExamesEditor() {
  const [list, setList] = useState<Exame[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    tipo_exame: "",
    resultado: "",
    status: "normal",
    observacao: "",
  });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("exam_results")
      .select("*")
      .eq("gestante_id", DEMO_GESTANTE_ID)
      .order("data_exame", { ascending: false })
      .limit(50);
    if (data) setList(data as Exame[]);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!form.tipo_exame || !form.resultado) return alert("Preencha tipo e resultado.");
    const { error } = await supabase.from("exam_results").insert({
      gestante_id: DEMO_GESTANTE_ID,
      tipo_exame: form.tipo_exame,
      resultado: form.resultado,
      status: form.status,
      observacao: form.observacao || null,
    });
    if (error) return alert(error.message);
    setForm({ tipo_exame: "", resultado: "", status: "normal", observacao: "" });
    await load();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <FormCard title="Novo resultado de exame">
        <Field label="Tipo de exame" value={form.tipo_exame} onChange={(v) => setForm({ ...form, tipo_exame: v })} placeholder="hemograma, sifilis, hiv..." />
        <Field label="Resultado" value={form.resultado} onChange={(v) => setForm({ ...form, resultado: v })} placeholder="reagente, normal, 120..." />
        <SelectField
          label="Status"
          value={form.status}
          onChange={(v) => setForm({ ...form, status: v })}
          options={[
            { value: "normal", label: "Normal" },
            { value: "alterado", label: "Alterado (gera alerta)" },
          ]}
        />
        <Field label="Observação" value={form.observacao} onChange={(v) => setForm({ ...form, observacao: v })} placeholder="opcional" />
        <SubmitButton onClick={create} label="Registrar exame" />
      </FormCard>

      <ListCard title={`Exames recentes (${list.length})`} loading={loading} empty={list.length === 0}>
        {list.map((e) => (
          <li key={e.id} className="p-3 text-xs">
            <p className="font-bold text-foreground">
              {e.tipo_exame}: <span className="font-normal">{e.resultado}</span>{" "}
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${e.status === "alterado" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                {e.status}
              </span>
            </p>
            <p className="text-muted-foreground">
              {new Date(e.data_exame).toLocaleDateString("pt-BR")}
              {e.observacao ? ` — ${e.observacao}` : ""}
            </p>
          </li>
        ))}
      </ListCard>
    </motion.div>
  );
}

/* ============ Vacinas ============ */
type Vacina = {
  id: string;
  vacina: string;
  data_aplicacao: string;
  observacao: string | null;
};

function VacinasEditor() {
  const [list, setList] = useState<Vacina[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ vacina: "", observacao: "" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("vaccinations")
      .select("*")
      .eq("gestante_id", DEMO_GESTANTE_ID)
      .order("data_aplicacao", { ascending: false });
    if (data) setList(data as Vacina[]);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!form.vacina) return alert("Preencha o nome da vacina.");
    const { error } = await supabase.from("vaccinations").insert({
      gestante_id: DEMO_GESTANTE_ID,
      vacina: form.vacina,
      observacao: form.observacao || null,
    });
    if (error) return alert(error.message);
    setForm({ vacina: "", observacao: "" });
    await load();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <FormCard title="Registrar vacina aplicada">
        <Field label="Vacina" value={form.vacina} onChange={(v) => setForm({ ...form, vacina: v })} placeholder="dTpa, hepatite_b, influenza..." />
        <Field label="Observação" value={form.observacao} onChange={(v) => setForm({ ...form, observacao: v })} placeholder="lote, local..." />
        <SubmitButton onClick={create} label="Registrar vacina" />
      </FormCard>

      <ListCard title={`Vacinas aplicadas (${list.length})`} loading={loading} empty={list.length === 0}>
        {list.map((v) => (
          <li key={v.id} className="p-3 text-xs">
            <p className="font-bold text-foreground">{v.vacina}</p>
            <p className="text-muted-foreground">
              {new Date(v.data_aplicacao).toLocaleDateString("pt-BR")}
              {v.observacao ? ` — ${v.observacao}` : ""}
            </p>
          </li>
        ))}
      </ListCard>
    </motion.div>
  );
}

/* ============ Alertas calculados ============ */
type Alerta = {
  id: string;
  origem: string;
  severidade: string;
  titulo: string;
  mensagem: string;
  data: string;
};

function AlertasCalculados() {
  const [list, setList] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_active_alerts", {
      _gestante_id: DEMO_GESTANTE_ID,
    });
    if (error) console.error(error);
    if (data) setList(data as Alerta[]);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-4 py-2 bg-muted/40 border-b border-border flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide">Alertas ativos calculados ({list.length})</p>
        <button onClick={load} className="text-[10px] font-semibold text-[#1a1557] hover:underline">
          Recalcular
        </button>
      </div>
      {loading ? (
        <p className="p-6 text-sm text-center text-muted-foreground">Calculando...</p>
      ) : list.length === 0 ? (
        <p className="p-6 text-sm text-center text-muted-foreground">
          Nenhum alerta no momento. Tudo dentro do padrão.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {list.map((a) => (
            <li key={a.id} className="p-3 text-xs">
              <div className="flex items-start gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    a.severidade === "urgente"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {a.severidade}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground">
                  {a.origem}
                </span>
              </div>
              <p className="font-bold text-foreground mt-1">{a.titulo}</p>
              <p className="text-muted-foreground mt-0.5">{a.mensagem}</p>
              <p className="text-muted-foreground/70 text-[10px] mt-0.5">
                {new Date(a.data).toLocaleDateString("pt-BR")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ============ helpers ============ */
function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
      <h3 className="font-bold text-sm text-foreground">{title}</h3>
      <div className="grid sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function ListCard({
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
        <p className="p-6 text-sm text-center text-muted-foreground">Nada registrado.</p>
      ) : (
        <ul className="divide-y divide-border">{children}</ul>
      )}
    </div>
  );
}

function Field({
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

function SelectField({
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

function SubmitButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <div className="sm:col-span-2 flex justify-end">
      <button
        type="button"
        onClick={onClick}
        className="px-4 py-2 rounded-full text-xs font-bold bg-[#1a1557] text-white hover:bg-[#241e7a]"
      >
        {label}
      </button>
    </div>
  );
}
