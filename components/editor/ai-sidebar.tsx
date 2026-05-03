"use client";

import { Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  return (
    <aside
      aria-label="AI assistant"
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={cn(
        "pointer-events-none fixed top-16 right-3 bottom-4 z-40 w-80 rounded-2xl border border-surface-border bg-surface/95 shadow-2xl backdrop-blur-md transition-all duration-200 ease-out",
        isOpen
          ? "pointer-events-auto translate-x-0 opacity-100"
          : "translate-x-4 opacity-0",
      )}
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-surface-border px-4 py-3">
          <h2 className="flex items-center gap-2 font-heading text-sm font-medium text-copy-primary">
            <Sparkles className="h-4 w-4 text-ai-text" />
            AI Assistant
          </h2>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close AI assistant"
          >
            <X className="h-4 w-4 text-copy-secondary" />
          </Button>
        </header>
        <div className="flex flex-1 items-center justify-center px-6 py-10 text-center">
          <p className="text-xs text-copy-muted">
            AI chat will live here.
          </p>
        </div>
      </div>
    </aside>
  );
}
