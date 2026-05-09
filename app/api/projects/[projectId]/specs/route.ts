import { prisma } from "@/lib/prisma";
import { checkProjectAccess, getCurrentIdentity } from "@/lib/project-access";

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const access = await checkProjectAccess(projectId, identity);
  if (!access) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const specs = await prisma.projectSpec.findMany({
    where: { projectId: access.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true },
  });

  return Response.json({
    specs: specs.map((spec) => ({
      id: spec.id,
      filename: `spec-${spec.id}.md`,
      createdAt: spec.createdAt.toISOString(),
    })),
  });
}
