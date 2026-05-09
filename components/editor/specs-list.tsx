"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Download, FileText, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SpecListItem {
  id: string;
  filename: string;
  createdAt: string;
}

interface SpecsListProps {
  projectId: string;
}

export function SpecsList({ projectId }: SpecsListProps) {
  const [specs, setSpecs] = useState<SpecListItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeSpec, setActiveSpec] = useState<SpecListItem | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/projects/${projectId}/specs`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Could not load specs.");
        }
        return (await response.json()) as { specs: SpecListItem[] };
      })
      .then((data) => setSpecs(data.specs))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setLoadError("Could not load specs.");
      });

    return () => controller.abort();
  }, [projectId]);

  const downloadUrl = useCallback(
    (specId: string) =>
      `/api/projects/${projectId}/specs/${specId}/download`,
    [projectId],
  );

  if (loadError) {
    return (
      <p
        role="alert"
        className="flex items-center gap-1.5 text-xs text-error"
      >
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        {loadError}
      </p>
    );
  }

  if (specs === null) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-copy-muted">
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
        Loading specs...
      </p>
    );
  }

  if (specs.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-2 py-6 text-center">
        <span
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-subtle text-copy-secondary"
        >
          <FileText className="h-6 w-6" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-copy-primary">No specs yet</p>
          <p className="text-xs text-copy-muted">
            Generate a spec from the canvas to see it here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {specs.map((spec) => (
          <SpecListItemRow
            key={spec.id}
            spec={spec}
            downloadHref={downloadUrl(spec.id)}
            onSelect={() => setActiveSpec(spec)}
          />
        ))}
      </ul>
      {activeSpec ? (
        <SpecPreviewDialog
          spec={activeSpec}
          downloadHref={downloadUrl(activeSpec.id)}
          onClose={() => setActiveSpec(null)}
        />
      ) : null}
    </>
  );
}

interface SpecListItemRowProps {
  spec: SpecListItem;
  downloadHref: string;
  onSelect: () => void;
}

function SpecListItemRow({
  spec,
  downloadHref,
  onSelect,
}: SpecListItemRowProps) {
  return (
    <li>
      <div className="flex items-center gap-2 rounded-xl border border-surface-border bg-elevated px-3 py-2 transition-colors hover:bg-subtle">
        <button
          type="button"
          onClick={onSelect}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-dim text-brand"
          >
            <FileText className="h-4 w-4" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-copy-primary">
              {spec.filename}
            </span>
            <span className="text-[11px] text-copy-faint">
              {formatTimestamp(spec.createdAt)}
            </span>
          </span>
        </button>
        <a
          href={downloadHref}
          download={spec.filename}
          aria-label={`Download ${spec.filename}`}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-copy-secondary transition-colors hover:bg-base/40 hover:text-copy-primary"
        >
          <Download className="h-4 w-4" />
        </a>
      </div>
    </li>
  );
}

interface SpecPreviewDialogProps {
  spec: SpecListItem;
  downloadHref: string;
  onClose: () => void;
}

function SpecPreviewDialog({
  spec,
  downloadHref,
  onClose,
}: SpecPreviewDialogProps) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(downloadHref, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Could not load spec.");
        }
        return await response.text();
      })
      .then((text) => setContent(text))
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }
        setError("Could not load spec.");
      });

    return () => controller.abort();
  }, [downloadHref]);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        showCloseButton
        className="grid w-full max-w-3xl grid-rows-[auto_minmax(0,1fr)_auto] max-h-[80vh] gap-4 overflow-hidden rounded-3xl border border-surface-border bg-elevated p-6 text-copy-primary shadow-2xl sm:max-w-3xl"
      >
        <DialogHeader>
          <DialogTitle className="text-copy-primary">
            {spec.filename}
          </DialogTitle>
          <DialogDescription className="text-copy-muted">
            Generated {formatTimestamp(spec.createdAt)}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-full w-full min-w-0 rounded-2xl border border-surface-border bg-base/40 [&>[data-slot=scroll-area-viewport]]:max-h-full">
          <div className="min-w-0 px-5 py-4">
            {error ? (
              <p
                role="alert"
                className="flex items-center gap-1.5 text-xs text-error"
              >
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </p>
            ) : content === null ? (
              <p className="flex items-center gap-1.5 text-xs text-copy-muted">
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                Loading spec...
              </p>
            ) : (
              <SpecMarkdown content={content} />
            )}
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <a
            href={downloadHref}
            download={spec.filename}
            className={cn(buttonVariants({ size: "sm" }))}
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SpecMarkdown({ content }: { content: string }) {
  return (
    <div className="prose-spec min-w-0 text-sm text-copy-primary wrap-anywhere">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="mt-0 mb-3 text-lg font-semibold text-copy-primary">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-5 mb-2 text-base font-semibold text-copy-primary">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-4 mb-1.5 text-sm font-semibold text-copy-primary">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="my-2 text-sm leading-relaxed text-copy-secondary">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="my-2 ml-5 list-disc text-sm text-copy-secondary">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 ml-5 list-decimal text-sm text-copy-secondary">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="my-1 leading-relaxed">{children}</li>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-brand underline underline-offset-2"
            >
              {children}
            </a>
          ),
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <code className="block rounded-lg border border-surface-border bg-subtle px-3 py-2 font-mono text-xs text-copy-primary">
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded bg-subtle px-1 py-0.5 font-mono text-xs break-all text-copy-primary">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="my-3 max-w-full overflow-x-auto rounded-lg border border-surface-border bg-subtle p-3 font-mono text-xs whitespace-pre text-copy-primary">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-2 border-surface-border pl-3 text-copy-muted italic">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-4 border-surface-border" />,
          strong: ({ children }) => (
            <strong className="font-semibold text-copy-primary">
              {children}
            </strong>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
