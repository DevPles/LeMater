import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type PostLoginPath = "/app/admin" | "/app/profissional" | "/app/home" | "/app/membro";

export async function waitForActiveSession(expectedUserId?: string, timeoutMs = 2500): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  if (data.session && (!expectedUserId || data.session.user.id === expectedUserId)) return data.session;

  if (typeof window === "undefined") return null;

  return new Promise((resolve) => {
    let resolved = false;
    const finish = (session: Session | null) => {
      if (resolved) return;
      resolved = true;
      window.clearTimeout(timer);
      subscription.unsubscribe();
      resolve(session);
    };

    const timer = window.setTimeout(() => finish(null), timeoutMs);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && (!expectedUserId || session.user.id === expectedUserId)) finish(session);
    });
  });
}

export async function resolvePostLoginPath(userId: string, fallback: PostLoginPath): Promise<PostLoginPath> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw error;

  const roles = (data ?? []).map((row) => row.role as string);
  if (roles.includes("admin")) return "/app/admin";
  if (roles.includes("profissional")) return "/app/profissional";
  return fallback;
}