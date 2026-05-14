import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import RegistrationModal from "@/components/RegistrationModal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MãeDigital — Carteira Digital da Gestante" },
      { name: "description", content: "\n. Acompanhe sua gestação com suporte profissional." },
...
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

          <div style={{ marginTop: 60, display: "flex", justifyContent: "center", gap: 24 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: serif, fontSize: 24, color: c.sageDark }}>100%</div>
              <div style={{ fontSize: 9, color: c.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Seguro</div>
            </div>
            <div style={{ width: 1, height: 40, background: c.border }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: serif, fontSize: 24, color: c.sageDark }}>PICC</div>
              <div style={{ fontSize: 9, color: c.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Certificado</div>
            </div>
          </div>
        </div>
      </motion.div>

      <RegistrationModal open={modalOpen} onOpenChange={setModalOpen} initialMode={modalMode} />
    </div>
  );
}

