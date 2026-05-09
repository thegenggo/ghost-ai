"use client";

import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MarkerType,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type DefaultEdgeOptions,
  type EdgeTypes,
  type NodeTypes,
} from "@xyflow/react";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  useCanRedo,
  useCanUndo,
  useRedo,
  useUndo,
  useUpdateMyPresence,
} from "@liveblocks/react/suspense";
import { useCallback, useEffect, useRef } from "react";
import type { DragEvent, MouseEvent as ReactMouseEvent } from "react";

import { AiStatusToast } from "@/components/editor/canvas/ai-status-toast";
import { CanvasControlBar } from "@/components/editor/canvas/canvas-control-bar";
import { CanvasEdge as CanvasEdgeRenderer } from "@/components/editor/canvas/canvas-edge";
import { CanvasNode } from "@/components/editor/canvas/canvas-node";
import { LiveCursors } from "@/components/editor/canvas/live-cursors";
import { PresenceAvatars } from "@/components/editor/canvas/presence-avatars";
import {
  ShapePanel,
  SHAPE_DRAG_MIME,
  type ShapeDragPayload,
} from "@/components/editor/canvas/shape-panel";
import { useCanvasSaveContext } from "@/components/editor/canvas-save-context";
import { useCanvasSnapshotContext } from "@/components/editor/canvas-snapshot-context";
import { useCanvasTemplatesContext } from "@/components/editor/canvas-templates-context";
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import type { CanvasTemplate } from "@/components/editor/starter-templates";
import { useCanvasAutosave } from "@/hooks/use-canvas-autosave";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import type { SavedCanvas } from "@/lib/canvas-storage";
import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  DEFAULT_NODE_COLOR,
  NODE_SHAPES,
  type CanvasEdge,
  type CanvasNode as CanvasNodeData,
  type NodeShape,
} from "@/types/canvas";

import "@xyflow/react/dist/style.css";

const NODE_TYPES: NodeTypes = {
  [CANVAS_NODE_TYPE]: CanvasNode,
};

const EDGE_TYPES: EdgeTypes = {
  [CANVAS_EDGE_TYPE]: CanvasEdgeRenderer,
};

const DEFAULT_EDGE_OPTIONS: DefaultEdgeOptions = {
  type: CANVAS_EDGE_TYPE,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: "#808090",
    width: 16,
    height: 16,
  },
};

interface CanvasFlowProps {
  projectId: string;
  savedCanvas: SavedCanvas | null;
}

export function CanvasFlow({ projectId, savedCanvas }: CanvasFlowProps) {
  return (
    <ReactFlowProvider>
      <CanvasFlowInner projectId={projectId} savedCanvas={savedCanvas} />
    </ReactFlowProvider>
  );
}

function CanvasFlowInner({ projectId, savedCanvas }: CanvasFlowProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNodeData, CanvasEdge>({
      suspense: true,
      nodes: { initial: savedCanvas?.nodes ?? [] },
      edges: { initial: savedCanvas?.edges ?? [] },
    });
  const reactFlow = useReactFlow<CanvasNodeData, CanvasEdge>();
  const { screenToFlowPosition } = reactFlow;
  const dropCounterRef = useRef(0);
  const templatesContext = useCanvasTemplatesContext();

  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const updateMyPresence = useUpdateMyPresence();
  const saveContext = useCanvasSaveContext();
  const snapshotContext = useCanvasSnapshotContext();
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  useEffect(() => {
    if (!snapshotContext) return;
    snapshotContext.registerGetSnapshot(() => ({
      nodes: nodesRef.current,
      edges: edgesRef.current,
    }));
    return () => {
      snapshotContext.registerGetSnapshot(null);
    };
  }, [snapshotContext]);

  const { status: saveStatus, saveNow } = useCanvasAutosave({
    projectId,
    nodes,
    edges,
    enabled: true,
  });

  useEffect(() => {
    saveContext?.reportStatus(saveStatus);
  }, [saveContext, saveStatus]);

  useEffect(() => {
    saveContext?.registerSaveNow(saveNow);
    return () => {
      saveContext?.registerSaveNow(null);
    };
  }, [saveContext, saveNow]);

  const handleZoomIn = useCallback(() => {
    void reactFlow.zoomIn({ duration: 200 });
  }, [reactFlow]);

  const handleZoomOut = useCallback(() => {
    void reactFlow.zoomOut({ duration: 200 });
  }, [reactFlow]);

  const handleFitView = useCallback(() => {
    void reactFlow.fitView({ duration: 300 });
  }, [reactFlow]);

  useKeyboardShortcuts({
    reactFlow,
    onUndo: undo,
    onRedo: redo,
    canUndo,
    canRedo,
  });

  const handleMouseMove = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      const point = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      updateMyPresence({ cursor: { x: point.x, y: point.y } });
    },
    [screenToFlowPosition, updateMyPresence],
  );

  const handleMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes(SHAPE_DRAG_MIME)) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      const raw = event.dataTransfer.getData(SHAPE_DRAG_MIME);
      if (!raw) return;
      event.preventDefault();

      const payload = parseShapePayload(raw);
      if (!payload) return;

      const point = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const id = `${payload.shape}-${Date.now()}-${dropCounterRef.current++}`;
      const newNode: CanvasNodeData = {
        id,
        type: CANVAS_NODE_TYPE,
        position: {
          x: point.x - payload.width / 2,
          y: point.y - payload.height / 2,
        },
        width: payload.width,
        height: payload.height,
        data: {
          label: "",
          color: DEFAULT_NODE_COLOR,
          shape: payload.shape,
        },
      };

      onNodesChange([{ type: "add", item: newNode }]);
    },
    [onNodesChange, screenToFlowPosition],
  );

  const handleImportTemplate = useCallback(
    (template: CanvasTemplate) => {
      const importStamp = `tpl-${Date.now()}-${dropCounterRef.current++}`;
      const idMap = new Map<string, string>();
      template.nodes.forEach((node) => {
        idMap.set(node.id, `${importStamp}-${node.id}`);
      });

      const nextNodes: CanvasNodeData[] = template.nodes.map((node) => ({
        ...node,
        id: idMap.get(node.id) ?? node.id,
        data: { ...node.data },
        position: { ...node.position },
      }));
      const nextEdges: CanvasEdge[] = template.edges.map((edgeItem) => ({
        ...edgeItem,
        id: `${importStamp}-${edgeItem.id}`,
        source: idMap.get(edgeItem.source) ?? edgeItem.source,
        target: idMap.get(edgeItem.target) ?? edgeItem.target,
        data: edgeItem.data ? { ...edgeItem.data } : undefined,
      }));

      const currentNodes = reactFlow.getNodes();
      const currentEdges = reactFlow.getEdges();

      // useLiveblocksFlow ignores `{ type: "remove" }` changes; deletion is
      // only persisted through the dedicated onDelete callback.
      if (currentNodes.length > 0 || currentEdges.length > 0) {
        onDelete({ nodes: currentNodes, edges: currentEdges });
      }

      if (nextNodes.length > 0) {
        onNodesChange(
          nextNodes.map((node) => ({ type: "add", item: node })),
        );
      }
      if (nextEdges.length > 0) {
        onEdgesChange(
          nextEdges.map((edgeItem) => ({ type: "add", item: edgeItem })),
        );
      }

      templatesContext?.close();

      window.setTimeout(() => {
        void reactFlow.fitView({ duration: 300, padding: 0.2 });
      }, 80);
    },
    [onDelete, onEdgesChange, onNodesChange, reactFlow, templatesContext],
  );

  return (
    <div
      className="relative flex flex-1 bg-base"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        connectionMode={ConnectionMode.Loose}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="var(--border-subtle)"
          bgColor="var(--bg-base)"
        />
        <MiniMap
          pannable
          zoomable
          nodeColor="var(--bg-elevated)"
          nodeStrokeColor="var(--border-subtle)"
          maskColor="rgba(8, 8, 9, 0.7)"
          bgColor="var(--bg-surface)"
          style={{
            border: "1px solid var(--border-default)",
            borderRadius: "0.75rem",
          }}
        />
        <Panel position="bottom-left">
          <CanvasControlBar
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFitView={handleFitView}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        </Panel>
        <Panel position="bottom-center">
          <ShapePanel />
        </Panel>
        <Panel position="top-right">
          <PresenceAvatars />
        </Panel>
        <Panel position="top-center">
          <AiStatusToast />
        </Panel>
      </ReactFlow>
      <LiveCursors />
      {templatesContext?.isOpen ? (
        <StarterTemplatesModal
          onImport={handleImportTemplate}
          onClose={templatesContext.close}
        />
      ) : null}
    </div>
  );
}

function parseShapePayload(raw: string): ShapeDragPayload | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("shape" in parsed) ||
      !("width" in parsed) ||
      !("height" in parsed)
    ) {
      return null;
    }
    const candidate = parsed as Record<string, unknown>;
    const shape = candidate.shape;
    const width = candidate.width;
    const height = candidate.height;
    if (
      typeof shape !== "string" ||
      !isNodeShape(shape) ||
      typeof width !== "number" ||
      typeof height !== "number"
    ) {
      return null;
    }
    return { shape, width, height };
  } catch {
    return null;
  }
}

function isNodeShape(value: string): value is NodeShape {
  return (NODE_SHAPES as readonly string[]).includes(value);
}
