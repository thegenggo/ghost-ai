import { logger, task } from "@trigger.dev/sdk";

export interface DesignAgentPayload {
  prompt: string;
  roomId: string;
}

export const designAgentTask = task({
  id: "design-agent",
  maxDuration: 600,
  run: async (payload: DesignAgentPayload) => {
    logger.info("design-agent task received", {
      prompt: payload.prompt,
      roomId: payload.roomId,
    });
    return { received: payload };
  },
});
