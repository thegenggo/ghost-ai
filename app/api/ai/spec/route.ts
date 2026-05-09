import { tasks } from "@trigger.dev/sdk";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { checkProjectAccess, getCurrentIdentity } from "@/lib/project-access";
import type { generateSpecTask } from "@/trigger/generate-spec";

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  sender: z.string().min(1).max(120).optional(),
  content: z.string().min(1).max(8000),
});

const nodeSchema = z
  .object({
    id: z.string().min(1),
  })
  .passthrough();

const edgeSchema = z
  .object({
    id: z.string().min(1),
    source: z.string().min(1),
    target: z.string().min(1),
  })
  .passthrough();

const requestSchema = z.object({
  roomId: z.string().min(1),
  chatHistory: z.array(chatMessageSchema).max(200),
  nodes: z.array(nodeSchema).max(500),
  edges: z.array(edgeSchema).max(1000),
});

export async function POST(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { roomId, chatHistory, nodes, edges } = parsed.data;

  const access = await checkProjectAccess(roomId, identity);
  if (!access) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const handle = await tasks.trigger<typeof generateSpecTask>("generate-spec", {
    projectId: access.id,
    roomId,
    chatHistory,
    nodes,
    edges,
  });

  await prisma.taskRun.create({
    data: {
      runId: handle.id,
      projectId: access.id,
      userId: identity.userId,
    },
  });

  return Response.json({ runId: handle.id }, { status: 201 });
}
