import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import RegistrationModal from "@/components/RegistrationModal";

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
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"login" | "register">("login");

  const openModal = (mode: "login" | "register") => {
    setModalMode(mode);
    setModalOpen(true);
  };

  return (
    <div className="h-[100dvh] overflow-hidden bg-gradient-to-b from-white via-blue-100 to-[#1a4ba8] flex flex-col">
      {/* Logo do hospital no topo */}
      <div className="flex items-start justify-center px-8 pt-2 pb-2">
        <img
          src="/images/hospital-bonini-logo.png"
          alt="Hospital Electro Bonini - UNAERP"
          className="w-full max-w-[220px] object-contain"
        />
      </div>

      {/* Card inferior com gradiente roxo — preenche até o rodapé */}
      <div className="relative bg-gradient-to-b from-[#1a4ba8] to-[#1a1557] px-8 pt-6 pb-6 rounded-t-3xl mt-3 flex-1 flex items-start justify-center overflow-hidden">
        {/* Rising particles / bokeh animation */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 18 }).map((_, i) => {
            const size = 4 + ((i * 7) % 14);
            const left = (i * 53) % 100;
            const duration = 8 + ((i * 3) % 10);
            const delay = (i * 0.7) % 8;
            const blur = i % 3 === 0 ? "blur-[2px]" : i % 3 === 1 ? "blur-[1px]" : "";
            const opacity = 0.25 + ((i % 5) * 0.12);
            return (
              <motion.span
                key={i}
                className={`absolute rounded-full bg-white ${blur}`}
                style={{
                  width: size,
                  height: size,
                  left: `${left}%`,
                  bottom: `-${size}px`,
                  opacity,
                }}
                animate={{
                  y: ["0%", "-1200%"],
                  x: [0, i % 2 === 0 ? 20 : -20, 0],
                  opacity: [0, opacity, opacity, 0],
                }}
                transition={{
                  duration,
                  delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.1, 0.9, 1],
                }}
              />
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center text-center"
        >
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold font-display text-white mb-1 tracking-tight"
          >
            Mãe Digital
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-white/90 text-sm mb-5"
          >
            Cartão Digital da Gestante
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex flex-row items-center justify-center gap-3 w-full max-w-md"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openModal("login")}
              className="bg-[#f0c040] hover:bg-[#e5b535] text-[#1a1557] font-bold text-sm px-6 py-3 rounded-full shadow-xl shadow-[#f0c040]/40 transition-colors flex-1"
            >
              Entrar
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openModal("register")}
              className="bg-white/10 hover:bg-white/20 text-white border-2 border-white/40 font-bold text-sm px-6 py-3 rounded-full backdrop-blur-sm transition-colors flex-1"
            >
              Cadastrar
            </motion.button>
          </motion.div>
        </motion.div>
      </div>

      <RegistrationModal open={modalOpen} onOpenChange={setModalOpen} initialMode={modalMode} />
    </div>
  );
}
