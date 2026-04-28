import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { AdminProfile } from "@/utils/admin-filters";

const ADMIN_SECRET = "unaerp2026";

type Tipo = "admin" | "profissional" | "gestante";

type CreateInput = {
  adminSecret: string;
  tipo: Tipo;
  email: string;
  senha: string;
  nome: string;
  cpf?: string;
  // profissional
  especialidade?: string;
  registro?: string | null;
  bio?: string | null;
  // gestante
  dum?: string | null;
  telefone?: string | null;
};

function amigavelAuthError(raw: string): string {
  if (/known to be weak|pwned|compromised|breach/i.test(raw))
    return "Senha muito fraca ou já vazada. Escolha outra mais forte.";
  if (/at least 6|password.*length|should be at least/i.test(raw))
    return "A senha precisa ter no mínimo 6 caracteres.";
  if (/already.*registered|exists|duplicate/i.test(raw))
    return "Este e-mail já está em uso por outra conta.";
  return raw;
}

export const createUserUnified = createServerFn({ method: "POST" })
  .inputValidator((input: CreateInput) => input)
  .handler(async ({ data }) => {
    if (data.adminSecret !== ADMIN_SECRET) throw new Error("Não autorizado");
    if (!data.email || !data.senha || !data.nome)
      throw new Error("Email, senha e nome são obrigatórios.");
    if (data.tipo === "profissional" && !data.especialidade)
      throw new Error("Especialidade é obrigatória para profissional.");

    const cpfDigits = (data.cpf ?? "").replace(/\D/g, "");
    if (data.cpf && cpfDigits.length !== 11)
      throw new Error("CPF inválido. Informe os 11 dígitos ou deixe em branco.");

    // 1. Cria usuário no auth (já confirmado para uso interno)
    const { data: created, error: createErr } =
      await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.senha,
        email_confirm: true,
        user_metadata: {
          nome: data.nome,
          cpf: cpfDigits || null,
          tipo_usuario: data.tipo === "profissional" ? "profissional" : "gestante",
        },
      });
    if (createErr) throw new Error(amigavelAuthError(createErr.message));
    const userId = created.user?.id;
    if (!userId) throw new Error("Não foi possível criar o usuário.");

    // 2. Garante profile
    await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          user_id: userId,
          nome: data.nome,
          email: data.email,
          cpf: cpfDigits || null,
          dum: data.dum || null,
          telefone: data.telefone || null,
        },
        { onConflict: "user_id" },
      );

    // 3. Vínculos de papel
    if (data.tipo === "profissional") {
      const { error: pErr } = await supabaseAdmin.from("professionals").insert({
        user_id: userId,
        nome: data.nome,
        especialidade: data.especialidade!,
        registro: data.registro || null,
        bio: data.bio || null,
        ativo: true,
      });
      if (pErr) throw new Error("Erro ao criar profissional: " + pErr.message);

      await supabaseAdmin.from("user_roles").delete().eq("user_id", userId).eq("role", "gestante");
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role: "profissional" }, { onConflict: "user_id,role" });
    } else if (data.tipo === "admin") {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", userId).eq("role", "gestante");
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
    } else {
      // gestante: trigger já cria role 'gestante'; garante caso falhe
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role: "gestante" }, { onConflict: "user_id,role" });
    }

    // 4. Grava senha em texto (definida pelo admin)
    await supabaseAdmin.from("admin_managed_passwords").upsert(
      {
        user_id: userId,
        password_plaintext: data.senha,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    return { success: true, userId };
  });

type ResetPwdInput = {
  adminSecret: string;
  userId: string;
  novaSenha: string;
};

export const resetUserPassword = createServerFn({ method: "POST" })
  .inputValidator((input: ResetPwdInput) => input)
  .handler(async ({ data }) => {
    if (data.adminSecret !== ADMIN_SECRET) throw new Error("Não autorizado");
    if (!data.novaSenha || data.novaSenha.length < 6)
      throw new Error("A senha precisa ter no mínimo 6 caracteres.");

    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.novaSenha,
    });
    if (error) throw new Error(amigavelAuthError(error.message));

    await supabaseAdmin.from("admin_managed_passwords").upsert(
      {
        user_id: data.userId,
        password_plaintext: data.novaSenha,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    return { success: true };
  });

export const listGestanteProfilesForAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: { adminSecret: string }) => input)
  .handler(async ({ data }): Promise<{ profiles: AdminProfile[] }> => {
    if (data.adminSecret !== ADMIN_SECRET) throw new Error("Não autorizado");

    const { data: roles, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");
    if (rolesErr) throw new Error(rolesErr.message);

    const rolesByUser = new Map<string, Set<string>>();
    for (const r of roles ?? []) {
      const set = rolesByUser.get(r.user_id) ?? new Set<string>();
      set.add(r.role as string);
      rolesByUser.set(r.user_id, set);
    }

    const gestanteIds = [...rolesByUser.entries()]
      .filter(([, rolesSet]) =>
        rolesSet.has("gestante") && !rolesSet.has("admin") && !rolesSet.has("profissional"),
      )
      .map(([userId]) => userId);

    if (gestanteIds.length === 0) return { profiles: [] };

    const { data: profiles, error: profilesErr } = await supabaseAdmin
      .from("profiles")
      .select(
        "user_id, nome, email, telefone, cidade, bairro, unidade_saude, data_nascimento, dum, numero_gestacoes, numero_partos, numero_abortos",
      )
      .in("user_id", gestanteIds)
      .order("nome", { ascending: true })
      .limit(1000);
    if (profilesErr) throw new Error(profilesErr.message);

    return { profiles: (profiles ?? []) as AdminProfile[] };
  });

type DeleteUserInput = {
  adminSecret: string;
  userId: string;
};

export const deleteUser = createServerFn({ method: "POST" })
  .inputValidator((input: DeleteUserInput) => input)
  .handler(async ({ data }) => {
    if (data.adminSecret !== ADMIN_SECRET) throw new Error("Não autorizado");
    // Remove vínculos
    await supabaseAdmin.from("professionals").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("admin_managed_passwords").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("profiles").delete().eq("user_id", data.userId);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export type UnifiedUser = {
  user_id: string;
  email: string | null;
  nome: string | null;
  cpf: string | null;
  roles: string[];
  professional: {
    id: string;
    especialidade: string;
    registro: string | null;
    ativo: boolean;
  } | null;
  password_plaintext: string | null;
  created_at: string | null;
};

export const listAllUsers = createServerFn({ method: "POST" })
  .inputValidator((input: { adminSecret: string }) => input)
  .handler(async ({ data }): Promise<{ users: UnifiedUser[] }> => {
    if (data.adminSecret !== ADMIN_SECRET) throw new Error("Não autorizado");

    // Lista usuários do auth (até 1000)
    const { data: authList, error: authErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (authErr) throw new Error(authErr.message);

    const users = authList.users ?? [];
    const ids = users.map((u) => u.id);

    const [profilesRes, rolesRes, profsRes, pwdsRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("user_id, nome, email, cpf").in("user_id", ids),
      supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids),
      supabaseAdmin
        .from("professionals")
        .select("id, user_id, especialidade, registro, ativo")
        .in("user_id", ids),
      supabaseAdmin
        .from("admin_managed_passwords")
        .select("user_id, password_plaintext")
        .in("user_id", ids),
    ]);

    const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.user_id, p]));
    const roleMap = new Map<string, string[]>();
    for (const r of rolesRes.data ?? []) {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role as string);
      roleMap.set(r.user_id, arr);
    }
    const profMap = new Map((profsRes.data ?? []).map((p) => [p.user_id, p]));
    const pwdMap = new Map((pwdsRes.data ?? []).map((p) => [p.user_id, p.password_plaintext]));

    const result: UnifiedUser[] = users.map((u) => {
      const prof = profMap.get(u.id);
      return {
        user_id: u.id,
        email: u.email ?? profileMap.get(u.id)?.email ?? null,
        nome: profileMap.get(u.id)?.nome ?? (u.user_metadata?.nome as string) ?? null,
        cpf: profileMap.get(u.id)?.cpf ?? null,
        roles: roleMap.get(u.id) ?? [],
        professional: prof
          ? {
              id: prof.id,
              especialidade: prof.especialidade,
              registro: prof.registro,
              ativo: prof.ativo,
            }
          : null,
        password_plaintext: pwdMap.get(u.id) ?? null,
        created_at: u.created_at ?? null,
      };
    });

    // Ordena: admins primeiro, depois profissionais, depois gestantes; por nome
    const order = (r: string[]) =>
      r.includes("admin") ? 0 : r.includes("profissional") ? 1 : 2;
    result.sort((a, b) => {
      const d = order(a.roles) - order(b.roles);
      if (d !== 0) return d;
      return (a.nome ?? "").localeCompare(b.nome ?? "");
    });

    return { users: result };
  });
