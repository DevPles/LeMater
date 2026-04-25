import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

const actions = [
  { to: "/videos", label: "Vídeos", color: "bg-coral-light text-primary", hasEqualizer: true },
  { to: "/videochamada", label: "Chamada", color: "bg-mint-light text-accent-foreground", hasEqualizer: false },
  { to: "/cartao", label: "Cartão", color: "bg-blush text-foreground", hasEqualizer: false },
  { to: "/alertas", label: "Alertas", color: "bg-warm text-foreground", hasEqualizer: false },
] as const;

// Ícone de vídeo minimalista — triângulo de play com anel pulsante contínuo
function PlayPulse() {
  return (
    <div className="absolute top-1.5 right-1.5 w-4 h-4">
      {/* Anel externo pulsando (ripple) */}
      <motion.span
        className="absolute inset-0 rounded-full border border-current"
        animate={{ scale: [1, 1.6], opacity: [0.7, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
      />
      {/* Disco sólido com triângulo de play */}
      <motion.div
        className="absolute inset-0 rounded-full bg-current flex items-center justify-center"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 10 10" className="w-2 h-2 text-coral-light" fill="currentColor">
          <polygon points="3,2 3,8 8,5" />
        </svg>
      </motion.div>
    </div>
  );
}

export function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map(({ to, label, color, hasEqualizer }, i) => (
        <motion.div
          key={to}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 * i }}
        >
          <Link to={to} className="flex flex-col items-center gap-2">
            <div className={`relative w-16 h-16 rounded-full ${color} flex items-center justify-center shadow-sm overflow-hidden`}>
              {hasEqualizer && <PlayPulse />}
              <span className="text-[10px] font-bold leading-tight text-center">{label}</span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
