import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MãeDigital — Cartão Digital da Gestante" },
      { name: "description", content: "Iniciativa UNAERP. Acompanhe sua gestação com suporte profissional." },
    ],
  }),
  component: WelcomeScreen,
});

function WelcomeScreen() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/unaerp-bg.png')" }}
      />
      <div className="absolute inset-0 bg-[#1a1557]/70" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex flex-col items-center text-center px-8 max-w-md"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="w-20 h-20 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center mb-6 border border-white/20"
        >
          <span className="text-3xl font-bold text-[#f0c040] font-display">M</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-4xl font-bold font-display text-white mb-2 tracking-tight"
        >
          MãeDigital
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-white/80 text-base mb-2"
        >
          Cartão Digital da Gestante
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-10 border border-white/15"
        >
          <span className="text-[#f0c040] text-xs font-semibold tracking-wider uppercase">
            Uma iniciativa UNAERP
          </span>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate({ to: "/home" })}
          className="bg-[#f0c040] hover:bg-[#e5b535] text-[#1a1557] font-bold text-lg px-10 py-4 rounded-full shadow-lg shadow-[#f0c040]/30 transition-colors"
        >
          Entrar →
        </motion.button>
      </motion.div>
    </div>
  );
}
