import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface TipCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function TipCard({ title, description, icon: Icon }: TipCardProps) {
  return (
    <motion.div
      className="bg-card rounded-2xl p-4 shadow-sm border border-border flex gap-3"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="w-10 h-10 rounded-xl bg-warm flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-foreground" />
      </div>
      <div>
        <h4 className="font-semibold text-sm text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}
