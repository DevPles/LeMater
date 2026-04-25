import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Gravacao = {
  id: string;
  data_hora: string;
  duracao_min: number;
  recording_path: string;
  recording_duration_seg: number | null;
  gravacao_iniciada_em: string | null;
  gravacao_finalizada_em: string | null;
  professional_id: string;
  gestante_id: string | null;
  professionals: { nome: string; especialidade: string } | null;
};

type GestanteInfo = { user_id: string; nome: string | null };

export function GravacoesTab() {
  const [items, setItems] = useState<Gravacao[]>([]);
  const [gestantes, setGestantes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointment_slots")
      .select(
        "id, data_hora, duracao_min, recording_path, recording_duration_seg, gravacao_iniciada_em, gravacao_finalizada_em, professional_id, gestante_id, professionals(nome, especialidade)",
      )
      .not("recording_path", "is", null)
      .order("gravacao_finalizada_em", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }
    const list = (data ?? []) as unknown as Gravacao[];
    setItems(list);

    // carregar nomes de gestantes
    const ids = Array.from(
      new Set(list.map((x) => x.gestante_id).filter((x): x is string => !!x)),
    );
    if (ids.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, nome")
        .in("user_id", ids);
      const map: Record<string, string> = {};
      (profs as GestanteInfo[] | null)?.forEach((p) => {
        map[p.user_id] = p.nome ?? "—";
      });
      setGestantes(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const gerarLink = async (item: Gravacao) => {
    setGeneratingId(item.id);
    const { data, error } = await supabase.storage
      .from("consultation-recordings")
      .createSignedUrl(item.recording_path, 3600);
    if (data?.signedUrl) {
      setSignedUrls((prev) => ({ ...prev, [item.id]: data.signedUrl }));
    } else if (error) {
      alert("Erro ao gerar link: " + error.message);
    }
    setGeneratingId(null);
  };

  const fmtDur = (seg: number | null) => {
    if (!seg) return "—";
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">Gravações de consultas</h1>
        <p className="text-sm text-muted-foreground">
          Histórico de videochamadas gravadas. Os links de reprodução expiram em 1h.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Carregando...</p>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma gravação registrada ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Data/hora</th>
                  <th className="text-left px-4 py-2 font-semibold">Profissional</th>
                  <th className="text-left px-4 py-2 font-semibold">Gestante</th>
                  <th className="text-left px-4 py-2 font-semibold">Duração</th>
                  <th className="text-right px-4 py-2 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => {
                  const dt = new Date(item.data_hora);
                  const url = signedUrls[item.id];
                  return (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-foreground">
                        {dt.toLocaleDateString("pt-BR")}{" "}
                        <span className="text-muted-foreground text-xs">
                          {dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">
                          {item.professionals?.nome ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.professionals?.especialidade}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {item.gestante_id ? gestantes[item.gestante_id] ?? "—" : "—"}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {fmtDur(item.recording_duration_seg)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!url ? (
                          <button
                            onClick={() => gerarLink(item)}
                            disabled={generatingId === item.id}
                            className="bg-[#1a1557] text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:opacity-90 disabled:opacity-50"
                          >
                            {generatingId === item.id ? "..." : "Gerar link"}
                          </button>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-full hover:opacity-90"
                            >
                              Reproduzir
                            </a>
                            <a
                              href={url}
                              download
                              className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                            >
                              Baixar
                            </a>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
