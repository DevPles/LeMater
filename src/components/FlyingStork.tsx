import { motion } from "framer-motion";

/**
 * Bolinhas flutuando suavemente ao fundo da tela.
 * Usa as cores do tema (mint, blush, warm, coral) com opacidade baixa
 * para não competir com o conteúdo.
 */

type Bubble = {
  size: number;
  left: string;
  delay: number;
  duration: number;
  drift: number;
  color: string;
};

const bubbles: Bubble[] = [
  { size: 90, left: "8%", delay: 0, duration: 18, drift: 30, color: "bg-blush" },
  { size: 56, left: "22%", delay: 4, duration: 22, drift: -25, color: "bg-mint" },
  { size: 120, left: "38%", delay: 2, duration: 26, drift: 40, color: "bg-warm" },
  { size: 44, left: "55%", delay: 6, duration: 16, drift: -20, color: "bg-coral-light" },
  { size: 80, left: "68%", delay: 1, duration: 24, drift: 35, color: "bg-mint-light" },
  { size: 64, left: "82%", delay: 5, duration: 20, drift: -30, color: "bg-blush" },
  { size: 38, left: "92%", delay: 3, duration: 19, drift: 25, color: "bg-warm" },
];

export function FlyingStork() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden z-0"
    >
      {bubbles.map((b, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full ${b.color} opacity-40 blur-[2px]`}
          style={{
            width: b.size,
            height: b.size,
            left: b.left,
            bottom: -b.size,
          }}
          animate={{
            y: [0, -window.innerHeight - b.size * 2],
            x: [0, b.drift, -b.drift, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{
            y: {
              duration: b.duration,
              repeat: Infinity,
              ease: "linear",
              delay: b.delay,
            },
            x: {
              duration: b.duration / 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: b.delay,
            },
            scale: {
              duration: b.duration / 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: b.delay,
            },
          }}
        />
      ))}
    </div>
  );
}
