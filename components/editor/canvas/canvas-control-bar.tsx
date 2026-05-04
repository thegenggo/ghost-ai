"use client";

import {
  Maximize,
  Redo2,
  Undo2,
  ZoomIn,
  ZoomOut,
  type LucideIcon,
} from "lucide-react";

interface CanvasControlBarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function CanvasControlBar({
  onZoomIn,
  onZoomOut,
  onFitView,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: CanvasControlBarProps) {
  return (
    <div
      className="flex items-center gap-1 rounded-full border border-surface-border bg-elevated/95 px-2 py-1.5 shadow-lg backdrop-blur"
      role="toolbar"
      aria-label="Canvas controls"
    >
      <ControlButton icon={ZoomOut} label="Zoom out" onClick={onZoomOut} />
      <ControlButton icon={Maximize} label="Fit view" onClick={onFitView} />
      <ControlButton icon={ZoomIn} label="Zoom in" onClick={onZoomIn} />

      <span
        aria-hidden
        className="mx-1 h-5 w-px bg-surface-border"
      />

      <ControlButton
        icon={Undo2}
        label="Undo"
        onClick={onUndo}
        disabled={!canUndo}
      />
      <ControlButton
        icon={Redo2}
        label="Redo"
        onClick={onRedo}
        disabled={!canRedo}
      />
    </div>
  );
}

interface ControlButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function ControlButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
}: ControlButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-full text-copy-secondary transition-colors hover:bg-subtle hover:text-copy-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:pointer-events-none disabled:opacity-40"
    >
      <Icon className="h-5 w-5" strokeWidth={1.75} />
    </button>
  );
}
