import { get } from "@vercel/blob";

import { prisma } from "@/lib/prisma";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

export interface SavedCanvas {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export async function getSavedCanvas(
  projectId: string,
): Promise<SavedCanvas | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { canvasJsonPath: true },
  });

  if (!project?.canvasJsonPath) return null;

  try {
    const result = await get(project.canvasJsonPath, {
      access: "private",
      useCache: false,
    });
    if (!result || result.statusCode !== 200) return null;
    const data = (await new Response(result.stream).json()) as unknown;
    return parseCanvas(data);
  } catch {
    return null;
  }
}

function parseCanvas(data: unknown): SavedCanvas | null {
  if (!data || typeof data !== "object") return null;
  const candidate = data as { nodes?: unknown; edges?: unknown };
  const nodes = Array.isArray(candidate.nodes)
    ? (candidate.nodes as CanvasNode[])
    : [];
  const edges = Array.isArray(candidate.edges)
    ? (candidate.edges as CanvasEdge[])
    : [];
  return { nodes, edges };
}
