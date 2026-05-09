"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";

export interface CanvasSnapshot {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export type CanvasSnapshotGetter = () => CanvasSnapshot;

interface CanvasSnapshotContextValue {
  registerGetSnapshot: (getter: CanvasSnapshotGetter | null) => void;
  getSnapshot: () => CanvasSnapshot | null;
}

const CanvasSnapshotContext = createContext<CanvasSnapshotContextValue | null>(
  null,
);

interface CanvasSnapshotProviderProps {
  value: CanvasSnapshotContextValue;
  children: ReactNode;
}

export function CanvasSnapshotProvider({
  value,
  children,
}: CanvasSnapshotProviderProps) {
  return (
    <CanvasSnapshotContext.Provider value={value}>
      {children}
    </CanvasSnapshotContext.Provider>
  );
}

export function useCanvasSnapshotContext(): CanvasSnapshotContextValue | null {
  return useContext(CanvasSnapshotContext);
}
