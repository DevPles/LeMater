import { useState, type CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { registrarLead } from "@/lib/leads.functions";

const c = {
  cream: "#FAF5EE",
  warm: "#F5EDE0",
  sage: "#5C8A6E",
  sageLight: "#8AB89A",
  sageDark: "#2D5A42",
  terracotta: "#C4714A",
  ink: "#1C1C1A",
  muted: "#6B6560",
  border: "#E8DDD2",
};
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

const WHATSAPP_NUMERO = "5516999999999"; // ajustar para o número oficial

type Estagio = "tentante" | "1tri" | "2tri" | "3tri" | "pos";
type Modalidade = "online" | "presencial" | "ambas";
type Periodo = "manha" | "tarde" | "noite";

interface Respostas {
  nome: string;
  estagio: Estagio | null;
  semanas: string;
  duvidas: string[];
  modalidade: Modalidade | null;
  periodo: Periodo | null;
  cidade: string;
  whatsapp: string;
  email: string;
  mensagem: string;
}

const RESPOSTAS_INICIAIS: Respostas = {
  nome: "",
  estagio: null,
  semanas: "",
  duvidas: [],
  modalidade: null,
  periodo: null,
  cidade: "",
  whatsapp: "",
  email: "",
  mensagem: "",
};

const DUVIDAS_OPCOES = [
  "Pré-natal humanizado",
  "Plano de parto",
  "Amamentação",
  "Exames e vacinas",
  "Saúde mental gestacional",
  "Alimentação na gravidez",
  "Pós-parto e puerpério",
  "Cuidados com o bebê",
];

export function AgendamentoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [r, setR] = useState<Respostas>(RESPOSTAS_INICIAIS);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const registrar = useServerFn(registrarLead);

  const ehGestante = r.estagio === "1tri" || r.estagio === "2tri" || r.estagio === "3tri";

  const passos = [
    "boas-vindas",
    "nome",
    "estagio",
    ...(ehGestante ? ["semanas"] : []),
    "duvidas",
    "modalidade",
    "periodo",
    "contato",
    "mensagem",
    "resumo",
    "sucesso",
  ];
  const total = passos.length - 1; // exclui boas-vindas da contagem
  const atual = passos[step];
  const progresso = Math.max(0, Math.min(100, ((step) / (passos.length - 2)) * 100));

  function patch(p: Partial<Respostas>) {
    setR((prev) => ({ ...prev, ...p }));
  }

  function avancar() {
    setErro(null);
    setStep((s) => Math.min(s + 1, passos.length - 1));
  }
  function voltar() {
    setErro(null);
    setStep((s) => Math.max(0, s - 1));
  }

  function podeAvancar(): boolean {
    switch (atual) {
      case "nome":
        return r.nome.trim().length >= 2;
      case "estagio":
        return !!r.estagio;
      case "semanas":
        return r.semanas !== "";
      case "duvidas":
        return r.duvidas.length > 0;
      case "modalidade":
        return !!r.modalidade;
      case "periodo":
        return !!r.periodo;
      case "contato":
        return (
          r.whatsapp.replace(/\D/g, "").length >= 10 &&
          /\S+@\S+\.\S+/.test(r.email)
        );
      default:
        return true;
    }
  }

  async function enviar() {
    setEnviando(true);
    setErro(null);
    try {
      await registrar({
        data: {
          nome: r.nome,
          email: r.email,
          telefone: r.whatsapp,
          material_id: null,
        },
      });
      // abre WhatsApp com resumo
      const labelEstagio: Record<Estagio, string> = {
        tentante: "Tentante",
        "1tri": "1º trimestre",
        "2tri": "2º trimestre",
        "3tri": "3º trimestre",
        pos: "Pós-parto",
      };
      const labelModalidade: Record<Modalidade, string> = {
        online: "Online",
        presencial: "Presencial",
        ambas: "Tanto faz",
      };
      const labelPeriodo: Record<Periodo, string> = {
        manha: "Manhã",
        tarde: "Tarde",
        noite: "Noite",
      };
      const msg =
        `Olá Rayssa! Sou ${r.nome} e gostaria de agendar uma consulta.%0A%0A` +
        `• Momento: ${r.estagio ? labelEstagio[r.estagio] : "—"}` +
        (r.semanas ? ` (${r.semanas} semanas)` : "") + `%0A` +
        `• Modalidade: ${r.modalidade ? labelModalidade[r.modalidade] : "—"}%0A` +
        `• Melhor período: ${r.periodo ? labelPeriodo[r.periodo] : "—"}%0A` +
        `• Cidade: ${r.cidade || "—"}%0A` +
        `• Principais dúvidas: ${r.duvidas.join(", ") || "—"}%0A` +
        (r.mensagem ? `%0A"${r.mensagem}"%0A` : "") +
        `%0AContato: ${r.whatsapp} · ${r.email}`;
      setStep(passos.length - 1);
      setTimeout(() => {
        window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${msg}`, "_blank", "noopener,noreferrer");
      }, 600);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível enviar. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  function fechar() {
    onClose();
    setTimeout(() => {
      setStep(0);
      setR(RESPOSTAS_INICIAIS);
      setErro(null);
    }, 300);
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={fechar}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(28,28,26,0.55)",
          backdropFilter: "blur(8px)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          fontFamily: sans,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ type: "spring", damping: 24, stiffness: 240 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: c.cream,
            borderRadius: 24,
            width: "100%",
            maxWidth: 560,
            maxHeight: "92vh",
            overflow: "hidden",
            boxShadow: "0 30px 80px -20px rgba(0,0,0,0.35)",
            border: `1px solid ${c.border}`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* topo: progresso + fechar */}
          <div style={{ padding: "18px 22px 0", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ flex: 1, height: 4, background: c.warm, borderRadius: 999, overflow: "hidden" }}>
              <motion.div
                animate={{ width: `${progresso}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{ height: "100%", background: `linear-gradient(90deg, ${c.sage}, ${c.sageDark})` }}
              />
            </div>
            <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: c.muted }}>
              {step === 0 ? "Início" : atual === "sucesso" ? "Pronto" : `${step} de ${total - 1}`}
            </div>
            <button
              onClick={fechar}
              aria-label="Fechar"
              style={{
                background: "transparent",
                border: `1px solid ${c.border}`,
                width: 32,
                height: 32,
                borderRadius: 999,
                color: c.ink,
                cursor: "pointer",
                fontSize: 16,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          {/* conteúdo */}
          <div style={{ padding: "32px 28px 8px", overflowY: "auto", flex: 1 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={atual}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.3 }}
              >
                {atual === "boas-vindas" && (
                  <Bloco
                    titulo="Que bom ter você aqui"
                    sub="Vamos conversar em poucos passos para entender seu momento e preparar uma consulta acolhedora com a Rayssa. Leva menos de 2 minutos."
                  >
                    <p style={pNota}>
                      Suas respostas ficam guardadas com privacidade e ajudam a Rayssa a chegar mais preparada para cuidar de você.
                    </p>
                  </Bloco>
                )}

                {atual === "nome" && (
                  <Bloco titulo="Como podemos te chamar?" sub="Pra começar a conversa do jeitinho certo.">
                    <Input
                      autoFocus
                      placeholder="Seu primeiro nome"
                      value={r.nome}
                      onChange={(v) => patch({ nome: v })}
                    />
                  </Bloco>
                )}

                {atual === "estagio" && (
                  <Bloco
                    titulo={`Em que momento você está, ${primeiro(r.nome) || "gestante"}?`}
                    sub="Isso ajuda a Rayssa a entender o seu cenário."
                  >
                    <Opcoes
                      valor={r.estagio}
                      onChange={(v) => patch({ estagio: v as Estagio })}
                      opcoes={[
                        ["tentante", "Tentante", "Planejando engravidar"],
                        ["1tri", "1º trimestre", "Até 13 semanas"],
                        ["2tri", "2º trimestre", "14 a 27 semanas"],
                        ["3tri", "3º trimestre", "28 semanas em diante"],
                        ["pos", "Pós-parto", "Bebê já chegou"],
                      ]}
                    />
                  </Bloco>
                )}

                {atual === "semanas" && (
                  <Bloco
                    titulo="Em qual semana você está?"
                    sub="Pode ser uma estimativa, sem pressão."
                  >
                    <Input
                      autoFocus
                      type="number"
                      placeholder="Ex: 22"
                      value={r.semanas}
                      onChange={(v) => patch({ semanas: v })}
                    />
                  </Bloco>
                )}

                {atual === "duvidas" && (
                  <Bloco
                    titulo="O que está mais no seu coração agora?"
                    sub="Escolha quantas quiser. Não precisa caber tudo aqui."
                  >
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                      {DUVIDAS_OPCOES.map((d) => {
                        const ativa = r.duvidas.includes(d);
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() =>
                              patch({
                                duvidas: ativa
                                  ? r.duvidas.filter((x) => x !== d)
                                  : [...r.duvidas, d],
                              })
                            }
                            style={{
                              padding: "10px 16px",
                              borderRadius: 999,
                              border: `1px solid ${ativa ? c.sageDark : c.border}`,
                              background: ativa ? c.sageDark : "white",
                              color: ativa ? c.cream : c.ink,
                              cursor: "pointer",
                              fontFamily: sans,
                              fontSize: 13.5,
                              transition: "all 0.2s",
                            }}
                          >
                            {d}
                          </button>
                        );
                      })}
                    </div>
                  </Bloco>
                )}

                {atual === "modalidade" && (
                  <Bloco
                    titulo="Como prefere a consulta?"
                    sub="Você escolhe o formato mais confortável."
                  >
                    <Opcoes
                      valor={r.modalidade}
                      onChange={(v) => patch({ modalidade: v as Modalidade })}
                      opcoes={[
                        ["online", "Online", "Por vídeo, do conforto da sua casa"],
                        ["presencial", "Presencial", "Em Ribeirão Preto, SP"],
                        ["ambas", "Tanto faz", "Combinar com a Rayssa"],
                      ]}
                    />
                  </Bloco>
                )}

                {atual === "periodo" && (
                  <Bloco titulo="Qual o melhor período pra você?" sub="A agenda é organizada com carinho.">
                    <Opcoes
                      valor={r.periodo}
                      onChange={(v) => patch({ periodo: v as Periodo })}
                      opcoes={[
                        ["manha", "Manhã", "Entre 8h e 12h"],
                        ["tarde", "Tarde", "Entre 13h e 18h"],
                        ["noite", "Noite", "Após 18h"],
                      ]}
                    />
                  </Bloco>
                )}

                {atual === "contato" && (
                  <Bloco
                    titulo="Como falamos com você?"
                    sub="Usamos seu contato apenas para retornar sobre a consulta."
                  >
                    <div style={{ display: "grid", gap: 14 }}>
                      <Input
                        placeholder="WhatsApp com DDD"
                        value={r.whatsapp}
                        onChange={(v) => patch({ whatsapp: v })}
                      />
                      <Input
                        type="email"
                        placeholder="Seu melhor email"
                        value={r.email}
                        onChange={(v) => patch({ email: v })}
                      />
                      <Input
                        placeholder="Cidade onde você mora"
                        value={r.cidade}
                        onChange={(v) => patch({ cidade: v })}
                      />
                    </div>
                  </Bloco>
                )}

                {atual === "mensagem" && (
                  <Bloco
                    titulo="Quer deixar um recado pra Rayssa?"
                    sub="Conte algo que considera importante. É opcional."
                  >
                    <textarea
                      value={r.mensagem}
                      onChange={(e) => patch({ mensagem: e.target.value })}
                      placeholder="Escreva à vontade…"
                      rows={5}
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        borderRadius: 14,
                        border: `1px solid ${c.border}`,
                        background: "white",
                        fontFamily: sans,
                        fontSize: 15,
                        color: c.ink,
                        resize: "vertical",
                        outline: "none",
                      }}
                    />
                  </Bloco>
                )}

                {atual === "resumo" && (
                  <Bloco
                    titulo="Tudo certo por aqui?"
                    sub="Confira rapidinho antes de enviar."
                  >
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
                      <ItemResumo k="Nome" v={r.nome} />
                      <ItemResumo k="Momento" v={labelEstagioCurto(r.estagio)} />
                      {ehGestante && <ItemResumo k="Semanas" v={r.semanas} />}
                      <ItemResumo k="Dúvidas" v={r.duvidas.join(", ")} />
                      <ItemResumo k="Modalidade" v={r.modalidade ?? ""} />
                      <ItemResumo k="Período" v={r.periodo ?? ""} />
                      <ItemResumo k="Cidade" v={r.cidade} />
                      <ItemResumo k="WhatsApp" v={r.whatsapp} />
                      <ItemResumo k="Email" v={r.email} />
                    </ul>
                    {erro && (
                      <p style={{ color: c.terracotta, marginTop: 16, fontSize: 13 }}>{erro}</p>
                    )}
                  </Bloco>
                )}

                {atual === "sucesso" && (
                  <Bloco
                    titulo={`Obrigada, ${primeiro(r.nome) || "mamãe"}`}
                    sub="Recebemos suas respostas. A Rayssa vai entrar em contato pelo WhatsApp para confirmar o melhor horário."
                  >
                    <p style={pNota}>
                      Já abrimos uma conversa pré-pronta com a Rayssa pra você adiantar. Se não abriu, é só tocar no botão abaixo.
                    </p>
                  </Bloco>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* rodapé */}
          <div
            style={{
              padding: "18px 22px 22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              borderTop: `1px solid ${c.border}`,
              background: c.warm,
            }}
          >
            {atual === "sucesso" ? (
              <button onClick={fechar} style={{ ...btnPrimario, marginLeft: "auto" }}>
                Fechar
              </button>
            ) : (
              <>
                <button
                  onClick={step === 0 ? fechar : voltar}
                  style={btnGhost}
                >
                  {step === 0 ? "Cancelar" : "Voltar"}
                </button>
                {atual === "resumo" ? (
                  <button onClick={enviar} disabled={enviando} style={btnPrimario}>
                    {enviando ? "Enviando…" : "Enviar e abrir WhatsApp"}
                  </button>
                ) : (
                  <button
                    onClick={avancar}
                    disabled={!podeAvancar()}
                    style={{
                      ...btnPrimario,
                      opacity: podeAvancar() ? 1 : 0.45,
                      cursor: podeAvancar() ? "pointer" : "not-allowed",
                    }}
                  >
                    {step === 0 ? "Começar" : "Continuar"}
                  </button>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ---------- subcomponentes ---------- */

function Bloco({ titulo, sub, children }: { titulo: string; sub?: string; children: React.ReactNode }) {
  return (
    <div>
      <h3
        style={{
          fontFamily: serif,
          fontSize: 28,
          lineHeight: 1.15,
          color: c.ink,
          margin: "0 0 10px",
          fontWeight: 400,
        }}
      >
        {titulo}
      </h3>
      {sub && (
        <p style={{ fontSize: 14, color: c.muted, margin: "0 0 22px", lineHeight: 1.5 }}>{sub}</p>
      )}
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoFocus?: boolean;
}) {
  return (
    <input
      type={type}
      autoFocus={autoFocus}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "14px 16px",
        borderRadius: 14,
        border: `1px solid ${c.border}`,
        background: "white",
        fontFamily: sans,
        fontSize: 16,
        color: c.ink,
        outline: "none",
      }}
    />
  );
}

function Opcoes({
  opcoes,
  valor,
  onChange,
}: {
  opcoes: Array<[string, string, string]>;
  valor: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {opcoes.map(([id, titulo, desc]) => {
        const ativa = valor === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            style={{
              textAlign: "left",
              padding: "14px 18px",
              borderRadius: 16,
              border: `1.5px solid ${ativa ? c.sageDark : c.border}`,
              background: ativa ? "white" : "white",
              boxShadow: ativa ? `0 0 0 4px ${c.sageLight}33` : "none",
              cursor: "pointer",
              fontFamily: sans,
              transition: "all 0.2s",
            }}
          >
            <div style={{ fontSize: 16, color: c.ink, fontWeight: 500 }}>{titulo}</div>
            <div style={{ fontSize: 13, color: c.muted, marginTop: 2 }}>{desc}</div>
          </button>
        );
      })}
    </div>
  );
}

function ItemResumo({ k, v }: { k: string; v: string }) {
  return (
    <li style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "10px 0", borderBottom: `1px dashed ${c.border}` }}>
      <span style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: c.muted }}>{k}</span>
      <span style={{ fontFamily: serif, fontSize: 16, color: c.ink, textAlign: "right" }}>{v || "—"}</span>
    </li>
  );
}

function primeiro(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? "";
}

function labelEstagioCurto(e: Estagio | null): string {
  if (!e) return "";
  return {
    tentante: "Tentante",
    "1tri": "1º trimestre",
    "2tri": "2º trimestre",
    "3tri": "3º trimestre",
    pos: "Pós-parto",
  }[e];
}

const btnPrimario: CSSProperties = {
  background: c.sageDark,
  color: c.cream,
  border: "none",
  borderRadius: 999,
  padding: "13px 26px",
  fontFamily: sans,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  cursor: "pointer",
  transition: "all 0.2s",
};

const btnGhost: CSSProperties = {
  background: "transparent",
  color: c.muted,
  border: "none",
  fontFamily: sans,
  fontSize: 13,
  fontWeight: 500,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  cursor: "pointer",
  padding: "10px 6px",
};

const pNota: CSSProperties = {
  fontSize: 13.5,
  color: c.muted,
  lineHeight: 1.55,
  marginTop: 6,
  background: "white",
  border: `1px solid ${c.border}`,
  borderRadius: 14,
  padding: "14px 16px",
};
