"use client";

import {
  Handle,
  NodeResizer,
  Position,
  useReactFlow,
  type NodeProps,
} from "@xyflow/react";
import { useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";

import { NodeColorToolbar } from "@/components/editor/canvas/node-color-toolbar";
import { ShapeBackground } from "@/components/editor/canvas/shape-render";
import { NODE_COLORS, type CanvasNode as CanvasNodeType } from "@/types/canvas";

const CONNECTION_HANDLE_STYLE: CSSProperties = {
  width: 8,
  height: 8,
  background: "#FFFFFF",
  border: "1px solid var(--bg-base)",
};

const HANDLE_POSITIONS: { id: string; position: Position }[] = [
  { id: "top", position: Position.Top },
  { id: "right", position: Position.Right },
  { id: "bottom", position: Position.Bottom },
  { id: "left", position: Position.Left },
];

const REST_STROKE = "var(--border-subtle)";
const SELECTED_STROKE = "var(--accent-primary)";
const RESIZE_HANDLE_COLOR = "var(--accent-primary)";

const RESIZE_HANDLE_STYLE: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 2,
  backgroundColor: "var(--bg-base)",
  border: `1.5px solid ${RESIZE_HANDLE_COLOR}`,
};

const RESIZE_LINE_STYLE: CSSProperties = {
  borderColor: "transparent",
};

const MIN_WIDTH = 80;
const MIN_HEIGHT = 40;

const PLACEHOLDER_LABEL = "Label";

export function CanvasNode({
  id,
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

  const [isEditing, setIsEditing] = useState(false);
  const { updateNodeData } = useReactFlow<CanvasNodeType>();

  const handleDoubleClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    setIsEditing(true);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    event.stopPropagation();
    if (event.key === "Escape") {
      event.preventDefault();
      setIsEditing(false);
    }
  };

  return (
    <div
      className="group relative text-sm"
      style={{
        width: width ?? undefined,
        height: height ?? undefined,
        color: palette.text,
      }}
      onDoubleClick={handleDoubleClick}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={MIN_WIDTH}
        minHeight={MIN_HEIGHT}
        color={RESIZE_HANDLE_COLOR}
        handleStyle={RESIZE_HANDLE_STYLE}
        lineStyle={RESIZE_LINE_STYLE}
      />
      <NodeColorToolbar
        nodeId={id}
        selected={Boolean(selected)}
        activeColor={data.color}
      />
      <ShapeBackground
        shape={data.shape}
        fill={palette.fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        width={w}
        height={h}
      />
      {!isEditing && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-3 py-2">
          {data.label ? (
            <span className="truncate text-center">{data.label}</span>
          ) : (
            <span className="truncate text-center text-copy-muted">
              {PLACEHOLDER_LABEL}
            </span>
          )}
        </div>
      )}
      {isEditing && (
        <div className="absolute inset-0 flex items-center justify-center px-3 py-2">
          <textarea
            autoFocus
            rows={1}
            value={data.label}
            placeholder={PLACEHOLDER_LABEL}
            onChange={(event) =>
              updateNodeData(id, { label: event.target.value })
            }
            onBlur={() => setIsEditing(false)}
            onKeyDown={handleKeyDown}
            onPointerDown={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            onWheel={(event) => event.stopPropagation()}
            className="nodrag nopan nowheel field-sizing-content w-full resize-none bg-transparent p-0 text-center text-copy-primary outline-none placeholder:text-copy-muted"
          />
        </div>
      )}
      {HANDLE_POSITIONS.map(({ id: handleId, position }) => (
        <Handle
          key={handleId}
          id={handleId}
          type="source"
          position={position}
          style={CONNECTION_HANDLE_STYLE}
          className="opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        />
      ))}
    </div>
  );
}
