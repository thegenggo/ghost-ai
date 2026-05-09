"use client";

import { useState } from "react";
import {
  ClientSideSuspense,
  useErrorListener,
} from "@liveblocks/react/suspense";

import { CanvasFlow } from "@/components/editor/canvas/canvas-flow";
import type { SavedCanvas } from "@/lib/canvas-storage";

interface CanvasProps {
  roomId: string;
  savedCanvas: SavedCanvas | null;
}

export function Canvas({ roomId, savedCanvas }: CanvasProps) {
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useErrorListener((error) => {
    if (error.context.type === "ROOM_CONNECTION_ERROR") {
      setConnectionError(connectionMessage(error.context.code));
    }
  });

  if (connectionError) {
    return <CanvasMessage tone="error" text={connectionError} />;
  }

  return (
    <ClientSideSuspense
      fallback={<CanvasMessage tone="muted" text="Connecting to canvas…" />}
    >
      <CanvasFlow projectId={roomId} savedCanvas={savedCanvas} />
    </ClientSideSuspense>
  );
}

function CanvasMessage({
  tone,
  text,
}: {
  tone: "muted" | "error";
  text: string;
}) {
  return (
    <div className="flex flex-1 items-center justify-center bg-base px-6 text-center">
      <p
        className={
          tone === "error"
            ? "text-sm text-error"
            : "text-sm text-copy-muted"
        }
      >
        {text}
      </p>
    </div>
  );
}

function connectionMessage(code: number): string {
  switch (code) {
    case -1:
      return "Authentication failed. Please refresh and try again.";
    case 4001:
      return "You don't have access to this canvas.";
    case 4005:
      return "This canvas room is full.";
    case 4006:
      return "This canvas room ID has changed.";
    default:
      return "Lost connection to the canvas. Please refresh and try again.";
  }
}
