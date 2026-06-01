import { useState, useEffect, useRef, type CSSProperties } from "react";
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

const WHATSAPP_NUMERO = "5511945383845";

type Lang = "pt" | "en" | "es";

interface Pais { code: string; flag: string; lang: Lang; nome: Record<Lang, string>; }
const PAISES: Pais[] = [
  { code: "BR", flag: "https://flagcdn.com/w160/br.png", lang: "pt", nome: { pt: "Brasil", en: "Brazil", es: "Brasil" } },
  { code: "ES", flag: "https://flagcdn.com/w160/es.png", lang: "es", nome: { pt: "Espanha", en: "Spain", es: "España" } },
  { code: "US", flag: "https://flagcdn.com/w160/us.png", lang: "en", nome: { pt: "Estados Unidos", en: "United States", es: "Estados Unidos" } },
];

interface Faq { id: string; pergunta: Record<Lang, string>; resposta: Record<Lang, string>; }

const FAQS: Faq[] = [
  {
    id: "oque",
    pergunta: {
      pt: "O que é a Le Mater?",
      en: "What is Le Mater?",
      es: "¿Qué es Le Mater?",
    },
    resposta: {
      pt: "A Le Mater é um ecossistema tecnológico de cuidado materno criado pela Enfermeira Obstetra brasileira Rayssa Leslie. Integra Educação (Atlas Materno), Orientação Profissional (teleconsultas e atendimento presencial), Carteira Digital da Gestante e acompanhamento desde a tentativa de engravidar até o pós-parto — tudo em um só lugar.",
      en: "Le Mater is a technology-driven maternal care ecosystem created by Brazilian Obstetric Nurse Rayssa Leslie. It integrates Education (Atlas Materno), Professional Guidance (telehealth and in-person care), a Digital Pregnancy Record and follow-up from preconception through postpartum — all in one place.",
      es: "Le Mater es un ecosistema tecnológico de cuidado materno creado por la Enfermera Obstetra brasileña Rayssa Leslie. Integra Educación (Atlas Materno), Orientación Profesional (teleconsultas y atención presencial), Carnet Digital de la Gestante y seguimiento desde la búsqueda del embarazo hasta el posparto — todo en un solo lugar.",
    },
  },
  {
    id: "metodologia",
    pergunta: {
      pt: "Como funciona o Método Le Mater?",
      en: "How does the Le Mater Method work?",
      es: "¿Cómo funciona el Método Le Mater?",
    },
    resposta: {
      pt: "O Método Le Mater combina ciência e acolhimento em três frentes: cuidado clínico baseado em evidência (pré-natal, exames, vacinas e parto humanizado), educação contínua por trimestre via Atlas Materno, e Carteira Digital da Gestante que organiza medidas, exames e alertas inteligentes para você e sua equipe de saúde. Rayssa é certificada em ACLS (AHA) e ALSO (Advanced Life Support in Obstetrics).",
      en: "The Le Mater Method blends science and warmth in three areas: evidence-based clinical care (prenatal, tests, vaccines and humanized birth), ongoing trimester education via Atlas Materno, and a Digital Pregnancy Record that organizes measurements, exams and smart alerts for you and your care team. Rayssa is certified in ACLS (AHA) and ALSO (Advanced Life Support in Obstetrics).",
      es: "El Método Le Mater combina ciencia y acogida en tres frentes: cuidado clínico basado en evidencia (prenatal, exámenes, vacunas y parto humanizado), educación continua por trimestre vía Atlas Materno, y Carnet Digital de la Gestante que organiza medidas, exámenes y alertas inteligentes para ti y tu equipo de salud. Rayssa está certificada en ACLS (AHA) y ALSO (Advanced Life Support in Obstetrics).",
    },
  },
  {
    id: "consulta",
    pergunta: {
      pt: "Como são as consultas com a Rayssa?",
      en: "What are consultations with Rayssa like?",
      es: "¿Cómo son las consultas con Rayssa?",
    },
    resposta: {
      pt: "As consultas podem ser online por videochamada (com sala dedicada dentro da própria plataforma) ou presenciais em Ribeirão Preto/SP. A Rayssa revisa exames, escuta o seu momento, orienta sobre pré-natal, parto e pós-parto, e tudo fica registrado no seu prontuário e na sua Carteira Digital.",
      en: "Consultations can be online via video call (in a dedicated room inside the platform itself) or in person in Ribeirão Preto, Brazil. Rayssa reviews your tests, listens to your moment, guides prenatal, birth and postpartum care, and everything is recorded in your chart and Digital Pregnancy Record.",
      es: "Las consultas pueden ser en línea por videollamada (con sala dedicada dentro de la propia plataforma) o presenciales en Ribeirão Preto, Brasil. Rayssa revisa exámenes, escucha tu momento, orienta el prenatal, parto y posparto, y todo queda registrado en tu historia clínica y Carnet Digital.",
    },
  },
  {
    id: "app",
    pergunta: {
      pt: "O que o app Le Mater oferece?",
      en: "What does the Le Mater app offer?",
      es: "¿Qué ofrece la app Le Mater?",
    },
    resposta: {
      pt: "No app você acompanha sua gestação semana a semana (tamanho do bebê, marcos e dicas), mantém sua Carteira Digital da Gestante (medidas, exames, vacinas e alertas), acessa o Atlas Materno com aulas por fase, agenda consultas e entra na videochamada com a equipe. Há conteúdo gratuito e áreas pagas (aulas, pacotes e assinatura).",
      en: "In the app you follow your pregnancy week by week (baby size, milestones and tips), keep your Digital Pregnancy Record (measurements, tests, vaccines and alerts), access Atlas Materno classes by stage, book consultations and join video calls with the team. There is free content and paid areas (classes, bundles and subscription).",
      es: "En la app sigues tu embarazo semana a semana (tamaño del bebé, hitos y consejos), mantienes tu Carnet Digital (medidas, exámenes, vacunas y alertas), accedes al Atlas Materno con clases por fase, agendas consultas y entras a la videollamada con el equipo. Hay contenido gratuito y áreas pagas (clases, paquetes y suscripción).",
    },
  },
  {
    id: "valores",
    pergunta: {
      pt: "Quais são os valores e formas de pagamento?",
      en: "What are the prices and payment options?",
      es: "¿Cuáles son los valores y formas de pago?",
    },
    resposta: {
      pt: "Os valores variam conforme o tipo de acompanhamento (consulta avulsa, aulas do Atlas, pacotes ou assinatura). No Brasil, o pagamento é processado via Mercado Pago — cartão de crédito em até 12x, Pix e boleto. Para outros países, usamos Stripe, aceitando cartões internacionais em múltiplas moedas. Se quiser um orçamento exato, fale com a nossa equipe pelo WhatsApp.",
      en: "Prices vary depending on the type of care (single consultation, Atlas classes, bundles or subscription). In Brazil, payments are processed via Mercado Pago — credit card up to 12x, Pix and boleto. For other countries we use Stripe, accepting international cards in multiple currencies. For an exact quote, reach our team on WhatsApp.",
      es: "Los precios varían según el tipo de cuidado (consulta puntual, clases del Atlas, paquetes o suscripción). En Brasil, el pago se procesa vía Mercado Pago — tarjeta de crédito hasta 12x, Pix y boleto. Para otros países usamos Stripe, aceptando tarjetas internacionales en varias monedas. Para una cotización exacta, habla con nuestro equipo por WhatsApp.",
    },
  },
  {
    id: "internacional",
    pergunta: {
      pt: "Atendem gestantes fora do Brasil?",
      en: "Do you support mothers outside Brazil?",
      es: "¿Atienden gestantes fuera de Brasil?",
    },
    resposta: {
      pt: "Sim. A plataforma está disponível em português, inglês e espanhol, e a teleconsulta acontece por videochamada dentro do próprio app. Nosso acompanhamento complementa o trabalho do seu obstetra local, respeitando as diretrizes do país onde você mora, com cuidado humanizado e suporte emocional.",
      en: "Yes. The platform is available in Portuguese, English and Spanish, and telehealth happens via video call inside the app itself. Our care complements your local obstetrician, respecting your country's guidelines, with humanized care and emotional support.",
      es: "Sí. La plataforma está disponible en portugués, inglés y español, y la teleconsulta ocurre por videollamada dentro de la propia app. Nuestro acompañamiento complementa a tu obstetra local, respetando las pautas de tu país, con cuidado humanizado y soporte emocional.",
    },
  },
  {
    id: "pos",
    pergunta: {
      pt: "E depois que o bebê nasce?",
      en: "What happens after the baby is born?",
      es: "¿Y después de que nace el bebé?",
    },
    resposta: {
      pt: "Seguimos com você no puerpério: amamentação, recuperação física e emocional, cuidados com o recém-nascido e rede de apoio. Há checklists e aulas específicas no Atlas Materno e consultas de pós-parto com a equipe.",
      en: "We stay with you through postpartum: breastfeeding, physical and emotional recovery, newborn care and support network. There are specific checklists and classes in Atlas Materno plus postpartum consultations with the team.",
      es: "Te acompañamos en el puerperio: lactancia, recuperación física y emocional, cuidado del recién nacido y red de apoyo. Hay checklists y clases específicas en el Atlas Materno y consultas posparto con el equipo.",
    },
  },
];

const T: Record<Lang, Record<string, string>> = {
  pt: {
    inicio: "Início", voltar: "Voltar", cancelar: "Cancelar", fechar: "Fechar",
    paisTitulo: "De onde você está nos visitando?", paisSub: "Escolha seu país para adaptarmos o idioma.",
    escTitulo: "Como podemos te ajudar agora?",
    escSub: "Escolha o caminho que combina com o seu momento.",
    escDuvTitulo: "Tirar dúvidas", escDuvDesc: "Saiba mais sobre a Le Mater, a metodologia e o atendimento.",
    escContTitulo: "Falar com a equipe", escContDesc: "Receba retorno personalizado pelo WhatsApp.",
    faqTitulo: "Sobre o que você quer saber?",
    faqSub: "Toque em uma pergunta para ler a resposta. Você pode escolher quantas quiser.",
    faqOutra: "Ver outras dúvidas",
    faqFalar: "Falar com a equipe",
    contTitulo: "Vamos conversar", contSub: "Deixe seu contato e uma mensagem. Retornamos pelo WhatsApp.",
    nomePh: "Seu primeiro nome", wppPh: "WhatsApp com DDD", emailPh: "Seu melhor email",
    msgPh: "Conte rapidamente sua dúvida ou pedido…",
    enviar: "Enviar e abrir WhatsApp", enviando: "Enviando…",
    sucTitulo: "Recebemos sua mensagem",
    sucSub: "Nossa equipe vai retornar pelo WhatsApp em instantes. Já abrimos o chat pra você.",
    waOla: "Olá! Sou", waDuv: "e tenho uma dúvida sobre a Le Mater.",
  },
  en: {
    inicio: "Start", voltar: "Back", cancelar: "Cancel", fechar: "Close",
    paisTitulo: "Where are you visiting from?", paisSub: "Choose your country so we can adapt the language.",
    escTitulo: "How can we help you now?",
    escSub: "Pick the path that suits your moment.",
    escDuvTitulo: "Ask questions", escDuvDesc: "Learn more about Le Mater, our method and care.",
    escContTitulo: "Talk to the team", escContDesc: "Get a personal reply on WhatsApp.",
    faqTitulo: "What would you like to know?",
    faqSub: "Tap a question to read the answer. You can pick as many as you like.",
    faqOutra: "See other questions",
    faqFalar: "Talk to the team",
    contTitulo: "Let's talk", contSub: "Leave your contact and a message. We'll reply on WhatsApp.",
    nomePh: "Your first name", wppPh: "WhatsApp with country code", emailPh: "Your best email",
    msgPh: "Briefly tell us your question or request…",
    enviar: "Send and open WhatsApp", enviando: "Sending…",
    sucTitulo: "We got your message",
    sucSub: "Our team will reply on WhatsApp shortly. We've opened the chat for you.",
    waOla: "Hi! I'm", waDuv: "and I have a question about Le Mater.",
  },
  es: {
    inicio: "Inicio", voltar: "Volver", cancelar: "Cancelar", fechar: "Cerrar",
    paisTitulo: "¿Desde dónde nos visitas?", paisSub: "Elige tu país para adaptar el idioma.",
    escTitulo: "¿Cómo podemos ayudarte ahora?",
    escSub: "Elige el camino que combina con tu momento.",
    escDuvTitulo: "Resolver dudas", escDuvDesc: "Conoce más sobre Le Mater, la metodología y la atención.",
    escContTitulo: "Hablar con el equipo", escContDesc: "Recibe respuesta personalizada por WhatsApp.",
    faqTitulo: "¿Sobre qué quieres saber?",
    faqSub: "Toca una pregunta para leer la respuesta. Puedes elegir las que quieras.",
    faqOutra: "Ver otras dudas",
    faqFalar: "Hablar con el equipo",
    contTitulo: "Hablemos", contSub: "Deja tu contacto y un mensaje. Te respondemos por WhatsApp.",
    nomePh: "Tu primer nombre", wppPh: "WhatsApp con código de país", emailPh: "Tu mejor correo",
    msgPh: "Cuéntanos brevemente tu duda o pedido…",
    enviar: "Enviar y abrir WhatsApp", enviando: "Enviando…",
    sucTitulo: "Recibimos tu mensaje",
    sucSub: "Nuestro equipo te responderá por WhatsApp enseguida. Ya abrimos el chat para ti.",
    waOla: "¡Hola! Soy", waDuv: "y tengo una duda sobre Le Mater.",
  },
};

type Step = "pais" | "escolha" | "faq" | "contato" | "sucesso";

export function DuvidasModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<Step>("pais");
  const [pais, setPais] = useState<string | null>(null);
  const [faqAberta, setFaqAberta] = useState<string | null>(null);
  const [faqLidas, setFaqLidas] = useState<string[]>([]);
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const registrar = useServerFn(registrarLead);

  const paisObj = PAISES.find((p) => p.code === pais) ?? null;
  const lang: Lang = paisObj?.lang ?? "pt";
  const t = T[lang];

  function fechar() {
    onClose();
    setTimeout(() => {
      setStep("pais"); setPais(null); setFaqAberta(null); setFaqLidas([]);
      setNome(""); setWhatsapp(""); setEmail(""); setMensagem("");
      setErro(null);
    }, 300);
  }

  function voltar() {
    setErro(null);
    if (step === "escolha") setStep("pais");
    else if (step === "faq" || step === "contato") {
      if (step === "faq" && faqAberta) { setFaqAberta(null); return; }
      setStep("escolha");
    }
  }

  function podeEnviar() {
    return nome.trim().length >= 2
      && whatsapp.replace(/\D/g, "").length >= 10
      && /\S+@\S+\.\S+/.test(email)
      && mensagem.trim().length >= 3;
  }

  async function enviarContato() {
    setEnviando(true);
    setErro(null);
    try {
      await registrar({
        data: { nome, email, telefone: whatsapp, material_id: "duvidas-contato" },
      });
      const msg =
        `${t.waOla} ${nome} ${t.waDuv}%0A%0A` +
        `"${mensagem}"%0A%0A` +
        `${whatsapp} · ${email}`;
      setStep("sucesso");
      setTimeout(() => {
        window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${msg}`, "_blank", "noopener,noreferrer");
      }, 500);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro");
    } finally {
      setEnviando(false);
    }
  }

  // Enter key
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Enter") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "TEXTAREA") return;
      if (step === "pais" && pais) { e.preventDefault(); setStep("escolha"); }
      else if (step === "sucesso") { e.preventDefault(); fechar(); }
      else if (step === "contato" && podeEnviar() && !enviando) { e.preventDefault(); enviarContato(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step, pais, nome, whatsapp, email, mensagem, enviando]);

  if (!open) return null;

  const labelStep =
    step === "pais" ? t.inicio :
    step === "escolha" ? "1 / 2" :
    step === "faq" ? "FAQ" :
    step === "contato" ? "—" : "";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={fechar}
        style={{
          position: "fixed", inset: 0, background: "rgba(28,28,26,0.55)",
          backdropFilter: "blur(8px)", zIndex: 1000, display: "flex",
          alignItems: "center", justifyContent: "center", padding: 16, fontFamily: sans,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ type: "spring", damping: 24, stiffness: 240 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: c.cream, borderRadius: 24, width: "100%", maxWidth: 560,
            maxHeight: "92vh", overflow: "hidden",
            boxShadow: "0 30px 80px -20px rgba(0,0,0,0.35)",
            border: `1px solid ${c.border}`, display: "flex", flexDirection: "column",
          }}
        >
          <div style={{ padding: "18px 22px 0", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ flex: 1, height: 4, background: c.warm, borderRadius: 999, overflow: "hidden" }}>
              <motion.div
                animate={{ width: step === "pais" ? "20%" : step === "escolha" ? "45%" : step === "sucesso" ? "100%" : "75%" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{ height: "100%", background: `linear-gradient(90deg, ${c.sage}, ${c.sageDark})` }}
              />
            </div>
            <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: c.muted }}>
              {labelStep}
            </div>
            <button onClick={fechar} aria-label="×"
              style={{
                background: "transparent", border: `1px solid ${c.border}`,
                width: 32, height: 32, borderRadius: 999, color: c.ink, cursor: "pointer",
                fontSize: 16, lineHeight: 1,
              }}>×</button>
          </div>

          <div style={{ padding: "32px 28px 8px", overflowY: "auto", flex: 1 }}>
            <AnimatePresence mode="wait">
              <motion.div key={step + (faqAberta ?? "")}
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>

                {step === "pais" && (
                  <Bloco titulo={t.paisTitulo} sub={t.paisSub}>
                    <div style={{ display: "grid", gap: 10 }}>
                      {PAISES.map((p) => {
                        const ativo = pais === p.code;
                        return (
                          <button key={p.code} type="button"
                            onClick={() => setPais(p.code)}
                            style={{
                              display: "flex", alignItems: "center", gap: 14,
                              padding: "14px 18px", borderRadius: 14,
                              border: `1.5px solid ${ativo ? c.sageDark : c.border}`,
                              background: "white",
                              boxShadow: ativo ? `0 0 0 4px ${c.sageLight}33` : "none",
                              cursor: "pointer", fontFamily: sans, textAlign: "left",
                              transition: "all 0.2s",
                            }}>
                            <img src={p.flag} alt="" width={42} height={28}
                              style={{ borderRadius: 4, objectFit: "cover", flexShrink: 0, boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }} />
                            <span style={{ fontSize: 16, color: c.ink, fontWeight: 500 }}>
                              {p.nome[lang]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </Bloco>
                )}

                {step === "escolha" && (
                  <Bloco titulo={t.escTitulo} sub={t.escSub}>
                    <div style={{ display: "grid", gap: 12 }}>
                      <Opcao
                        titulo={t.escDuvTitulo}
                        desc={t.escDuvDesc}
                        onClick={() => setStep("faq")}
                      />
                      <Opcao
                        titulo={t.escContTitulo}
                        desc={t.escContDesc}
                        destaque
                        onClick={() => setStep("contato")}
                      />
                    </div>
                  </Bloco>
                )}

                {step === "faq" && !faqAberta && (
                  <Bloco titulo={t.faqTitulo} sub={t.faqSub}>
                    <div style={{ display: "grid", gap: 8 }}>
                      {FAQS.map((f) => {
                        const lida = faqLidas.includes(f.id);
                        return (
                          <button key={f.id} type="button"
                            onClick={() => {
                              setFaqAberta(f.id);
                              if (!lida) setFaqLidas((prev) => [...prev, f.id]);
                            }}
                            style={{
                              textAlign: "left", padding: "14px 16px", borderRadius: 14,
                              border: `1px solid ${c.border}`, background: "white",
                              cursor: "pointer", fontFamily: sans,
                              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                              transition: "all 0.2s",
                            }}>
                            <span style={{ fontSize: 14.5, color: c.ink, lineHeight: 1.35 }}>
                              {f.pergunta[lang]}
                            </span>
                            <span style={{
                              fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
                              color: lida ? c.sageDark : c.muted, flexShrink: 0,
                            }}>
                              {lida ? "✓" : "→"}
                            </span>
                          </button>
                        );
                      })}
                      <button type="button" onClick={() => setStep("contato")}
                        style={{
                          marginTop: 6, padding: "12px 16px", borderRadius: 14,
                          border: `1.5px solid ${c.sageDark}`, background: "transparent",
                          color: c.sageDark, cursor: "pointer", fontFamily: sans,
                          fontSize: 13, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
                        }}>
                        {t.faqFalar}
                      </button>
                    </div>
                  </Bloco>
                )}

                {step === "faq" && faqAberta && (() => {
                  const f = FAQS.find((x) => x.id === faqAberta)!;
                  return (
                    <Bloco titulo={f.pergunta[lang]}>
                      <div style={{
                        background: "white", border: `1px solid ${c.border}`,
                        borderRadius: 16, padding: "18px 18px", marginBottom: 14,
                      }}>
                        <p style={{ fontSize: 15, color: c.ink, lineHeight: 1.6, margin: 0 }}>
                          {f.resposta[lang]}
                        </p>
                      </div>
                      <div style={{ display: "grid", gap: 10 }}>
                        <button type="button" onClick={() => setFaqAberta(null)}
                          style={{
                            padding: "12px 16px", borderRadius: 14,
                            border: `1px solid ${c.border}`, background: "white",
                            color: c.ink, cursor: "pointer", fontFamily: sans,
                            fontSize: 13, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
                          }}>
                          {t.faqOutra}
                        </button>
                        <button type="button" onClick={() => setStep("contato")}
                          style={{
                            padding: "12px 16px", borderRadius: 14,
                            border: "none", background: c.sageDark,
                            color: c.cream, cursor: "pointer", fontFamily: sans,
                            fontSize: 13, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
                          }}>
                          {t.faqFalar}
                        </button>
                      </div>
                    </Bloco>
                  );
                })()}

                {step === "contato" && (
                  <Bloco titulo={t.contTitulo} sub={t.contSub}>
                    <div style={{ display: "grid", gap: 12 }}>
                      <Input autoFocus placeholder={t.nomePh} value={nome} onChange={setNome} />
                      <Input placeholder={t.wppPh} value={whatsapp} onChange={setWhatsapp} />
                      <Input type="email" placeholder={t.emailPh} value={email} onChange={setEmail} />
                      <textarea value={mensagem}
                        onChange={(e) => setMensagem(e.target.value)}
                        placeholder={t.msgPh} rows={4}
                        style={{
                          width: "100%", padding: "14px 16px", borderRadius: 14,
                          border: `1px solid ${c.border}`, background: "white",
                          fontFamily: sans, fontSize: 15, color: c.ink,
                          resize: "vertical", outline: "none",
                        }} />
                      {erro && <p style={{ color: c.terracotta, fontSize: 13, margin: 0 }}>{erro}</p>}
                    </div>
                  </Bloco>
                )}

                {step === "sucesso" && (
                  <Bloco titulo={t.sucTitulo} sub={t.sucSub} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div style={{
            padding: "18px 22px 22px", display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 12,
            borderTop: `1px solid ${c.border}`, background: c.warm,
          }}>
            {step === "sucesso" ? (
              <button onClick={fechar} style={{ ...btnPrimario, marginLeft: "auto" }}>{t.fechar}</button>
            ) : step === "pais" ? (
              <>
                <button onClick={fechar} style={btnGhost}>{t.cancelar}</button>
                <button onClick={() => pais && setStep("escolha")} disabled={!pais}
                  style={{ ...btnPrimario, opacity: pais ? 1 : 0.45, cursor: pais ? "pointer" : "not-allowed" }}>
                  {t.escTitulo.includes("?") ? "Continuar" : "Continuar"}
                </button>
              </>
            ) : step === "contato" ? (
              <>
                <button onClick={voltar} style={btnGhost}>{t.voltar}</button>
                <button onClick={enviarContato} disabled={!podeEnviar() || enviando}
                  style={{ ...btnPrimario, opacity: podeEnviar() && !enviando ? 1 : 0.45, cursor: podeEnviar() && !enviando ? "pointer" : "not-allowed" }}>
                  {enviando ? t.enviando : t.enviar}
                </button>
              </>
            ) : (
              <button onClick={voltar} style={btnGhost}>{t.voltar}</button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Bloco({ titulo, sub, children }: { titulo: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div>
      <h3 style={{
        fontFamily: serif, fontSize: 26, lineHeight: 1.15,
        color: c.ink, margin: "0 0 10px", fontWeight: 400,
      }}>{titulo}</h3>
      {sub && <p style={{ fontSize: 14, color: c.muted, margin: "0 0 20px", lineHeight: 1.5 }}>{sub}</p>}
      {children}
    </div>
  );
}

function Opcao({ titulo, desc, onClick, destaque }: { titulo: string; desc: string; onClick: () => void; destaque?: boolean }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        textAlign: "left", padding: "16px 18px", borderRadius: 16,
        border: `1.5px solid ${destaque ? c.sageDark : c.border}`,
        background: destaque ? "white" : c.cream,
        boxShadow: destaque ? `0 14px 30px -18px rgba(45,90,66,0.45)` : "none",
        cursor: "pointer", fontFamily: sans, transition: "all 0.2s",
      }}>
      <div style={{ fontSize: 16.5, color: c.ink, fontWeight: 600 }}>{titulo}</div>
      <div style={{ fontSize: 13.5, color: c.muted, marginTop: 4, lineHeight: 1.45 }}>{desc}</div>
    </button>
  );
}

function Input({
  value, onChange, placeholder, type = "text", autoFocus,
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; autoFocus?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (autoFocus) ref.current?.focus(); }, [autoFocus]);
  return (
    <input ref={ref} type={type} placeholder={placeholder} value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%", padding: "14px 16px", borderRadius: 14,
        border: `1px solid ${c.border}`, background: "white",
        fontFamily: sans, fontSize: 16, color: c.ink, outline: "none",
      }} />
  );
}

const btnPrimario: CSSProperties = {
  background: c.sageDark, color: c.cream, border: "none", borderRadius: 999,
  padding: "13px 26px", fontFamily: sans, fontSize: 13, fontWeight: 600,
  letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
  transition: "all 0.2s",
};

const btnGhost: CSSProperties = {
  background: "transparent", color: c.muted, border: "none",
  fontFamily: sans, fontSize: 13, fontWeight: 500, letterSpacing: "0.06em",
  textTransform: "uppercase", cursor: "pointer", padding: "10px 6px",
};
