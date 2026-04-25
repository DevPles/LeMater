import { motion } from "framer-motion";

/**
 * Cegonha voando ao fundo da tela.
 * Desenho elegante em SVG, com asas batendo, ondulação suave
 * e trouxa do bebê pendurada no bico.
 */
export function FlyingStork() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden z-0"
    >
      <motion.div
        initial={{ x: "-25%" }}
        animate={{ x: "125%" }}
        transition={{
          duration: 32,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-[12%]"
      >
        <motion.div
          animate={{ y: [0, -14, 0, 10, 0], rotate: [-2, 1, -1, 2, -2] }}
          transition={{
            duration: 7,
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
  return (
    <svg
      viewBox="0 0 200 140"
      className="w-44 h-32 opacity-70 drop-shadow-sm"
      fill="none"
    >
      {/* Pernas longas estendidas para trás */}
      <g
        className="stroke-warm-dark"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        <path d="M70 80 L 30 112" />
        <path d="M76 82 L 38 116" />
        <path d="M30 112 L 26 114" />
        <path d="M38 116 L 34 118" />
      </g>

      {/* Corpo principal — forma de gota alongada */}
      <path
        d="M62 78
           C 70 64, 105 58, 135 64
           C 150 67, 158 72, 160 76
           C 158 82, 150 85, 135 86
           C 105 90, 75 88, 62 78 Z"
        className="fill-background stroke-foreground/70"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Pescoço curvo e elegante */}
      <path
        d="M148 70
           C 158 60, 168 52, 174 42"
        className="stroke-foreground/70"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M150 74
           C 160 64, 170 56, 176 46"
        className="stroke-background"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Cabeça */}
      <ellipse
        cx="176"
        cy="40"
        rx="6"
        ry="5"
        className="fill-background stroke-foreground/70"
        strokeWidth="1.2"
      />

      {/* Olho */}
      <circle cx="178" cy="39" r="0.9" className="fill-foreground" />

      {/* Bico longo e fino */}
      <path
        d="M182 40 L 198 38 L 182 42 Z"
        className="fill-warm-dark stroke-warm-dark"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      {/* Trouxa do bebê pendurada no bico */}
      <g>
        <path
          d="M196 39 L 188 56"
          className="stroke-foreground/60"
          strokeWidth="0.8"
          strokeLinecap="round"
        />
        {/* Nó da trouxa */}
        <path
          d="M186 54 q 2 -3 5 0 q 1 2 -1 3 q -3 1 -4 -3 z"
          className="fill-blush stroke-blush-dark"
          strokeWidth="0.8"
        />
        {/* Corpo da trouxa */}
        <path
          d="M183 58
             q -2 6 3 10
             q 8 3 11 -3
             q 2 -7 -4 -10
             q -6 -2 -10 3 z"
          className="fill-blush stroke-blush-dark"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </g>

      {/* Asa que bate — camada de fundo */}
      <motion.path
        className="fill-mint stroke-mint-dark"
        strokeWidth="1.2"
        strokeLinejoin="round"
        animate={{
          d: [
            // asa para baixo
            "M85 76 C 80 92, 95 104, 120 100 C 135 98, 140 88, 138 80 C 120 84, 100 82, 85 76 Z",
            // asa intermediária
            "M85 76 C 88 80, 110 82, 130 78 C 138 76, 142 74, 140 72 C 120 76, 100 76, 85 76 Z",
            // asa para cima
            "M85 76 C 92 60, 110 48, 130 50 C 140 52, 142 60, 138 66 C 120 64, 100 70, 85 76 Z",
            // volta intermediária
            "M85 76 C 88 80, 110 82, 130 78 C 138 76, 142 74, 140 72 C 120 76, 100 76, 85 76 Z",
            // asa para baixo
            "M85 76 C 80 92, 95 104, 120 100 C 135 98, 140 88, 138 80 C 120 84, 100 82, 85 76 Z",
          ],
        }}
        transition={{
          duration: 1.6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Detalhe de penas na ponta da cauda */}
      <path
        d="M62 78 L 50 74 M62 78 L 52 80 M62 78 L 54 84"
        className="stroke-foreground/60"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}
