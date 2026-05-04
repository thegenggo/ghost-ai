"use client";

import { useEffect } from "react";
import type { ReactFlowInstance } from "@xyflow/react";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";

interface UseKeyboardShortcutsArgs {
  reactFlow: ReactFlowInstance<CanvasNode, CanvasEdge>;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const ZOOM_DURATION_MS = 200;

export function useKeyboardShortcuts({
  reactFlow,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: UseKeyboardShortcutsArgs) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) {
        return;
      }

      const isMod = event.metaKey || event.ctrlKey;

      if (isMod && (event.key === "z" || event.key === "Z")) {
        event.preventDefault();
        if (event.shiftKey) {
          if (canRedo) onRedo();
        } else if (canUndo) {
          onUndo();
        }
        return;
      }

      if (isMod && (event.key === "y" || event.key === "Y")) {
        event.preventDefault();
        if (canRedo) onRedo();
        return;
      }

      if (isMod) {
        return;
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        void reactFlow.zoomIn({ duration: ZOOM_DURATION_MS });
        return;
      }

      if (event.key === "-") {
        event.preventDefault();
        void reactFlow.zoomOut({ duration: ZOOM_DURATION_MS });
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [reactFlow, onUndo, onRedo, canUndo, canRedo]);
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}
