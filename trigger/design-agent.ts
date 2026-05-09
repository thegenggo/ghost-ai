import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
  mutateFlow,
  type MutableFlow,
} from "@liveblocks/react-flow/node";
import { logger, metadata, task } from "@trigger.dev/sdk";
import { generateObject } from "ai";
import { z } from "zod";

import {
  AI_AGENT_COLOR,
  AI_AGENT_NAME,
  AI_AGENT_PRESENCE_TTL_SECONDS,
  AI_AGENT_USER_ID,
  AI_STATUS_EVENT_TYPE,
  type AiStatusEvent,
  type AiStatusLevel,
} from "@/lib/ai-agent";
import { getLiveblocksClient } from "@/lib/liveblocks";
import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  NODE_SHAPES,
  type CanvasEdge,
  type CanvasNode,
  type NodeColor,
} from "@/types/canvas";

export interface DesignAgentPayload {
  prompt: string;
  roomId: string;
}

const DEFAULT_NODE_WIDTH = 160;
const DEFAULT_NODE_HEIGHT = 80;
const APPLY_CHUNK_SIZE = 3;
const NODE_COLOR_IDS = [
  "neutral",
  "blue",
  "purple",
  "orange",
  "red",
  "pink",
  "green",
  "teal",
] as const satisfies readonly NodeColor[];
const HANDLE_IDS = ["top", "right", "bottom", "left"] as const;
const ARROW_MARKER = {
  type: "arrowclosed" as const,
  color: "#808090",
  width: 16,
  height: 16,
};

// Each action is its own object with the fields it actually requires —
// `color` and `shape` are mandatory on add-node so Gemini can't drop them.
// `@ai-sdk/google` forwards anyOf to Gemini's responseSchema, so the
// discriminated union compiles cleanly.
const addNodeAction = z.object({
  type: z.literal("add-node"),
  id: z.string().min(1),
  label: z.string(),
  shape: z.enum(NODE_SHAPES),
  color: z.enum(NODE_COLOR_IDS),
  x: z.number(),
  y: z.number(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
});

const moveNodeAction = z.object({
  type: z.literal("move-node"),
  id: z.string().min(1),
  x: z.number(),
  y: z.number(),
});

const resizeNodeAction = z.object({
  type: z.literal("resize-node"),
  id: z.string().min(1),
  width: z.number().positive(),
  height: z.number().positive(),
});

const updateNodeAction = z.object({
  type: z.literal("update-node"),
  id: z.string().min(1),
  label: z.string().optional(),
  shape: z.enum(NODE_SHAPES).optional(),
  color: z.enum(NODE_COLOR_IDS).optional(),
});

const deleteNodeAction = z.object({
  type: z.literal("delete-node"),
  id: z.string().min(1),
});

const addEdgeAction = z.object({
  type: z.literal("add-edge"),
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.enum(HANDLE_IDS).optional(),
  targetHandle: z.enum(HANDLE_IDS).optional(),
  label: z.string().optional(),
});

const deleteEdgeAction = z.object({
  type: z.literal("delete-edge"),
  id: z.string().min(1),
});

const designActionSchema = z.discriminatedUnion("type", [
  addNodeAction,
  moveNodeAction,
  resizeNodeAction,
  updateNodeAction,
  deleteNodeAction,
  addEdgeAction,
  deleteEdgeAction,
]);

const designPlanSchema = z.object({
  summary: z.string(),
  actions: z.array(designActionSchema).min(1),
});

type DesignAction = z.infer<typeof designActionSchema>;

export const designAgentTask = task({
  id: "design-agent",
  maxDuration: 600,
  run: async (payload: DesignAgentPayload) => {
    const { prompt, roomId } = payload;
    const liveblocks = getLiveblocksClient();

    metadata.set("status", "starting");
    metadata.set("message", "Reading your prompt");
    metadata.set("progress", 0);

    await safePresence(() => updateAiPresence(roomId, { x: 0, y: 0 }, true));
    await safeBroadcast(roomId, "start", "Reading your prompt");

    try {
      const apiKey =
        process.env.GOOGLE_AI_API_KEY ??
        process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (!apiKey) {
        throw new Error(
          "GOOGLE_AI_API_KEY is not set in the Trigger.dev environment.",
        );
      }
      const google = createGoogleGenerativeAI({ apiKey });

      const { object: plan } = await generateObject({
        model: google("gemini-2.5-flash"),
        schema: designPlanSchema,
        system: SYSTEM_PROMPT,
        prompt: `User prompt:\n${prompt.trim()}`,
      });

      logger.info("design-agent generated plan", {
        actionCount: plan.actions.length,
        summary: plan.summary,
      });

      metadata.set("planSummary", plan.summary);
      metadata.set("status", "processing");
      metadata.set(
        "message",
        `Designing ${plan.actions.length} canvas elements`,
      );
      await safeBroadcast(
        roomId,
        "processing",
        `Designing ${plan.actions.length} canvas elements`,
      );

      for (let i = 0; i < plan.actions.length; i += APPLY_CHUNK_SIZE) {
        const chunk = plan.actions.slice(i, i + APPLY_CHUNK_SIZE);
        const focusPoint = findFocusPoint(chunk);
        if (focusPoint) {
          await safePresence(() =>
            updateAiPresence(roomId, focusPoint, true),
          );
        }

        await mutateFlow<CanvasNode, CanvasEdge>(
          { client: liveblocks, roomId },
          (flow) => {
            for (const action of chunk) {
              applyAction(flow, action);
            }
          },
        );

        const completed = Math.min(i + chunk.length, plan.actions.length);
        const progress = Math.round((completed / plan.actions.length) * 100);
        metadata.set("progress", progress);
      }

      metadata.set("status", "complete");
      metadata.set("message", "Design ready");
      metadata.set("progress", 100);
      await safeBroadcast(roomId, "complete", "Design ready");

      return {
        actionsApplied: plan.actions.length,
        summary: plan.summary,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      logger.error("design-agent failed", { error: message });
      metadata.set("status", "error");
      metadata.set("message", message);
      await safeBroadcast(roomId, "error", "Design failed");
      throw error;
    } finally {
      await safePresence(() => clearAiPresence(roomId));
    }
  },
});

const SYSTEM_PROMPT = `You are Ghost AI, an assistant that designs system architectures on a collaborative canvas.

Return a plan as JSON with two fields:
- summary: a one-sentence description of the design.
- actions: an ordered list of canvas mutations to perform.

Each action has a "type" plus the fields it needs:
- add-node: { id, label, shape, color, x, y, width?, height? } — shape AND color are MANDATORY, never omit them.
- move-node: { id, x, y }
- resize-node: { id, width, height }
- update-node: { id, label?, shape?, color? }
- delete-node: { id }
- add-edge: { id, source, target, sourceHandle?, targetHandle?, label? }
- delete-edge: { id }

Constraints:
- Every add-node action MUST include both "shape" and "color". Pick the most appropriate value from the allowed lists below — there is no implicit default.
- Allowed shapes: rectangle, diamond, circle, pill, cylinder, hexagon.
  - rectangle: general service or component
  - pill: process or stateless service
  - cylinder: database or persistent storage
  - diamond: decision or gateway
  - circle: event, endpoint, or trigger
  - hexagon: external system or boundary
- Allowed colors: neutral, blue, purple, orange, red, pink, green, teal. Use color to group related elements (e.g. all data stores teal, all external systems orange).
- Use unique string ids for new nodes and edges. Edge sources and targets must reference node ids declared earlier in the same plan or already on the canvas.
- Layout the diagram on a grid from x=0,y=0. Space nodes at least 220 pixels apart horizontally and 160 pixels apart vertically. Group related nodes into rows or columns. Default node size is 160x80 — only set width/height when the label needs more room.
- Prefer clear left-to-right or top-to-bottom flow. Keep labels short (1-4 words).
- Edge handles, when set, must be one of: top, right, bottom, left.
- Output between 4 and 24 actions for a fresh design unless the user requests a smaller change.`;

function applyAction(
  flow: MutableFlow<CanvasNode, CanvasEdge>,
  action: DesignAction,
): void {
  switch (action.type) {
    case "add-node": {
      const node: CanvasNode = {
        id: action.id,
        type: CANVAS_NODE_TYPE,
        position: { x: action.x, y: action.y },
        width: action.width ?? DEFAULT_NODE_WIDTH,
        height: action.height ?? DEFAULT_NODE_HEIGHT,
        data: {
          label: action.label,
          shape: action.shape,
          color: action.color,
        },
      };
      flow.addNode(node);
      return;
    }
    case "move-node": {
      flow.updateNode(action.id, {
        position: { x: action.x, y: action.y },
      });
      return;
    }
    case "resize-node": {
      flow.updateNode(action.id, {
        width: action.width,
        height: action.height,
      });
      return;
    }
    case "update-node": {
      const partial: Partial<CanvasNode["data"]> = {};
      if (action.label !== undefined) partial.label = action.label;
      if (action.shape !== undefined) partial.shape = action.shape;
      if (action.color !== undefined) partial.color = action.color;
      if (Object.keys(partial).length > 0) {
        flow.updateNodeData(action.id, partial);
      }
      return;
    }
    case "delete-node": {
      flow.removeNode(action.id);
      return;
    }
    case "add-edge": {
      const edge: CanvasEdge = {
        id: action.id,
        type: CANVAS_EDGE_TYPE,
        source: action.source,
        target: action.target,
        sourceHandle: action.sourceHandle,
        targetHandle: action.targetHandle,
        markerEnd: ARROW_MARKER,
        data: action.label ? { label: action.label } : {},
      };
      flow.addEdge(edge);
      return;
    }
    case "delete-edge": {
      flow.removeEdge(action.id);
      return;
    }
  }
}

function findFocusPoint(
  actions: DesignAction[],
): { x: number; y: number } | null {
  for (const action of actions) {
    if (action.type === "add-node" || action.type === "move-node") {
      return { x: action.x, y: action.y };
    }
  }
  return null;
}

async function updateAiPresence(
  roomId: string,
  cursor: { x: number; y: number },
  thinking: boolean,
): Promise<void> {
  const liveblocks = getLiveblocksClient();
  await liveblocks.setPresence(roomId, {
    userId: AI_AGENT_USER_ID,
    data: { cursor, thinking },
    userInfo: {
      name: AI_AGENT_NAME,
      color: AI_AGENT_COLOR,
    },
    ttl: AI_AGENT_PRESENCE_TTL_SECONDS,
  });
}

async function clearAiPresence(roomId: string): Promise<void> {
  const liveblocks = getLiveblocksClient();
  // Minimum TTL is 2 seconds; cursor=null hides the on-canvas pointer right
  // away while presence quickly expires.
  await liveblocks.setPresence(roomId, {
    userId: AI_AGENT_USER_ID,
    data: { cursor: null, thinking: false },
    userInfo: {
      name: AI_AGENT_NAME,
      color: AI_AGENT_COLOR,
    },
    ttl: 2,
  });
}

async function safePresence(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    logger.warn("ai presence update failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function safeBroadcast(
  roomId: string,
  level: AiStatusLevel,
  message: string,
): Promise<void> {
  try {
    const liveblocks = getLiveblocksClient();
    const event: AiStatusEvent = {
      type: AI_STATUS_EVENT_TYPE,
      level,
      message,
    };
    await liveblocks.broadcastEvent(roomId, event);
  } catch (error) {
    logger.warn("ai status broadcast failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
