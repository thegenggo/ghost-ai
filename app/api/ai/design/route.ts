import { auth as triggerAuth, tasks } from "@trigger.dev/sdk";

import { prisma } from "@/lib/prisma";
import { checkProjectAccess, getCurrentIdentity } from "@/lib/project-access";
import type { designAgentTask } from "@/trigger/design-agent";

interface DesignRequestBody {
  prompt: string;
  roomId: string;
}

export async function POST(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await readBody(request);
  if (!body) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const access = await checkProjectAccess(body.roomId, identity);
  if (!access) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const handle = await tasks.trigger<typeof designAgentTask>("design-agent", {
    prompt: body.prompt,
    roomId: body.roomId,
  });

  await prisma.taskRun.create({
    data: {
      runId: handle.id,
      projectId: access.id,
      userId: identity.userId,
    },
  });

  const publicToken = await triggerAuth.createPublicToken({
    scopes: { read: { runs: [handle.id] } },
    expirationTime: "1h",
  });

  return Response.json(
    { runId: handle.id, publicToken },
    { status: 201 },
  );
}

async function readBody(request: Request): Promise<DesignRequestBody | null> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const prompt = readNonEmptyString(raw, "prompt");
  const roomId = readNonEmptyString(raw, "roomId");
  if (!prompt || !roomId) return null;

  return { prompt, roomId };
}

function readNonEmptyString(body: object, key: string): string | null {
  const value = (body as Record<string, unknown>)[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
