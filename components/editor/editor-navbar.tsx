"use client";

import {
  AlertCircle,
  Check,
  LayoutTemplate,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Save,
  Share2,
  Sparkles,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  currentProjectName?: string;
  onOpenShare?: () => void;
  onOpenStarterTemplates?: () => void;
  isAiOpen?: boolean;
  onToggleAi?: () => void;
  hideUserButton?: boolean;
  saveStatus?: CanvasSaveStatus;
  onSaveNow?: () => void;
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  currentProjectName,
  onOpenShare,
  onOpenStarterTemplates,
  isAiOpen = false,
  onToggleAi,
  hideUserButton = false,
  saveStatus,
  onSaveNow,
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
        {onSaveNow ? (
          <SaveButton status={saveStatus ?? "idle"} onClick={onSaveNow} />
        ) : null}
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
        {hideUserButton ? null : <UserButton />}
      </div>
    </header>
  );
}

function SaveButton({
  status,
  onClick,
}: {
  status: CanvasSaveStatus;
  onClick: () => void;
}) {
  const { Icon, label, tone, spin } = describeSaveStatus(status);
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      aria-label={`Save canvas — ${label}`}
      title={label}
      className={tone}
    >
      <Icon className={`h-4 w-4 ${spin ? "animate-spin" : ""}`} />
      {label}
    </Button>
  );
}

function describeSaveStatus(status: CanvasSaveStatus): {
  Icon: typeof Save;
  label: string;
  tone: string;
  spin: boolean;
} {
  switch (status) {
    case "saving":
      return {
        Icon: Loader2,
        label: "Saving…",
        tone: "text-copy-muted",
        spin: true,
      };
    case "saved":
      return {
        Icon: Check,
        label: "Saved",
        tone: "text-success",
        spin: false,
      };
    case "error":
      return {
        Icon: AlertCircle,
        label: "Save failed",
        tone: "text-error",
        spin: false,
      };
    case "idle":
    default:
      return {
        Icon: Save,
        label: "Save",
        tone: "text-copy-secondary",
        spin: false,
      };
  }
}
