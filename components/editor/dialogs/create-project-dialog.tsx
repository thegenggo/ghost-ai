"use client";

import { useId, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditorDialog } from "@/components/editor/editor-dialog";

interface CreateProjectDialogProps {
  name: string;
  roomId: string;
  isLoading: boolean;
  onNameChange: (name: string) => void;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
}

export function CreateProjectDialog({
  name,
  roomId,
  isLoading,
  onNameChange,
  onClose,
  onSubmit,
}: CreateProjectDialogProps) {
  const nameId = useId();
  const roomIdId = useId();

  const trimmedName = name.trim();
  const canSubmit =
    trimmedName.length > 0 && roomId.length > 0 && !isLoading;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    void onSubmit();
  }

  return (
    <EditorDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Create project"
      description="Name your new architecture workspace."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-project-form"
            disabled={!canSubmit}
          >
            {isLoading ? "Creating..." : "Create project"}
          </Button>
        </>
      }
    >
      <form
        id="create-project-form"
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
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="e.g. Realtime Chat Platform"
            autoFocus
            autoComplete="off"
            className="text-copy-primary"
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-copy-secondary">
            Room ID preview
          </span>
          <div
            id={roomIdId}
            aria-live="polite"
            className="rounded-lg border border-surface-border bg-base px-2.5 py-1.5 font-mono text-sm text-copy-secondary"
          >
            {roomId || (
              <span className="text-copy-faint">your-project-room-id</span>
            )}
          </div>
        </div>
      </form>
    </EditorDialog>
  );
}
