import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

const actions = [
  { to: "/videos", label: "Vídeos", color: "bg-coral-light text-primary", hasPlay: true },
  { to: "/videochamada", label: "Chamada", color: "bg-mint-light text-accent-foreground", hasPlay: false },
  { to: "/cartao", label: "Cartão", color: "bg-blush text-foreground", hasPlay: false },
  { to: "/alertas", label: "Alertas", color: "bg-warm text-foreground", hasPlay: false },
] as const;

// Triângulo de play minimalista, centralizado atrás do label, com respiração sutil
function PlayMark() {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      className="absolute inset-0 m-auto w-8 h-8 text-current"
      fill="currentColor"
      animate={{ opacity: [0.15, 0.35, 0.15], scale: [1, 1.06, 1] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
    >
      <polygon points="9,7 9,17 17,12" />
    </motion.svg>
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
            <div className={`relative w-16 h-16 rounded-full ${color} flex items-center justify-center shadow-sm overflow-hidden`}>
              {hasPlay && <PlayMark />}
              <span className="relative text-[10px] font-bold leading-tight text-center">{label}</span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
