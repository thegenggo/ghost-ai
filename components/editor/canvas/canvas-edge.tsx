"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
  type Node,
} from "@xyflow/react";
import {
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";

import type { CanvasEdge as CanvasEdgeType } from "@/types/canvas";

const REST_STROKE = "var(--text-muted)";
const ACTIVE_STROKE = "var(--text-primary)";
const REST_OPACITY = 0.85;
const ACTIVE_OPACITY = 1;
const INTERACTION_WIDTH = 24;
const BORDER_RADIUS = 8;
const STROKE_WIDTH = 1.5;

const ADD_LABEL_HINT = "Add label";

export function CanvasEdge({
  id,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  data,
  selected,
  markerEnd,
}: EdgeProps<CanvasEdgeType>) {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: BORDER_RADIUS,
  });

  const [hovered, setHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const { updateEdgeData } = useReactFlow<Node, CanvasEdgeType>();

  const label = data?.label ?? "";
  const isActive = hovered || Boolean(selected) || isEditing;
  const stroke = isActive ? ACTIVE_STROKE : REST_STROKE;
  const opacity = isActive ? ACTIVE_OPACITY : REST_OPACITY;

  const edgeStyle: CSSProperties = {
    stroke,
    strokeWidth: STROKE_WIDTH,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    opacity,
    transition: "stroke 120ms ease, opacity 120ms ease",
  };

  const beginEditing = () => {
    setDraft(label);
    setIsEditing(true);
  };

  const commitEditing = () => {
    updateEdgeData(id, { label: draft });
    setIsEditing(false);
  };

  const handleDoubleClick = (event: MouseEvent<SVGGElement>) => {
    event.stopPropagation();
    beginEditing();
  };

  const handleLabelDoubleClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    beginEditing();
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation();
    if (event.key === "Enter" || event.key === "Escape") {
      event.preventDefault();
      commitEditing();
    }
  };

  const stopPointer = (event: PointerEvent | MouseEvent) => {
    event.stopPropagation();
  };

  return (
    <g onDoubleClick={handleDoubleClick}>
      <g
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <BaseEdge
          path={path}
          markerEnd={markerEnd}
          style={edgeStyle}
          interactionWidth={INTERACTION_WIDTH}
        />
      </g>
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan absolute"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
          onDoubleClick={handleLabelDoubleClick}
          onPointerDown={stopPointer}
          onMouseDown={stopPointer}
          onClick={stopPointer}
        >
          {isEditing ? (
            <input
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={commitEditing}
              onKeyDown={handleInputKeyDown}
              onPointerDown={stopPointer}
              onMouseDown={stopPointer}
              onClick={stopPointer}
              placeholder={ADD_LABEL_HINT}
              className="field-sizing-content min-w-[8ch] rounded-full border border-surface-border bg-elevated/95 px-2.5 py-0.5 text-center text-xs text-copy-primary shadow-sm outline-none placeholder:text-copy-muted focus-visible:ring-2 focus-visible:ring-brand"
            />
          ) : label ? (
            <span className="inline-flex items-center rounded-full border border-surface-border bg-elevated/95 px-2.5 py-0.5 text-xs text-copy-primary shadow-sm">
              {label}
            </span>
          ) : isActive ? (
            <span className="inline-flex items-center rounded-full border border-dashed border-surface-border bg-elevated/70 px-2.5 py-0.5 text-xs text-copy-faint">
              {ADD_LABEL_HINT}
            </span>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </g>
  );
}
