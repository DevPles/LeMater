import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

type IconKind = "play" | "stethoscope" | "card" | "bell" | null;

const actions: { to: string; label: string; color: string; icon: IconKind }[] = [
  { to: "/videos", label: "Vídeos", color: "bg-coral-light text-primary", icon: "play" },
  { to: "/videochamada", label: "Consulta", color: "bg-mint-light text-mint-dark", icon: "stethoscope" },
  { to: "/cartao", label: "Cartão", color: "bg-blush text-blush-dark", icon: "card" },
  { to: "/alertas", label: "Alertas", color: "bg-warm text-warm-dark", icon: "bell" },
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

// Linha de sinal vital (ECG) — simples, traçando continuamente
function StethoscopeMark() {
  return (
    <svg viewBox="0 0 24 24" className="w-9 h-9 text-current" fill="none">
      <motion.path
        d="M3 12 H8 L10 7 L13 17 L15 12 H21"
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

// Cartão minimalista com animação de desenho contínuo
function CardMark() {
  return (
    <svg viewBox="0 0 24 24" className="w-9 h-9 text-current" fill="none">
      <motion.rect
        x="4"
        y="7"
        width="16"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.75"
        initial={{ pathLength: 0, opacity: 0.3 }}
        animate={{ pathLength: [0, 1, 1], opacity: [0.3, 1, 1] }}
        transition={{ duration: 2.4, times: [0, 0.6, 1], repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M4 11 H20"
        stroke="currentColor"
        strokeWidth="1.75"
        initial={{ pathLength: 0, opacity: 0.3 }}
        animate={{ pathLength: [0, 1, 1], opacity: [0.3, 1, 1] }}
        transition={{ duration: 2.4, times: [0, 0.6, 1], repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
      />
    </svg>
  );
}

// Sino minimalista com animação de desenho contínuo
function BellMark() {
  return (
    <svg viewBox="0 0 24 24" className="w-9 h-9 text-current" fill="none">
      <motion.path
        d="M7 16 V11 A5 5 0 0 1 17 11 V16 H7 Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0.3 }}
        animate={{ pathLength: [0, 1, 1], opacity: [0.3, 1, 1] }}
        transition={{ duration: 2.4, times: [0, 0.6, 1], repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M10.5 19 A1.5 1.5 0 0 0 13.5 19"
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
              {icon === "bell" && <BellMark />}
              <span className="text-[10px] font-bold leading-tight text-center">{label}</span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
