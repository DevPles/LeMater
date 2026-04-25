import { motion } from "framer-motion";

/**
 * Cegonha voando ao fundo da tela.
 * - Voa da esquerda para a direita em loop
 * - Sobe e desce levemente (ondulação)
 * - Asas batem suavemente
 * - Desenho minimalista em SVG, segue a paleta do tema
 */
export function FlyingStork() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Trajetória horizontal (loop) */}
      <motion.div
        initial={{ x: "-20%" }}
        animate={{ x: "120%" }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-[14%]"
      >
        {/* Ondulação vertical */}
        <motion.div
          animate={{ y: [0, -10, 0, 8, 0] }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Stork />
        </motion.div>
      </motion.div>
    </div>
  );
}

function Stork() {
  // Paleta: corpo claro (mint-claro), bico/pernas em tom quente, trouxa em blush
  return (
    <svg
      viewBox="0 0 120 70"
      className="w-28 h-16 opacity-30"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Corpo */}
      <path
        d="M40 38 C 50 30, 70 30, 82 36 L 90 38 L 82 42 C 70 46, 50 46, 40 38 Z"
        className="fill-mint stroke-mint-dark"
      />

      {/* Cabeça + pescoço */}
      <path
        d="M82 36 C 88 32, 94 30, 98 26"
        className="stroke-mint-dark"
      />
      <circle cx="99" cy="25" r="2.4" className="fill-mint stroke-mint-dark" />

      {/* Bico */}
      <path d="M101 25 L 108 24" className="stroke-warm-dark" strokeWidth="1.6" />

      {/* Pernas para trás */}
      <path d="M50 42 L 40 56 M55 43 L 47 58" className="stroke-warm-dark" />

      {/* Asa que bate */}
      <motion.path
        d="M55 36 Q 62 22 75 30"
        className="stroke-mint-dark"
        animate={{
          d: [
            "M55 36 Q 62 22 75 30",
            "M55 36 Q 62 14 78 26",
            "M55 36 Q 62 30 75 34",
            "M55 36 Q 62 22 75 30",
          ],
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Trouxa do bebê pendurada no bico */}
      <path d="M108 24 L 114 30" className="stroke-warm-dark" />
      <path
        d="M110 30 q 4 -2 8 0 q 2 6 -4 8 q -6 -1 -4 -8 z"
        className="fill-blush stroke-blush-dark"
      />
    </svg>
  );
}
