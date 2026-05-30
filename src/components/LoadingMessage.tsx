import { motion } from "framer-motion";

type Props = {
  text?: string;
  className?: string;
};

/**
 * Modern animated loading indicator (no icons).
 * Concentric pulsing rings + animated gradient text + segmented progress.
 */
export function LoadingMessage({ text = "Carregando", className = "" }: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 gap-6 ${className}`}
    >
      {/* Concentric pulsing rings */}
      <div className="relative h-16 w-16 flex items-center justify-center">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute inset-0 rounded-full border-2 border-primary"
            animate={{
              scale: [0.4, 1.4],
              opacity: [0.6, 0],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeOut",
              delay: i * 0.6,
            }}
          />
        ))}
        <motion.span
          className="relative h-3 w-3 rounded-full bg-primary shadow-[0_0_18px_hsl(var(--primary)/0.7)]"
          animate={{ scale: [1, 1.35, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Animated gradient text */}
      <motion.div
        className="flex items-baseline gap-1.5"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <span
          className="text-sm font-semibold tracking-wide bg-clip-text text-transparent bg-[linear-gradient(90deg,hsl(var(--primary)),hsl(var(--accent,var(--primary))),hsl(var(--primary)))] bg-[length:200%_100%] animate-[shimmer_2.4s_linear_infinite]"
          style={{
            animation: "lm-shimmer 2.4s linear infinite",
          }}
        >
          {text}
        </span>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="inline-block h-1 w-1 rounded-full bg-primary"
            animate={{ y: [0, -4, 0], opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.15,
            }}
          />
        ))}
      </motion.div>

      {/* Segmented progress */}
      <div className="flex gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.span
            key={i}
            className="h-1 w-6 rounded-full bg-primary/20 overflow-hidden relative"
          >
            <motion.span
              className="absolute inset-0 rounded-full bg-primary"
              animate={{ scaleX: [0, 1, 0], originX: 0 }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.12,
              }}
            />
          </motion.span>
        ))}
      </div>

      <style>{`
        @keyframes lm-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
