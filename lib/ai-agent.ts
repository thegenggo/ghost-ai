export const AI_AGENT_USER_ID = "ai-ghost";
export const AI_AGENT_NAME = "Ghost AI";
export const AI_AGENT_COLOR = "#6457f9";
export const AI_AGENT_PRESENCE_TTL_SECONDS = 60;

export const AI_STATUS_EVENT_TYPE = "ai-status";

export type AiStatusLevel =
  | "start"
  | "processing"
  | "complete"
  | "error";

export type AiStatusEvent = {
  type: typeof AI_STATUS_EVENT_TYPE;
  level: AiStatusLevel;
  message: string;
};
