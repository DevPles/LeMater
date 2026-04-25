import { motion } from "framer-motion";
import { LiquidCard } from "@/components/LiquidCard";

interface TipCardProps {
  title: string;
  description: string;
}

export function TipCard({ title, description }: TipCardProps) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
      <LiquidCard className="p-4" bgOpacity={0.55}>
        <h4 className="font-semibold text-sm text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
      </LiquidCard>
    </motion.div>
  );
}
