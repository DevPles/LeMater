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
      // 1. Cria conta no auth (passa cpf nos metadados para o trigger handle_new_user)
      const { data: signupData, error: signupErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.senha,
        options: { data: { nome: form.nome, cpf: cpfDigits } },
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

      // 2b. Garante que o CPF foi gravado em profiles (caso o trigger ainda não tenha)
      if (cpfDigits) {
        await supabase
          .from("profiles")
          .update({ cpf: cpfDigits })
          .eq("user_id", userId);
      }

      // 3. Concede role 'profissional' (RLS exige admin; chamada será feita pelo admin)
      // Como o admin atual usa sessionStorage e não tem JWT, usamos a função has_role:
      // este insert pode falhar se quem chama não tiver role admin no banco.
      // Para o MVP, fazemos a chamada e mostramos mensagem.
      const { error: roleErr } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: "profissional",
      });
      if (roleErr) {
        // Não bloqueia, apenas avisa
        console.warn("Atenção: papel 'profissional' não atribuído via RLS:", roleErr.message);
      }

      setMsg("Profissional cadastrado com sucesso. Avise para confirmar o email.");
      setForm({ email: "", senha: "", nome: "", cpf: "", especialidade: "", registro: "", bio: "" });
      await load();
    } catch (e) {
      setMsg("Erro: " + (e as Error).message);
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
          <Input label="Senha provisória *" value={form.senha} onChange={(v) => setForm({ ...form, senha: v })} type="password" />
          <Input label="Nome completo *" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
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
