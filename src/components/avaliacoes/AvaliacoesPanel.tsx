import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LiquidCard } from "@/components/LiquidCard";
import { LoadingMessage } from "@/components/LoadingMessage";
import { supabase } from "@/integrations/supabase/client";

type Especialidade = "medico" | "nutricionista" | "psicologo";

type Pedido = {
  id: string;
  token: string;
  especialidade: Especialidade;
  status: "pendente" | "respondida" | "expirada";
  appointment_id: string | null;
  expira_em: string;
  created_at: string;
};

type Resposta = {
  id: string;
  request_id: string;
  professional_nome: string;
  professional_registro_tipo: string;
  professional_registro_numero: string;
  professional_registro_uf: string;
  respostas: Record<string, unknown>;
  created_at: string;
};

const LABEL: Record<Especialidade, string> = {
  medico: "Médico",
  nutricionista: "Nutricionista",
  psicologo: "Psicólogo",
};

export function AvaliacoesPanel({ userId }: { userId: string | null }) {
  const [sub, setSub] = useState<"solicitar" | "recebidas">("solicitar");
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [especialidade, setEspecialidade] = useState<Especialidade>("medico");
  const [gerando, setGerando] = useState(false);
  const [novoLink, setNovoLink] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [detalhes, setDetalhes] = useState<{ pedido: Pedido; resposta: Resposta } | null>(null);

  const load = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: peds } = await supabase
      .from("evaluation_requests")
      .select("*")
      .eq("gestante_id", userId)
      .order("created_at", { ascending: false });
    const pedList = (peds ?? []) as Pedido[];
    setPedidos(pedList);
    const ids = pedList.map((p) => p.id);
    if (ids.length) {
      const { data: resps } = await supabase
        .from("evaluation_responses")
        .select("*")
        .in("request_id", ids);
      setRespostas((resps ?? []) as Resposta[]);
    } else {
      setRespostas([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const recebidas = useMemo(() => {
    return respostas
      .map((r) => {
        const pedido = pedidos.find((p) => p.id === r.request_id);
        return pedido ? { pedido, resposta: r } : null;
      })
      .filter(Boolean) as Array<{ pedido: Pedido; resposta: Resposta }>;
  }, [respostas, pedidos]);

  const gerarLink = async () => {
    if (!userId) return;
    setGerando(true);
    setMsg(null);
    setNovoLink(null);
    const { data, error } = await supabase
      .from("evaluation_requests")
      .insert({
        gestante_id: userId,
        especialidade,
        appointment_id: null,
      })
      .select("token")
      .single();
    setGerando(false);
    if (error || !data) {
      setMsg("Não foi possível gerar o link: " + (error?.message ?? ""));
      return;
    }
    const url = `${window.location.origin}/avaliacao/${data.token}`;
    setNovoLink(url);
    await load();
  };

  const copiar = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setMsg("Link copiado!");
      setTimeout(() => setMsg(null), 2000);
    } catch {
      setMsg("Não foi possível copiar — selecione manualmente.");
    }
  };

  const compartilhar = async (url: string) => {
    const text = `Olá, por favor preencha esta avaliação para minha consulta: ${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Avaliação MãeDigital", text, url });
        return;
      } catch {
        /* cancelado */
      }
    }
    const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(wa, "_blank", "noopener,noreferrer");
  };

  const excluir = async (id: string, token: string) => {
    if (!(await appConfirm("Excluir este link de avaliação? Esta ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("evaluation_requests").delete().eq("id", id);
    if (error) {
      setMsg("Não foi possível excluir: " + error.message);
      return;
    }
    setPedidos((prev) => prev.filter((p) => p.id !== id));
    if (novoLink && novoLink.endsWith(token)) setNovoLink(null);
    setMsg("Link excluído.");
    setTimeout(() => setMsg(null), 2000);
  };

  return (
    <div>
      <div className="flex gap-1 bg-muted rounded-full p-1 mb-4">
        <button
          onClick={() => setSub("solicitar")}
          className={`flex-1 py-1.5 rounded-full text-xs font-semibold ${
            sub === "solicitar" ? "bg-white text-primary shadow-sm" : "text-muted-foreground"
          }`}
        >
          Solicitar
        </button>
        <button
          onClick={() => setSub("recebidas")}
          className={`flex-1 py-1.5 rounded-full text-xs font-semibold ${
            sub === "recebidas" ? "bg-white text-primary shadow-sm" : "text-muted-foreground"
          }`}
        >
          Recebidas ({recebidas.length})
        </button>
      </div>

      {msg && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-mint-light text-foreground text-xs">{msg}</div>
      )}

      {sub === "solicitar" ? (
        <div className="space-y-4">
          <LiquidCard className="p-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">
                Especialidade do profissional
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(LABEL) as Especialidade[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setEspecialidade(k)}
                    className={`py-2 rounded-lg text-xs font-semibold ${
                      especialidade === k
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {LABEL[k]}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={gerarLink}
              disabled={gerando || !userId}
              className="w-full mt-4 bg-primary text-primary-foreground text-xs font-bold py-2.5 rounded-full disabled:opacity-50 hover:opacity-90"
            >
              {gerando ? "Gerando..." : "Gerar link da avaliação"}
            </button>

          </LiquidCard>

          {novoLink && (
            <LiquidCard className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground">Link gerado</p>
                {(() => {
                  const ped = pedidos.find((p) => novoLink.endsWith(p.token));
                  return ped ? (
                    <button
                      onClick={() => excluir(ped.id, ped.token)}
                      aria-label="Excluir link"
                      title="Excluir link"
                      className="text-xs font-bold w-6 h-6 rounded-full bg-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                    >
                      ×
                    </button>
                  ) : null;
                })()}
              </div>
              <p className="text-[11px] text-muted-foreground break-all bg-muted rounded-lg px-2 py-2">
                {novoLink}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => copiar(novoLink)}
                  className="flex-1 bg-secondary text-secondary-foreground text-xs font-bold py-2 rounded-full hover:opacity-90"
                >
                  Copiar
                </button>
                <button
                  onClick={() => compartilhar(novoLink)}
                  className="flex-1 bg-primary text-primary-foreground text-xs font-bold py-2 rounded-full hover:opacity-90"
                >
                  Compartilhar
                </button>
              </div>
            </LiquidCard>
          )}

          {!loading && pedidos.filter((p) => p.status === "pendente").length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 mt-4">
                Aguardando preenchimento
              </h4>
              <div className="space-y-2">
                {pedidos
                  .filter((p) => p.status === "pendente")
                  .map((p) => {
                    const url = `${window.location.origin}/avaliacao/${p.token}`;
                    return (
                      <LiquidCard key={p.id} className="p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground">
                              {LABEL[p.especialidade]}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Criado em {new Date(p.created_at).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              onClick={() => copiar(url)}
                              className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground"
                            >
                              Copiar
                            </button>
                            <button
                              onClick={() => compartilhar(url)}
                              className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary text-primary-foreground"
                            >
                              Enviar
                            </button>
                            <button
                              onClick={() => excluir(p.id, p.token)}
                              aria-label="Excluir link"
                              title="Excluir link"
                              className="text-xs font-bold w-6 h-6 rounded-full bg-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      </LiquidCard>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      ) : loading ? (
        <LoadingMessage />
      ) : recebidas.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-12">
          Nenhuma avaliação preenchida ainda.
        </p>
      ) : (
        <div className="space-y-3">
          {recebidas.map(({ pedido, resposta }, i) => (
            <motion.div
              key={resposta.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <LiquidCard className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-primary">
                      {LABEL[pedido.especialidade]}
                    </p>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {resposta.professional_nome}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {resposta.professional_registro_tipo}{" "}
                      {resposta.professional_registro_numero}/
                      {resposta.professional_registro_uf}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Recebida em{" "}
                      {new Date(resposta.created_at).toLocaleDateString("pt-BR")}
                      {pedido.appointment_id ? " • vinculada a uma consulta" : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => setDetalhes({ pedido, resposta })}
                    className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-primary text-primary-foreground shrink-0"
                  >
                    Ver
                  </button>
                </div>
              </LiquidCard>
            </motion.div>
          ))}
        </div>
      )}

      {detalhes && (
        <DetalhesModal
          pedido={detalhes.pedido}
          resposta={detalhes.resposta}
          label={LABEL[detalhes.pedido.especialidade]}
          onClose={() => setDetalhes(null)}
        />
      )}

    </div>
  );
}

function DetalhesModal({
  pedido,
  resposta,
  label,
  onClose,
}: {
  pedido: Pedido;
  resposta: Resposta;
  label: string;
  onClose: () => void;
}) {
  const [urls, setUrls] = useState<Array<{ nome: string; url: string }>>([]);
  const respostas = resposta.respostas as Record<string, unknown>;
  const evidencias = (respostas._evidencias as Array<{ path: string; nome: string }> | undefined) ?? [];
  const camposClinicos = Object.entries(respostas).filter(([k]) => !k.startsWith("_") && respostas[k] != null && respostas[k] !== "");

  useEffect(() => {
    (async () => {
      if (!evidencias.length) return;
      const out: Array<{ nome: string; url: string }> = [];
      for (const e of evidencias) {
        const { data } = await supabase.storage
          .from("evaluation-evidence")
          .createSignedUrl(e.path, 60 * 60);
        if (data?.signedUrl) out.push({ nome: e.nome, url: data.signedUrl });
      }
      setUrls(out);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resposta.id]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold font-display text-foreground mb-1">
          Avaliação — {label}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          {resposta.professional_nome} — {resposta.professional_registro_tipo}{" "}
          {resposta.professional_registro_numero}/{resposta.professional_registro_uf}
        </p>
        <div className="space-y-2 mb-4">
          {camposClinicos.map(([k, v]) => (
            <div key={k} className="border-b border-border pb-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {k.replace(/_/g, " ")}
              </p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{String(v ?? "—")}</p>
            </div>
          ))}
        </div>

        {evidencias.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold text-foreground mb-2">Evidências anexadas</p>
            <ul className="space-y-1">
              {evidencias.map((e) => {
                const u = urls.find((x) => x.nome === e.nome);
                return (
                  <li key={e.path} className="text-xs bg-muted rounded-lg px-3 py-2">
                    {u ? (
                      <a
                        href={u.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary font-semibold underline break-all"
                      >
                        {e.nome}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">{e.nome} (gerando link...)</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground mb-3">
          Pedido criado em {new Date(pedido.created_at).toLocaleDateString("pt-BR")}
        </p>

        <button
          onClick={onClose}
          className="w-full bg-primary text-primary-foreground text-xs font-bold py-2.5 rounded-full"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}

