import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

const actions = [
  { to: "/videos", label: "Vídeos", color: "bg-coral-light text-primary", hasEqualizer: true },
  { to: "/videochamada", label: "Chamada", color: "bg-mint-light text-accent-foreground", hasEqualizer: false },
  { to: "/cartao", label: "Cartão", color: "bg-blush text-foreground", hasEqualizer: false },
  { to: "/alertas", label: "Alertas", color: "bg-warm text-foreground", hasEqualizer: false },
] as const;

// Equalizer animado contínuo — 4 barras com timings desencontrados
function Equalizer() {
  const bars = [
    { delay: 0, duration: 0.9, heights: ["20%", "85%", "40%"] },
    { delay: 0.15, duration: 1.1, heights: ["70%", "25%", "90%"] },
    { delay: 0.3, duration: 0.8, heights: ["35%", "95%", "55%"] },
    { delay: 0.45, duration: 1.0, heights: ["80%", "30%", "65%"] },
  ];

  return (
    <div className="absolute top-1.5 right-1.5 flex items-end gap-[2px] h-3 w-3.5">
      {bars.map((bar, idx) => (
        <motion.span
          key={idx}
          className="flex-1 bg-current rounded-full origin-bottom"
          animate={{ height: bar.heights }}
          transition={{
            duration: bar.duration,
            delay: bar.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ height: "30%" }}
        />
      ))}
    </div>
  );
}

export function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map(({ to, label, color, hasEqualizer }, i) => (
        <motion.div
          key={to}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 * i }}
        >
          <Link to={to} className="flex flex-col items-center gap-2">
            <div className={`relative w-16 h-16 rounded-full ${color} flex items-center justify-center shadow-sm overflow-hidden`}>
              {hasEqualizer && <Equalizer />}
              <span className="text-[10px] font-bold leading-tight text-center">{label}</span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
