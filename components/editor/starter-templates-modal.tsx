"use client";

import { Fragment, useMemo } from "react";

import { EditorDialog } from "@/components/editor/editor-dialog";
import {
  CANVAS_TEMPLATES,
  type CanvasTemplate,
} from "@/components/editor/starter-templates";
import { Button } from "@/components/ui/button";
import { NODE_COLORS, type CanvasNode } from "@/types/canvas";

interface StarterTemplatesModalProps {
  onImport: (template: CanvasTemplate) => void;
  onClose: () => void;
}

export function StarterTemplatesModal({
  onImport,
  onClose,
}: StarterTemplatesModalProps) {
  return (
    <EditorDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Start from a template"
      description="Pick a starter diagram. Importing replaces your current canvas."
      className="max-w-5xl"
    >
      <div className="grid max-h-[60vh] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
        {CANVAS_TEMPLATES.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onImport={() => onImport(template)}
          />
        ))}
      </div>
    </EditorDialog>
  );
}

interface TemplateCardProps {
  template: CanvasTemplate;
  onImport: () => void;
}

function TemplateCard({ template, onImport }: TemplateCardProps) {
  return (
    <div className="group flex flex-col gap-3 rounded-2xl border border-surface-border bg-surface/40 p-3 transition-colors hover:border-brand/50 hover:bg-surface/70 focus-within:border-brand/50 focus-within:bg-surface/70">
      <TemplatePreview template={template} />
      <div className="flex flex-1 flex-col gap-1">
        <h3 className="text-sm font-medium text-copy-primary">
          {template.name}
        </h3>
        <p className="line-clamp-2 min-h-10 text-xs text-copy-muted">
          {template.description}
        </p>
      </div>
      <Button onClick={onImport} className="w-full">
        Use template
      </Button>
    </div>
  );
}

const PREVIEW_VIEWBOX_WIDTH = 320;
const PREVIEW_VIEWBOX_HEIGHT = 160;
const PREVIEW_PADDING = 12;
const PREVIEW_STROKE = "var(--border-subtle)";

interface ProjectedNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  data: CanvasNode["data"];
}

function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const projected = useMemo(
    () => projectNodes(template.nodes),
    [template.nodes],
  );

  const nodeMap = useMemo(() => {
    const map = new Map<string, ProjectedNode>();
    for (const node of projected) {
      map.set(node.id, node);
    }
    return map;
  }, [projected]);

  return (
    <svg
      viewBox={`0 0 ${PREVIEW_VIEWBOX_WIDTH} ${PREVIEW_VIEWBOX_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      className="aspect-2/1 w-full rounded-xl bg-base"
      aria-hidden
    >
      {template.edges.map((edgeItem) => {
        const source = nodeMap.get(edgeItem.source);
        const target = nodeMap.get(edgeItem.target);
        if (!source || !target) return null;
        return (
          <line
            key={edgeItem.id}
            x1={source.centerX}
            y1={source.centerY}
            x2={target.centerX}
            y2={target.centerY}
            stroke="var(--text-muted)"
            strokeWidth={1}
            opacity={0.7}
          />
        );
      })}
      {projected.map((node) => (
        <PreviewNode key={node.id} node={node} />
      ))}
    </svg>
  );
}

function PreviewNode({ node }: { node: ProjectedNode }) {
  const palette =
    NODE_COLORS.find((color) => color.id === node.data.color) ?? NODE_COLORS[0];
  const fill = palette.fill;
  const { x, y, width, height } = node;

  switch (node.data.shape) {
    case "rectangle":
      return (
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={Math.min(6, width / 4)}
          fill={fill}
          stroke={PREVIEW_STROKE}
          strokeWidth={1}
        />
      );
    case "pill":
      return (
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={height / 2}
          fill={fill}
          stroke={PREVIEW_STROKE}
          strokeWidth={1}
        />
      );
    case "circle":
      return (
        <ellipse
          cx={x + width / 2}
          cy={y + height / 2}
          rx={width / 2}
          ry={height / 2}
          fill={fill}
          stroke={PREVIEW_STROKE}
          strokeWidth={1}
        />
      );
    case "diamond": {
      const points = [
        `${x + width / 2},${y}`,
        `${x + width},${y + height / 2}`,
        `${x + width / 2},${y + height}`,
        `${x},${y + height / 2}`,
      ].join(" ");
      return (
        <polygon
          points={points}
          fill={fill}
          stroke={PREVIEW_STROKE}
          strokeWidth={1}
          strokeLinejoin="round"
        />
      );
    }
    case "hexagon": {
      const inset = width * 0.25;
      const points = [
        `${x + inset},${y}`,
        `${x + width - inset},${y}`,
        `${x + width},${y + height / 2}`,
        `${x + width - inset},${y + height}`,
        `${x + inset},${y + height}`,
        `${x},${y + height / 2}`,
      ].join(" ");
      return (
        <polygon
          points={points}
          fill={fill}
          stroke={PREVIEW_STROKE}
          strokeWidth={1}
          strokeLinejoin="round"
        />
      );
    }
    case "cylinder": {
      const ry = Math.max(2, height * 0.12);
      const rx = width / 2;
      const silhouette = `M ${x} ${y + ry} A ${rx} ${ry} 0 0 1 ${x + width} ${y + ry} L ${x + width} ${y + height - ry} A ${rx} ${ry} 0 0 1 ${x} ${y + height - ry} Z`;
      const topRim = `M ${x} ${y + ry} A ${rx} ${ry} 0 0 0 ${x + width} ${y + ry}`;
      return (
        <Fragment>
          <path
            d={silhouette}
            fill={fill}
            stroke={PREVIEW_STROKE}
            strokeWidth={1}
            strokeLinejoin="round"
          />
          <path
            d={topRim}
            fill="none"
            stroke={PREVIEW_STROKE}
            strokeWidth={1}
          />
        </Fragment>
      );
    }
    default:
      return null;
  }
}

function projectNodes(nodes: CanvasNode[]): ProjectedNode[] {
  if (nodes.length === 0) return [];

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const node of nodes) {
    const width = node.width ?? 160;
    const height = node.height ?? 80;
    if (node.position.x < minX) minX = node.position.x;
    if (node.position.y < minY) minY = node.position.y;
    if (node.position.x + width > maxX) maxX = node.position.x + width;
    if (node.position.y + height > maxY) maxY = node.position.y + height;
  }

  const contentW = Math.max(1, maxX - minX);
  const contentH = Math.max(1, maxY - minY);
  const availableW = PREVIEW_VIEWBOX_WIDTH - PREVIEW_PADDING * 2;
  const availableH = PREVIEW_VIEWBOX_HEIGHT - PREVIEW_PADDING * 2;
  const scale = Math.min(availableW / contentW, availableH / contentH, 1);

  const renderedW = contentW * scale;
  const renderedH = contentH * scale;
  const offsetX = (PREVIEW_VIEWBOX_WIDTH - renderedW) / 2 - minX * scale;
  const offsetY = (PREVIEW_VIEWBOX_HEIGHT - renderedH) / 2 - minY * scale;

  return nodes.map((node) => {
    const width = (node.width ?? 160) * scale;
    const height = (node.height ?? 80) * scale;
    const x = node.position.x * scale + offsetX;
    const y = node.position.y * scale + offsetY;
    return {
      id: node.id,
      x,
      y,
      width,
      height,
      centerX: x + width / 2,
      centerY: y + height / 2,
      data: node.data,
    };
  });
}
