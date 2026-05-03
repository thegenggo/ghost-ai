"use client";

import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
} from "@xyflow/react";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import { useCallback, useRef } from "react";
import type { DragEvent } from "react";

import { CanvasNode } from "@/components/editor/canvas/canvas-node";
import {
  ShapePanel,
  SHAPE_DRAG_MIME,
  type ShapeDragPayload,
} from "@/components/editor/canvas/shape-panel";
import {
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

export function CanvasFlow() {
  return (
    <ReactFlowProvider>
      <CanvasFlowInner />
    </ReactFlowProvider>
  );
}

function CanvasFlowInner() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNodeData, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    });
  const { screenToFlowPosition } = useReactFlow();
  const dropCounterRef = useRef(0);

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

  return (
    <div
      className="flex flex-1 bg-base"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
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
        <Panel position="bottom-center">
          <ShapePanel />
        </Panel>
      </ReactFlow>
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
