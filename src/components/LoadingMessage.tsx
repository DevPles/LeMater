import { motion } from "framer-motion";

type Props = {
  text?: string;
  className?: string;
};

/**
 * Minimalist modern loader: a single thin line that sweeps left to right,
 * paired with quiet typographic text. No icons, no rings, no dots cluster.
 */
export function LoadingMessage({ text = "Carregando", className = "" }: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 gap-5 ${className}`}
    >
      {/* Thin sweeping line */}
      <div className="relative h-px w-40 overflow-hidden bg-primary/10">
        <motion.span
          className="absolute top-0 left-0 h-full w-1/3 bg-primary"
          animate={{ x: ["-100%", "300%"] }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1],
          }}
        />
      </div>

      {/* Quiet wordmark */}
      <motion.span
        className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {text}
      </motion.span>
    </div>
  );
}
