"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface EditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  footer?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export function EditorDialog({
  open,
  onOpenChange,
  title,
  description,
  footer,
  className,
  children,
}: EditorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "rounded-3xl border border-surface-border bg-elevated p-6 text-copy-primary shadow-2xl",
          className
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-copy-primary">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="text-copy-muted">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        {children ? (
          <div className="text-sm text-copy-secondary">{children}</div>
        ) : null}

        {footer ? (
          <DialogFooter className="-mx-6 -mb-6 mt-2 rounded-b-3xl border-t border-surface-border bg-surface/40 px-6 py-4">
            {footer}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
