import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

type Professional = {
  id: string;
  user_id: string;
  nome: string;
  especialidade: string;
  registro: string | null;
  bio: string | null;
  ativo: boolean;
  created_at: string;
};

export function ProfissionaisTab() {
  const [list, setList] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    email: "",
    senha: "",
    nome: "",
    cpf: "",
    especialidade: "",
    registro: "",
    bio: "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const normalizeCpf = (v: string) => v.replace(/\D/g, "");
  const formatCpf = (v: string) => {
    const d = normalizeCpf(v).slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("professionals")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setList(data as Professional[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    setMsg(null);
    if (!form.email || !form.senha || !form.nome || !form.especialidade) {
      setMsg("Preencha email, senha, nome e especialidade.");
      return;
    }
    const cpfDigits = normalizeCpf(form.cpf);
    if (form.cpf && cpfDigits.length !== 11) {
      setMsg("CPF inválido. Informe os 11 dígitos ou deixe em branco.");
      return;
    }
    setSaving(true);
    try {
      // 1. Cria conta no auth — sinaliza tipo_usuario=profissional para que o trigger
      // handle_new_user atribua diretamente a role 'profissional' (e não 'gestante').
      const { data: signupData, error: signupErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.senha,
        options: {
          data: {
            nome: form.nome,
            cpf: cpfDigits,
            tipo_usuario: "profissional",
          },
        },
      });
      if (signupErr) throw signupErr;
      const userId = signupData.user?.id;
      if (!userId) throw new Error("Não foi possível criar usuário.");

      // 2. Insere registro na tabela professionals
      const { error: profErr } = await supabase.from("professionals").insert({
        user_id: userId,
        nome: form.nome,
        especialidade: form.especialidade,
        registro: form.registro || null,
        bio: form.bio || null,
        ativo: true,
      });
      if (profErr) throw profErr;

      // 2b. Garante que o CPF foi gravado em profiles
      if (cpfDigits) {
        await supabase
          .from("profiles")
          .update({ cpf: cpfDigits })
          .eq("user_id", userId);
      }

      // 3. Garantia extra: chama RPC segura que promove o usuário a profissional
      // e remove a role 'gestante' caso tenha sido atribuída automaticamente.
      // Funciona mesmo sem JWT de admin porque a função valida via tabela professionals.
      const { error: promoteErr } = await supabase.rpc("promote_to_professional", {
        _user_id: userId,
      });
      if (promoteErr) {
        console.warn("Atenção: não foi possível confirmar papel 'profissional':", promoteErr.message);
      }

      setMsg("Profissional cadastrado com sucesso. Avise para confirmar o email.");
      setForm({ email: "", senha: "", nome: "", cpf: "", especialidade: "", registro: "", bio: "" });
      await load();
    } catch (e) {
      const raw = (e as Error).message || "";
      let amigavel = raw;
      if (/known to be weak|pwned|compromised|breach/i.test(raw)) {
        amigavel = "Senha muito fraca ou já vazada em outros sites. Escolha outra (mín. 8 caracteres, misture letras, números e símbolos).";
      } else if (/password.*should be at least|at least 6 characters|password.*length/i.test(raw)) {
        amigavel = "A senha precisa ter no mínimo 6 caracteres.";
      } else if (/already registered|exists|duplicate/i.test(raw)) {
        amigavel = "Este e-mail já está cadastrado.";
      }
      setMsg("Erro: " + amigavel);
    } finally {
      setSaving(false);
    }
  };

  const toggleAtivo = async (p: Professional) => {
    await supabase.from("professionals").update({ ativo: !p.ativo }).eq("id", p.id);
    await load();
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border p-5 space-y-4"
      >
        <div>
          <h2 className="text-lg font-bold font-display text-foreground">Cadastrar profissional</h2>
          <p className="text-xs text-muted-foreground">
            Cria conta de acesso e perfil profissional. O profissional usará o portal{" "}
            <code className="bg-muted px-1 rounded">/profissional</code> com o email e senha definidos aqui.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Email de acesso *" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
          <PasswordInput
            label="Senha provisória *"
            value={form.senha}
            onChange={(v) => setForm({ ...form, senha: v })}
            hint="Mínimo 8 caracteres. Evite senhas óbvias (123456, senha, etc.)."
          />
          <Input label="Nome completo *" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
          <Input label="CPF" value={form.cpf} onChange={(v) => setForm({ ...form, cpf: formatCpf(v) })} placeholder="000.000.000-00" />
          <Input label="Especialidade *" value={form.especialidade} onChange={(v) => setForm({ ...form, especialidade: v })} placeholder="Obstetra, Enfermeiro Obstétrico..." />
          <Input label="Registro (CRM/COREN)" value={form.registro} onChange={(v) => setForm({ ...form, registro: v })} />
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Bio / apresentação</label>
            <textarea
              rows={2}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="w-full text-sm rounded-xl border border-border bg-background p-3"
            />
          </div>
        </div>

        {msg && <p className="text-xs text-foreground bg-muted px-3 py-2 rounded-lg">{msg}</p>}

        <div className="flex justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={handleCreate}
            className="px-4 py-2 rounded-full text-xs font-bold bg-[#1a1557] text-white hover:bg-[#241e7a] disabled:opacity-50"
          >
            {saving ? "Cadastrando..." : "Cadastrar profissional"}
          </button>
        </div>
      </motion.div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-4 py-2 bg-muted/40 border-b border-border">
          <p className="text-xs font-bold uppercase tracking-wide text-foreground">
            Profissionais cadastrados ({list.length})
          </p>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground p-6 text-center">Carregando...</p>
        ) : list.length === 0 ? (
          <p className="text-sm text-muted-foreground p-6 text-center">Nenhum profissional cadastrado ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((p) => (
              <li key={p.id} className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm text-foreground">{p.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.especialidade}
                    {p.registro && ` — ${p.registro}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleAtivo(p)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                    p.ativo
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {p.ativo ? "Ativo" : "Inativo"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 text-sm rounded-xl border border-border bg-background px-3"
      />
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground mb-1 block">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-9 text-sm rounded-xl border border-border bg-background px-3 pr-10"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          {show ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 3l18 18" />
              <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
              <path d="M9.9 5.1A10.5 10.5 0 0 1 12 5c5 0 9 4 10 7-.4 1.1-1.2 2.4-2.4 3.6" />
              <path d="M6.1 6.1C3.9 7.6 2.4 9.7 2 12c1 3 5 7 10 7 1.6 0 3-.4 4.3-1" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
          )}
        </button>
      </div>
      {hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
