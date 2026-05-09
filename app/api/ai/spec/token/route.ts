import { auth as triggerAuth } from "@trigger.dev/sdk";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentIdentity } from "@/lib/project-access";

const requestSchema = z.object({
  runId: z.string().min(1),
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
    return Response.json({ error: "runId is required" }, { status: 400 });
  }
  const { runId } = parsed.data;

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
