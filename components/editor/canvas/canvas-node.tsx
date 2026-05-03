"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

import { ShapeBackground } from "@/components/editor/canvas/shape-render";
import { NODE_COLORS, type CanvasNode as CanvasNodeType } from "@/types/canvas";

const HIDDEN_HANDLE_STYLE = {
  width: 1,
  height: 1,
  minWidth: 1,
  minHeight: 1,
  background: "transparent",
  border: "none",
  opacity: 0,
};

const REST_STROKE = "var(--border-subtle)";
const SELECTED_STROKE = "var(--accent-primary)";

export function CanvasNode({
  data,
  width,
  height,
  selected,
}: NodeProps<CanvasNodeType>) {
  const palette =
    NODE_COLORS.find((color) => color.id === data.color) ?? NODE_COLORS[0];
  const w = width ?? 0;
  const h = height ?? 0;
  const stroke = selected ? SELECTED_STROKE : REST_STROKE;
  const strokeWidth = selected ? 2 : 1;

  return (
    <div
      className="relative text-sm"
      style={{
        width: width ?? undefined,
        height: height ?? undefined,
        color: palette.text,
      }}
    >
      <Handle type="target" position={Position.Top} style={HIDDEN_HANDLE_STYLE} />
      <ShapeBackground
        shape={data.shape}
        fill={palette.fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        width={w}
        height={h}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-3 py-2">
        <span className="truncate text-center">{data.label}</span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={HIDDEN_HANDLE_STYLE}
      />
    </div>
  );
}
