import { Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

interface TipCardProps {
  title: string;
  description: string;
  emoji?: string;
}

export function TipCard({ title, description, emoji = "💡" }: TipCardProps) {
  return (
    <motion.div
      className="bg-card rounded-2xl p-4 shadow-sm border border-border flex gap-3"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="w-10 h-10 rounded-xl bg-warm flex items-center justify-center shrink-0 text-lg">
        {emoji}
      </div>
      <div>
        <h4 className="font-semibold text-sm text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}
