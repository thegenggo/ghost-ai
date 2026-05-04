"use client";

import {
  LayoutTemplate,
  PanelLeftClose,
  PanelLeftOpen,
  Share2,
  Sparkles,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  currentProjectName?: string;
  onOpenShare?: () => void;
  onOpenStarterTemplates?: () => void;
  isAiOpen?: boolean;
  onToggleAi?: () => void;
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  currentProjectName,
  onOpenShare,
  onOpenStarterTemplates,
  isAiOpen = false,
  onToggleAi,
}: EditorNavbarProps) {
  const ToggleIcon = isSidebarOpen ? PanelLeftClose : PanelLeftOpen;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-surface-border bg-base px-3">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-pressed={isSidebarOpen}
        >
          <ToggleIcon className="h-4 w-4 text-copy-secondary" />
        </Button>
        {currentProjectName ? (
          <h1 className="truncate font-heading text-sm font-medium text-copy-primary">
            {currentProjectName}
          </h1>
        ) : null}
      </div>
      <div className="flex flex-1 items-center justify-center" />
      <div className="flex items-center gap-2">
        {onOpenStarterTemplates ? (
          <Button
            variant="outline"
            size="sm"
            aria-label="Browse starter templates"
            onClick={onOpenStarterTemplates}
          >
            <LayoutTemplate className="h-4 w-4" />
            Templates
          </Button>
        ) : null}
        {onOpenShare ? (
          <Button
            variant="outline"
            size="sm"
            aria-label="Share project"
            onClick={onOpenShare}
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        ) : null}
        {onToggleAi ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleAi}
            aria-label={isAiOpen ? "Close AI assistant" : "Open AI assistant"}
            aria-pressed={isAiOpen}
          >
            <Sparkles className="h-4 w-4 text-ai-text" />
          </Button>
        ) : null}
        <UserButton />
      </div>
    </header>
  );
}
