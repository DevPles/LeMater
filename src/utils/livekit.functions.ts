import { createServerFn } from "@tanstack/react-start";
import { AccessToken } from "livekit-server-sdk";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const gerarTokenSala = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { roomId: string }) => {
    if (
      !input ||
      typeof input.roomId !== "string" ||
      !/^[0-9a-fA-F-]{36}$/.test(input.roomId)
    ) {
      throw new Error("roomId inválido");
    }
    return { roomId: input.roomId };
  })
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      throw new Error(
        "LiveKit não configurado (faltam LIVEKIT_API_KEY/SECRET/URL).",
      );
    }

    const { supabase, userId } = context;

    // Busca o slot e valida que o usuário pode entrar
    const { data: slot, error } = await supabase
      .from("appointment_slots")
      .select("id, room_id, gestante_id, professional_id, status")
      .eq("room_id", data.roomId)
      .maybeSingle();

    if (error || !slot) {
      throw new Error("Sala não encontrada.");
    }

    // Verifica se é o profissional dono
    const { data: prof } = await supabase
      .from("professionals")
      .select("id, nome, user_id")
      .eq("id", slot.professional_id)
      .maybeSingle();

    const ehProfissional = !!prof && prof.user_id === userId;
    const ehGestante = slot.gestante_id === userId;

    if (!ehProfissional && !ehGestante) {
      throw new Error("Você não tem permissão para entrar nesta sala.");
    }

    // Nome de exibição
    let displayName = "Participante";
    if (ehProfissional) {
      displayName = prof?.nome ?? "Profissional";
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("nome")
        .eq("user_id", userId)
        .maybeSingle();
      displayName = profile?.nome ?? "Gestante";
    }

    // Gera token JWT do LiveKit (validade: 2h)
    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: displayName,
      ttl: 60 * 60 * 2,
    });

    at.addGrant({
      roomJoin: true,
      room: `maedigital-${slot.room_id}`,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return { token, wsUrl };
  });
