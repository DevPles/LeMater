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
const APP_URL = "https://lemater.com/app";

type Lang = "pt" | "en" | "es";
type Estagio = "tentante" | "1tri" | "2tri" | "3tri" | "pos";
type Modalidade = "online" | "presencial" | "ambas";
type Periodo = "manha" | "tarde" | "noite";

interface Pais {
  code: string;
  flag: string;
  lang: Lang;
  nome: Record<Lang, string>;
}

const PAISES: Pais[] = [
  { code: "BR", flag: "https://flagcdn.com/w160/br.png", lang: "pt", nome: { pt: "Brasil", en: "Brazil", es: "Brasil" } },
  { code: "ES", flag: "https://flagcdn.com/w160/es.png", lang: "es", nome: { pt: "Espanha", en: "Spain", es: "España" } },
  { code: "US", flag: "https://flagcdn.com/w160/us.png", lang: "en", nome: { pt: "Estados Unidos", en: "United States", es: "Estados Unidos" } },
];

const T: Record<Lang, Record<string, string>> = {
  pt: {
    inicio: "Início", pronto: "Pronto", de: "de", cancelar: "Cancelar", voltar: "Voltar",
    comecar: "Começar", continuar: "Continuar", enviar: "Enviar e abrir WhatsApp",
    enviando: "Enviando…", fechar: "Fechar",
    paisTitulo: "De onde você está nos visitando?", paisSub: "Escolha seu país para adaptarmos o idioma.",
    bvTitulo: "Que bom ter você aqui",
    bvSub: "Vamos conversar em poucos passos para entender seu momento e preparar uma consulta acolhedora com a Rayssa. Leva menos de 2 minutos.",
    bvNota: "Suas respostas ficam guardadas com privacidade e ajudam a Rayssa a chegar mais preparada para cuidar de você.",
    nomeTitulo: "Como podemos te chamar?", nomeSub: "Pra começar a conversa do jeitinho certo.",
    nomePh: "Seu primeiro nome",
    estagioTitulo: "Em que momento você está", estagioSub: "Isso ajuda a Rayssa a entender o seu cenário.",
    tentante: "Tentante", tentanteD: "Planejando engravidar",
    t1: "1º trimestre", t1d: "Até 13 semanas",
    t2: "2º trimestre", t2d: "14 a 27 semanas",
    t3: "3º trimestre", t3d: "28 semanas em diante",
    pos: "Pós-parto", posD: "Bebê já chegou",
    semanasTitulo: "Em qual semana você está?", semanasSub: "Pode ser uma estimativa, sem pressão.",
    semanasPh: "Ex: 22",
    duvidasTitulo: "O que está mais no seu coração agora?", duvidasSub: "Escolha quantas quiser.",
    modTitulo: "Como prefere a consulta?", modSub: "Você escolhe o formato mais confortável.",
    online: "Online", onlineD: "Por vídeo, do conforto da sua casa",
    presencial: "Presencial", presencialD: "Em Ribeirão Preto, SP",
    ambas: "Tanto faz", ambasD: "Combinar com a Rayssa",
    perTitulo: "Qual o melhor período pra você?", perSub: "A agenda é organizada com carinho.",
    manha: "Manhã", manhaD: "Entre 8h e 12h",
    tarde: "Tarde", tardeD: "Entre 13h e 18h",
    noite: "Noite", noiteD: "Após 18h",
    contTitulo: "Como falamos com você?", contSub: "Usamos seu contato apenas para retornar sobre a consulta.",
    wpp: "WhatsApp com DDD", email: "Seu melhor email", cidade: "Cidade onde você mora",
    msgTitulo: "Quer deixar um recado pra Rayssa?", msgSub: "Conte algo que considera importante. É opcional.",
    msgPh: "Escreva à vontade…",
    resTitulo: "Tudo certo por aqui?", resSub: "Confira rapidinho antes de enviar.",
    rPais: "País", rNome: "Nome", rMomento: "Momento", rSemanas: "Semanas", rDuvidas: "Dúvidas",
    rMod: "Modalidade", rPer: "Período", rCidade: "Cidade", rWpp: "WhatsApp", rEmail: "Email",
    sucTitulo: "Obrigada", sucSub: "Recebemos suas respostas. A Rayssa vai entrar em contato pelo WhatsApp.",
    sucNota: "Já abrimos uma conversa pré-pronta com a Rayssa. Se não abriu, toque no botão abaixo.",
    waMsg: "Olá Rayssa! Sou", waQuero: "e gostaria de agendar uma consulta.",
    waMomento: "Momento", waSem: "semanas", waMod: "Modalidade", waPer: "Melhor período",
    waCidade: "Cidade", waDuv: "Principais dúvidas", waCont: "Contato", waPais: "País",
    ofTitulo: "Como prefere continuar daqui?",
    ofSub: "Escolha o caminho mais natural para o seu momento. Você não precisa decidir tudo agora.",
    ofConsultaTag: "Recomendado pra você",
    ofConsultaTitulo: "Consulta acolhedora com a Rayssa",
    ofConsultaDesc: "Atendimento humanizado, pré-natal completo e plano de cuidado feito sob medida. Vagas limitadas esta semana.",
    ofConsultaBtn: "Falar com a Rayssa agora",
    ofAppTag: "Comece grátis",
    ofAppTitulo: "Acompanhe sua gestação no app Le Mater",
    ofAppDesc: "Conteúdos semana a semana, plano de parto guiado e a comunidade de mães. Experimente sem custo.",
    ofAppBtn: "Acessar o app gratuito",
    ofProva: "Mais de 1.200 famílias atendidas · 5.0 ★ no Google",
    ofOu: "ou",
  },
  en: {
    inicio: "Start", pronto: "Done", de: "of", cancelar: "Cancel", voltar: "Back",
    comecar: "Start", continuar: "Continue", enviar: "Send and open WhatsApp",
    enviando: "Sending…", fechar: "Close",
    paisTitulo: "Where are you visiting from?", paisSub: "Choose your country so we can adapt the language.",
    bvTitulo: "So glad you're here",
    bvSub: "Let's chat in a few steps to understand your moment and prepare a warm consultation with Rayssa. Takes less than 2 minutes.",
    bvNota: "Your answers are kept private and help Rayssa be more prepared to care for you.",
    nomeTitulo: "What should we call you?", nomeSub: "To start the conversation just right.",
    nomePh: "Your first name",
    estagioTitulo: "Where are you in your journey", estagioSub: "This helps Rayssa understand your scenario.",
    tentante: "Trying to conceive", tentanteD: "Planning to get pregnant",
    t1: "1st trimester", t1d: "Up to 13 weeks",
    t2: "2nd trimester", t2d: "14 to 27 weeks",
    t3: "3rd trimester", t3d: "28 weeks and beyond",
    pos: "Postpartum", posD: "Baby has arrived",
    semanasTitulo: "How many weeks are you?", semanasSub: "An estimate is fine, no pressure.",
    semanasPh: "E.g. 22",
    duvidasTitulo: "What's most on your heart right now?", duvidasSub: "Pick as many as you'd like.",
    modTitulo: "How would you prefer the consultation?", modSub: "You choose the most comfortable format.",
    online: "Online", onlineD: "By video, from the comfort of home",
    presencial: "In person", presencialD: "In Ribeirão Preto, Brazil",
    ambas: "Either works", ambasD: "Arrange with Rayssa",
    perTitulo: "What's the best time for you?", perSub: "The schedule is built with care.",
    manha: "Morning", manhaD: "Between 8am and 12pm",
    tarde: "Afternoon", tardeD: "Between 1pm and 6pm",
    noite: "Evening", noiteD: "After 6pm",
    contTitulo: "How can we reach you?", contSub: "We only use your contact to follow up about the consultation.",
    wpp: "WhatsApp with country code", email: "Your best email", cidade: "City where you live",
    msgTitulo: "Want to leave a note for Rayssa?", msgSub: "Share something important. Optional.",
    msgPh: "Write freely…",
    resTitulo: "All good here?", resSub: "Take a quick look before sending.",
    rPais: "Country", rNome: "Name", rMomento: "Moment", rSemanas: "Weeks", rDuvidas: "Topics",
    rMod: "Format", rPer: "Time", rCidade: "City", rWpp: "WhatsApp", rEmail: "Email",
    sucTitulo: "Thank you", sucSub: "We received your answers. Rayssa will reach out on WhatsApp.",
    sucNota: "We opened a pre-filled chat with Rayssa. If it didn't open, tap the button below.",
    waMsg: "Hi Rayssa! I'm", waQuero: "and I'd like to schedule a consultation.",
    waMomento: "Moment", waSem: "weeks", waMod: "Format", waPer: "Best time",
    waCidade: "City", waDuv: "Main topics", waCont: "Contact", waPais: "Country",
    ofTitulo: "How would you like to continue from here?",
    ofSub: "Pick the path that feels most natural. You don't have to decide everything now.",
    ofConsultaTag: "Recommended for you",
    ofConsultaTitulo: "Warm consultation with Rayssa",
    ofConsultaDesc: "Humanized care, complete prenatal follow-up and a tailored care plan. Limited spots this week.",
    ofConsultaBtn: "Talk to Rayssa now",
    ofAppTag: "Start free",
    ofAppTitulo: "Follow your pregnancy in the Le Mater app",
    ofAppDesc: "Week-by-week content, a guided birth plan, and the mothers community. Try it at no cost.",
    ofAppBtn: "Open the free app",
    ofProva: "1,200+ families served · 5.0 ★ on Google",
    ofOu: "or",
  },
  es: {
    inicio: "Inicio", pronto: "Listo", de: "de", cancelar: "Cancelar", voltar: "Volver",
    comecar: "Comenzar", continuar: "Continuar", enviar: "Enviar y abrir WhatsApp",
    enviando: "Enviando…", fechar: "Cerrar",
    paisTitulo: "¿Desde dónde nos visitas?", paisSub: "Elige tu país para adaptar el idioma.",
    bvTitulo: "Qué bueno tenerte aquí",
    bvSub: "Conversemos en pocos pasos para entender tu momento y preparar una consulta acogedora con Rayssa. Menos de 2 minutos.",
    bvNota: "Tus respuestas se guardan con privacidad y ayudan a Rayssa a llegar más preparada.",
    nomeTitulo: "¿Cómo podemos llamarte?", nomeSub: "Para empezar la conversación con cariño.",
    nomePh: "Tu primer nombre",
    estagioTitulo: "¿En qué momento estás", estagioSub: "Esto ayuda a Rayssa a entender tu escenario.",
    tentante: "Buscando embarazo", tentanteD: "Planeando quedar embarazada",
    t1: "1er trimestre", t1d: "Hasta 13 semanas",
    t2: "2º trimestre", t2d: "14 a 27 semanas",
    t3: "3er trimestre", t3d: "28 semanas en adelante",
    pos: "Posparto", posD: "El bebé ya llegó",
    semanasTitulo: "¿En qué semana estás?", semanasSub: "Puede ser una estimación, sin presión.",
    semanasPh: "Ej: 22",
    duvidasTitulo: "¿Qué está más en tu corazón ahora?", duvidasSub: "Elige las que quieras.",
    modTitulo: "¿Cómo prefieres la consulta?", modSub: "Tú eliges el formato más cómodo.",
    online: "En línea", onlineD: "Por video, desde casa",
    presencial: "Presencial", presencialD: "En Ribeirão Preto, Brasil",
    ambas: "Cualquiera", ambasD: "Coordinar con Rayssa",
    perTitulo: "¿Cuál es el mejor horario?", perSub: "La agenda se organiza con cariño.",
    manha: "Mañana", manhaD: "Entre 8h y 12h",
    tarde: "Tarde", tardeD: "Entre 13h y 18h",
    noite: "Noche", noiteD: "Después de las 18h",
    contTitulo: "¿Cómo te contactamos?", contSub: "Usamos tu contacto solo para responder sobre la consulta.",
    wpp: "WhatsApp con código de país", email: "Tu mejor correo", cidade: "Ciudad donde vives",
    msgTitulo: "¿Quieres dejar un mensaje a Rayssa?", msgSub: "Cuenta algo importante. Es opcional.",
    msgPh: "Escribe con libertad…",
    resTitulo: "¿Todo bien por aquí?", resSub: "Revisa rápido antes de enviar.",
    rPais: "País", rNome: "Nombre", rMomento: "Momento", rSemanas: "Semanas", rDuvidas: "Temas",
    rMod: "Modalidad", rPer: "Horario", rCidade: "Ciudad", rWpp: "WhatsApp", rEmail: "Email",
    sucTitulo: "Gracias", sucSub: "Recibimos tus respuestas. Rayssa te contactará por WhatsApp.",
    sucNota: "Ya abrimos un chat listo con Rayssa. Si no se abrió, toca el botón abajo.",
    waMsg: "¡Hola Rayssa! Soy", waQuero: "y me gustaría agendar una consulta.",
    waMomento: "Momento", waSem: "semanas", waMod: "Modalidad", waPer: "Mejor horario",
    waCidade: "Ciudad", waDuv: "Temas principales", waCont: "Contacto", waPais: "País",
    ofTitulo: "¿Cómo prefieres continuar desde aquí?",
    ofSub: "Elige el camino más natural para tu momento. No necesitas decidirlo todo ahora.",
    ofConsultaTag: "Recomendado para ti",
    ofConsultaTitulo: "Consulta acogedora con Rayssa",
    ofConsultaDesc: "Atención humanizada, prenatal completo y plan de cuidado a tu medida. Cupos limitados esta semana.",
    ofConsultaBtn: "Hablar con Rayssa ahora",
    ofAppTag: "Empieza gratis",
    ofAppTitulo: "Acompaña tu embarazo en la app Le Mater",
    ofAppDesc: "Contenido semana a semana, plan de parto guiado y la comunidad de madres. Pruébala sin costo.",
    ofAppBtn: "Abrir la app gratuita",
    ofProva: "Más de 1.200 familias atendidas · 5.0 ★ en Google",
    ofOu: "o",
  },
};

interface Respostas {
  pais: string | null;
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
  pais: null, nome: "", estagio: null, semanas: "", duvidas: [],
  modalidade: null, periodo: null, cidade: "", whatsapp: "", email: "", mensagem: "",
};

const DUVIDAS_KEYS: Record<Lang, string[]> = {
  pt: ["Pré-natal humanizado", "Plano de parto", "Amamentação", "Exames e vacinas", "Saúde mental gestacional", "Alimentação na gravidez", "Pós-parto e puerpério", "Cuidados com o bebê"],
  en: ["Humanized prenatal care", "Birth plan", "Breastfeeding", "Tests and vaccines", "Mental health in pregnancy", "Nutrition during pregnancy", "Postpartum care", "Baby care"],
  es: ["Prenatal humanizado", "Plan de parto", "Lactancia", "Exámenes y vacunas", "Salud mental gestacional", "Alimentación en el embarazo", "Posparto y puerperio", "Cuidados del bebé"],
};

export function AgendamentoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [r, setR] = useState<Respostas>(RESPOSTAS_INICIAIS);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const registrar = useServerFn(registrarLead);

  const paisObj = PAISES.find((p) => p.code === r.pais) ?? null;
  const lang: Lang = paisObj?.lang ?? "pt";
  const t = T[lang];

  const ehGestante = r.estagio === "1tri" || r.estagio === "2tri" || r.estagio === "3tri";

  const passos = [
    "boas-vindas",
    "pais",
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
  const total = passos.length - 1;
  const atual = passos[step];
  const progresso = Math.max(0, Math.min(100, (step / (passos.length - 2)) * 100));

  function patch(p: Partial<Respostas>) {
    setR((prev) => ({ ...prev, ...p }));
  }

  function podeAvancar(): boolean {
    switch (atual) {
      case "pais": return !!r.pais;
      case "nome": return r.nome.trim().length >= 2;
      case "estagio": return !!r.estagio;
      case "semanas": return r.semanas !== "";
      case "duvidas": return r.duvidas.length > 0;
      case "modalidade": return !!r.modalidade;
      case "periodo": return !!r.periodo;
      case "contato": return r.whatsapp.replace(/\D/g, "").length >= 10 && /\S+@\S+\.\S+/.test(r.email);
      default: return true;
    }
  }

  function avancar() {
    setErro(null);
    setStep((s) => Math.min(s + 1, passos.length - 1));
  }
  function voltar() {
    setErro(null);
    setStep((s) => Math.max(0, s - 1));
  }

  async function enviar() {
    setEnviando(true);
    setErro(null);
    try {
      await registrar({
        data: { nome: r.nome, email: r.email, telefone: r.whatsapp, material_id: null },
      });
      const labelEstagio: Record<Estagio, string> = {
        tentante: t.tentante, "1tri": t.t1, "2tri": t.t2, "3tri": t.t3, pos: t.pos,
      };
      const labelModalidade: Record<Modalidade, string> = {
        online: t.online, presencial: t.presencial, ambas: t.ambas,
      };
      const labelPeriodo: Record<Periodo, string> = {
        manha: t.manha, tarde: t.tarde, noite: t.noite,
      };
      const paisNome = paisObj ? paisObj.nome[lang] : "—";
      const msg =
        `${t.waMsg} ${r.nome} ${t.waQuero}%0A%0A` +
        `• ${t.waPais}: ${paisNome}%0A` +
        `• ${t.waMomento}: ${r.estagio ? labelEstagio[r.estagio] : "—"}` +
        (r.semanas ? ` (${r.semanas} ${t.waSem})` : "") + `%0A` +
        `• ${t.waMod}: ${r.modalidade ? labelModalidade[r.modalidade] : "—"}%0A` +
        `• ${t.waPer}: ${r.periodo ? labelPeriodo[r.periodo] : "—"}%0A` +
        `• ${t.waCidade}: ${r.cidade || "—"}%0A` +
        `• ${t.waDuv}: ${r.duvidas.join(", ") || "—"}%0A` +
        (r.mensagem ? `%0A"${r.mensagem}"%0A` : "") +
        `%0A${t.waCont}: ${r.whatsapp} · ${r.email}`;
      setStep(passos.length - 1);
      setTimeout(() => {
        window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${msg}`, "_blank", "noopener,noreferrer");
      }, 600);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro");
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

  // Enter key advances
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Enter") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "TEXTAREA") return; // allow newlines in textarea
      e.preventDefault();
      if (atual === "sucesso") return fechar();
      if (atual === "resumo") {
        if (!enviando) enviar();
        return;
      }
      if (podeAvancar()) avancar();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, atual, r, enviando]);

  if (!open) return null;

  const duvidasOpcoes = DUVIDAS_KEYS[lang];

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
                animate={{ width: `${progresso}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{ height: "100%", background: `linear-gradient(90deg, ${c.sage}, ${c.sageDark})` }}
              />
            </div>
            <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: c.muted }}>
              {step === 0 ? t.inicio : atual === "sucesso" ? t.pronto : `${step} ${t.de} ${total - 1}`}
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
              <motion.div key={atual}
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }}>

                {atual === "boas-vindas" && (
                  <Bloco titulo={t.bvTitulo} sub={t.bvSub}>
                    <p style={pNota}>{t.bvNota}</p>
                  </Bloco>
                )}

                {atual === "pais" && (
                  <Bloco titulo={t.paisTitulo} sub={t.paisSub}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                      {PAISES.map((p) => {
                        const ativo = r.pais === p.code;
                        return (
                          <button key={p.code} type="button"
                            onClick={() => patch({ pais: p.code })}
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

                {atual === "nome" && (
                  <Bloco titulo={t.nomeTitulo} sub={t.nomeSub}>
                    <Input autoFocus placeholder={t.nomePh} value={r.nome}
                      onChange={(v) => patch({ nome: v })} />
                  </Bloco>
                )}

                {atual === "estagio" && (
                  <Bloco titulo={`${t.estagioTitulo}${primeiro(r.nome) ? ", " + primeiro(r.nome) : ""}?`}
                    sub={t.estagioSub}>
                    <Opcoes valor={r.estagio} onChange={(v) => patch({ estagio: v as Estagio })}
                      opcoes={[
                        ["tentante", t.tentante, t.tentanteD],
                        ["1tri", t.t1, t.t1d],
                        ["2tri", t.t2, t.t2d],
                        ["3tri", t.t3, t.t3d],
                        ["pos", t.pos, t.posD],
                      ]} />
                  </Bloco>
                )}

                {atual === "semanas" && (
                  <Bloco titulo={t.semanasTitulo} sub={t.semanasSub}>
                    <Input autoFocus type="number" placeholder={t.semanasPh}
                      value={r.semanas} onChange={(v) => patch({ semanas: v })} />
                  </Bloco>
                )}

                {atual === "duvidas" && (
                  <Bloco titulo={t.duvidasTitulo} sub={t.duvidasSub}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                      {duvidasOpcoes.map((d) => {
                        const ativa = r.duvidas.includes(d);
                        return (
                          <button key={d} type="button"
                            onClick={() => patch({
                              duvidas: ativa ? r.duvidas.filter((x) => x !== d) : [...r.duvidas, d],
                            })}
                            style={{
                              padding: "10px 12px", borderRadius: 999,
                              border: `1px solid ${ativa ? c.sageDark : c.border}`,
                              background: ativa ? c.sageDark : "white",
                              color: ativa ? c.cream : c.ink,
                              cursor: "pointer", fontFamily: sans, fontSize: 12.5,
                              textAlign: "center", lineHeight: 1.2,
                              transition: "all 0.2s",
                            }}>{d}</button>
                        );
                      })}
                    </div>
                  </Bloco>
                )}

                {atual === "modalidade" && (
                  <Bloco titulo={t.modTitulo} sub={t.modSub}>
                    <Opcoes valor={r.modalidade} onChange={(v) => patch({ modalidade: v as Modalidade })}
                      opcoes={[
                        ["online", t.online, t.onlineD],
                        ["presencial", t.presencial, t.presencialD],
                        ["ambas", t.ambas, t.ambasD],
                      ]} />
                  </Bloco>
                )}

                {atual === "periodo" && (
                  <Bloco titulo={t.perTitulo} sub={t.perSub}>
                    <Opcoes valor={r.periodo} onChange={(v) => patch({ periodo: v as Periodo })}
                      opcoes={[
                        ["manha", t.manha, t.manhaD],
                        ["tarde", t.tarde, t.tardeD],
                        ["noite", t.noite, t.noiteD],
                      ]} />
                  </Bloco>
                )}

                {atual === "contato" && (
                  <Bloco titulo={t.contTitulo} sub={t.contSub}>
                    <div style={{ display: "grid", gap: 12 }}>
                      <Input placeholder={t.wpp} value={r.whatsapp}
                        onChange={(v) => patch({ whatsapp: v })} />
                      <Input type="email" placeholder={t.email} value={r.email}
                        onChange={(v) => patch({ email: v })} />
                      <Input placeholder={t.cidade} value={r.cidade}
                        onChange={(v) => patch({ cidade: v })} />
                    </div>
                  </Bloco>
                )}

                {atual === "mensagem" && (
                  <Bloco titulo={t.msgTitulo} sub={t.msgSub}>
                    <textarea value={r.mensagem}
                      onChange={(e) => patch({ mensagem: e.target.value })}
                      placeholder={t.msgPh} rows={5}
                      style={{
                        width: "100%", padding: "14px 16px", borderRadius: 14,
                        border: `1px solid ${c.border}`, background: "white",
                        fontFamily: sans, fontSize: 15, color: c.ink,
                        resize: "vertical", outline: "none",
                      }} />
                  </Bloco>
                )}

                {atual === "resumo" && (
                  <Bloco titulo={t.resTitulo} sub={t.resSub}>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
                      <ItemResumo k={t.rPais} v={paisObj ? paisObj.nome[lang] : ""} />
                      <ItemResumo k={t.rNome} v={r.nome} />
                      <ItemResumo k={t.rMomento} v={labelEstagioCurto(r.estagio, t)} />
                      {ehGestante && <ItemResumo k={t.rSemanas} v={r.semanas} />}
                      <ItemResumo k={t.rDuvidas} v={r.duvidas.join(", ")} />
                      <ItemResumo k={t.rMod} v={r.modalidade ? (t as any)[r.modalidade] : ""} />
                      <ItemResumo k={t.rPer} v={r.periodo ? (t as any)[r.periodo] : ""} />
                      <ItemResumo k={t.rCidade} v={r.cidade} />
                      <ItemResumo k={t.rWpp} v={r.whatsapp} />
                      <ItemResumo k={t.rEmail} v={r.email} />
                    </ul>
                    {erro && <p style={{ color: c.terracotta, marginTop: 16, fontSize: 13 }}>{erro}</p>}
                  </Bloco>
                )}

                {atual === "sucesso" && (
                  <Bloco titulo={`${t.sucTitulo}${primeiro(r.nome) ? ", " + primeiro(r.nome) : ""}`} sub={t.sucSub}>
                    <p style={pNota}>{t.sucNota}</p>
                  </Bloco>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div style={{
            padding: "18px 22px 22px", display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 12,
            borderTop: `1px solid ${c.border}`, background: c.warm,
          }}>
            {atual === "sucesso" ? (
              <button onClick={fechar} style={{ ...btnPrimario, marginLeft: "auto" }}>{t.fechar}</button>
            ) : (
              <>
                <button onClick={step === 0 ? fechar : voltar} style={btnGhost}>
                  {step === 0 ? t.cancelar : t.voltar}
                </button>
                {atual === "resumo" ? (
                  <button onClick={enviar} disabled={enviando} style={btnPrimario}>
                    {enviando ? t.enviando : t.enviar}
                  </button>
                ) : (
                  <button onClick={avancar} disabled={!podeAvancar()}
                    style={{
                      ...btnPrimario, opacity: podeAvancar() ? 1 : 0.45,
                      cursor: podeAvancar() ? "pointer" : "not-allowed",
                    }}>
                    {step === 0 ? t.comecar : t.continuar}
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

function Bloco({ titulo, sub, children }: { titulo: string; sub?: string; children: React.ReactNode }) {
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

function Opcoes({
  opcoes, valor, onChange,
}: {
  opcoes: Array<[string, string, string]>;
  valor: string | null; onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {opcoes.map(([id, titulo, desc]) => {
        const ativa = valor === id;
        return (
          <button key={id} type="button" onClick={() => onChange(id)}
            style={{
              textAlign: "left", padding: "14px 18px", borderRadius: 16,
              border: `1.5px solid ${ativa ? c.sageDark : c.border}`,
              background: "white",
              boxShadow: ativa ? `0 0 0 4px ${c.sageLight}33` : "none",
              cursor: "pointer", fontFamily: sans, transition: "all 0.2s",
            }}>
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
    <li style={{
      display: "flex", justifyContent: "space-between", gap: 16,
      padding: "10px 0", borderBottom: `1px dashed ${c.border}`,
    }}>
      <span style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: c.muted }}>{k}</span>
      <span style={{ fontFamily: serif, fontSize: 16, color: c.ink, textAlign: "right" }}>{v || "—"}</span>
    </li>
  );
}

function primeiro(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? "";
}

function labelEstagioCurto(e: Estagio | null, t: Record<string, string>): string {
  if (!e) return "";
  return ({ tentante: t.tentante, "1tri": t.t1, "2tri": t.t2, "3tri": t.t3, pos: t.pos } as Record<Estagio, string>)[e];
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

const pNota: CSSProperties = {
  fontSize: 13.5, color: c.muted, lineHeight: 1.55, marginTop: 6,
  background: "white", border: `1px solid ${c.border}`, borderRadius: 14,
  padding: "14px 16px",
};
