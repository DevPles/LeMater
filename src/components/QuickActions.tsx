import { Link } from "@tanstack/react-router";
import { Play, Video, FileText, Bell } from "lucide-react";
import { motion } from "framer-motion";

const actions = [
  { to: "/videos", icon: Play, label: "Vídeos", color: "bg-coral-light text-primary" },
  { to: "/videochamada", icon: Video, label: "Chamada", color: "bg-mint-light text-accent-foreground" },
  { to: "/prontuario", icon: FileText, label: "Prontuário", color: "bg-blush text-foreground" },
  { to: "/alertas", icon: Bell, label: "Alertas", color: "bg-warm text-foreground" },
] as const;

export function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map(({ to, icon: Icon, label, color }, i) => (
        <motion.div
          key={to}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 * i }}
        >
          <Link
            to={to}
            className="flex flex-col items-center gap-2"
          >
            <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center shadow-sm`}>
              <Icon className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-foreground">{label}</span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
