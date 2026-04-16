import { motion } from "framer-motion";

interface TipCardProps {
  title: string;
  description: string;
}

export function TipCard({ title, description }: TipCardProps) {
  return (
    <motion.div
      className="bg-card rounded-2xl p-4 shadow-sm border border-border"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <h4 className="font-semibold text-sm text-foreground">{title}</h4>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
    </motion.div>
  );
}
