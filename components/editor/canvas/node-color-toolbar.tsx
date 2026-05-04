"use client";

import { NodeToolbar, Position, useReactFlow } from "@xyflow/react";
import type { CSSProperties, MouseEvent, PointerEvent } from "react";

import {
  NODE_COLORS,
  type CanvasNode,
  type NodeColor,
} from "@/types/canvas";

const COLOR_LABELS: Record<NodeColor, string> = {
  neutral: "Neutral",
  blue: "Blue",
  purple: "Purple",
  orange: "Orange",
  red: "Red",
  pink: "Pink",
  green: "Green",
  teal: "Teal",
};

interface NodeColorToolbarProps {
  nodeId: string;
  selected: boolean;
  activeColor: NodeColor;
}

export function NodeColorToolbar({
  nodeId,
  selected,
  activeColor,
}: NodeColorToolbarProps) {
  const { updateNodeData } = useReactFlow<CanvasNode>();

  const stopEvent = (event: PointerEvent | MouseEvent) => {
    event.stopPropagation();
  };

  return (
    <NodeToolbar
      isVisible={selected}
      position={Position.Top}
      offset={12}
      className="nodrag nopan flex items-center gap-1 rounded-full border border-surface-border bg-elevated/95 px-2 py-1.5 shadow-lg backdrop-blur"
      onPointerDown={stopEvent}
      onMouseDown={stopEvent}
      onClick={stopEvent}
    >
      {NODE_COLORS.map((color) => {
        const isActive = color.id === activeColor;
        const swatchStyle: CSSProperties = {
          backgroundColor: color.fill,
          borderColor: isActive ? color.text : "var(--border-default)",
          borderWidth: isActive ? 2 : 1,
          boxShadow: isActive ? `0 0 0 1px ${color.text}` : undefined,
        };
        const buttonStyle = {
          ["--swatch-glow" as string]: color.text,
        } as CSSProperties;
        return (
          <button
            key={color.id}
            type="button"
            onPointerDown={stopEvent}
            onMouseDown={stopEvent}
            onClick={(event) => {
              event.stopPropagation();
              updateNodeData(nodeId, { color: color.id });
            }}
            aria-label={`Set color to ${COLOR_LABELS[color.id]}`}
            aria-pressed={isActive}
            title={COLOR_LABELS[color.id]}
            style={buttonStyle}
            className="group flex h-7 w-7 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <span
              className="block h-5 w-5 rounded-full border border-solid transition-shadow group-hover:shadow-[0_0_6px_var(--swatch-glow)]"
              style={swatchStyle}
            />
          </button>
        );
      })}
    </NodeToolbar>
  );
}
