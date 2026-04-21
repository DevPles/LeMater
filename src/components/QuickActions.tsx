import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

const actions = [
  { to: "/videos", label: "Vídeos", color: "bg-coral-light text-primary" },
  { to: "/videochamada", label: "Chamada", color: "bg-mint-light text-accent-foreground" },
  { to: "/cartao", label: "Cartão", color: "bg-blush text-foreground" },
  { to: "/alertas", label: "Alertas", color: "bg-warm text-foreground" },
] as const;

export function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map(({ to, label, color }, i) => (
        <motion.div
          key={to}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 * i }}
        >
          <Link to={to} className="flex flex-col items-center gap-2">
            <div className={`w-16 h-16 rounded-full ${color} flex items-center justify-center shadow-sm`}>
              <span className="text-[10px] font-bold leading-tight text-center">{label}</span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
