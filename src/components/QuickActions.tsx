import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

const actions = [
  { to: "/videos", label: "Vídeos", color: "bg-coral-light text-primary", hasPlay: true },
  { to: "/videochamada", label: "Chamada", color: "bg-mint-light text-accent-foreground", hasPlay: false },
  { to: "/cartao", label: "Cartão", color: "bg-blush text-foreground", hasPlay: false },
  { to: "/alertas", label: "Alertas", color: "bg-warm text-foreground", hasPlay: false },
] as const;

// Triângulo de play minimalista (apenas contorno), animação em loop contínuo
function PlayMark() {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      className="w-7 h-7 text-current"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinejoin="round"
      strokeLinecap="round"
      animate={{ scale: [1, 1.15, 1] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
    >
      <polygon points="8,5 8,19 19,12" />
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
