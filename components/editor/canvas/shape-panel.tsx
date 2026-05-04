"use client";

import {
  Circle,
  Cylinder,
  Diamond,
  Hexagon,
  Pill,
  Square,
  type LucideIcon,
} from "lucide-react";
import { useRef, type DragEvent } from "react";

import { ShapeBackground } from "@/components/editor/canvas/shape-render";
import {
  DEFAULT_NODE_COLOR,
  NODE_COLORS,
  type NodeShape,
} from "@/types/canvas";

export const SHAPE_DRAG_MIME = "application/x-ghost-shape";

export interface ShapeDragPayload {
  shape: NodeShape;
  width: number;
  height: number;
}

interface ShapeOption {
  shape: NodeShape;
  label: string;
  icon: LucideIcon;
  width: number;
  height: number;
}

const SHAPE_OPTIONS: ShapeOption[] = [
  { shape: "rectangle", label: "Rectangle", icon: Square, width: 160, height: 80 },
  { shape: "diamond", label: "Diamond", icon: Diamond, width: 140, height: 140 },
  { shape: "circle", label: "Circle", icon: Circle, width: 100, height: 100 },
  { shape: "pill", label: "Pill", icon: Pill, width: 160, height: 60 },
  { shape: "cylinder", label: "Cylinder", icon: Cylinder, width: 120, height: 100 },
  { shape: "hexagon", label: "Hexagon", icon: Hexagon, width: 130, height: 110 },
];

const PREVIEW_PALETTE =
  NODE_COLORS.find((color) => color.id === DEFAULT_NODE_COLOR) ?? NODE_COLORS[0];

export function ShapePanel() {
  const previewRefs = useRef<Map<NodeShape, HTMLDivElement | null>>(new Map());

  function handleDragStart(
    event: DragEvent<HTMLButtonElement>,
    option: ShapeOption,
  ) {
    const payload: ShapeDragPayload = {
      shape: option.shape,
      width: option.width,
      height: option.height,
    };
    event.dataTransfer.setData(SHAPE_DRAG_MIME, JSON.stringify(payload));
    event.dataTransfer.effectAllowed = "move";

    const preview = previewRefs.current.get(option.shape);
    if (preview) {
      event.dataTransfer.setDragImage(
        preview,
        option.width / 2,
        option.height / 2,
      );
    }
  }

  return (
    <>
      <div
        className="flex items-center gap-1 rounded-full border border-surface-border bg-elevated/95 px-2 py-1.5 shadow-lg backdrop-blur"
        role="toolbar"
        aria-label="Shape palette"
      >
        {SHAPE_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.shape}
              type="button"
              draggable
              onDragStart={(event) => handleDragStart(event, option)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-copy-secondary transition-colors hover:bg-subtle hover:text-copy-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              aria-label={`Drag to add ${option.label}`}
              title={`Drag to add ${option.label}`}
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </button>
          );
        })}
      </div>

      <div
        aria-hidden
        className="pointer-events-none fixed top-0"
        style={{ left: -9999 }}
      >
        {SHAPE_OPTIONS.map((option) => (
          <div
            key={option.shape}
            ref={(el) => {
              previewRefs.current.set(option.shape, el);
            }}
            className="relative"
            style={{
              width: option.width,
              height: option.height,
              color: PREVIEW_PALETTE.text,
            }}
          >
            <ShapeBackground
              shape={option.shape}
              fill={PREVIEW_PALETTE.fill}
              stroke="#3a3a42"
              strokeWidth={1}
              width={option.width}
              height={option.height}
            />
          </div>
        ))}
      </div>
    </>
  );
}
