import { motion } from "framer-motion";
import { Baby, Flower2, Cherry, Apple, Banana, Carrot, Citrus, Egg, Grape } from "lucide-react";

const babySizes: Record<number, { icon: React.ElementType; size: string; name: string }> = {
  8: { icon: Grape, size: "1,6 cm", name: "Uva" },
  12: { icon: Citrus, size: "5,4 cm", name: "Limão" },
  16: { icon: Apple, size: "11,6 cm", name: "Pêra" },
  20: { icon: Banana, size: "16,4 cm", name: "Banana" },
  24: { icon: Carrot, size: "30 cm", name: "Espiga" },
  28: { icon: Cherry, size: "37,6 cm", name: "Berinjela" },
  32: { icon: Egg, size: "42,4 cm", name: "Coco" },
  36: { icon: Flower2, size: "47,4 cm", name: "Melão" },
  40: { icon: Baby, size: "51,2 cm", name: "Melancia" },
};

function getClosestSize(week: number) {
  const keys = Object.keys(babySizes).map(Number).sort((a, b) => a - b);
  const closest = keys.reduce((prev, curr) =>
    Math.abs(curr - week) < Math.abs(prev - week) ? curr : prev
  );
  return babySizes[closest];
}

export function BabySize({ week }: { week: number }) {
  const size = getClosestSize(week);
  const IconComp = size.icon;

  return (
    <motion.div
      className="bg-mint-light rounded-2xl p-5 shadow-sm"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <p className="text-sm text-accent-foreground font-medium mb-2">Tamanho do bebê</p>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center">
          <IconComp className="w-7 h-7 text-accent-foreground" />
        </div>
        <div>
          <p className="text-lg font-bold font-display text-foreground">{size.size}</p>
          <p className="text-xs text-muted-foreground">comprimento aproximado ({size.name})</p>
        </div>
      </div>
    </motion.div>
  );
}
