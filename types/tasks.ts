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
