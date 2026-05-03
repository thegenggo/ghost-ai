"use client";

import type { ReactNode } from "react";

import {
  FolderOpen,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { ProjectListItem } from "@/lib/projects";

interface ProjectSidebarProps {
  isOpen: boolean;
  ownedProjects: ProjectListItem[];
  sharedProjects: ProjectListItem[];
  onClose: () => void;
  onCreateProject: () => void;
  onRenameProject: (project: ProjectListItem) => void;
  onDeleteProject: (project: ProjectListItem) => void;
}

export function ProjectSidebar({
  isOpen,
  ownedProjects,
  sharedProjects,
  onClose,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
}: ProjectSidebarProps) {
  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 md:hidden",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <aside
        aria-label="Projects"
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={cn(
          "pointer-events-none fixed top-16 bottom-4 left-3 z-40 w-72 rounded-2xl border border-surface-border bg-surface/95 shadow-2xl backdrop-blur-md transition-all duration-200 ease-out",
          isOpen
            ? "pointer-events-auto translate-x-0 opacity-100"
            : "-translate-x-4 opacity-0"
        )}
      >
        <div className="flex h-full flex-col">
          <header className="flex items-center justify-between border-b border-surface-border px-4 py-3">
            <h2 className="font-heading text-sm font-medium text-copy-primary">
              Projects
            </h2>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label="Close projects sidebar"
            >
              <X className="h-4 w-4 text-copy-secondary" />
            </Button>
          </header>

          <Tabs
            defaultValue="mine"
            className="flex flex-1 flex-col gap-0 px-3 pt-3"
          >
            <TabsList className="w-full">
              <TabsTrigger value="mine" className="flex-1">
                My Projects
              </TabsTrigger>
              <TabsTrigger value="shared" className="flex-1">
                Shared
              </TabsTrigger>
            </TabsList>

            <TabsContent value="mine" className="mt-3 flex-1 min-h-0 overflow-y-auto">
              {ownedProjects.length === 0 ? (
                <EmptyState
                  icon={<FolderOpen className="h-8 w-8 text-copy-faint" />}
                  title="No projects yet"
                  description="Create your first project to get started."
                />
              ) : (
                <ProjectList
                  projects={ownedProjects}
                  showActions
                  onRename={onRenameProject}
                  onDelete={onDeleteProject}
                />
              )}
            </TabsContent>

            <TabsContent value="shared" className="mt-3 flex-1 min-h-0 overflow-y-auto">
              {sharedProjects.length === 0 ? (
                <EmptyState
                  icon={<Users className="h-8 w-8 text-copy-faint" />}
                  title="Nothing shared with you"
                  description="Projects shared by collaborators will appear here."
                />
              ) : (
                <ProjectList projects={sharedProjects} />
              )}
            </TabsContent>
          </Tabs>

          <div className="border-t border-surface-border p-3">
            <Button
              variant="default"
              size="default"
              className="w-full"
              onClick={onCreateProject}
            >
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}

interface ProjectListProps {
  projects: ProjectListItem[];
  showActions?: boolean;
  onRename?: (project: ProjectListItem) => void;
  onDelete?: (project: ProjectListItem) => void;
}

function ProjectList({
  projects,
  showActions = false,
  onRename,
  onDelete,
}: ProjectListProps) {
  return (
    <ul className="flex flex-col gap-1">
      {projects.map((project) => (
        <li key={project.id}>
          <div className="group flex items-center gap-1 rounded-xl px-2 py-1.5 hover:bg-subtle">
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm text-copy-primary">
                {project.name}
              </span>
              <span className="truncate font-mono text-xs text-copy-faint">
                {project.id}
              </span>
            </div>
            {showActions && onRename && onDelete ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Actions for ${project.name}`}
                      className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100"
                    />
                  }
                >
                  <MoreHorizontal className="h-3.5 w-3.5 text-copy-secondary" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-36">
                  <DropdownMenuItem onClick={() => onRename(project)}>
                    <Pencil className="h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDelete(project)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
}

function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      {icon}
      <p className="text-sm font-medium text-copy-secondary">{title}</p>
      <p className="text-xs text-copy-muted">{description}</p>
    </div>
  );
}
