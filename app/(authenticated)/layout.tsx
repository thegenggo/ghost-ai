import type { ReactNode } from "react";

import { EditorShell } from "@/components/editor/editor-shell";
import { getUserProjects } from "@/lib/projects";

export default async function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { owned, shared } = await getUserProjects();

  return (
    <EditorShell ownedProjects={owned} sharedProjects={shared}>
      {children}
    </EditorShell>
  );
}
