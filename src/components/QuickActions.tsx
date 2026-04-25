import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

type IconKind = "play" | "stethoscope" | "card" | "bell" | null;

const actions: { to: string; label: string; color: string; icon: IconKind }[] = [
  { to: "/videos", label: "Vídeos", color: "bg-coral-light text-primary", icon: "play" },
  { to: "/videochamada", label: "Consulta", color: "bg-mint-light text-accent-foreground", icon: "stethoscope" },
  { to: "/cartao", label: "Cartão", color: "bg-blush text-foreground", icon: "card" },
  { to: "/alertas", label: "Alertas", color: "bg-warm text-foreground", icon: "bell" },
];

// Play minimalista moderno: traço se desenhando em loop contínuo
function PlayMark() {
  return (
    <svg viewBox="0 0 24 24" className="w-9 h-9 text-current" fill="none">
      <motion.polygon
        points="9,6 9,18 19,12"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0.3 }}
        animate={{ pathLength: [0, 1, 1], opacity: [0.3, 1, 1] }}
        transition={{ duration: 2.4, times: [0, 0.6, 1], repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}

// Estetoscópio minimalista: traço se desenhando em loop contínuo
function StethoscopeMark() {
  return (
    <svg viewBox="0 0 24 24" className="w-9 h-9 text-current" fill="none">
      {/* Tubo em Y + curva até o disco */}
      <motion.path
        d="M7 4 V10 A4 4 0 0 0 15 10 V4 M11 14 V16 A4 4 0 0 0 18 16 V14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0.3 }}
        animate={{ pathLength: [0, 1, 1], opacity: [0.3, 1, 1] }}
        transition={{ duration: 2.4, times: [0, 0.6, 1], repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Disco do estetoscópio */}
      <motion.circle
        cx="18"
        cy="12"
        r="2"
        stroke="currentColor"
        strokeWidth="1.75"
        initial={{ pathLength: 0, opacity: 0.3 }}
        animate={{ pathLength: [0, 1, 1], opacity: [0.3, 1, 1] }}
        transition={{ duration: 2.4, times: [0, 0.6, 1], repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
      />
    </svg>
  );
}

// Cartão de saúde minimalista: contorno + linhas se desenhando em loop
function CardMark() {
  return (
    <svg viewBox="0 0 24 24" className="w-9 h-9 text-current" fill="none">
      {/* Contorno do cartão */}
      <motion.rect
        x="3.5"
        y="6"
        width="17"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0.3 }}
        animate={{ pathLength: [0, 1, 1], opacity: [0.3, 1, 1] }}
        transition={{ duration: 2.4, times: [0, 0.6, 1], repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Cruz médica */}
      <motion.path
        d="M8 13 H12 M10 11 V15"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0.3 }}
        animate={{ pathLength: [0, 1, 1], opacity: [0.3, 1, 1] }}
        transition={{ duration: 2.4, times: [0, 0.6, 1], repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      />
      {/* Linhas de informação */}
      <motion.path
        d="M14 11 H17 M14 14 H17"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0.3 }}
        animate={{ pathLength: [0, 1, 1], opacity: [0.3, 1, 1] }}
        transition={{ duration: 2.4, times: [0, 0.6, 1], repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
    </svg>
  );
}


// Sino de alerta minimalista: contorno + badeço se desenhando em loop
function BellMark() {
  return (
    <svg viewBox="0 0 24 24" className="w-9 h-9 text-current" fill="none">
      {/* Corpo do sino */}
      <motion.path
        d="M6 16 V11 A6 6 0 0 1 18 11 V16 L19.5 17.5 H4.5 L6 16 Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0.3 }}
        animate={{ pathLength: [0, 1, 1], opacity: [0.3, 1, 1] }}
        transition={{ duration: 2.4, times: [0, 0.6, 1], repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Badeço */}
      <motion.path
        d="M10.5 20 A1.5 1.5 0 0 0 13.5 20"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0.3 }}
        animate={{ pathLength: [0, 1, 1], opacity: [0.3, 1, 1] }}
        transition={{ duration: 2.4, times: [0, 0.6, 1], repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
      />
    </svg>
  );
}

export function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map(({ to, label, color, icon }, i) => (
        <motion.div
          key={to}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 * i }}
        >
          <Link to={to} className="flex flex-col items-center gap-2">
            <div className={`relative w-16 h-16 rounded-full ${color} flex flex-col items-center justify-center gap-0.5 shadow-sm overflow-hidden`}>
              {icon === "play" && <PlayMark />}
              {icon === "stethoscope" && <StethoscopeMark />}
              {icon === "card" && <CardMark />}
              <span className="text-[10px] font-bold leading-tight text-center">{label}</span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
