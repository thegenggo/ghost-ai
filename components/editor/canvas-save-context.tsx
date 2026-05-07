"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave";

interface CanvasSaveContextValue {
  reportStatus: (status: CanvasSaveStatus) => void;
  registerSaveNow: (saveNow: (() => void) | null) => void;
}

const CanvasSaveContext = createContext<CanvasSaveContextValue | null>(null);

interface CanvasSaveProviderProps {
  value: CanvasSaveContextValue;
  children: ReactNode;
}

export function CanvasSaveProvider({
  value,
  children,
}: CanvasSaveProviderProps) {
  return (
    <CanvasSaveContext.Provider value={value}>
      {children}
    </CanvasSaveContext.Provider>
  );
}

export function useCanvasSaveContext(): CanvasSaveContextValue | null {
  return useContext(CanvasSaveContext);
}
