"use client";

import { createContext, useContext, type ReactNode } from "react";

interface CanvasTemplatesContextValue {
  isOpen: boolean;
  close: () => void;
}

const CanvasTemplatesContext =
  createContext<CanvasTemplatesContextValue | null>(null);

interface CanvasTemplatesProviderProps {
  value: CanvasTemplatesContextValue;
  children: ReactNode;
}

export function CanvasTemplatesProvider({
  value,
  children,
}: CanvasTemplatesProviderProps) {
  return (
    <CanvasTemplatesContext.Provider value={value}>
      {children}
    </CanvasTemplatesContext.Provider>
  );
}

export function useCanvasTemplatesContext(): CanvasTemplatesContextValue | null {
  return useContext(CanvasTemplatesContext);
}
