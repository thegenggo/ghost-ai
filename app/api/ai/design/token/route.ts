import { auth as triggerAuth } from "@trigger.dev/sdk";

import { prisma } from "@/lib/prisma";
import { getCurrentIdentity } from "@/lib/project-access";

export async function POST(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const runId = await readRunId(request);
  if (!runId) {
    return Response.json({ error: "runId is required" }, { status: 400 });
  }

  const taskRun = await prisma.taskRun.findUnique({ where: { runId } });
  if (!taskRun) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (taskRun.userId !== identity.userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const token = await triggerAuth.createPublicToken({
    scopes: { read: { runs: [runId] } },
    expirationTime: "1h",
  });

  return Response.json({ token });
}

async function readRunId(request: Request): Promise<string | null> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const value = (raw as Record<string, unknown>).runId;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
