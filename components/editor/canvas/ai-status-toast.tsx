"use client";

import { useEventListener } from "@liveblocks/react/suspense";
import { Bot, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { AI_STATUS_EVENT_TYPE, type AiStatusLevel } from "@/lib/ai-agent";
import { cn } from "@/lib/utils";

interface ActiveStatus {
  level: AiStatusLevel;
  message: string;
  key: number;
}

const HIDE_AFTER_MS = 4000;

export function AiStatusToast() {
  const [status, setStatus] = useState<ActiveStatus | null>(null);

  useEventListener(({ event }) => {
    if (event.type !== AI_STATUS_EVENT_TYPE) return;
    setStatus({
      level: event.level,
      message: event.message,
      key: Date.now(),
    });
  });

  useEffect(() => {
    if (!status) return;
    if (status.level === "start" || status.level === "processing") return;
    const timeout = window.setTimeout(() => setStatus(null), HIDE_AFTER_MS);
    return () => window.clearTimeout(timeout);
  }, [status]);

  if (!status) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs shadow-lg backdrop-blur",
        levelClasses(status.level),
      )}
    >
      <StatusIcon level={status.level} />
      <span className="text-copy-primary">{status.message}</span>
    </div>
  );
}

function StatusIcon({ level }: { level: AiStatusLevel }) {
  if (level === "complete") {
    return <CheckCircle2 className="h-3.5 w-3.5 text-success" />;
  }
  if (level === "error") {
    return <AlertCircle className="h-3.5 w-3.5 text-error" />;
  }
  if (level === "start") {
    return <Bot className="h-3.5 w-3.5 text-ai-text" />;
  }
  return <Loader2 className="h-3.5 w-3.5 animate-spin text-ai-text" />;
}

function levelClasses(level: AiStatusLevel): string {
  if (level === "error") {
    return "border-error/40 bg-elevated/95";
  }
  if (level === "complete") {
    return "border-success/40 bg-elevated/95";
  }
  return "border-ai/40 bg-elevated/95";
}
