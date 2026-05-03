"use client";

import {
  useCallback,
  useEffect,
  useId,
  useState,
  type FormEvent,
} from "react";
import { Check, Copy, Link as LinkIcon, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditorDialog } from "@/components/editor/editor-dialog";

interface Collaborator {
  id: string;
  email: string;
  displayName: string | null;
  imageUrl: string | null;
}

interface ShareDialogProps {
  projectId: string;
  projectName: string;
  isOwner: boolean;
  onClose: () => void;
}

export function ShareDialog({
  projectId,
  projectName,
  isOwner,
  onClose,
}: ShareDialogProps) {
  const inviteId = useId();

  const [collaborators, setCollaborators] = useState<Collaborator[] | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  const [removingId, setRemovingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/projects/${projectId}/collaborators`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Could not load collaborators.");
        }
        return (await response.json()) as { collaborators: Collaborator[] };
      })
      .then((data) => setCollaborators(data.collaborators))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setLoadError("Could not load collaborators.");
      });

    return () => controller.abort();
  }, [projectId]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleInvite = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = email.trim();
      if (!trimmed || inviting) return;

      setInviting(true);
      setInviteError(null);
      try {
        const response = await fetch(
          `/api/projects/${projectId}/collaborators`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: trimmed }),
          },
        );
        if (!response.ok) {
          const payload = await safeJson(response);
          setInviteError(payload?.error ?? "Could not invite collaborator.");
          return;
        }
        const { collaborator } = (await response.json()) as {
          collaborator: Collaborator;
        };
        setCollaborators((prev) =>
          prev ? [...prev, collaborator] : [collaborator],
        );
        setEmail("");
      } catch {
        setInviteError("Could not invite collaborator.");
      } finally {
        setInviting(false);
      }
    },
    [email, inviting, projectId],
  );

  const handleRemove = useCallback(
    async (collaborator: Collaborator) => {
      setRemovingId(collaborator.id);
      try {
        const response = await fetch(
          `/api/projects/${projectId}/collaborators/${collaborator.id}`,
          { method: "DELETE" },
        );
        if (!response.ok) return;
        setCollaborators(
          (prev) => prev?.filter((entry) => entry.id !== collaborator.id) ?? null,
        );
      } finally {
        setRemovingId(null);
      }
    },
    [projectId],
  );

  const handleCopyLink = useCallback(async () => {
    const url = `${window.location.origin}/editor/${projectId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }, [projectId]);

  return (
    <EditorDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Share project"
      description={
        isOwner
          ? `Invite collaborators to "${projectName}".`
          : `Collaborators on "${projectName}".`
      }
    >
      <div className="flex flex-col gap-5">
        {isOwner ? (
          <form onSubmit={handleInvite} className="flex flex-col gap-2">
            <label
              htmlFor={inviteId}
              className="text-xs font-medium text-copy-secondary"
            >
              Invite by email
            </label>
            <div className="flex items-center gap-2">
              <Input
                id={inviteId}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="teammate@example.com"
                autoComplete="off"
                disabled={inviting}
                className="text-copy-primary"
              />
              <Button
                type="submit"
                disabled={inviting || email.trim().length === 0}
              >
                {inviting ? "Inviting..." : "Invite"}
              </Button>
            </div>
            {inviteError ? (
              <p role="alert" className="text-xs text-error">
                {inviteError}
              </p>
            ) : null}
          </form>
        ) : null}

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-copy-secondary">
            Collaborators
          </span>
          <CollaboratorList
            collaborators={collaborators}
            error={loadError}
            isOwner={isOwner}
            removingId={removingId}
            onRemove={handleRemove}
          />
        </div>

        {isOwner ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-surface-border bg-base/40 px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <LinkIcon className="h-4 w-4 shrink-0 text-copy-muted" />
              <span className="truncate font-mono text-xs text-copy-secondary">
                {`/editor/${projectId}`}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              {copied ? (
                <Check className="h-3.5 w-3.5 text-success" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied!" : "Copy link"}
            </Button>
          </div>
        ) : null}
      </div>
    </EditorDialog>
  );
}

interface CollaboratorListProps {
  collaborators: Collaborator[] | null;
  error: string | null;
  isOwner: boolean;
  removingId: string | null;
  onRemove: (collaborator: Collaborator) => void;
}

function CollaboratorList({
  collaborators,
  error,
  isOwner,
  removingId,
  onRemove,
}: CollaboratorListProps) {
  if (error) {
    return (
      <p role="alert" className="text-xs text-error">
        {error}
      </p>
    );
  }
  if (collaborators === null) {
    return <p className="text-xs text-copy-muted">Loading collaborators...</p>;
  }
  if (collaborators.length === 0) {
    return (
      <p className="text-xs text-copy-muted">
        {isOwner
          ? "No collaborators yet. Invite someone to get started."
          : "Just you for now."}
      </p>
    );
  }

  return (
    <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto pr-1">
      {collaborators.map((collaborator) => (
        <li
          key={collaborator.id}
          className="flex items-center gap-3 rounded-lg border border-surface-border bg-surface/40 px-3 py-2"
        >
          <CollaboratorAvatar collaborator={collaborator} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm text-copy-primary">
              {collaborator.displayName ?? collaborator.email}
            </span>
            {collaborator.displayName ? (
              <span className="truncate text-xs text-copy-muted">
                {collaborator.email}
              </span>
            ) : null}
          </div>
          {isOwner ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove ${collaborator.email}`}
              onClick={() => onRemove(collaborator)}
              disabled={removingId === collaborator.id}
            >
              <Trash2 className="h-4 w-4 text-copy-secondary" />
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function CollaboratorAvatar({ collaborator }: { collaborator: Collaborator }) {
  if (collaborator.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={collaborator.imageUrl}
        alt=""
        className="h-8 w-8 rounded-full border border-surface-border object-cover"
      />
    );
  }
  const source = collaborator.displayName ?? collaborator.email;
  const initial = source.charAt(0).toUpperCase() || "?";
  return (
    <div
      aria-hidden="true"
      className="flex h-8 w-8 items-center justify-center rounded-full bg-subtle text-xs font-medium text-copy-secondary"
    >
      {initial}
    </div>
  );
}

async function safeJson(
  response: Response,
): Promise<{ error?: string } | null> {
  try {
    return (await response.json()) as { error?: string };
  } catch {
    return null;
  }
}
