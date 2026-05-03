"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

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

export function CanvasNode({ data, width, height }: NodeProps<CanvasNodeType>) {
  const palette =
    NODE_COLORS.find((color) => color.id === data.color) ?? NODE_COLORS[0];

  return (
    <div
      className="flex items-center justify-center rounded-md border border-surface-border px-3 py-2 text-sm"
      style={{
        width: width ?? undefined,
        height: height ?? undefined,
        backgroundColor: palette.fill,
        color: palette.text,
      }}
    >
      <Handle type="target" position={Position.Top} style={HIDDEN_HANDLE_STYLE} />
      <span className="truncate text-center">{data.label}</span>
      <Handle
        type="source"
        position={Position.Bottom}
        style={HIDDEN_HANDLE_STYLE}
      />
    </div>
  );
}
