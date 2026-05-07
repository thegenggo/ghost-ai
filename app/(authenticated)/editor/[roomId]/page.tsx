import { redirect } from "next/navigation";

import { AccessDenied } from "@/components/editor/access-denied";
import { Canvas } from "@/components/editor/canvas/canvas";
import { EditorShell } from "@/components/editor/editor-shell";
import { getSavedCanvas } from "@/lib/canvas-storage";
import { checkProjectAccess, getCurrentIdentity } from "@/lib/project-access";
import { getUserProjects } from "@/lib/projects";

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default async function ProjectWorkspacePage({ params }: PageProps) {
  const { roomId } = await params;

  const identity = await getCurrentIdentity();
  if (!identity) {
    redirect("/sign-in");
  }

  const [access, { owned, shared }] = await Promise.all([
    checkProjectAccess(roomId, identity),
    getUserProjects(),
  ]);

  if (!access) {
    return (
      <EditorShell ownedProjects={owned} sharedProjects={shared}>
        <AccessDenied />
      </EditorShell>
    );
  }

  const savedCanvas = await getSavedCanvas(access.id);

  return (
    <EditorShell
      ownedProjects={owned}
      sharedProjects={shared}
      currentProject={{
        id: access.id,
        name: access.name,
        ownership: access.ownership,
      }}
    >
      <Canvas roomId={access.id} savedCanvas={savedCanvas} />
    </EditorShell>
  );
}
