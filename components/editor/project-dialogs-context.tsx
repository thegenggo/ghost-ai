"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { ProjectListItem } from "@/lib/projects";

interface ProjectDialogsContextValue {
  openCreate: () => void;
  openRename: (project: ProjectListItem) => void;
  openDelete: (project: ProjectListItem) => void;
}

const ProjectDialogsContext = createContext<ProjectDialogsContextValue | null>(
  null
);

interface ProjectDialogsProviderProps {
  value: ProjectDialogsContextValue;
  children: ReactNode;
}

export function ProjectDialogsProvider({
  value,
  children,
}: ProjectDialogsProviderProps) {
  return (
    <ProjectDialogsContext.Provider value={value}>
      {children}
    </ProjectDialogsContext.Provider>
  );
}

export function useProjectDialogsContext(): ProjectDialogsContextValue {
  const ctx = useContext(ProjectDialogsContext);
  if (!ctx) {
    throw new Error(
      "useProjectDialogsContext must be used inside a ProjectDialogsProvider"
    );
  }
  return ctx;
}
