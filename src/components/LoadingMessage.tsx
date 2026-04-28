import { motion } from "framer-motion";

type Props = {
  text?: string;
  className?: string;
};

/**
 * Animated loading indicator using only text + motion (no icons).
 * Shows a pulsing message with three bouncing dots and a shimmer bar.
 */
export function LoadingMessage({ text = "Carregando", className = "" }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center py-10 gap-3 ${className}`}>
      <motion.div
        className="flex items-baseline gap-1"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <motion.span
          className="text-sm font-semibold text-foreground tracking-wide"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          {text}
        </motion.span>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="inline-block w-1 h-1 rounded-full bg-primary"
            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.15,
            }}
          />
        ))}
      </motion.div>

      <div className="relative w-32 h-1 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="absolute inset-y-0 w-1/2 rounded-full bg-primary"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
