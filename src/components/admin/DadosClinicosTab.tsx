import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

/**
 * Visualização read-only dos dados clínicos das gestantes.
 *
 * IMPORTANTE: o lançamento de medições, exames, vacinas e exames de imagem
 * acontece exclusivamente no app pela própria gestante (ou pelo profissional
 * em consulta), sempre vinculado ao `auth.uid()` para garantir rastreabilidade.
 * O admin apenas audita / acompanha os dados aqui.
 */

type Tab = "medicoes" | "exames" | "imagem" | "vacinas" | "alertas";

type Gestante = {
  user_id: string;
  nome: string | null;
  email: string | null;
  cidade: string | null;
  bairro: string | null;
  unidade_saude: string | null;
};

export function DadosClinicosTab() {
  const [tab, setTab] = useState<Tab>("medicoes");
  const [gestantes, setGestantes] = useState<Gestante[]>([]);
  const [selecionada, setSelecionada] = useState<string>("");
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    (async () => {
      setLoadingList(true);
      const { data } = await supabase
        .from("profiles")
        .select("user_id, nome, email, cidade, bairro, unidade_saude")
        .order("nome", { ascending: true })
        .limit(500);
      if (data) {
        setGestantes(data as Gestante[]);
        if (data.length > 0) setSelecionada((data[0] as Gestante).user_id);
      }
      setLoadingList(false);
    })();
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <p className="text-xs text-amber-900">
          <strong>Visualização somente leitura.</strong> O lançamento de medições, exames e vacinas
          é feito no app pela gestante ou pelo profissional em consulta — sempre vinculado à
          paciente autenticada para garantir rastreabilidade. Aqui o admin acompanha e audita.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4">
        <label className="text-xs font-semibold text-muted-foreground mb-1 block">
          Gestante
        </label>
        {loadingList ? (
          <p className="text-sm text-muted-foreground">Carregando gestantes...</p>
        ) : gestantes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma gestante cadastrada ainda. Os dados aparecerão aqui assim que houver cadastros
            no app.
          </p>
        ) : (
          <select
            value={selecionada}
            onChange={(e) => setSelecionada(e.target.value)}
            className="w-full h-10 text-sm rounded-xl border border-border bg-background px-3"
          >
            {gestantes.map((g) => (
              <option key={g.user_id} value={g.user_id}>
                {g.nome || g.email || g.user_id.slice(0, 8)}
                {g.cidade ? ` — ${g.cidade}` : ""}
                {g.unidade_saude ? ` / ${g.unidade_saude}` : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      {selecionada && (
        <>
          <div className="flex gap-2 flex-wrap">
            {[
              { v: "medicoes" as const, l: "Medições" },
              { v: "exames" as const, l: "Exames laboratoriais" },
              { v: "imagem" as const, l: "Exames de imagem" },
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

          {tab === "medicoes" && <MedicoesView gestanteId={selecionada} />}
          {tab === "exames" && <ExamesView gestanteId={selecionada} />}
          {tab === "imagem" && <ImagemView gestanteId={selecionada} />}
          {tab === "vacinas" && <VacinasView gestanteId={selecionada} />}
          {tab === "alertas" && <AlertasCalculados gestanteId={selecionada} />}
        </>
      )}
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

function MedicoesView({ gestanteId }: { gestanteId: string }) {
  const [list, setList] = useState<Medicao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("clinical_measurements")
        .select("*")
        .eq("gestante_id", gestanteId)
        .order("data_medicao", { ascending: false })
        .limit(100);
      if (data) setList(data as Medicao[]);
      setLoading(false);
    })();
  }, [gestanteId]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <ListCard title={`Medições (${list.length})`} loading={loading} empty={list.length === 0}>
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

/* ============ Exames laboratoriais ============ */
type Exame = {
  id: string;
  tipo_exame: string;
  resultado: string;
  status: string;
  data_exame: string;
  observacao: string | null;
};

function ExamesView({ gestanteId }: { gestanteId: string }) {
  const [list, setList] = useState<Exame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("exam_results")
        .select("*")
        .eq("gestante_id", gestanteId)
        .order("data_exame", { ascending: false })
        .limit(100);
      if (data) setList(data as Exame[]);
      setLoading(false);
    })();
  }, [gestanteId]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <ListCard
        title={`Exames recentes (${list.length})`}
        loading={loading}
        empty={list.length === 0}
      >
        {list.map((e) => (
          <li key={e.id} className="p-3 text-xs">
            <p className="font-bold text-foreground">
              {e.tipo_exame}: <span className="font-normal">{e.resultado}</span>{" "}
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] ${
                  e.status === "alterado"
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
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

function VacinasView({ gestanteId }: { gestanteId: string }) {
  const [list, setList] = useState<Vacina[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("vaccinations")
        .select("*")
        .eq("gestante_id", gestanteId)
        .order("data_aplicacao", { ascending: false });
      if (data) setList(data as Vacina[]);
      setLoading(false);
    })();
  }, [gestanteId]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <ListCard
        title={`Vacinas aplicadas (${list.length})`}
        loading={loading}
        empty={list.length === 0}
      >
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

/* ============ Exames de imagem ============ */
type ImageResult = {
  id: string;
  tipo_exame: string;
  data_exame: string;
  semana_gestacional: number | null;
  status: string;
  laudo_texto: string | null;
  imagem_path: string | null;
  observacao: string | null;
};

function ImagemView({ gestanteId }: { gestanteId: string }) {
  const [list, setList] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("image_exam_results")
        .select("*")
        .eq("gestante_id", gestanteId)
        .order("data_exame", { ascending: false })
        .limit(100);
      if (data) setList(data as ImageResult[]);
      setLoading(false);
    })();
  }, [gestanteId]);

  const verImagem = async (path: string) => {
    const { data, error } = await supabase.storage
      .from("image-exams")
      .createSignedUrl(path, 300);
    if (error || !data?.signedUrl) return alert("Não foi possível gerar URL.");
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <ListCard
        title={`Exames de imagem (${list.length})`}
        loading={loading}
        empty={list.length === 0}
      >
        {list.map((e) => (
          <li key={e.id} className="p-3 text-xs">
            <p className="font-bold text-foreground">
              {e.tipo_exame}{" "}
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] ${
                  e.status === "alterado"
                    ? "bg-red-100 text-red-700"
                    : e.status === "pendente"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-green-100 text-green-700"
                }`}
              >
                {e.status}
              </span>
              {e.semana_gestacional !== null && (
                <span className="text-muted-foreground"> • semana {e.semana_gestacional}</span>
              )}
            </p>
            <p className="text-muted-foreground">
              {new Date(e.data_exame).toLocaleDateString("pt-BR")}
            </p>
            {e.laudo_texto && (
              <p className="text-muted-foreground italic mt-0.5">{e.laudo_texto}</p>
            )}
            {e.observacao && (
              <p className="text-muted-foreground/80 mt-0.5">Obs: {e.observacao}</p>
            )}
            {e.imagem_path && (
              <button
                type="button"
                onClick={() => verImagem(e.imagem_path!)}
                className="mt-1 text-[10px] font-semibold text-[#1a1557] hover:underline"
              >
                Ver imagem / laudo →
              </button>
            )}
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

function AlertasCalculados({ gestanteId }: { gestanteId: string }) {
  const [list, setList] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_active_alerts", {
      _gestante_id: gestanteId,
    });
    if (error) console.error(error);
    if (data) setList(data as Alerta[]);
    setLoading(false);
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gestanteId]);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-4 py-2 bg-muted/40 border-b border-border flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide">
          Alertas ativos calculados ({list.length})
        </p>
        <button
          onClick={load}
          className="text-[10px] font-semibold text-[#1a1557] hover:underline"
        >
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
