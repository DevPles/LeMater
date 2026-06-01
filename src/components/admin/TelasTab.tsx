import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { saveScreenContent, loadScreenContentOnce } from "@/hooks/useScreenContent";

/* ============ Defaults (mesmos valores das telas) ============ */

export const HOME_DEFAULT = {
  greeting: "Olá, Maria",
  pageTitle: "Minha Gestação",
  currentWeek: 24,
  tipsHeading: "Dicas da semana",
  weeklyTips: [
    { title: "Hidratação é essencial", description: "Beba pelo menos 2 litros de água por dia para manter o líquido amniótico saudável." },
    { title: "Exercícios leves", description: "Caminhadas de 30 minutos ajudam na circulação e preparam para o parto." },
    { title: "Próxima consulta", description: "Não esqueça do ultrassom morfológico agendado para esta semana." },
  ],
};

export const ALERTAS_DEFAULT = {
  pageTitle: "Alertas",
  pageSubtitle: "Alertas, lembretes e dicas para sua gestação",
  alerts: [
    { id: 1, type: "warning", title: "Exame pendente: Teste de tolerância à glicose", description: "Deve ser realizado até a semana 28. Agende com seu médico.", time: "Há 2 horas", read: false, category: "exame" },
    { id: 2, type: "warning", title: "Vacina agendada: Influenza", description: "Vacina contra gripe recomendada na semana 28. Data prevista: 08/05/2026.", time: "Hoje", read: false, category: "vacina" },
    { id: 3, type: "warning", title: "Exame agendado: Ultrassom obstétrico", description: "Verificar crescimento fetal. Semana 30 — 22/05/2026.", time: "Hoje", read: false, category: "exame" },
    { id: 4, type: "warning", title: "Consulta em 5 dias", description: "Sua próxima consulta pré-natal está agendada para 08/05/2026.", time: "Ontem", read: false, category: "consulta" },
    { id: 5, type: "success", title: "Ultrassom morfológico OK", description: "Resultado do ultrassom morfológico da semana 22 sem alterações.", time: "2 dias atrás", read: true, category: "exame" },
    { id: 6, type: "success", title: "Vacina dTpa aplicada", description: "Vacina dTpa aplicada na semana 20 na UBS Central.", time: "3 dias atrás", read: true, category: "vacina" },
    { id: 7, type: "info", title: "Dica: Posição para dormir", description: "A partir do 2º trimestre, prefira dormir de lado esquerdo para melhor circulação.", time: "3 dias atrás", read: true, category: "dica" },
    { id: 8, type: "info", title: "Novo vídeo disponível", description: "A Dra. Ana Costa publicou um vídeo sobre preparação para o parto normal.", time: "4 dias atrás", read: true, category: "dica" },
  ],
};

export const VIDEOCHAMADA_DEFAULT = {
  pageTitle: "Agendamentos",
  pageSubtitle: "Suas consultas com profissionais de saúde",
  agendamentos: [
    { id: 1, profissional: "Dra. Ana Costa", especialidade: "Obstetra", data: "17/04/2026", horario: "14:00", tipo: "videochamada", status: "confirmado" },
    { id: 2, profissional: "Enf. Carlos Silva", especialidade: "Enfermeiro Obstétrico", data: "18/04/2026", horario: "10:30", tipo: "presencial", status: "confirmado" },
    { id: 3, profissional: "Dra. Beatriz Mendes", especialidade: "Fisioterapeuta Pélvica", data: "20/04/2026", horario: "09:00", tipo: "videochamada", status: "pendente" },
    { id: 4, profissional: "Enf. Paula Rocha", especialidade: "Enfermeira Obstétrica", data: "15/04/2026", horario: "16:00", tipo: "presencial", status: "realizado" },
  ],
};

export const VIDEOS_DEFAULT = {
  videos: [
    { id: 1, title: "Preparação para o parto normal", author: "Dra. Ana Costa", role: "Obstetra", duration: "12:30", category: "Parto", gradient: "from-coral-light to-blush" },
    { id: 2, title: "Alimentação saudável no 2º trimestre", author: "Enf. Carlos Silva", role: "Enfermeiro Obstétrico", duration: "8:45", category: "Nutrição", gradient: "from-mint-light to-warm" },
    { id: 3, title: "Exercícios seguros na gestação", author: "Dra. Beatriz Mendes", role: "Fisioterapeuta", duration: "15:20", category: "Exercícios", gradient: "from-warm to-coral-light" },
    { id: 4, title: "Primeiros cuidados com a amamentação", author: "Enf. Paula Rocha", role: "Enfermeira Obstétrica", duration: "10:15", category: "Amamentação", gradient: "from-blush to-coral-light" },
    { id: 5, title: "Sinais de alerta no terceiro trimestre", author: "Dr. Roberto Lima", role: "Obstetra", duration: "7:50", category: "Parto", gradient: "from-mint-light to-blush" },
    { id: 6, title: "Recuperação no pós-parto", author: "Dra. Fernanda Reis", role: "Obstetra", duration: "11:00", category: "Pós-parto", gradient: "from-coral-light to-mint-light" },
  ],
};

export const CARTAO_DEFAULT = {
  patientName: "Maria Silva",
  patientAge: 28,
  bloodType: "O+",
  dum: "29/10/2025",
  dpp: "15/07/2026",
  weeks: 24,
  vitals: [
    { label: "Peso", value: "68,5 kg", change: "+2,1 kg" },
    { label: "Pressão", value: "110/70", change: "Normal" },
    { label: "Glicemia", value: "85 mg/dL", change: "Normal" },
    { label: "BCF", value: "142 bpm", change: "Normal" },
  ],
};

export const GESTACAO_DEFAULT = {
  pageTitle: "Minha Gestação por Trimestre",
  pageSubtitle: "Acompanhe mês a mês as mudanças no seu corpo durante a gestação.",
};

/* ============ Telas configuráveis ============ */

type Screen = {
  key: string;
  label: string;
  description: string;
  defaults: Record<string, unknown>;
  fields: Field[];
};

type Field =
  | { kind: "text"; path: string; label: string; placeholder?: string }
  | { kind: "textarea"; path: string; label: string; placeholder?: string }
  | { kind: "number"; path: string; label: string }
  | { kind: "list"; path: string; label: string; itemFields: { key: string; label: string; kind: "text" | "textarea" | "number" }[] };

const SCREENS: Screen[] = [
  {
    key: "gestacao",
    label: "Gestação",
    description: "Cabeçalho da tela de evolução por trimestre exibida no app.",
    defaults: GESTACAO_DEFAULT,
    fields: [
      { kind: "text", path: "pageTitle", label: "Título da página" },
      { kind: "textarea", path: "pageSubtitle", label: "Subtítulo" },
    ],
  },
];
// Observação:
// - Os vídeos educativos agora são gerenciados em "Atlas" (não há mais
//   conteúdo estático aqui).
// - O Cartão da Gestante consome dados reais do banco (profiles +
//   clinical_measurements / exam_results / vaccinations) e não precisa
//   de edição manual nesta tela.

/* ============ Componente ============ */

export function TelasTab() {
  const [activeKey, setActiveKey] = useState<string>(SCREENS[0].key);
  const screen = SCREENS.find((s) => s.key === activeKey)!;

  const [data, setData] = useState<Record<string, unknown>>(screen.defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setSavedAt(null);
    loadScreenContentOnce(screen.key, screen.defaults).then((c) => {
      setData(c as Record<string, unknown>);
      setLoading(false);
    });
  }, [screen.key, screen.defaults]);

  const updateField = (path: string, value: unknown) => {
    setData((prev) => ({ ...prev, [path]: value }));
  };

  const updateListItem = (path: string, index: number, key: string, value: unknown) => {
    setData((prev) => {
      const list = [...((prev[path] as Record<string, unknown>[]) ?? [])];
      list[index] = { ...list[index], [key]: value };
      return { ...prev, [path]: list };
    });
  };

  const removeListItem = (path: string, index: number) => {
    setData((prev) => {
      const list = [...((prev[path] as Record<string, unknown>[]) ?? [])];
      list.splice(index, 1);
      return { ...prev, [path]: list };
    });
  };

  const addListItem = (path: string, itemFields: { key: string; kind: string }[]) => {
    setData((prev) => {
      const list = [...((prev[path] as Record<string, unknown>[]) ?? [])];
      const blank: Record<string, unknown> = { id: Date.now() };
      itemFields.forEach((f) => (blank[f.key] = f.kind === "number" ? 0 : ""));
      list.push(blank);
      return { ...prev, [path]: list };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveScreenContent(screen.key, data);
      setSavedAt(new Date().toLocaleTimeString("pt-BR"));
    } catch (e) {
      alert("Erro ao salvar: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (await appConfirm("Restaurar conteúdo padrão desta tela? As alterações não salvas serão perdidas.")) {
      setData(screen.defaults);
    }
  };

  return (
    <div className="space-y-4">
      {/* Sub-abas das telas */}
      <div className="flex gap-2 flex-wrap">
        {SCREENS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setActiveKey(s.key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
              activeKey === s.key
                ? "bg-[#234735] text-white border-[#234735]"
                : "bg-background text-muted-foreground border-border hover:border-[#234735]/50",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <motion.div
        key={screen.key}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-5"
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-bold font-display text-foreground">
              Tela: {screen.label}
            </h2>
            <p className="text-xs text-muted-foreground">{screen.description}</p>
          </div>
          <div className="flex items-center gap-2">
            {savedAt && (
              <span className="text-[11px] text-green-700 bg-green-100 px-2 py-1 rounded-full">
                Salvo às {savedAt}
              </span>
            )}
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border border-border text-muted-foreground hover:text-foreground"
            >
              Restaurar padrão
            </button>
            <button
              type="button"
              disabled={saving || loading}
              onClick={handleSave}
              className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#234735] text-white hover:bg-[#241e7a] disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Carregando conteúdo...</p>
        ) : (
          <div className="space-y-5">
            {screen.fields.map((field) => (
              <FieldRenderer
                key={field.path}
                field={field}
                data={data}
                onUpdate={updateField}
                onUpdateList={updateListItem}
                onRemoveList={removeListItem}
                onAddList={addListItem}
              />
            ))}
          </div>
        )}
      </motion.div>

      <p className="text-[11px] text-muted-foreground px-1">
        As alterações ficam salvas no banco de dados (Lovable Cloud) e aparecem
        em tempo real para todos os usuários do app na próxima vez que a tela é
        aberta.
      </p>
    </div>
  );
}

/* ============ Renderização dos campos ============ */

function FieldRenderer({
  field, data, onUpdate, onUpdateList, onRemoveList, onAddList,
}: {
  field: Field;
  data: Record<string, unknown>;
  onUpdate: (path: string, value: unknown) => void;
  onUpdateList: (path: string, index: number, key: string, value: unknown) => void;
  onRemoveList: (path: string, index: number) => void;
  onAddList: (path: string, itemFields: { key: string; kind: string }[]) => void;
}) {
  if (field.kind === "text") {
    return (
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1 block">{field.label}</label>
        <input
          type="text"
          value={(data[field.path] as string) ?? ""}
          onChange={(e) => onUpdate(field.path, e.target.value)}
          placeholder={field.placeholder}
          className="w-full h-9 text-sm rounded-xl border border-border bg-background px-3"
        />
      </div>
    );
  }
  if (field.kind === "textarea") {
    return (
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1 block">{field.label}</label>
        <textarea
          rows={3}
          value={(data[field.path] as string) ?? ""}
          onChange={(e) => onUpdate(field.path, e.target.value)}
          placeholder={field.placeholder}
          className="w-full text-sm rounded-xl border border-border bg-background p-3"
        />
      </div>
    );
  }
  if (field.kind === "number") {
    return (
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1 block">{field.label}</label>
        <input
          type="number"
          value={(data[field.path] as number) ?? 0}
          onChange={(e) => onUpdate(field.path, Number(e.target.value))}
          className="w-full h-9 text-sm rounded-xl border border-border bg-background px-3"
        />
      </div>
    );
  }
  // list
  const list = (data[field.path] as Record<string, unknown>[]) ?? [];
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-muted-foreground">
          {field.label} <span className="text-muted-foreground/70">({list.length})</span>
        </label>
        <button
          type="button"
          onClick={() => onAddList(field.path, field.itemFields)}
          className="px-2 py-1 rounded-full text-[10px] font-bold bg-[#c9a24a] text-[#234735] hover:bg-[#e5b535]"
        >
          + Adicionar
        </button>
      </div>
      <div className="space-y-3">
        {list.map((item, idx) => (
          <div
            key={(item.id as string | number) ?? idx}
            className="border border-border rounded-xl p-3 bg-muted/20 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase">
                Item {idx + 1}
              </span>
              <button
                type="button"
                onClick={() => onRemoveList(field.path, idx)}
                className="text-[10px] font-semibold text-red-700 hover:text-red-900"
              >
                Remover
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {field.itemFields.map((f) => (
                <div key={f.key} className={f.kind === "textarea" ? "sm:col-span-2" : ""}>
                  <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">
                    {f.label}
                  </label>
                  {f.kind === "textarea" ? (
                    <textarea
                      rows={2}
                      value={(item[f.key] as string) ?? ""}
                      onChange={(e) => onUpdateList(field.path, idx, f.key, e.target.value)}
                      className="w-full text-xs rounded-lg border border-border bg-background p-2"
                    />
                  ) : (
                    <input
                      type={f.kind === "number" ? "number" : "text"}
                      value={(item[f.key] as string | number) ?? ""}
                      onChange={(e) => onUpdateList(
                        field.path, idx, f.key,
                        f.kind === "number" ? Number(e.target.value) : e.target.value,
                      )}
                      className="w-full h-8 text-xs rounded-lg border border-border bg-background px-2"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <p className="text-xs text-muted-foreground italic text-center py-4">
            Nenhum item. Clique em "+ Adicionar" para criar.
          </p>
        )}
      </div>
    </div>
  );
}
