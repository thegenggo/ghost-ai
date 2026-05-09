"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";

export type CanvasSaveStatus = "idle" | "saving" | "saved" | "error";

interface UseCanvasAutosaveArgs {
  projectId: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  enabled: boolean;
}

interface UseCanvasAutosaveResult {
  status: CanvasSaveStatus;
  saveNow: () => void;
}

const DEBOUNCE_MS = 1500;

export function useCanvasAutosave({
  projectId,
  nodes,
  edges,
  enabled,
}: UseCanvasAutosaveArgs): UseCanvasAutosaveResult {
  const [status, setStatus] = useState<CanvasSaveStatus>("idle");

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const timeoutRef = useRef<number | null>(null);
  const lastPayloadRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [nodes, edges]);

  const flush = useCallback(async (): Promise<void> => {
    if (inFlightRef.current) return;

    const payload = JSON.stringify({
      nodes: stripNodes(nodesRef.current),
      edges: stripEdges(edgesRef.current),
    });

    if (payload === lastPayloadRef.current) return;

    inFlightRef.current = true;
    setStatus("saving");
    try {
      const response = await fetch(`/api/projects/${projectId}/canvas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });
      if (!response.ok) {
        throw new Error(`Save failed: ${response.status}`);
      }
      lastPayloadRef.current = payload;
      setStatus("saved");
    } catch {
      setStatus("error");
    } finally {
      inFlightRef.current = false;
    }
  }, [projectId]);

  useEffect(() => {
    if (!enabled) return;

    // Skip the very first render so we don't autosave the initial state
    // (which may have just been loaded from the blob) straight back.
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      lastPayloadRef.current = JSON.stringify({
        nodes: stripNodes(nodes),
        edges: stripEdges(edges),
      });
      return;
    }

    const payload = JSON.stringify({
      nodes: stripNodes(nodes),
      edges: stripEdges(edges),
    });

    if (payload === lastPayloadRef.current) {
      return;
    }

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null;
      void flush();
    }, DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [nodes, edges, enabled, flush]);

  const saveNow = useCallback(() => {
    if (!enabled) return;
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    void flush();
  }, [enabled, flush]);

  return { status, saveNow };
}

interface SerializableNode {
  id: string;
  type: CanvasNode["type"];
  position: CanvasNode["position"];
  data: CanvasNode["data"];
  width?: number;
  height?: number;
}

interface SerializableEdge {
  id: string;
  type: CanvasEdge["type"];
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  data?: CanvasEdge["data"];
}

function stripNodes(nodes: CanvasNode[]): SerializableNode[] {
  return nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: node.data,
    ...(typeof node.width === "number" ? { width: node.width } : {}),
    ...(typeof node.height === "number" ? { height: node.height } : {}),
  }));
}

function stripEdges(edges: CanvasEdge[]): SerializableEdge[] {
  return edges.map((edge) => ({
    id: edge.id,
    type: edge.type,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle ?? null,
    targetHandle: edge.targetHandle ?? null,
    ...(edge.data ? { data: edge.data } : {}),
  }));
}
