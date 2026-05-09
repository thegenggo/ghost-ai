import { randomUUID } from "node:crypto";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { logger, metadata, schemaTask } from "@trigger.dev/sdk";
import { put } from "@vercel/blob";
import { generateText } from "ai";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  sender: z.string().min(1).max(120).optional(),
  content: z.string().min(1).max(8000),
});

const nodeDataSchema = z
  .object({
    label: z.string().optional(),
    shape: z.string().optional(),
    color: z.string().optional(),
  })
  .passthrough();

const nodeSchema = z
  .object({
    id: z.string().min(1),
    type: z.string().optional(),
    position: z
      .object({ x: z.number(), y: z.number() })
      .optional(),
    width: z.number().optional().nullable(),
    height: z.number().optional().nullable(),
    data: nodeDataSchema.optional(),
  })
  .passthrough();

const edgeDataSchema = z
  .object({
    label: z.string().optional(),
  })
  .passthrough();

const edgeSchema = z
  .object({
    id: z.string().min(1),
    source: z.string().min(1),
    target: z.string().min(1),
    sourceHandle: z.string().nullable().optional(),
    targetHandle: z.string().nullable().optional(),
    data: edgeDataSchema.optional(),
  })
  .passthrough();

export const generateSpecPayloadSchema = z.object({
  projectId: z.string().min(1),
  roomId: z.string().min(1),
  chatHistory: z.array(chatMessageSchema).max(200),
  nodes: z.array(nodeSchema).max(500),
  edges: z.array(edgeSchema).max(1000),
});

export type GenerateSpecPayload = z.infer<typeof generateSpecPayloadSchema>;

type CanvasNodeInput = z.infer<typeof nodeSchema>;
type CanvasEdgeInput = z.infer<typeof edgeSchema>;
type ChatMessageInput = z.infer<typeof chatMessageSchema>;

export const generateSpecTask = schemaTask({
  id: "generate-spec",
  schema: generateSpecPayloadSchema,
  maxDuration: 600,
  run: async (payload) => {
    const { projectId, roomId, chatHistory, nodes, edges } = payload;

    metadata.set("status", "starting");
    metadata.set("message", "Reading the canvas and chat");
    metadata.set("progress", 0);
    metadata.set("projectId", projectId);
    metadata.set("roomId", roomId);

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

      metadata.set("status", "processing");
      metadata.set("message", "Generating Markdown spec");
      metadata.set("progress", 25);

      const userPrompt = buildPrompt({ chatHistory, nodes, edges });

      const { text } = await generateText({
        model: google("gemini-2.5-flash"),
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
      });

      const markdown = text.trim();
      if (markdown.length === 0) {
        throw new Error("Spec generation returned an empty document.");
      }

      logger.info("generate-spec produced markdown", {
        characters: markdown.length,
        nodeCount: nodes.length,
        edgeCount: edges.length,
        chatTurns: chatHistory.length,
      });

      metadata.set("message", "Saving spec");
      metadata.set("progress", 75);

      const specId = randomUUID();
      const blob = await put(
        `specs/${projectId}/${specId}.md`,
        markdown,
        {
          access: "private",
          contentType: "text/markdown; charset=utf-8",
          allowOverwrite: true,
        },
      );

      const spec = await prisma.projectSpec.create({
        data: {
          id: specId,
          projectId,
          filePath: blob.url,
        },
        select: { id: true, filePath: true, createdAt: true },
      });

      metadata.set("status", "complete");
      metadata.set("message", "Spec ready");
      metadata.set("progress", 100);
      metadata.set("characters", markdown.length);
      metadata.set("specId", spec.id);
      metadata.set("filePath", spec.filePath);

      return {
        spec: markdown,
        specId: spec.id,
        filePath: spec.filePath,
        createdAt: spec.createdAt.toISOString(),
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      logger.error("generate-spec failed", { error: message });
      metadata.set("status", "error");
      metadata.set("message", message);
      throw error;
    }
  },
});

const SYSTEM_PROMPT = `You are Ghost AI, an assistant that writes a technical specification for a system architecture in Markdown.

You are given:
- a list of canvas nodes (services, components, data stores, external systems) with shape, color grouping, and label
- a list of canvas edges connecting those nodes (with optional labels describing the relationship)
- the chat history between the user, collaborators, and the AI design agent

Your job is to write a complete, well-structured technical specification in Markdown that documents the design currently on the canvas. The spec must be self-contained — a reader who has not seen the canvas should be able to understand the architecture from your document alone.

Output rules:
- Output Markdown only. No surrounding code fences, no commentary about your process.
- Start with a single H1 title.
- Include these sections, in this order, using H2 headings: Overview, Components, Data Flow, Interfaces, Data Model, Operational Concerns, Open Questions.
- Components: list every node with its role and responsibilities. Group related nodes (data stores, external systems, etc.) when it improves readability.
- Data Flow: walk through the primary flows implied by the edges. Reference component names exactly as labeled on the canvas.
- Interfaces: describe the boundaries between components — protocols, payloads, or contracts that can be inferred.
- Data Model: describe persistent stores or schemas implied by data-store nodes.
- Operational Concerns: cover scaling, failure modes, observability, and security where the design implies them.
- Open Questions: list ambiguities that would need clarification from the team.
- Prefer short paragraphs and bulleted lists. Do not invent components or relationships that are not represented on the canvas or discussed in the chat.
- If the canvas is empty or extremely sparse, say so explicitly under Overview and keep the rest of the document brief.`;

interface BuildPromptInput {
  chatHistory: ChatMessageInput[];
  nodes: CanvasNodeInput[];
  edges: CanvasEdgeInput[];
}

function buildPrompt({
  chatHistory,
  nodes,
  edges,
}: BuildPromptInput): string {
  const nodeLines = nodes.length
    ? nodes.map(formatNode).join("\n")
    : "(no nodes on canvas)";

  const nodeLabels = new Map<string, string>();
  for (const node of nodes) {
    nodeLabels.set(node.id, formatNodeLabel(node));
  }

  const edgeLines = edges.length
    ? edges.map((edge) => formatEdge(edge, nodeLabels)).join("\n")
    : "(no edges on canvas)";

  const chatLines = chatHistory.length
    ? chatHistory.map(formatChat).join("\n")
    : "(no chat history)";

  return [
    "Canvas nodes:",
    nodeLines,
    "",
    "Canvas edges:",
    edgeLines,
    "",
    "Chat history (oldest first):",
    chatLines,
    "",
    "Write the Markdown technical specification now.",
  ].join("\n");
}

function formatNode(node: CanvasNodeInput): string {
  const label = formatNodeLabel(node);
  const shape = node.data?.shape ?? "rectangle";
  const color = node.data?.color ?? "neutral";
  return `- id=${node.id} label="${label}" shape=${shape} color=${color}`;
}

function formatNodeLabel(node: CanvasNodeInput): string {
  const raw = node.data?.label;
  const label = typeof raw === "string" ? raw.trim() : "";
  return label.length > 0 ? label : "(unlabeled)";
}

function formatEdge(
  edge: CanvasEdgeInput,
  nodeLabels: Map<string, string>,
): string {
  const sourceLabel = nodeLabels.get(edge.source) ?? edge.source;
  const targetLabel = nodeLabels.get(edge.target) ?? edge.target;
  const rawLabel = edge.data?.label;
  const label =
    typeof rawLabel === "string" && rawLabel.trim().length > 0
      ? ` label="${rawLabel.trim()}"`
      : "";
  return `- ${sourceLabel} -> ${targetLabel}${label} (id=${edge.id})`;
}

function formatChat(message: ChatMessageInput): string {
  const sender = message.sender?.trim() || message.role;
  const content = message.content.replace(/\s+/g, " ").trim();
  return `- [${message.role}] ${sender}: ${content}`;
}
