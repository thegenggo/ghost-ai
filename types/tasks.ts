import { z } from "zod";

export const AI_STATUS_FEED_NAME = "ai-status-feed";

export interface AiStatusFeedMessage {
  text?: string;
}

export function parseAiStatusFeedMessage(
  value: unknown,
): AiStatusFeedMessage | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Record<string, unknown>;
  const text = candidate.text;
  if (text !== undefined && typeof text !== "string") return null;
  return text === undefined ? {} : { text };
}

export const AI_CHAT_FEED_NAME = "ai-chat";
export const AI_CHAT_EVENT_TYPE = "ai-chat";

export const aiChatRoleSchema = z.enum(["user", "assistant", "system"]);
export type AiChatRole = z.infer<typeof aiChatRoleSchema>;

export const aiChatMessageSchema = z.object({
  id: z.string().min(1).max(128),
  senderId: z.string().min(1).max(128),
  sender: z.string().min(1).max(120),
  role: aiChatRoleSchema,
  content: z.string().min(1).max(2000),
  timestamp: z.number().int().nonnegative(),
});

export type AiChatMessage = {
  id: string;
  senderId: string;
  sender: string;
  role: AiChatRole;
  content: string;
  timestamp: number;
};

export function parseAiChatMessage(value: unknown): AiChatMessage | null {
  const result = aiChatMessageSchema.safeParse(value);
  return result.success ? (result.data as AiChatMessage) : null;
}

export type AiChatEvent = {
  type: typeof AI_CHAT_EVENT_TYPE;
  message: AiChatMessage;
};
