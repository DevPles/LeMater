import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  campaignId: z.string().uuid(),
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(2000),
  url: z.string().max(500).optional(),
  userIds: z.array(z.string().uuid()).min(1).max(5000),
});

export const sendPushCampaign = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    // Dynamic import keeps web-push out of the client bundle.
    const { sendPushCampaignImpl } = await import("./push.server");
    return sendPushCampaignImpl(data);
  });
