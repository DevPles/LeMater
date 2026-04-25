import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

const actions = [
  { to: "/videos", label: "Vídeos", color: "bg-coral-light text-primary", hasPlay: true },
  { to: "/videochamada", label: "Chamada", color: "bg-mint-light text-accent-foreground", hasPlay: false },
  { to: "/cartao", label: "Cartão", color: "bg-blush text-foreground", hasPlay: false },
  { to: "/alertas", label: "Alertas", color: "bg-warm text-foreground", hasPlay: false },
] as const;

// Play minimalista moderno: traço se desenhando + ripple concêntrico em loop
function PlayMark() {
  return (
    <div className="relative w-7 h-7 flex items-center justify-center">
      {/* Ripple expandindo */}
      <motion.span
        className="absolute inset-0 rounded-full border border-current"
        animate={{ scale: [0.6, 1.4], opacity: [0.5, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
      />
      <motion.span
        className="absolute inset-0 rounded-full border border-current"
        animate={{ scale: [0.6, 1.4], opacity: [0.5, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: 0.9 }}
      />
      {/* Triângulo desenhando o traço continuamente */}
      <svg viewBox="0 0 24 24" className="relative w-5 h-5 text-current" fill="none">
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
    </div>
  );
}

export function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map(({ to, label, color, hasPlay }, i) => (
        <motion.div
          key={to}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 * i }}
        >
          <Link to={to} className="flex flex-col items-center gap-2">
            <div className={`relative w-16 h-16 rounded-full ${color} flex flex-col items-center justify-center gap-0.5 shadow-sm overflow-hidden`}>
              {hasPlay && <PlayMark />}
              <span className="text-[10px] font-bold leading-tight text-center">{label}</span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
