import { logger, task } from "@trigger.dev/sdk";

export const exampleTask = task({
  id: "example",
  maxDuration: 60,
  run: async (payload: { name: string }) => {
    logger.info("example task running", { name: payload.name });
    return { greeting: `Hello, ${payload.name}!` };
  },
});
