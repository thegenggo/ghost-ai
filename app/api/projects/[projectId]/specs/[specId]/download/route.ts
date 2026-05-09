import { prisma } from "@/lib/prisma";
import { checkProjectAccess, getCurrentIdentity } from "@/lib/project-access";
import { fetchSpecMarkdown } from "@/lib/spec-storage";

interface RouteContext {
  params: Promise<{ projectId: string; specId: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, specId } = await params;

  const access = await checkProjectAccess(projectId, identity);
  if (!access) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const spec = await prisma.projectSpec.findFirst({
    where: { id: specId, projectId: access.id },
    select: { id: true, filePath: true },
  });
  if (!spec) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const markdown = await fetchSpecMarkdown(spec.filePath);
  if (markdown === null) {
    return Response.json(
      { error: "Spec file is unavailable" },
      { status: 502 },
    );
  }

  return new Response(markdown, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="spec-${spec.id}.md"`,
      "Cache-Control": "no-store",
    },
  });
}
