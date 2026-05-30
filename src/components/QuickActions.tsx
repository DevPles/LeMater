import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

const actions: { to: string; label: string; color: string }[] = [
  { to: "/app/videos", label: "Cursos", color: "text-primary" },
  { to: "/app/videochamada", label: "Consulta", color: "text-mint-dark" },
  { to: "/app/cartao", label: "Cartão", color: "text-blush-dark" },
  { to: "/app/alertas", label: "Alertas", color: "text-warm-dark" },
];

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
          <Link to={to} className="flex flex-col items-center">
            <div className={`w-16 h-16 rounded-full bg-transparent ${color} flex items-center justify-center`}>
              <span className="text-xs font-bold leading-tight text-center">{label}</span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
