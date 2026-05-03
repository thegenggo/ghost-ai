"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useProjectDialogsContext } from "@/components/editor/project-dialogs-context";

export function EditorHome() {
  const { openCreate } = useProjectDialogsContext();

  if (!openCreate) {
    return null; // or show an error state
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-medium text-copy-primary">
          Create a project or open an existing one
        </h1>
        <p className="text-sm text-copy-muted">
          Start a new architecture workspace, or choose a project from the
          sidebar.
        </p>
      </div>
      <Button onClick={openCreate} size="lg">
        <Plus className="h-4 w-4" />
        New Project
      </Button>
    </div>
  );
}
