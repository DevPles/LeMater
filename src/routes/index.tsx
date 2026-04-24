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
      <div className="relative bg-gradient-to-b from-[#1a4ba8] to-[#1a1557] px-8 pt-6 pb-6 rounded-t-3xl mt-3 flex-1 flex items-start justify-center">
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
            className="text-white/90 text-sm mb-2"
          >
            Cartão Digital da Gestante
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="relative rounded-full px-4 py-1.5 mb-4 overflow-hidden bg-gradient-to-br from-white/25 via-white/10 to-white/5 backdrop-blur-xl border border-white/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),inset_0_-1px_0_0_rgba(255,255,255,0.1),0_8px_32px_-4px_rgba(240,192,64,0.25)]"
          >
            <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-full pointer-events-none" />
            <span className="absolute -inset-x-2 -top-1 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none" />
            <span className="relative text-[#f0c040] text-[11px] font-semibold tracking-wider uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
              Uma iniciativa UNAERP
            </span>
          </motion.div>

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
