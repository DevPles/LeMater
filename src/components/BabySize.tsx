import { motion } from "framer-motion";

const babySizes: Record<number, { size: string; name: string }> = {
  8: { size: "1,6 cm", name: "Uva" },
  12: { size: "5,4 cm", name: "Limão" },
  16: { size: "11,6 cm", name: "Pêra" },
  20: { size: "16,4 cm", name: "Banana" },
  24: { size: "30 cm", name: "Espiga" },
  28: { size: "37,6 cm", name: "Berinjela" },
  32: { size: "42,4 cm", name: "Coco" },
  36: { size: "47,4 cm", name: "Melão" },
  40: { size: "51,2 cm", name: "Melancia" },
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
          <span className="text-lg font-bold text-accent-foreground font-display">{size.name.charAt(0)}</span>
        </div>
        <div>
          <p className="text-lg font-bold font-display text-foreground">{size.size}</p>
          <p className="text-xs text-muted-foreground">comprimento aproximado ({size.name})</p>
        </div>
      </div>
    </motion.div>
  );
}
