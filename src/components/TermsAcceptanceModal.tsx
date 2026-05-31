import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { acceptTerms, getMyTermsAcceptance, TERMS_VERSION } from "@/lib/terms.functions";

export const TERMS_TEXT = `TERMO DE CONSENTIMENTO PARA USO DO APLICATIVO E COLETA DE DADOS

1. OBJETO
O presente termo regula o uso do aplicativo MãeDigital / LeMater (a "Plataforma") e autoriza, de forma expressa e informada, a coleta, o armazenamento e o tratamento dos seus dados pessoais e de saúde, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).

2. DADOS COLETADOS
Para o adequado funcionamento dos serviços, a Plataforma pode coletar:
- Dados de identificação (nome, CPF, e-mail, telefone, data de nascimento);
- Dados de localização (cidade, bairro, unidade de saúde);
- Dados de saúde e gestacionais (DUM, peso, altura, medições clínicas, exames laboratoriais e de imagem, vacinas, prontuário e anotações de consulta);
- Dados de uso da Plataforma (acessos, dispositivos, registros de navegação);
- GRAVAÇÃO DE ÁUDIO E VÍDEO DAS CONSULTAS REALIZADAS POR VIDEOCHAMADA, para fins assistenciais, de auditoria clínica e de segurança jurídica.

3. FINALIDADE
Os dados serão utilizados para: acompanhamento gestacional, prestação de cuidado por profissionais habilitados (médico, nutricionista, psicólogo), emissão de alertas clínicos, geração de prontuário eletrônico, melhoria contínua dos serviços, cumprimento de obrigações legais e regulatórias.

4. COMPARTILHAMENTO
Os dados poderão ser compartilhados com os profissionais de saúde vinculados ao seu atendimento e com autoridades públicas, quando exigido por lei.

5. ARMAZENAMENTO E SEGURANÇA
Os dados são armazenados em infraestrutura segura, com criptografia em trânsito e em repouso, controle de acesso e registro de auditoria.

6. SEUS DIREITOS
Você pode, a qualquer tempo, solicitar acesso, correção, portabilidade, anonimização ou exclusão dos seus dados, bem como revogar este consentimento.

7. ACEITE
Ao clicar em "Li e aceito", você declara ter lido, compreendido e aceitado integralmente este termo, autorizando o tratamento dos seus dados pessoais e sensíveis (incluindo a gravação de consultas) nos termos acima.

Versão do termo: ${TERMS_VERSION}`;

export function TermsAcceptanceModal() {
  const [loading, setLoading] = useState(true);
  const [needs, setNeeds] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checked, setChecked] = useState(false);
  const get = useServerFn(getMyTermsAcceptance);
  const accept = useServerFn(acceptTerms);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await get();
        if (cancelled) return;
        setNeeds(!res.acceptance);
      } catch {
        // silently ignore — modal will simply not show
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [get]);

  const handleAccept = async () => {
    setSaving(true);
    try {
      await accept({ data: { userAgent: navigator.userAgent } });
      setNeeds(false);
    } catch (e) {
      alert("Erro ao registrar aceite: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !needs) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            background: "#fff",
            borderRadius: 16,
            maxWidth: 640,
            width: "100%",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #eee" }}>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 26,
                fontWeight: 500,
                margin: 0,
                color: "#1C1C1A",
              }}
            >
              Termo de Uso e Consentimento
            </h2>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#6B6560" }}>
              Antes de continuar, leia e aceite os termos abaixo.
            </p>
          </div>

          <div
            style={{
              padding: "16px 24px",
              overflowY: "auto",
              flex: 1,
              fontSize: 13.5,
              lineHeight: 1.55,
              color: "#2a2a28",
              whiteSpace: "pre-wrap",
            }}
          >
            {TERMS_TEXT}
          </div>

          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid #eee",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              background: "#FAF5EE",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                fontSize: 13,
                color: "#1C1C1A",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                style={{ marginTop: 3 }}
              />
              <span>
                Li e aceito integralmente o Termo de Uso e autorizo o tratamento dos
                meus dados pessoais e sensíveis, incluindo a gravação das consultas.
              </span>
            </label>
            <button
              onClick={handleAccept}
              disabled={!checked || saving}
              style={{
                background: "#2D5A42",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "12px 16px",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: checked && !saving ? "pointer" : "not-allowed",
                opacity: checked && !saving ? 1 : 0.5,
              }}
            >
              {saving ? "Registrando..." : "Aceitar e continuar"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
