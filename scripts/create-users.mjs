import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const users = [
  {
    tipo: "admin",
    email: "admin@lemater.com",
    senha: "pericles.13",
    nome: "Administrador Le Mater",
  },
  {
    tipo: "gestante",
    email: "43953227866@lemater.com",
    senha: "123456",
    nome: "Gestante 43953227866",
    cpf: "43953227866",
  },
  {
    tipo: "profissional",
    email: "profissional@lemater.com",
    senha: "123456",
    nome: "Profissional Le Mater",
    especialidade: "Obstetrícia",
  },
];

for (const u of users) {
  console.log(`\n--- ${u.email} (${u.tipo}) ---`);
  // Check if exists
  const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = list.users.find((x) => x.email === u.email);
  let userId;
  if (existing) {
    console.log("Já existe, atualizando senha...");
    userId = existing.id;
    const { error } = await sb.auth.admin.updateUserById(userId, { password: u.senha });
    if (error) { console.error(error.message); continue; }
  } else {
    const { data, error } = await sb.auth.admin.createUser({
      email: u.email,
      password: u.senha,
      email_confirm: true,
      user_metadata: {
        nome: u.nome,
        cpf: u.cpf ?? null,
        tipo_usuario: u.tipo === "profissional" ? "profissional" : "gestante",
      },
    });
    if (error) { console.error(error.message); continue; }
    userId = data.user.id;
  }

  await sb.from("profiles").upsert(
    { user_id: userId, nome: u.nome, email: u.email, cpf: u.cpf ?? null },
    { onConflict: "user_id" },
  );

  if (u.tipo === "profissional") {
    const { data: existProf } = await sb.from("professionals").select("id").eq("user_id", userId).maybeSingle();
    if (!existProf) {
      await sb.from("professionals").insert({
        user_id: userId, nome: u.nome, especialidade: u.especialidade, ativo: true,
      });
    }
    await sb.from("user_roles").delete().eq("user_id", userId).eq("role", "gestante");
    await sb.from("user_roles").upsert({ user_id: userId, role: "profissional" }, { onConflict: "user_id,role" });
  } else if (u.tipo === "admin") {
    await sb.from("user_roles").delete().eq("user_id", userId).eq("role", "gestante");
    await sb.from("user_roles").upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
  } else {
    await sb.from("user_roles").upsert({ user_id: userId, role: "gestante" }, { onConflict: "user_id,role" });
  }

  await sb.from("admin_managed_passwords").upsert(
    { user_id: userId, password_plaintext: u.senha, updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );

  console.log("OK ->", userId);
}
