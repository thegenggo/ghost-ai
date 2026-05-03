import { redirect } from "next/navigation";

import { AccessDenied } from "@/components/editor/access-denied";
import { EditorShell } from "@/components/editor/editor-shell";
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

  return (
    <EditorShell
      ownedProjects={owned}
      sharedProjects={shared}
      currentProject={{ id: access.id, name: access.name }}
    >
      <div className="flex flex-1 items-center justify-center bg-base px-6 text-center">
        <p className="text-sm text-copy-muted">
          Canvas for{" "}
          <span className="font-mono text-copy-secondary">{access.id}</span> —
          coming soon
        </p>
      </div>
    </EditorShell>
  );
}
