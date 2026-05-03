"use client";

import { Button } from "@/components/ui/button";
import { EditorDialog } from "@/components/editor/editor-dialog";
import type { MockProject } from "@/lib/mock-projects";

interface DeleteProjectDialogProps {
  isLoading: boolean;
  project: MockProject;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export function DeleteProjectDialog({
  isLoading,
  project,
  onClose,
  onConfirm,
}: DeleteProjectDialogProps) {
  return (
    <EditorDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Delete project"
      description={`"${project.name}" will be permanently removed. This cannot be undone.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => void onConfirm()}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete project"}
          </Button>
        </>
      }
    />
  );
}
