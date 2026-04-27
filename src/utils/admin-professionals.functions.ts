import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Senha de admin compartilhada (mesmo backdoor do RegistrationModal).
// Em produção real, substituir por verificação de role admin via JWT.
const ADMIN_SECRET = "unaerp2026";

type UpdateInput = {
  adminSecret: string;
  professionalId: string;
  userId: string;
  patch: {
    nome?: string;
    especialidade?: string;
    registro?: string | null;
    bio?: string | null;
    ativo?: boolean;
  };
  novaSenha?: string;
  novoEmail?: string;
};

export const updateProfessional = createServerFn({ method: "POST" })
  .inputValidator((input: UpdateInput) => input)
  .handler(async ({ data }) => {
    if (data.adminSecret !== ADMIN_SECRET) {
      throw new Error("Não autorizado");
    }

    // 1. Atualiza professionals
    const profPatch: {
      nome?: string;
      especialidade?: string;
      registro?: string | null;
      bio?: string | null;
      ativo?: boolean;
    } = {};
    if (data.patch.nome !== undefined) profPatch.nome = data.patch.nome;
    if (data.patch.especialidade !== undefined) profPatch.especialidade = data.patch.especialidade;
    if (data.patch.registro !== undefined) profPatch.registro = data.patch.registro;
    if (data.patch.bio !== undefined) profPatch.bio = data.patch.bio;
    if (data.patch.ativo !== undefined) profPatch.ativo = data.patch.ativo;

    if (Object.keys(profPatch).length > 0) {
      const { error } = await supabaseAdmin
        .from("professionals")
        .update(profPatch)
        .eq("id", data.professionalId);
      if (error) throw new Error("Erro ao atualizar profissional: " + error.message);
    }

    // 2. Atualiza profiles (nome / email espelhado)
    const profilesPatch: { nome?: string; email?: string } = {};
    if (data.patch.nome !== undefined) profilesPatch.nome = data.patch.nome;
    if (data.novoEmail) profilesPatch.email = data.novoEmail;
    if (Object.keys(profilesPatch).length > 0) {
      await supabaseAdmin.from("profiles").update(profilesPatch).eq("user_id", data.userId);
    }

    // 3. Atualiza auth (senha e/ou email)
    const authPatch: { password?: string; email?: string } = {};
    if (data.novaSenha && data.novaSenha.length >= 6) authPatch.password = data.novaSenha;
    if (data.novoEmail) authPatch.email = data.novoEmail;

    if (Object.keys(authPatch).length > 0) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, authPatch);
      if (error) {
        const raw = error.message || "";
        let amigavel = raw;
        if (/known to be weak|pwned|compromised|breach/i.test(raw)) {
          amigavel = "Senha muito fraca ou já vazada. Escolha outra mais forte.";
        } else if (/at least 6|password.*length/i.test(raw)) {
          amigavel = "A senha precisa ter no mínimo 6 caracteres.";
        } else if (/already.*registered|exists/i.test(raw)) {
          amigavel = "Este e-mail já está em uso por outra conta.";
        }
        throw new Error(amigavel);
      }
    }

    return { success: true };
  });

type DeleteInput = {
  adminSecret: string;
  professionalId: string;
  userId: string;
};

export const deleteProfessional = createServerFn({ method: "POST" })
  .inputValidator((input: DeleteInput) => input)
  .handler(async ({ data }) => {
    if (data.adminSecret !== ADMIN_SECRET) {
      throw new Error("Não autorizado");
    }

    // Remove vínculo professionals e roles, mas mantém auth user para histórico
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", "profissional");
    const { error } = await supabaseAdmin.from("professionals").delete().eq("id", data.professionalId);
    if (error) throw new Error(error.message);
    return { success: true };
  });
