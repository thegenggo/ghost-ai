import { EditorHome } from "@/components/editor/editor-home";
import { EditorShell } from "@/components/editor/editor-shell";
import { getUserProjects } from "@/lib/projects";

export default async function EditorPage() {
  const { owned, shared } = await getUserProjects();

  return (
    <EditorShell ownedProjects={owned} sharedProjects={shared}>
      <EditorHome />
    </EditorShell>
  );
}
