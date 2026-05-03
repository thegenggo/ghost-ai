"use client";

import type { ReactNode } from "react";

import { FolderOpen, Plus, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject?: () => void;
}

export function ProjectSidebar({
  isOpen,
  onClose,
  onCreateProject,
}: ProjectSidebarProps) {
  return (
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

        <Tabs defaultValue="mine" className="flex flex-1 flex-col gap-0 px-3 pt-3">
          <TabsList className="w-full">
            <TabsTrigger value="mine" className="flex-1">
              My Projects
            </TabsTrigger>
            <TabsTrigger value="shared" className="flex-1">
              Shared
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mine" className="mt-3 flex-1">
            <EmptyState
              icon={<FolderOpen className="h-8 w-8 text-copy-faint" />}
              title="No projects yet"
              description="Create your first project to get started."
            />
          </TabsContent>

          <TabsContent value="shared" className="mt-3 flex-1">
            <EmptyState
              icon={<Users className="h-8 w-8 text-copy-faint" />}
              title="Nothing shared with you"
              description="Projects shared by collaborators will appear here."
            />
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
