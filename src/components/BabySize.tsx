import { motion } from "framer-motion";

const babySizes: Record<number, { fruit: string; size: string }> = {
  8: { fruit: "🫐", size: "1,6 cm" },
  12: { fruit: "🍋", size: "5,4 cm" },
  16: { fruit: "🍐", size: "11,6 cm" },
  20: { fruit: "🍌", size: "16,4 cm" },
  24: { fruit: "🌽", size: "30 cm" },
  28: { fruit: "🍆", size: "37,6 cm" },
  32: { fruit: "🥥", size: "42,4 cm" },
  36: { fruit: "🍈", size: "47,4 cm" },
  40: { fruit: "🍉", size: "51,2 cm" },
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
        <span className="text-5xl">{size.fruit}</span>
        <div>
          <p className="text-lg font-bold font-display text-foreground">{size.size}</p>
          <p className="text-xs text-muted-foreground">comprimento aproximado</p>
        </div>
      </div>
    </motion.div>
  );
}
