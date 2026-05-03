"use client";

import { useCallback, useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditorDialog } from "@/components/editor/editor-dialog";
import type { MockProject } from "@/lib/mock-projects";

interface RenameProjectDialogProps {
  isLoading: boolean;
  project: MockProject;
  onClose: () => void;
  onSubmit: (name: string) => void | Promise<void>;
}

export function RenameProjectDialog({
  isLoading,
  project,
  onClose,
  onSubmit,
}: RenameProjectDialogProps) {
  const nameId = useId();
  const [name, setName] = useState(project.name);

  const focusAndSelect = useCallback((node: HTMLInputElement | null) => {
    if (node) {
      node.focus();
      node.select();
    }
  }, []);

  const trimmed = name.trim();
  const canSubmit =
    trimmed.length > 0 && trimmed !== project.name && !isLoading;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    void onSubmit(trimmed);
  }

  return (
    <EditorDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Rename project"
      description={`Currently named "${project.name}".`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="rename-project-form"
            disabled={!canSubmit}
          >
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </>
      }
    >
      <form
        id="rename-project-form"
        className="flex flex-col gap-4"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-2">
          <label
            htmlFor={nameId}
            className="text-xs font-medium text-copy-secondary"
          >
            Project name
          </label>
          <Input
            id={nameId}
            ref={focusAndSelect}
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="off"
            className="text-copy-primary"
          />
        </div>
      </form>
    </EditorDialog>
  );
}
