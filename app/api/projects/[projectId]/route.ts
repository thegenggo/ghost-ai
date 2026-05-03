import { auth } from "@clerk/nextjs/server";

import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = readNonEmptyString(body, "name");
  if (!name) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  try {
    const updated = await prisma.project.update({
      where: { id: projectId, ownerId: userId },
      data: { name },
    });
    return Response.json({ project: updated });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  try {
    await prisma.project.delete({ where: { id: projectId, ownerId: userId } });
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    throw error;
  }
}

function readNonEmptyString(body: unknown, key: string): string | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const value = (body as Record<string, unknown>)[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
