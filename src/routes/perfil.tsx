import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useGestanteProfile } from "@/hooks/useGestanteProfile";
import { LoadingMessage } from "@/components/LoadingMessage";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Meu Perfil — MãeDigital" },
      {
        name: "description",
        content:
          "Gerencie seu perfil: foto, telefone e dados pessoais da gestante.",
      },
    ],
  }),
  ssr: false,
  component: PerfilPage,
});

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function PerfilPage() {
  const { session, profile, loading } = useGestanteProfile();
  const fileRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [bebeSexo, setBebeSexo] = useState<"masculino" | "feminino" | "neutro">("neutro");
  const [saving, setSaving] = useState(false);
  const [savingTema, setSavingTema] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [enviandoReset, setEnviandoReset] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );

  useEffect(() => {
    if (profile) {
      setNome(profile.nome ?? "");
      setTelefone(profile.telefone ? formatPhone(profile.telefone) : "");
      setFotoUrl(profile.foto_url ?? null);
      setBebeSexo((profile.bebe_sexo as "masculino" | "feminino" | "neutro") ?? "neutro");
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingMessage />
      </div>
    );
  }

  if (!session) return <Navigate to="/" />;

  const initials = (nome || profile?.email || "M")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !session) return;

    if (!file.type.startsWith("image/")) {
      setMsg({ type: "err", text: "Selecione uma imagem válida." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMsg({ type: "err", text: "A imagem deve ter no máximo 5MB." });
      return;
    }

    setUploading(true);
    setMsg(null);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${session.user.id}/avatar-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, cacheControl: "3600" });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = data.publicUrl;

      const { error: updErr } = await supabase
        .from("profiles")
        .update({ foto_url: publicUrl })
        .eq("user_id", session.user.id);
      if (updErr) throw updErr;

      setFotoUrl(publicUrl);
      setMsg({ type: "ok", text: "Foto atualizada com sucesso." });
    } catch (err: any) {
      setMsg({
        type: "err",
        text: err?.message || "Erro ao enviar a foto.",
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleRemovePhoto() {
    if (!session) return;
    setUploading(true);
    setMsg(null);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ foto_url: null })
        .eq("user_id", session.user.id);
      if (error) throw error;
      setFotoUrl(null);
      setMsg({ type: "ok", text: "Foto removida." });
    } catch (err: any) {
      setMsg({ type: "err", text: err?.message || "Erro ao remover foto." });
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setSaving(true);
    setMsg(null);
    try {
      const telefoneDigits = telefone.replace(/\D/g, "");
      const { error } = await supabase
        .from("profiles")
        .update({
          nome: nome.trim() || null,
          telefone: telefoneDigits || null,
        })
        .eq("user_id", session.user.id);
      if (error) throw error;
      setMsg({ type: "ok", text: "Perfil atualizado com sucesso." });
    } catch (err: any) {
      setMsg({
        type: "err",
        text: err?.message || "Erro ao salvar perfil.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectSexo(novo: "masculino" | "feminino" | "neutro") {
    if (!session || savingTema) return;
    const anterior = bebeSexo;
    setBebeSexo(novo);

    // Aplica imediatamente o tema no <html>
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.classList.remove("theme-boy", "theme-girl");
      if (novo === "masculino") root.classList.add("theme-boy");
      else if (novo === "feminino") root.classList.add("theme-girl");
    }

    setSavingTema(true);
    setMsg(null);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ bebe_sexo: novo })
        .eq("user_id", session.user.id);
      if (error) throw error;
      setMsg({
        type: "ok",
        text:
          novo === "masculino"
            ? "Tema azul aplicado — é um menino! 💙"
            : novo === "feminino"
              ? "Tema rosa aplicado — é uma menina! 💗"
              : "Tema padrão restaurado.",
      });
    } catch (err: any) {
      // reverte em caso de erro
      setBebeSexo(anterior);
      setMsg({
        type: "err",
        text: err?.message || "Erro ao salvar a preferência de cor.",
      });
    } finally {
      setSavingTema(false);
    }
  }

  async function handleAlterarSenha(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    if (novaSenha.length < 6) {
      setMsg({ type: "err", text: "A senha deve ter ao menos 6 caracteres." });
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setMsg({ type: "err", text: "As senhas não coincidem." });
      return;
    }
    setSalvandoSenha(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) throw error;
      setNovaSenha("");
      setConfirmarSenha("");
      setMsg({ type: "ok", text: "Senha alterada com sucesso." });
    } catch (err: any) {
      setMsg({ type: "err", text: err?.message || "Erro ao alterar senha." });
    } finally {
      setSalvandoSenha(false);
    }
  }

  async function handleResetSenhaEmail() {
    if (!profile?.email) return;
    setEnviandoReset(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        profile.email,
        { redirectTo: `${window.location.origin}/reset-password` },
      );
      if (error) throw error;
      setMsg({
        type: "ok",
        text: "Enviamos um link de redefinição para o seu e-mail.",
      });
    } catch (err: any) {
      setMsg({
        type: "err",
        text: err?.message || "Erro ao enviar e-mail de redefinição.",
      });
    } finally {
      setEnviandoReset(false);
    }
  }
  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3">
          <Link
            to="/home"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border border-border bg-card text-foreground hover:bg-muted transition-colors shadow-sm"
          >
            Voltar
          </Link>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Meu Perfil
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie sua foto e seus dados pessoais.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border p-5 shadow-sm"
      >
        {/* Foto + Tema */}
        <div className="flex items-start gap-4 mb-6">
          <div className="flex flex-col items-center shrink-0">
            <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center overflow-hidden shadow-sm">
              {fotoUrl ? (
                <img
                  src={fotoUrl}
                  alt={nome || "Foto de perfil"}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="mt-2 px-2.5 py-1 text-[11px] rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {uploading ? "Enviando..." : fotoUrl ? "Trocar" : "Adicionar"}
            </button>
            {fotoUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={uploading}
                className="mt-1 text-[11px] text-muted-foreground hover:text-foreground transition disabled:opacity-50"
              >
                Remover
              </button>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground">Cor do app</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
              Escolha a tonalidade do bebê.
            </p>

            <div className="grid grid-cols-3 gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => handleSelectSexo("masculino")}
                disabled={savingTema}
                aria-pressed={bebeSexo === "masculino"}
                title="Menino"
                className={`flex flex-col items-center gap-1 rounded-lg border p-1.5 transition disabled:opacity-50 ${
                  bebeSexo === "masculino"
                    ? "border-[oklch(0.62_0.13_245)] ring-2 ring-[oklch(0.62_0.13_245)]/40 bg-[oklch(0.94_0.04_240)]"
                    : "border-border bg-background hover:bg-muted"
                }`}
              >
                <span
                  className="block w-6 h-6 rounded-full shadow-sm"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.72 0.12 245), oklch(0.55 0.14 245))",
                  }}
                  aria-hidden="true"
                />
                <span className="text-[10px] font-medium text-foreground">Menino</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectSexo("feminino")}
                disabled={savingTema}
                aria-pressed={bebeSexo === "feminino"}
                title="Menina"
                className={`flex flex-col items-center gap-1 rounded-lg border p-1.5 transition disabled:opacity-50 ${
                  bebeSexo === "feminino"
                    ? "border-[oklch(0.7_0.15_350)] ring-2 ring-[oklch(0.7_0.15_350)]/40 bg-[oklch(0.95_0.04_350)]"
                    : "border-border bg-background hover:bg-muted"
                }`}
              >
                <span
                  className="block w-6 h-6 rounded-full shadow-sm"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.82 0.1 350), oklch(0.62 0.16 350))",
                  }}
                  aria-hidden="true"
                />
                <span className="text-[10px] font-medium text-foreground">Menina</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectSexo("neutro")}
                disabled={savingTema}
                aria-pressed={bebeSexo === "neutro"}
                title="Padrão"
                className={`flex flex-col items-center gap-1 rounded-lg border p-1.5 transition disabled:opacity-50 ${
                  bebeSexo === "neutro"
                    ? "border-primary ring-2 ring-primary/40 bg-secondary"
                    : "border-border bg-background hover:bg-muted"
                }`}
              >
                <span
                  className="block w-6 h-6 rounded-full shadow-sm"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.85 0.08 60), oklch(0.7 0.13 25))",
                  }}
                  aria-hidden="true"
                />
                <span className="text-[10px] font-medium text-foreground">Padrão</span>
              </button>
            </div>
            {savingTema && (
              <p className="text-[10px] text-muted-foreground mt-1">Salvando...</p>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Nome completo
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Seu nome"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              E-mail
            </label>
            <input
              type="email"
              value={profile?.email ?? ""}
              disabled
              className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-muted-foreground text-sm cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">
              O e-mail não pode ser alterado.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(formatPhone(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Senha
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="w-full px-3 py-2 pr-16 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Nova senha"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-medium text-primary hover:underline"
                >
                  {mostrarSenha ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              {novaSenha && (
                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="mt-1.5 w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Confirmar senha"
                  autoComplete="new-password"
                />
              )}
              <div className="flex gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={handleAlterarSenha}
                  disabled={salvandoSenha || !novaSenha}
                  className="flex-1 px-2 py-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-medium hover:opacity-90 transition disabled:opacity-50"
                >
                  {salvandoSenha ? "..." : "Alterar"}
                </button>
                <button
                  type="button"
                  onClick={handleResetSenhaEmail}
                  disabled={enviandoReset}
                  className="flex-1 px-2 py-1.5 rounded-full border border-border bg-card text-foreground text-[11px] font-medium hover:bg-muted transition disabled:opacity-50"
                >
                  {enviandoReset ? "..." : "Resetar"}
                </button>
              </div>
            </div>
          </div>

          {msg && (
            <div
              className={`text-sm rounded-lg px-3 py-2 ${
                msg.type === "ok"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {msg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full px-4 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

