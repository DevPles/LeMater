import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import RegistrationModal from "@/components/RegistrationModal";
import { useLang, FLAG_TO_LANG, isTranslatable, type Lang } from "@/lib/translate.context";
import { translateBatch } from "@/lib/translate.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MãeDigital — Carteira Digital da Gestante" },
      { name: "description", content: "\n. Acompanhe sua gestação com suporte profissional." },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap",
      },
    ],
  }),
  component: WelcomeScreen,
});

const c = {
  cream: "#FAF5EE",
  warm: "#F5EDE0",
  sage: "#5C8A6E",
  sageLight: "#8AB89A",
  sageDark: "#2D5A42",
  terracotta: "#C4714A",
  ink: "#1C1C1A",
  muted: "#6B6560",
  border: "#E8DDD2",
};

const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

function WelcomeScreen() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"login" | "register">("login");

  const openModal = (mode: "login" | "register") => {
    setModalMode(mode);
    setModalOpen(true);
  };

  return (
    <div style={{ fontFamily: sans, background: c.cream, color: c.ink, minHeight: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Logo Section */}
      <div style={{ padding: "40px 24px", display: "flex", justifyContent: "center" }}>
        <img
          src="/logo-mater.png"
          alt="LeMater Logo"
          style={{ width: "100%", maxWidth: 180, objectFit: "contain" }}
        />
      </div>

      {/* Main Content Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{ 
          flex: 1, 
          background: c.warm, 
          borderTopLeftRadius: 40, 
          borderTopRightRadius: 40, 
          padding: "48px 32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          border: `1px solid ${c.border}`,
          borderBottom: "none"
        }}
      >
        {/* Subtle decorative elements */}
        <div style={{ position: "absolute", top: -100, right: -100, width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${c.sageLight}22 0%, transparent 70%)` }} />
        
        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 400 }}>
          <div style={{ 
            fontSize: 12, 
            letterSpacing: "0.15em", 
            textTransform: "uppercase", 
            color: c.sage, 
            fontWeight: 500, 
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12
          }}>
            <span style={{ width: 24, height: 1, background: c.sage }} />
            {"\n"}
            <span style={{ width: 24, height: 1, background: c.sage }} />
          </div>

          <h1 style={{ fontFamily: serif, fontSize: "42px", fontWeight: 300, lineHeight: 1.1, marginBottom: 12, color: c.ink }}>
            Mãe <em style={{ fontStyle: "italic", color: c.sage }}>Digital</em>
          </h1>

          <p style={{ fontSize: 15, lineHeight: 1.6, color: c.muted, marginBottom: 48, fontWeight: 300 }}>
            Sua carteira digital da gestante com <br />
            apoio clínico especializado.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openModal("login")}
              style={{
                background: c.sageDark,
                color: "white",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "16px 32px",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontFamily: sans,
                boxShadow: "0 4px 12px rgba(45, 90, 66, 0.2)"
              }}
            >
              Entrar no Sistema
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openModal("register")}
              style={{
                background: "transparent",
                color: c.ink,
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "16px 32px",
                border: `1.5px solid ${c.sage}`,
                borderRadius: 4,
                cursor: "pointer",
                fontFamily: sans,
              }}
            >
              Criar minha conta
            </motion.button>
          </div>

        </div>
      </motion.div>

      <RegistrationModal open={modalOpen} onOpenChange={setModalOpen} initialMode={modalMode} />
    </div>
  );
}
