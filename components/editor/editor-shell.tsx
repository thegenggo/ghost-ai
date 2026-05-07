"use client";

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";

import { AiSidebar } from "@/components/editor/ai-sidebar";
import { CanvasSaveProvider } from "@/components/editor/canvas-save-context";
import { CanvasTemplatesProvider } from "@/components/editor/canvas-templates-context";
import { CreateProjectDialog } from "@/components/editor/dialogs/create-project-dialog";
import { DeleteProjectDialog } from "@/components/editor/dialogs/delete-project-dialog";
import { RenameProjectDialog } from "@/components/editor/dialogs/rename-project-dialog";
import { ShareDialog } from "@/components/editor/dialogs/share-dialog";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectDialogsProvider } from "@/components/editor/project-dialogs-context";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave";
import { useProjectActions } from "@/hooks/use-project-actions";
import type { ProjectListItem, ProjectOwnership } from "@/lib/projects";

export interface EditorShellCurrentProject {
  id: string;
  name: string;
  ownership: ProjectOwnership;
}

interface EditorShellProps {
  ownedProjects: ProjectListItem[];
  sharedProjects: ProjectListItem[];
  currentProject?: EditorShellCurrentProject;
  children: ReactNode;
}

export function EditorShell({
  ownedProjects,
  sharedProjects,
  currentProject,
  children,
}: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isStarterTemplatesOpen, setIsStarterTemplatesOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<CanvasSaveStatus>("idle");
  const saveNowRef = useRef<(() => void) | null>(null);
  const actions = useProjectActions();

  const contextValue = useMemo(
    () => ({
      openCreate: actions.openCreate,
      openRename: actions.openRename,
      openDelete: actions.openDelete,
    }),
    [actions.openCreate, actions.openRename, actions.openDelete]
  );

  const closeStarterTemplates = useCallback(
    () => setIsStarterTemplatesOpen(false),
    []
  );

  const templatesContextValue = useMemo(
    () => ({
      isOpen: isStarterTemplatesOpen,
      close: closeStarterTemplates,
    }),
    [isStarterTemplatesOpen, closeStarterTemplates]
  );

  const reportSaveStatus = useCallback((status: CanvasSaveStatus) => {
    setSaveStatus(status);
  }, []);

  const registerSaveNow = useCallback((saveNow: (() => void) | null) => {
    saveNowRef.current = saveNow;
  }, []);

  const saveContextValue = useMemo(
    () => ({
      reportStatus: reportSaveStatus,
      registerSaveNow,
    }),
    [reportSaveStatus, registerSaveNow]
  );

  const handleSaveNow = useCallback(() => {
    saveNowRef.current?.();
  }, []);

  const hasCurrentProject = Boolean(currentProject);

  return (
    <ProjectDialogsProvider value={contextValue}>
      <CanvasTemplatesProvider value={templatesContextValue}>
        <CanvasSaveProvider value={saveContextValue}>
          <div className="flex h-screen flex-col bg-base">
            <EditorNavbar
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
              currentProjectName={currentProject?.name}
              onOpenShare={
                hasCurrentProject ? () => setIsShareOpen(true) : undefined
              }
              onOpenStarterTemplates={
                hasCurrentProject
                  ? () => setIsStarterTemplatesOpen(true)
                  : undefined
              }
              isAiOpen={isAiOpen}
              onToggleAi={
                hasCurrentProject
                  ? () => setIsAiOpen((open) => !open)
                  : undefined
              }
              hideUserButton={hasCurrentProject}
              saveStatus={hasCurrentProject ? saveStatus : undefined}
              onSaveNow={hasCurrentProject ? handleSaveNow : undefined}
            />
            <ProjectSidebar
              isOpen={isSidebarOpen}
              ownedProjects={ownedProjects}
              sharedProjects={sharedProjects}
              currentProjectId={currentProject?.id}
              onClose={() => setIsSidebarOpen(false)}
              onCreateProject={actions.openCreate}
              onRenameProject={actions.openRename}
              onDeleteProject={actions.openDelete}
            />
            <main className="flex flex-1 flex-col">{children}</main>
            {hasCurrentProject ? (
              <AiSidebar isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
            ) : null}
          </div>
        </CanvasSaveProvider>
      </CanvasTemplatesProvider>

      {actions.dialog === "create" ? (
        <CreateProjectDialog
          name={actions.createName}
          roomId={actions.createRoomId}
          isLoading={actions.isLoading}
          onNameChange={actions.setCreateName}
          onClose={actions.close}
          onSubmit={actions.submitCreate}
        />
      ) : null}
      {actions.dialog === "rename" && actions.renameTarget ? (
        <RenameProjectDialog
          project={actions.renameTarget}
          name={actions.renameName}
          isLoading={actions.isLoading}
          onNameChange={actions.setRenameName}
          onClose={actions.close}
          onSubmit={actions.submitRename}
        />
      ) : null}
      {actions.dialog === "delete" && actions.deleteTarget ? (
        <DeleteProjectDialog
          project={actions.deleteTarget}
          isLoading={actions.isLoading}
          onClose={actions.close}
          onConfirm={actions.submitDelete}
        />
      ) : null}
      {isShareOpen && currentProject ? (
        <ShareDialog
          projectId={currentProject.id}
          projectName={currentProject.name}
          isOwner={currentProject.ownership === "owned"}
          onClose={() => setIsShareOpen(false)}
        />
      ) : null}
    </ProjectDialogsProvider>
  );
}
