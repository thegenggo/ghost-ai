"use client";

import { useMemo, useState, type ReactNode } from "react";

import { CreateProjectDialog } from "@/components/editor/dialogs/create-project-dialog";
import { DeleteProjectDialog } from "@/components/editor/dialogs/delete-project-dialog";
import { RenameProjectDialog } from "@/components/editor/dialogs/rename-project-dialog";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectDialogsProvider } from "@/components/editor/project-dialogs-context";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { useProjectDialogs } from "@/hooks/use-project-dialogs";
import { MOCK_PROJECTS } from "@/lib/mock-projects";

interface EditorShellProps {
  children: ReactNode;
}

export function EditorShell({ children }: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const dialogs = useProjectDialogs();

  const contextValue = useMemo(
    () => ({
      openCreate: dialogs.openCreate,
      openRename: dialogs.openRename,
      openDelete: dialogs.openDelete,
    }),
    [dialogs.openCreate, dialogs.openRename, dialogs.openDelete]
  );

  return (
    <ProjectDialogsProvider value={contextValue}>
      <div className="flex min-h-screen flex-col bg-base">
        <EditorNavbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        />
        <ProjectSidebar
          isOpen={isSidebarOpen}
          projects={MOCK_PROJECTS}
          onClose={() => setIsSidebarOpen(false)}
          onCreateProject={dialogs.openCreate}
          onRenameProject={dialogs.openRename}
          onDeleteProject={dialogs.openDelete}
        />
        <main className="flex flex-1 flex-col">{children}</main>
      </div>

      {dialogs.dialog === "create" ? (
        <CreateProjectDialog
          isLoading={dialogs.isLoading}
          onClose={dialogs.close}
          onSubmit={dialogs.submitCreate}
        />
      ) : null}
      {dialogs.dialog === "rename" && dialogs.target ? (
        <RenameProjectDialog
          isLoading={dialogs.isLoading}
          project={dialogs.target}
          onClose={dialogs.close}
          onSubmit={dialogs.submitRename}
        />
      ) : null}
      {dialogs.dialog === "delete" && dialogs.target ? (
        <DeleteProjectDialog
          isLoading={dialogs.isLoading}
          project={dialogs.target}
          onClose={dialogs.close}
          onConfirm={dialogs.submitDelete}
        />
      ) : null}
    </ProjectDialogsProvider>
  );
}
