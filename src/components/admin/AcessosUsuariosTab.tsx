import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  createUserUnified,
  resetUserPassword,
  deleteUser,
  listAllUsers,
  updateUserUnified,
  type UnifiedUser,
} from "@/utils/admin-users.functions";
import { updateProfessional } from "@/utils/admin-professionals.functions";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_SECRET = "unaerp2026";

type Tipo = "admin" | "profissional" | "gestante";

const tipoLabel: Record<Tipo, string> = {
  admin: "Administrador",
  profissional: "Profissional",
  gestante: "Gestante",
};

const normalizeCpf = (v: string) => v.replace(/\D/g, "");
const formatCpf = (v: string) => {
  const d = normalizeCpf(v).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

async function uploadAvatar(file: File, userId: string): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw new Error("Erro ao enviar foto: " + error.message);
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

export function AcessosUsuariosTab() {
  const [list, setList] = useState<UnifiedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<"todos" | Tipo>("todos");
  const [busca, setBusca] = useState("");

  const [tipo, setTipo] = useState<Tipo>("profissional");
  const [form, setForm] = useState({
    email: "",
    senha: "",
    nome: "",
    cpf: "",
    especialidade: "",
    registro: "",
    bio: "",
    dum: "",
    telefone: "",
  });
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [showSenhasIds, setShowSenhasIds] = useState<Set<string>>(new Set());
  const [resetUserId, setResetUserId] = useState<UnifiedUser | null>(null);
  const [editUser, setEditUser] = useState<UnifiedUser | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listAllUsers({ data: { adminSecret: ADMIN_SECRET } });
      setList(res.users);
    } catch (e) {
      console.error(e);
      setMsg("Erro ao listar usuários: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onPickFoto = (f: File | null) => {
    setFotoFile(f);
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFotoPreview(f ? URL.createObjectURL(f) : null);
  };

  const handleCreate = async () => {
    setMsg(null);
    if (!form.email || !form.senha || !form.nome) {
      setMsg("Preencha email, senha e nome.");
      return;
    }
    if (tipo === "profissional" && !form.especialidade) {
      setMsg("Informe a especialidade do profissional.");
      return;
    }
    const cpfDigits = normalizeCpf(form.cpf);
    if (form.cpf && cpfDigits.length !== 11) {
      setMsg("CPF inválido. Informe os 11 dígitos ou deixe em branco.");
      return;
    }
    setSaving(true);
    try {
      const created = await createUserUnified({
        data: {
          adminSecret: ADMIN_SECRET,
          tipo,
          email: form.email.trim(),
          senha: form.senha,
          nome: form.nome.trim(),
          cpf: cpfDigits || undefined,
          especialidade: tipo === "profissional" ? form.especialidade : undefined,
          registro: tipo === "profissional" ? form.registro || null : undefined,
          bio: tipo === "profissional" ? form.bio || null : undefined,
          dum: tipo === "gestante" ? form.dum || null : undefined,
          telefone: tipo === "gestante" ? form.telefone || null : undefined,
        },
      });

      // upload da foto após criar (precisa do userId)
      if (fotoFile && created?.userId) {
        try {
          const url = await uploadAvatar(fotoFile, created.userId);
          await updateUserUnified({
            data: {
              adminSecret: ADMIN_SECRET,
              userId: created.userId,
              foto_url: url,
            },
          });
        } catch (err) {
          console.error(err);
          setMsg("Usuário criado, mas houve erro ao enviar foto: " + (err as Error).message);
        }
      }

      setMsg(`${tipoLabel[tipo]} cadastrado com sucesso.`);
      setForm({
        email: "",
        senha: "",
        nome: "",
        cpf: "",
        especialidade: "",
        registro: "",
        bio: "",
        dum: "",
        telefone: "",
      });
      onPickFoto(null);
      if (fotoInputRef.current) fotoInputRef.current.value = "";
      await load();
    } catch (e) {
      setMsg("Erro: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const toggleAtivo = async (u: UnifiedUser) => {
    if (!u.professional) return;
    try {
      await updateProfessional({
        data: {
          adminSecret: ADMIN_SECRET,
          professionalId: u.professional.id,
          userId: u.user_id,
          patch: { ativo: !u.professional.ativo },
        },
      });
      await load();
    } catch (e) {
      alert("Erro ao alterar status: " + (e as Error).message);
    }
  };

  const handleDelete = async (u: UnifiedUser) => {
    if (
      !window.confirm(
        `Apagar definitivamente ${u.nome ?? u.email}? Esta ação remove o usuário e todos os vínculos.`,
      )
    )
      return;
    try {
      await deleteUser({ data: { adminSecret: ADMIN_SECRET, userId: u.user_id } });
      await load();
    } catch (e) {
      alert("Erro ao remover: " + (e as Error).message);
    }
  };

  const toggleSenha = (id: string) => {
    setShowSenhasIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtrados = list.filter((u) => {
    if (filtroTipo !== "todos") {
      const isType =
        filtroTipo === "admin"
          ? u.roles.includes("admin")
          : filtroTipo === "profissional"
            ? u.roles.includes("profissional")
            : u.roles.includes("gestante") &&
              !u.roles.includes("admin") &&
              !u.roles.includes("profissional");
      if (!isType) return false;
    }
    if (busca.trim()) {
      const q = busca.toLowerCase();
      return (
        (u.nome ?? "").toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q) ||
        (u.cpf ?? "").includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ============== FORM CRIAR ============== */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border p-5 space-y-4"
      >
        <div>
          <h2 className="text-lg font-bold font-display text-foreground">Cadastrar usuário</h2>
          <p className="text-xs text-muted-foreground">
            Cria um usuário no sistema com o papel selecionado. A senha definida aqui ficará
            visível apenas para administradores na lista abaixo.
          </p>
        </div>

        {/* Seletor de tipo */}
        <div className="flex flex-wrap gap-2">
          {(["admin", "profissional", "gestante"] as Tipo[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${
                tipo === t
                  ? "bg-[#1a1557] text-white border-[#1a1557]"
                  : "bg-background text-foreground border-border hover:bg-muted"
              }`}
            >
              {tipoLabel[t]}
            </button>
          ))}
        </div>

        {/* Foto */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-muted overflow-hidden flex items-center justify-center border border-border">
            {fotoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fotoPreview} alt="Pré-visualização" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] text-muted-foreground text-center px-1">
                Sem foto
              </span>
            )}
          </div>
          <div className="flex-1">
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Foto de perfil (opcional)
            </label>
            <input
              ref={fotoInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => onPickFoto(e.target.files?.[0] ?? null)}
              className="text-xs"
            />
            {fotoFile && (
              <button
                type="button"
                onClick={() => {
                  onPickFoto(null);
                  if (fotoInputRef.current) fotoInputRef.current.value = "";
                }}
                className="mt-1 text-[10px] font-semibold text-rose-700 hover:underline"
              >
                Remover foto selecionada
              </button>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Input
            label="Email de acesso *"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
            type="email"
          />
          <PasswordInput
            label="Senha *"
            value={form.senha}
            onChange={(v) => setForm({ ...form, senha: v })}
            hint="Mínimo 8 caracteres. Evite senhas óbvias."
          />
          <Input
            label="Nome completo *"
            value={form.nome}
            onChange={(v) => setForm({ ...form, nome: v })}
          />
          <Input
            label="CPF"
            value={form.cpf}
            onChange={(v) => setForm({ ...form, cpf: formatCpf(v) })}
            placeholder="000.000.000-00"
          />

          {tipo === "profissional" && (
            <>
              <Input
                label="Especialidade *"
                value={form.especialidade}
                onChange={(v) => setForm({ ...form, especialidade: v })}
                placeholder="Obstetra, Enfermeiro Obstétrico..."
              />
              <Input
                label="Registro (CRM/COREN)"
                value={form.registro}
                onChange={(v) => setForm({ ...form, registro: v })}
              />
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  Bio / apresentação
                </label>
                <textarea
                  rows={2}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="w-full text-sm rounded-xl border border-border bg-background p-3"
                />
              </div>
            </>
          )}

          {tipo === "gestante" && (
            <>
              <Input
                label="DUM (data da última menstruação)"
                value={form.dum}
                onChange={(v) => setForm({ ...form, dum: v })}
                type="date"
              />
              <Input
                label="Telefone"
                value={form.telefone}
                onChange={(v) => setForm({ ...form, telefone: v })}
                placeholder="(00) 00000-0000"
              />
            </>
          )}
        </div>

        {msg && (
          <p className="text-xs text-foreground bg-muted px-3 py-2 rounded-lg">{msg}</p>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={handleCreate}
            className="px-4 py-2 rounded-full text-xs font-bold bg-[#1a1557] text-white hover:bg-[#241e7a] disabled:opacity-50"
          >
            {saving ? "Cadastrando..." : `Cadastrar ${tipoLabel[tipo].toLowerCase()}`}
          </button>
        </div>
      </motion.div>

      {/* ============== LISTA ============== */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-4 py-3 bg-muted/40 border-b border-border flex flex-wrap items-center gap-3 justify-between">
          <p className="text-xs font-bold uppercase tracking-wide text-foreground">
            Usuários do sistema ({filtrados.length})
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, email, CPF..."
              className="h-8 text-xs rounded-full border border-border bg-background px-3 w-56"
            />
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as typeof filtroTipo)}
              className="h-8 text-xs rounded-full border border-border bg-background px-3"
            >
              <option value="todos">Todos os tipos</option>
              <option value="admin">Administradores</option>
              <option value="profissional">Profissionais</option>
              <option value="gestante">Gestantes</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground p-6 text-center">Carregando...</p>
        ) : filtrados.length === 0 ? (
          <p className="text-sm text-muted-foreground p-6 text-center">
            Nenhum usuário encontrado.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {filtrados.map((u) => {
              const isAdmin = u.roles.includes("admin");
              const isProf = u.roles.includes("profissional");
              const tipoTxt = isAdmin
                ? "Administrador"
                : isProf
                  ? "Profissional"
                  : "Gestante";
              const senhaVisivel = showSenhasIds.has(u.user_id);
              return (
                <li
                  key={u.user_id}
                  className="p-4 flex items-start justify-between gap-3 flex-wrap"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-full bg-muted overflow-hidden flex items-center justify-center border border-border shrink-0">
                      {u.foto_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.foto_url} alt={u.nome ?? ""} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-muted-foreground">
                          {(u.nome ?? "?").slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-foreground">
                          {u.nome ?? "(sem nome)"}
                        </p>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                            isAdmin
                              ? "bg-[#1a1557] text-[#f0c040]"
                              : isProf
                                ? "bg-[#f0c040]/20 text-[#1a1557]"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {tipoTxt}
                        </span>
                        {u.professional && (
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              u.professional.ativo
                                ? "bg-green-100 text-green-700"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {u.professional.ativo ? "Ativo" : "Inativo"}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {u.email ?? "—"}
                        {u.cpf && ` • CPF ${u.cpf}`}
                        {u.telefone && ` • ${u.telefone}`}
                        {u.professional &&
                          ` • ${u.professional.especialidade}${u.professional.registro ? ` (${u.professional.registro})` : ""}`}
                      </p>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          Senha:
                        </span>
                        {u.password_plaintext ? (
                          <>
                            <code className="text-[11px] bg-muted px-2 py-0.5 rounded font-mono">
                              {senhaVisivel ? u.password_plaintext : "••••••••"}
                            </code>
                            <button
                              type="button"
                              onClick={() => toggleSenha(u.user_id)}
                              className="text-[10px] font-semibold text-[#1a1557] hover:underline"
                            >
                              {senhaVisivel ? "ocultar" : "mostrar"}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                navigator.clipboard.writeText(u.password_plaintext!)
                              }
                              className="text-[10px] font-semibold text-[#1a1557] hover:underline"
                            >
                              copiar
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] italic text-muted-foreground">
                            definida pelo próprio usuário (não armazenada)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setEditUser(u)}
                      className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#f0c040] text-[#1a1557] hover:bg-[#e6b730]"
                    >
                      Editar
                    </button>
                    {u.professional && (
                      <button
                        type="button"
                        onClick={() => toggleAtivo(u)}
                        className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                          u.professional.ativo
                            ? "bg-muted text-muted-foreground hover:bg-muted/80"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {u.professional.ativo ? "Inativar" : "Ativar"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setResetUserId(u)}
                      className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#1a1557] text-white hover:bg-[#241e7a]"
                    >
                      Redefinir senha
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(u)}
                      className="px-3 py-1 rounded-full text-[11px] font-bold bg-rose-600 text-white hover:bg-rose-700"
                    >
                      Apagar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {resetUserId && (
        <ResetPasswordModal
          user={resetUserId}
          onClose={() => setResetUserId(null)}
          onSaved={async () => {
            setResetUserId(null);
            await load();
          }}
        />
      )}

      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={async () => {
            setEditUser(null);
            await load();
          }}
        />
      )}
    </div>
  );
}

function ResetPasswordModal({
  user,
  onClose,
  onSaved,
}: {
  user: UnifiedUser;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [novaSenha, setNovaSenha] = useState("");
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const salvar = async () => {
    setErro(null);
    setSaving(true);
    try {
      await resetUserPassword({
        data: { adminSecret: ADMIN_SECRET, userId: user.user_id, novaSenha },
      });
      onSaved();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card w-full max-w-md rounded-2xl border border-border p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 className="text-lg font-bold font-display text-foreground">Redefinir senha</h3>
          <p className="text-xs text-muted-foreground">
            {user.nome ?? user.email} — a nova senha ficará visível na lista.
          </p>
        </div>

        <PasswordInput
          label="Nova senha"
          value={novaSenha}
          onChange={setNovaSenha}
          hint="Mínimo 6 caracteres."
        />

        {erro && (
          <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">
            {erro}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-bold bg-muted text-foreground hover:bg-muted/70"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={salvar}
            disabled={saving || !novaSenha}
            className="px-4 py-2 rounded-full text-xs font-bold bg-[#1a1557] text-white hover:bg-[#241e7a] disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar nova senha"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditUserModal({
  user,
  onClose,
  onSaved,
}: {
  user: UnifiedUser;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState(user.nome ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [cpf, setCpf] = useState(user.cpf ? formatCpf(user.cpf) : "");
  const [telefone, setTelefone] = useState(user.telefone ?? "");
  const [dum, setDum] = useState(user.dum ?? "");
  const [especialidade, setEspecialidade] = useState(user.professional?.especialidade ?? "");
  const [registro, setRegistro] = useState(user.professional?.registro ?? "");
  const [bio, setBio] = useState(user.professional?.bio ?? "");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(user.foto_url);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const onPick = (f: File | null) => {
    setFotoFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setFotoPreview(url);
    } else {
      setFotoPreview(user.foto_url);
    }
  };

  const salvar = async () => {
    setErro(null);
    const cpfDigits = normalizeCpf(cpf);
    if (cpf && cpfDigits.length !== 11) {
      setErro("CPF inválido. Informe os 11 dígitos ou deixe em branco.");
      return;
    }
    setSaving(true);
    try {
      let fotoUrl: string | undefined = undefined;
      if (fotoFile) {
        fotoUrl = await uploadAvatar(fotoFile, user.user_id);
      }
      await updateUserUnified({
        data: {
          adminSecret: ADMIN_SECRET,
          userId: user.user_id,
          nome,
          email,
          cpf: cpfDigits,
          telefone,
          dum: dum || null,
          foto_url: fotoUrl ?? undefined,
          professionalId: user.professional?.id ?? null,
          especialidade: user.professional ? especialidade : undefined,
          registro: user.professional ? registro : undefined,
          bio: user.professional ? bio : undefined,
        },
      });
      onSaved();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-card w-full max-w-2xl rounded-2xl border border-border p-5 space-y-4 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 className="text-lg font-bold font-display text-foreground">Editar usuário</h3>
          <p className="text-xs text-muted-foreground">
            Atualize os dados de {user.nome ?? user.email}.
          </p>
        </div>

        {/* Foto */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-muted overflow-hidden flex items-center justify-center border border-border">
            {fotoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fotoPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] text-muted-foreground">Sem foto</span>
            )}
          </div>
          <div className="flex-1">
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Trocar foto
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onPick(e.target.files?.[0] ?? null)}
              className="text-xs"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Nome completo" value={nome} onChange={setNome} />
          <Input label="Email" value={email} onChange={setEmail} type="email" />
          <Input
            label="CPF"
            value={cpf}
            onChange={(v) => setCpf(formatCpf(v))}
            placeholder="000.000.000-00"
          />
          <Input label="Telefone" value={telefone} onChange={setTelefone} />

          {user.roles.includes("gestante") &&
            !user.roles.includes("profissional") &&
            !user.roles.includes("admin") && (
              <Input label="DUM" value={dum} onChange={setDum} type="date" />
            )}

          {user.professional && (
            <>
              <Input label="Especialidade" value={especialidade} onChange={setEspecialidade} />
              <Input label="Registro (CRM/COREN)" value={registro} onChange={setRegistro} />
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  Bio / apresentação
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full text-sm rounded-xl border border-border bg-background p-3"
                />
              </div>
            </>
          )}
        </div>

        {erro && (
          <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">
            {erro}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-bold bg-muted text-foreground hover:bg-muted/70"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={salvar}
            disabled={saving}
            className="px-4 py-2 rounded-full text-xs font-bold bg-[#1a1557] text-white hover:bg-[#241e7a] disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
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
          className="w-full h-9 text-sm rounded-xl border border-border bg-background px-3 pr-16"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#1a1557] hover:underline"
        >
          {show ? "ocultar" : "mostrar"}
        </button>
      </div>
      {hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
