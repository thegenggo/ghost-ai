"use client";

import { useId, useMemo, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditorDialog } from "@/components/editor/editor-dialog";
import { slugify } from "@/lib/slugify";

interface CreateProjectDialogProps {
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void | Promise<void>;
}

export function CreateProjectDialog({
  isLoading,
  onClose,
  onSubmit,
}: CreateProjectDialogProps) {
  const nameId = useId();
  const slugId = useId();
  const [name, setName] = useState("");

  const slugPreview = useMemo(() => slugify(name), [name]);
  const trimmedName = name.trim();
  const canSubmit =
    trimmedName.length > 0 && slugPreview.length > 0 && !isLoading;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    void onSubmit(trimmedName);
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
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Realtime Chat Platform"
            autoFocus
            autoComplete="off"
            className="text-copy-primary"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            htmlFor={slugId}
            className="text-xs font-medium text-copy-secondary"
          >
            Slug preview
          </label>
          <div
            id={slugId}
            aria-live="polite"
            className="rounded-lg border border-surface-border bg-base px-2.5 py-1.5 font-mono text-sm text-copy-secondary"
          >
            {slugPreview || (
              <span className="text-copy-faint">your-project-slug</span>
            )}
          </div>
        </div>
      </form>
    </EditorDialog>
  );
}
