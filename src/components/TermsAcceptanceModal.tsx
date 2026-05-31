import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { acceptTerms, getMyTermsAcceptance, TERMS_VERSION } from "@/lib/terms.functions";
import { supabase } from "@/integrations/supabase/client";

export const TERMS_TEXT = `TERMO DE CONSENTIMENTO LIVRE, INFORMADO E ESCLARECIDO PARA USO DA PLATAFORMA, TRATAMENTO DE DADOS PESSOAIS SENSÍVEIS, GRAVAÇÃO DE TELECONSULTAS E ARMAZENAMENTO DE IMAGENS DE EXAMES

Este instrumento ("Termo") regula o uso do aplicativo MãeDigital / LeMater ("Plataforma"), operado pelos seus controladores ("Operador"), e formaliza o consentimento livre, informado, inequívoco e específico do(a) usuário(a) ("Titular") para o tratamento dos seus dados pessoais, inclusive dados pessoais sensíveis (dados de saúde, biométricos, imagens, áudio e vídeo), nos termos da Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais - LGPD), do Marco Civil da Internet (Lei nº 12.965/2014), do Código de Defesa do Consumidor (Lei nº 8.078/1990), da Resolução CFM nº 2.314/2022 (telemedicina), da Resolução CFM nº 1.821/2007 (prontuário eletrônico) e demais normas aplicáveis.

1. OBJETO
1.1. O presente Termo tem por objeto autorizar, de forma expressa, a coleta, o registro, o armazenamento, o uso, o tratamento, o compartilhamento e a guarda dos dados pessoais e sensíveis do(a) Titular, necessários à prestação dos serviços de acompanhamento gestacional, materno-infantil, nutricional, psicológico e médico, presenciais ou à distância (telemedicina).

2. DEFINIÇÕES
2.1. "Dados pessoais sensíveis": informações sobre saúde, vida sexual, dado genético ou biométrico, na forma do art. 5º, II, da LGPD.
2.2. "Tratamento": toda operação realizada com dados pessoais, conforme art. 5º, X, da LGPD.
2.3. "Prontuário eletrônico": conjunto de informações clínicas registradas em meio digital, regido pelas normas do Conselho Federal de Medicina.

3. DADOS COLETADOS
3.1. Para o adequado funcionamento dos serviços, a Plataforma poderá coletar:
a) Dados de identificação e contato: nome completo, CPF, RG, e-mail, telefone, endereço, data de nascimento, estado civil, foto de perfil;
b) Dados de localização: cidade, bairro, unidade de saúde de referência, geolocalização aproximada quando autorizada pelo dispositivo;
c) Dados de saúde e gestacionais: data da última menstruação (DUM), idade gestacional, peso, altura, pressão arterial, glicemia, medidas antropométricas, sintomas, histórico clínico e obstétrico, alergias, medicações em uso, vacinas, evolução clínica e anotações de consulta;
d) Imagens de exames laboratoriais e de imagem: ultrassonografias, ressonâncias, tomografias, raios-X, fotografias clínicas, laudos digitalizados, resultados de exames de sangue, urina e demais exames complementares, em qualquer formato (PDF, JPG, PNG, DICOM ou equivalente);
e) Gravações de áudio e vídeo de teleconsultas, mensagens de chat, transcrições automáticas e metadados de comunicação realizadas pela Plataforma, para fins assistenciais, de auditoria clínica, ensino, qualidade, segurança jurídica e cumprimento das Resoluções CFM aplicáveis;
f) Dados de uso da Plataforma: registros de acesso (logs), endereço IP, identificadores de dispositivo, sistema operacional, navegador, páginas visitadas e interações, nos termos do art. 15 do Marco Civil da Internet;
g) Dados de menores: quando aplicável, dados do nascituro, do(a) bebê e/ou de filhos(as) menores, cujo tratamento é autorizado pelo(a) Titular na qualidade de responsável legal, nos termos do art. 14 da LGPD.

4. FINALIDADES DO TRATAMENTO
4.1. Os dados serão tratados exclusivamente para as seguintes finalidades:
a) Prestação dos serviços de saúde, acompanhamento pré-natal, puerperal, pediátrico, nutricional e psicológico;
b) Realização de teleconsultas e demais modalidades de telessaúde permitidas pela legislação;
c) Geração, manutenção e guarda do prontuário eletrônico, pelo prazo mínimo de 20 (vinte) anos, conforme Resolução CFM nº 1.821/2007;
d) Emissão de receitas, atestados, laudos, encaminhamentos e demais documentos médicos;
e) Envio de lembretes, alertas clínicos, notificações de consultas, exames e medicamentos;
f) Auditoria clínica, gestão de qualidade, segurança do paciente e defesa em eventual processo administrativo, judicial ou ético;
g) Cumprimento de obrigações legais, regulatórias e requisições de autoridades competentes;
h) Anonimização para fins estatísticos, epidemiológicos, de pesquisa científica e melhoria contínua dos serviços.

5. IMAGENS DE EXAMES E DOCUMENTOS CLÍNICOS
5.1. O(A) Titular autoriza, de forma específica, o upload, o armazenamento, a indexação e o compartilhamento, com a equipe assistencial vinculada ao seu atendimento, de imagens de exames, laudos e documentos clínicos enviados à Plataforma.
5.2. As imagens e documentos serão armazenados em ambiente seguro, criptografado, com controle de acesso por perfil e registro de auditoria, e somente serão acessados por profissionais habilitados e vinculados ao cuidado do(a) Titular.
5.3. É vedado o uso comercial, publicitário ou de divulgação das imagens sem o consentimento específico e por escrito do(a) Titular.

6. GRAVAÇÃO DE TELECONSULTAS
6.1. O(A) Titular reconhece e autoriza que as teleconsultas realizadas pela Plataforma poderão ser integralmente gravadas em áudio e vídeo, com finalidade assistencial, probatória, de auditoria e de segurança jurídica do(a) Titular e do(a) profissional.
6.2. As gravações integram o prontuário eletrônico, observada a guarda mínima de 20 (vinte) anos.
6.3. O(A) Titular poderá solicitar cópia das gravações que lhe digam respeito, observados os procedimentos de identificação e segurança.

7. BASES LEGAIS
7.1. O tratamento dos dados pessoais e sensíveis observa as seguintes bases legais (arts. 7º e 11 da LGPD):
a) Consentimento do(a) Titular;
b) Cumprimento de obrigação legal ou regulatória;
c) Tutela da saúde, exclusivamente em procedimento realizado por profissionais de saúde, serviços de saúde ou autoridade sanitária;
d) Execução de contrato;
e) Exercício regular de direitos em processo judicial, administrativo ou arbitral.

8. COMPARTILHAMENTO
8.1. Os dados poderão ser compartilhados com:
a) Profissionais de saúde vinculados ao atendimento do(a) Titular;
b) Laboratórios, clínicas e prestadores parceiros, quando necessários à execução do serviço;
c) Operadores de tecnologia (provedores de hospedagem, e-mail transacional, telemedicina e armazenamento em nuvem) sob contrato de operador e dever de sigilo;
d) Autoridades públicas, judiciais, sanitárias e administrativas, quando exigido por lei ou por ordem judicial.
8.2. A Plataforma não comercializa dados pessoais.

9. TRANSFERÊNCIA INTERNACIONAL
9.1. Em razão do uso de infraestrutura em nuvem, parte dos dados poderá ser processada em servidores localizados fora do Brasil, sempre em países que ofereçam grau de proteção adequado ou mediante cláusulas contratuais específicas, conforme art. 33 da LGPD.

10. ARMAZENAMENTO, SEGURANÇA E PRAZO DE GUARDA
10.1. Os dados são armazenados em infraestrutura segura, com criptografia em trânsito (TLS) e em repouso, controle de acesso baseado em perfis, registro de auditoria e medidas técnicas e administrativas compatíveis com o estado da arte.
10.2. Os dados clínicos integrantes do prontuário, incluindo imagens de exames e gravações de teleconsultas, serão guardados por, no mínimo, 20 (vinte) anos, contados do último registro do(a) Titular, conforme Resolução CFM nº 1.821/2007.
10.3. Os demais dados serão mantidos pelo tempo necessário ao cumprimento das finalidades e das obrigações legais.

11. DIREITOS DO(A) TITULAR
11.1. Nos termos do art. 18 da LGPD, o(a) Titular pode, a qualquer tempo e mediante requisição:
a) Confirmar a existência de tratamento;
b) Acessar os dados;
c) Corrigir dados incompletos, inexatos ou desatualizados;
d) Solicitar anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a LGPD;
e) Solicitar portabilidade;
f) Obter informação sobre o compartilhamento;
g) Revogar o consentimento, sendo certo que a revogação não afetará a legalidade do tratamento realizado anteriormente, nem impedirá a guarda dos dados clínicos pelo prazo legal mínimo.

12. ENCARREGADO (DPO) E CANAL DE ATENDIMENTO
12.1. As requisições previstas neste Termo poderão ser exercidas pelos canais de atendimento disponibilizados na Plataforma, dirigidas ao Encarregado pelo Tratamento de Dados Pessoais (DPO).

13. RESPONSABILIDADES DO(A) TITULAR
13.1. O(A) Titular se compromete a fornecer informações verdadeiras, completas e atualizadas, a manter a confidencialidade de suas credenciais de acesso e a utilizar a Plataforma de forma lícita.
13.2. A Plataforma não substitui atendimento médico de urgência ou emergência; em tais situações, o(a) Titular deverá procurar serviço de pronto-atendimento ou acionar o SAMU 192.

14. ALTERAÇÕES
14.1. Este Termo poderá ser atualizado a qualquer tempo, sendo o(a) Titular notificado(a) pela própria Plataforma. O uso continuado após a notificação implica concordância com a nova versão.

15. FORO
15.1. Para dirimir eventuais controvérsias, fica eleito o foro do domicílio do(a) Titular, com renúncia a qualquer outro, por mais privilegiado que seja.

16. ACEITE
16.1. Ao marcar a caixa de aceite e clicar em "Li e aceito", o(a) Titular DECLARA, sob as penas da lei, que: (i) leu integralmente este Termo; (ii) compreendeu seu conteúdo; (iii) teve oportunidade de esclarecer dúvidas; (iv) consente, de forma livre, informada, específica e inequívoca, com o tratamento dos seus dados pessoais e sensíveis, incluindo imagens de exames, documentos clínicos e gravações de áudio e vídeo das teleconsultas, nos termos aqui descritos.

Versão do termo: ${TERMS_VERSION}`;

export function TermsAcceptanceModal() {
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [needs, setNeeds] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checked, setChecked] = useState(false);
  const get = useServerFn(getMyTermsAcceptance);
  const accept = useServerFn(acceptTerms);

  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setAuthUserId(session?.user.id ?? null);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (active) setAuthUserId(data.session?.user.id ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!authUserId) {
        setNeeds(false);
        setLoading(false);
        return;
      }
      setLoading(true);
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
  }, [authUserId, get]);

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
                fontSize: 22,
                fontWeight: 500,
                margin: 0,
                color: "#1C1C1A",
                whiteSpace: "nowrap",
                textAlign: "center",
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
              textAlign: "justify",
              textJustify: "inter-word",
              hyphens: "auto",
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
