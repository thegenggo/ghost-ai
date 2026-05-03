"use client";

import { useCallback, useState } from "react";

import type { MockProject } from "@/lib/mock-projects";

type DialogKind = "create" | "rename" | "delete" | null;

interface ProjectDialogsState {
  dialog: DialogKind;
  target: MockProject | null;
  isLoading: boolean;
}

const INITIAL_STATE: ProjectDialogsState = {
  dialog: null,
  target: null,
  isLoading: false,
};

export interface UseProjectDialogs {
  dialog: DialogKind;
  target: MockProject | null;
  isLoading: boolean;
  openCreate: () => void;
  openRename: (project: MockProject) => void;
  openDelete: (project: MockProject) => void;
  close: () => void;
  submitCreate: (name: string) => Promise<void>;
  submitRename: (name: string) => Promise<void>;
  submitDelete: () => Promise<void>;
}

export function useProjectDialogs(): UseProjectDialogs {
  const [state, setState] = useState<ProjectDialogsState>(INITIAL_STATE);

  const openCreate = useCallback(() => {
    setState({ dialog: "create", target: null, isLoading: false });
  }, []);

  const openRename = useCallback((project: MockProject) => {
    setState({ dialog: "rename", target: project, isLoading: false });
  }, []);

  const openDelete = useCallback((project: MockProject) => {
    setState({ dialog: "delete", target: project, isLoading: false });
  }, []);

  const close = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const runMockAction = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    await new Promise((resolve) => setTimeout(resolve, 250));
    setState(INITIAL_STATE);
  }, []);

  const submitCreate = useCallback(
    async (_name: string) => {
      void _name;
      await runMockAction();
    },
    [runMockAction]
  );

  const submitRename = useCallback(
    async (_name: string) => {
      void _name;
      await runMockAction();
    },
    [runMockAction]
  );

  const submitDelete = useCallback(async () => {
    await runMockAction();
  }, [runMockAction]);

  return {
    dialog: state.dialog,
    target: state.target,
    isLoading: state.isLoading,
    openCreate,
    openRename,
    openDelete,
    close,
    submitCreate,
    submitRename,
    submitDelete,
  };
}
