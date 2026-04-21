import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";

type Mode = "login" | "register";

function calcGestationalAge(lmpDate: Date): { weeks: number; days: number } {
  const now = new Date();
  const diffMs = now.getTime() - lmpDate.getTime();
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return { weeks: Math.floor(totalDays / 7), days: totalDays % 7 };
}

function calcDueDate(lmpDate: Date): Date {
  const due = new Date(lmpDate);
  due.setDate(due.getDate() + 280);
  return due;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR");
}

export default function RegistrationModal({
  open,
  onOpenChange,
  initialMode = "register",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialMode?: Mode;
}) {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [step, setStep] = useState<1 | 2>(1);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setStep(1);
    }
  }, [open, initialMode]);

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginSenha, setLoginSenha] = useState("");

  // Step 1 fields
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNasc, setDataNasc] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [foto, setFoto] = useState<string | null>(null);
  const [gestante, setGestante] = useState<boolean | null>(null);

  // Step 2 fields (pregnancy)
  const [dum, setDum] = useState("");
  const [testeGravidez, setTesteGravidez] = useState<boolean | null>(null);
  const [qualTeste, setQualTeste] = useState("");

  const gestAge = dum ? calcGestationalAge(new Date(dum)) : null;
  const dueDate = dum ? calcDueDate(new Date(dum)) : null;

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleStep1Continue = () => {
    if (!nome.trim()) return;
    if (gestante === true) {
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        setStep(2);
      }, 2500);
    } else {
      navigate({ to: "/home" });
    }
  };

  const handleFinish = () => {
    navigate({ to: "/home" });
  };

  const inputClass =
    "bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#f0c040] focus:ring-[#f0c040]/30 h-9 text-sm w-full min-w-0 block appearance-none";
  const labelClass = "text-white/90 text-xs font-medium";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1557] border-[#f0c040]/30 w-[calc(100vw-1rem)] max-w-md max-h-[92vh] overflow-y-auto p-3 sm:p-4 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#f0c040] text-xl font-display text-center">
            {step === 1 ? "Cadastro da Gestante" : "Dados da Gestação"}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Celebration animation */}
          {showCelebration && (
            <motion.div
              key="celebration"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="flex flex-col items-center justify-center py-12 gap-4"
            >
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{ duration: 0.6, repeat: 3 }}
                className="text-6xl"
              >
                🎉
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-[#f0c040] text-2xl font-display font-bold text-center"
              >
                Parabéns, mamãe!
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-white/70 text-center text-sm"
              >
                Vamos coletar mais alguns dados sobre a sua gestação
              </motion.p>

              {/* Confetti particles */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: ["#f0c040", "#ff6b9d", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57"][i % 6],
                    top: "30%",
                    left: "50%",
                  }}
                  initial={{ opacity: 1, x: 0, y: 0 }}
                  animate={{
                    x: (Math.random() - 0.5) * 300,
                    y: (Math.random() - 0.5) * 200,
                    opacity: 0,
                    scale: [1, 1.5, 0],
                  }}
                  transition={{ duration: 1.5, delay: i * 0.05 }}
                />
              ))}
            </motion.div>
          )}

          {/* Step 1 */}
          {step === 1 && !showCelebration && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-2"
            >
              {/* Foto */}
              <div className="flex flex-col items-center gap-1 mb-1">
                <div
                  onClick={() => fileRef.current?.click()}
                  className="w-16 h-16 rounded-full bg-white/10 border-2 border-dashed border-white/30 flex items-center justify-center cursor-pointer hover:border-[#f0c040]/60 transition-colors overflow-hidden"
                >
                  {foto ? (
                    <img src={foto} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white/40 text-xs text-center leading-tight">Adicionar<br/>foto</span>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFoto}
                />
              </div>

              <div>
                <Label className={labelClass}>Nome completo</Label>
                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Maria da Silva"
                  className={inputClass}
                />
              </div>

              <div>
                <Label className={labelClass}>CPF</Label>
                <Input
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  className={inputClass}
                />
              </div>

              <div>
                <Label className={labelClass}>Data de nascimento</Label>
                <Input
                  type="date"
                  value={dataNasc}
                  onChange={(e) => setDataNasc(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <Label className={labelClass}>Endereço</Label>
                <Input
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua, número, bairro"
                  className={inputClass}
                />
              </div>

              <div>
                <Label className={labelClass}>E-mail</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className={inputClass}
                />
              </div>

              <div>
                <Label className={labelClass}>WhatsApp</Label>
                <Input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className={inputClass}
                />
              </div>

              {/* Gestante toggle */}
              <div className="mt-1">
                <Label className={labelClass}>Você está gestante?</Label>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setGestante(true)}
                    className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${
                      gestante === true
                        ? "bg-[#f0c040] text-[#1a1557]"
                        : "bg-white/10 text-white/60 border border-white/20"
                    }`}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setGestante(false)}
                    className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${
                      gestante === false
                        ? "bg-[#f0c040] text-[#1a1557]"
                        : "bg-white/10 text-white/60 border border-white/20"
                    }`}
                  >
                    Não
                  </button>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStep1Continue}
                disabled={!nome.trim() || gestante === null}
                className="mt-2 bg-[#f0c040] hover:bg-[#e5b535] text-[#1a1557] font-bold text-sm py-2.5 rounded-full shadow-lg shadow-[#f0c040]/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continuar
              </motion.button>
            </motion.div>
          )}

          {/* Step 2 — Pregnancy data */}
          {step === 2 && !showCelebration && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col gap-4"
            >
              <div>
                <Label className={labelClass}>Data da última menstruação (DUM)</Label>
                <Input
                  type="date"
                  value={dum}
                  onChange={(e) => setDum(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Auto-calculated fields */}
              {dum && gestAge && dueDate && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#f0c040]/10 border border-[#f0c040]/30 rounded-2xl p-4 space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">Idade gestacional</span>
                    <span className="text-[#f0c040] font-bold">
                      {gestAge.weeks} semanas e {gestAge.days} dias
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">Data provável do parto</span>
                    <span className="text-[#f0c040] font-bold">{formatDate(dueDate)}</span>
                  </div>
                </motion.div>
              )}

              <div>
                <Label className={labelClass}>Fez teste de gravidez?</Label>
                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setTesteGravidez(true)}
                    className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all ${
                      testeGravidez === true
                        ? "bg-[#f0c040] text-[#1a1557]"
                        : "bg-white/10 text-white/60 border border-white/20"
                    }`}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setTesteGravidez(false)}
                    className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all ${
                      testeGravidez === false
                        ? "bg-[#f0c040] text-[#1a1557]"
                        : "bg-white/10 text-white/60 border border-white/20"
                    }`}
                  >
                    Não
                  </button>
                </div>
              </div>

              {testeGravidez === true && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                >
                  <Label className={labelClass}>Qual teste?</Label>
                  <Input
                    value={qualTeste}
                    onChange={(e) => setQualTeste(e.target.value)}
                    placeholder="Ex: Beta HCG, teste de farmácia..."
                    className={inputClass}
                  />
                </motion.div>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-full text-sm font-bold bg-white/10 text-white/60 border border-white/20"
                >
                  Voltar
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleFinish}
                  className="flex-1 bg-[#f0c040] hover:bg-[#e5b535] text-[#1a1557] font-bold text-base py-3 rounded-full shadow-lg shadow-[#f0c040]/30 transition-colors"
                >
                  Finalizar
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
