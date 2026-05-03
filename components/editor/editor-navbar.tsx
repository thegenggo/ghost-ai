"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

/**
 * Renders the editor's top navigation bar with a sidebar toggle and user button.
 *
 * @param isSidebarOpen - Whether the left sidebar is currently open
 * @param onToggleSidebar - Callback invoked when the sidebar toggle button is clicked
 * @returns The header element containing the sidebar toggle, centered spacer, and user button
 */
export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
}: EditorNavbarProps) {
  const ToggleIcon = isSidebarOpen ? PanelLeftClose : PanelLeftOpen;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-surface-border bg-base px-3">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-pressed={isSidebarOpen}
        >
          <ToggleIcon className="h-4 w-4 text-copy-secondary" />
        </Button>
      </div>
      <div className="flex flex-1 items-center justify-center" />
      <div className="flex items-center gap-2">
        <UserButton />
      </div>
    </header>
  );
}
