"use client";

import { useState, type ReactNode } from "react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";

interface EditorShellProps {
  children: ReactNode;
}

/**
 * Top-level layout for the editor page that provides navigation, a project sidebar, and a main content area.
 *
 * Manages internal open/closed state for the project sidebar and wires that state to the navbar and sidebar controls.
 *
 * @param children - Content to render inside the editor's main area
 * @returns The editor shell as a React element
 */
export function EditorShell({ children }: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-base">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
      />
      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
