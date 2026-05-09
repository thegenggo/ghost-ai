"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import {
  useBroadcastEvent,
  useEventListener,
} from "@liveblocks/react/suspense";
import { useSelf } from "@liveblocks/react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";

import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AI_AGENT_NAME,
  AI_AGENT_USER_ID,
  AI_STATUS_EVENT_TYPE,
  type AiStatusLevel,
} from "@/lib/ai-agent";
import { cn } from "@/lib/utils";
import type { designAgentTask } from "@/trigger/design-agent";
import {
  AI_CHAT_EVENT_TYPE,
  parseAiChatMessage,
  parseAiStatusFeedMessage,
  type AiChatMessage,
} from "@/types/tasks";

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}

interface ActiveRun {
  runId: string;
  publicToken: string;
}

interface FeedState {
  level: AiStatusLevel;
  text: string;
}

const STARTER_PROMPTS: readonly string[] = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

const TAB_TRIGGER_CLASSES =
  "flex-1 text-copy-muted hover:text-copy-primary data-active:bg-brand-dim data-active:text-brand dark:data-active:bg-brand-dim dark:data-active:text-brand dark:data-active:border-transparent";

const ACCENT_BUTTON_CLASSES =
  "bg-accent-chat text-[var(--bg-base)] hover:bg-accent-chat/90 dark:hover:bg-accent-chat/90 disabled:opacity-50";

export function AiSidebar({ isOpen, onClose, projectId }: AiSidebarProps) {
  const [feedState, setFeedState] = useState<FeedState | null>(null);
  const [chatMessages, setChatMessages] = useState<AiChatMessage[]>([]);
  const [chatError, setChatError] = useState<string | null>(null);
  const broadcast = useBroadcastEvent();
  const self = useSelf();

  useEventListener(({ event }) => {
    if (event.type === AI_STATUS_EVENT_TYPE) {
      const parsed = parseAiStatusFeedMessage({ text: event.message });
      if (!parsed) return;
      setFeedState({ level: event.level, text: parsed.text ?? "" });
      return;
    }
    if (event.type === AI_CHAT_EVENT_TYPE) {
      const validated = parseAiChatMessage(event.message);
      if (!validated) return;
      setChatMessages((prev) =>
        prev.some((msg) => msg.id === validated.id)
          ? prev
          : [...prev, validated],
      );
    }
  });

  useEffect(() => {
    if (!feedState) return;
    if (feedState.level === "start" || feedState.level === "processing") {
      return;
    }
    const timer = window.setTimeout(() => setFeedState(null), 4000);
    return () => window.clearTimeout(timer);
  }, [feedState]);

  const isAiActive =
    feedState?.level === "start" || feedState?.level === "processing";

  const senderId = self?.id ?? null;
  const senderName = self?.info?.name ?? null;
  const canChat = Boolean(senderId && senderName);

  const appendLocalMessage = useCallback((message: AiChatMessage) => {
    setChatMessages((prev) =>
      prev.some((msg) => msg.id === message.id) ? prev : [...prev, message],
    );
  }, []);

  const broadcastChatMessage = useCallback(
    (message: AiChatMessage): boolean => {
      const validated = parseAiChatMessage(message);
      if (!validated) return false;
      try {
        broadcast({ type: AI_CHAT_EVENT_TYPE, message: validated });
      } catch {
        return false;
      }
      appendLocalMessage(validated);
      return true;
    },
    [appendLocalMessage, broadcast],
  );

  const sendChatMessage = useCallback(
    (rawContent: string) => {
      const trimmed = rawContent.trim();
      if (!trimmed) return false;
      if (!senderId || !senderName) {
        setChatError("Connecting to room...");
        return false;
      }
      const message: AiChatMessage = {
        id: `${senderId}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        senderId,
        sender: senderName,
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };
      const success = broadcastChatMessage(message);
      if (!success) {
        setChatError("Message could not be sent");
        return false;
      }
      setChatError(null);
      return true;
    },
    [broadcastChatMessage, senderId, senderName],
  );

  return (
    <aside
      aria-label="AI workspace"
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={cn(
        "pointer-events-none fixed top-16 right-3 bottom-4 z-40 flex w-96 flex-col rounded-2xl border border-surface-border bg-surface/95 shadow-2xl backdrop-blur-md transition-all duration-200 ease-out",
        isOpen
          ? "pointer-events-auto translate-x-0 opacity-100"
          : "translate-x-4 opacity-0"
      )}
    >
      <SidebarHeader onClose={onClose} />
      <Tabs
        defaultValue="architect"
        className="flex min-h-0 flex-1 flex-col gap-0"
      >
        <div className="px-4 pt-3">
          <TabsList className="w-full">
            <TabsTrigger value="architect" className={TAB_TRIGGER_CLASSES}>
              AI Architect
            </TabsTrigger>
            <TabsTrigger value="chat" className={TAB_TRIGGER_CLASSES}>
              Chat
            </TabsTrigger>
            <TabsTrigger value="specs" className={TAB_TRIGGER_CLASSES}>
              Specs
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent
          value="architect"
          className="flex min-h-0 flex-1 flex-col"
        >
          <ArchitectTab
            projectId={projectId}
            messages={chatMessages}
            currentSenderId={senderId}
            senderName={senderName}
            isAiActive={isAiActive}
            feedState={feedState}
            broadcastMessage={broadcastChatMessage}
          />
        </TabsContent>
        <TabsContent
          value="chat"
          className="flex min-h-0 flex-1 flex-col"
        >
          <ChatTab
            messages={chatMessages}
            currentSenderId={senderId}
            canChat={canChat}
            error={chatError}
            onSend={sendChatMessage}
            onDismissError={() => setChatError(null)}
          />
        </TabsContent>
        <TabsContent
          value="specs"
          className="flex min-h-0 flex-1 flex-col"
        >
          <SpecsTab isAiActive={isAiActive} />
        </TabsContent>
      </Tabs>
    </aside>
  );
}

interface StatusStripProps {
  level: AiStatusLevel;
  text: string;
}

function StatusStrip({ level, text }: StatusStripProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-2 flex items-center gap-2 rounded-xl border border-accent-chat/40 bg-elevated px-3 py-1.5 text-xs text-accent-chat"
    >
      <FeedStatusIcon level={level} />
      <span className="flex-1 truncate">{text}</span>
    </div>
  );
}

function FeedStatusIcon({ level }: { level: AiStatusLevel }) {
  if (level === "complete") {
    return <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />;
  }
  if (level === "error") {
    return <AlertCircle className="h-3.5 w-3.5 shrink-0" />;
  }
  if (level === "start") {
    return <Bot className="h-3.5 w-3.5 shrink-0" />;
  }
  return <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />;
}

interface SidebarHeaderProps {
  onClose: () => void;
}

function SidebarHeader({ onClose }: SidebarHeaderProps) {
  return (
    <header className="flex shrink-0 items-start justify-between border-b border-surface-border px-4 py-3">
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-brand-dim text-brand"
        >
          <Bot className="h-4 w-4" />
        </span>
        <div className="flex flex-col">
          <h2 className="font-heading text-sm font-medium text-copy-primary">
            AI Workspace
          </h2>
          <p className="text-xs text-copy-muted">
            Collaborate with Ghost AI
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onClose}
        aria-label="Close AI workspace"
      >
        <X className="h-4 w-4 text-copy-secondary" />
      </Button>
    </header>
  );
}

interface ArchitectTabProps {
  projectId?: string;
  messages: AiChatMessage[];
  currentSenderId: string | null;
  senderName: string | null;
  isAiActive: boolean;
  feedState: FeedState | null;
  broadcastMessage: (message: AiChatMessage) => boolean;
}

function ArchitectTab({
  projectId,
  messages,
  currentSenderId,
  senderName,
  isAiActive,
  feedState,
  broadcastMessage,
}: ArchitectTabProps) {
  const [draft, setDraft] = useState("");
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages.length]);

  const handleRunComplete = useCallback(
    (
      runId: string,
      summary: string | undefined,
      level: "complete" | "error",
    ) => {
      const fallback =
        level === "complete" ? "Design ready" : "Design failed";
      const aiMessage: AiChatMessage = {
        id: `ai-${runId}`,
        senderId: AI_AGENT_USER_ID,
        sender: AI_AGENT_NAME,
        role: level === "error" ? "system" : "assistant",
        content: summary ?? fallback,
        timestamp: Date.now(),
      };
      broadcastMessage(aiMessage);
      setActiveRun((current) =>
        current?.runId === runId ? null : current,
      );
    },
    [broadcastMessage],
  );

  const submit = useCallback(async () => {
    const trimmed = draft.trim();
    if (
      !trimmed ||
      !projectId ||
      isSubmitting ||
      activeRun ||
      isAiActive
    ) {
      return;
    }
    if (!currentSenderId || !senderName) {
      setError("Connecting to room...");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const userMessage: AiChatMessage = {
      id: `${currentSenderId}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      senderId: currentSenderId,
      sender: senderName,
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };
    broadcastMessage(userMessage);
    setDraft("");

    try {
      const response = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: trimmed, roomId: projectId }),
      });
      if (!response.ok) {
        throw new Error(
          `Failed to start design agent (${response.status})`,
        );
      }
      const data = (await response.json()) as {
        runId: string;
        publicToken: string;
      };
      setActiveRun({ runId: data.runId, publicToken: data.publicToken });
    } catch (caught) {
      const messageText =
        caught instanceof Error ? caught.message : "Something went wrong";
      const errorMessage: AiChatMessage = {
        id: `system-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        senderId: AI_AGENT_USER_ID,
        sender: AI_AGENT_NAME,
        role: "system",
        content: messageText,
        timestamp: Date.now(),
      };
      broadcastMessage(errorMessage);
      setError(messageText);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    activeRun,
    broadcastMessage,
    currentSenderId,
    draft,
    isAiActive,
    isSubmitting,
    projectId,
    senderName,
  ]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  };

  const handlePromptSelect = (prompt: string) => {
    setDraft(prompt);
  };

  const isReady = Boolean(projectId);
  const isBusy = isSubmitting || Boolean(activeRun) || isAiActive;
  const showStatusStrip = Boolean(activeRun) || isAiActive;
  const statusLevel: AiStatusLevel = feedState?.level ?? "processing";
  const statusFallback =
    statusLevel === "complete"
      ? "Design ready"
      : statusLevel === "error"
        ? "AI ran into an issue"
        : statusLevel === "start"
          ? "Working..."
          : "Generating...";
  const statusText = feedState?.text || statusFallback;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 ? (
          <ArchitectEmptyState onSelectPrompt={handlePromptSelect} />
        ) : (
          <ul className="flex flex-col gap-3">
            {messages.map((message) => (
              <ChatMessageItem
                key={message.id}
                message={message}
                isOwn={message.senderId === currentSenderId}
              />
            ))}
          </ul>
        )}
        {error ? (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-error">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        ) : null}
      </div>
      {activeRun ? (
        <RunSubscriber
          runId={activeRun.runId}
          accessToken={activeRun.publicToken}
          onComplete={handleRunComplete}
        />
      ) : null}
      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-surface-border px-4 py-3"
      >
        {showStatusStrip ? (
          <StatusStrip level={statusLevel} text={statusText} />
        ) : null}
        <label htmlFor={inputId} className="sr-only">
          Ask the AI architect
        </label>
        <div className="flex items-end gap-2">
          <Textarea
            id={inputId}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isReady
                ? "Describe a system to design..."
                : "Open a project to start designing"
            }
            rows={1}
            disabled={!isReady || isBusy}
            className="min-h-[72px] max-h-[160px] resize-none text-copy-primary"
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Send message"
            disabled={!isReady || isBusy || draft.trim().length === 0}
            className={ACCENT_BUTTON_CLASSES}
          >
            {isBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-copy-faint">
          {isReady
            ? "Press Enter to send, Shift + Enter for a new line."
            : "Select or open a project to chat with Ghost AI."}
        </p>
      </form>
    </div>
  );
}

interface RunSubscriberProps {
  runId: string;
  accessToken: string;
  onComplete: (
    runId: string,
    summary: string | undefined,
    level: "complete" | "error",
  ) => void;
}

function RunSubscriber({
  runId,
  accessToken,
  onComplete,
}: RunSubscriberProps) {
  const completedRef = useRef(false);
  const { error } = useRealtimeRun<typeof designAgentTask>(runId, {
    accessToken,
    onComplete: (completedRun, err) => {
      if (completedRef.current) return;
      completedRef.current = true;
      const summary =
        readMetadataString(completedRun?.metadata, "planSummary") ??
        readMetadataString(completedRun?.metadata, "message");
      const failed = Boolean(err) || completedRun?.status === "FAILED";
      onComplete(runId, summary, failed ? "error" : "complete");
    },
  });

  useEffect(() => {
    if (!error || completedRef.current) return;
    completedRef.current = true;
    onComplete(runId, error.message, "error");
  }, [error, onComplete, runId]);

  return null;
}

function readMetadataString(
  metadata: unknown,
  key: string,
): string | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

interface ArchitectEmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

function ArchitectEmptyState({ onSelectPrompt }: ArchitectEmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-2 py-6 text-center">
      <span
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-dim text-brand"
      >
        <Bot className="h-8 w-8" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-copy-primary">
          Start with a prompt
        </p>
        <p className="text-xs text-copy-muted">
          Describe a system and the AI architect will sketch it on the
          canvas.
        </p>
      </div>
      <ul className="flex flex-wrap justify-center gap-2">
        {STARTER_PROMPTS.map((prompt) => (
          <li key={prompt}>
            <button
              type="button"
              onClick={() => onSelectPrompt(prompt)}
              className="rounded-full bg-subtle px-3 py-1 text-xs text-ai-text transition-colors hover:bg-elevated"
            >
              {prompt}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface SpecsTabProps {
  isAiActive: boolean;
}

function SpecsTab({ isAiActive }: SpecsTabProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-surface-border px-4 py-3">
        <Button
          type="button"
          size="default"
          disabled={isAiActive}
          className={cn(ACCENT_BUTTON_CLASSES, "w-full")}
        >
          {isAiActive ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Generate Spec
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <DemoSpecCard />
      </div>
    </div>
  );
}

interface ChatTabProps {
  messages: AiChatMessage[];
  currentSenderId: string | null;
  canChat: boolean;
  error: string | null;
  onSend: (content: string) => boolean;
  onDismissError: () => void;
}

function ChatTab({
  messages,
  currentSenderId,
  canChat,
  error,
  onSend,
  onDismissError,
}: ChatTabProps) {
  const [draft, setDraft] = useState("");
  const inputId = useId();
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages.length]);

  const submit = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const success = onSend(trimmed);
    if (success) {
      setDraft("");
    }
  }, [draft, onSend]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const handleChange = (value: string) => {
    setDraft(value);
    if (error) onDismissError();
  };

  const sendDisabled = !canChat || draft.trim().length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 ? (
          <ChatEmptyState />
        ) : (
          <ul className="flex flex-col gap-3">
            {messages.map((message) => (
              <ChatMessageItem
                key={message.id}
                message={message}
                isOwn={message.senderId === currentSenderId}
              />
            ))}
          </ul>
        )}
        {error ? (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-error">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        ) : null}
      </div>
      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-surface-border px-4 py-3"
      >
        <label htmlFor={inputId} className="sr-only">
          Send a chat message
        </label>
        <div className="flex items-end gap-2">
          <Textarea
            id={inputId}
            value={draft}
            onChange={(event) => handleChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              canChat
                ? "Message your room..."
                : "Connecting to room..."
            }
            rows={1}
            disabled={!canChat}
            className="min-h-[72px] max-h-[160px] resize-none text-copy-primary"
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Send chat message"
            disabled={sendDisabled}
            className={ACCENT_BUTTON_CLASSES}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-copy-faint">
          Press Enter to send, Shift + Enter for a new line.
        </p>
      </form>
    </div>
  );
}

interface ChatMessageItemProps {
  message: AiChatMessage;
  isOwn: boolean;
}

function ChatMessageItem({ message, isOwn }: ChatMessageItemProps) {
  const time = formatChatTime(message.timestamp);
  const isAi = message.senderId === AI_AGENT_USER_ID;
  const isSystem = message.role === "system";
  const senderLabel = isOwn ? "You" : message.sender;

  return (
    <li
      className={cn(
        "flex flex-col gap-1",
        isOwn ? "items-end" : "items-start",
      )}
    >
      <div className="flex items-center gap-2 text-[11px]">
        <span
          className={cn(
            "font-medium",
            isAi ? "text-ai-text" : "text-copy-secondary",
          )}
        >
          {senderLabel}
        </span>
        <span className="text-copy-faint">{time}</span>
      </div>
      <div
        className={cn(
          "flex max-w-[85%] items-start gap-1.5 rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap wrap-anywhere",
          isOwn
            ? "bg-accent-chat text-[var(--bg-base)]"
            : isSystem
              ? "border border-error/40 bg-elevated text-error"
              : isAi
                ? "border border-surface-border bg-elevated text-copy-primary"
                : "border border-surface-border bg-elevated text-copy-primary",
        )}
      >
        {isAi ? (
          <Bot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ai-text" />
        ) : null}
        <span>{message.content}</span>
      </div>
    </li>
  );
}

function ChatEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-2 py-6 text-center">
      <span
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-subtle text-copy-secondary"
      >
        <MessageSquare className="h-6 w-6" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-copy-primary">No messages yet</p>
        <p className="text-xs text-copy-muted">
          Start a conversation with everyone in this room.
        </p>
      </div>
    </div>
  );
}

function formatChatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DemoSpecCard() {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-surface-border bg-elevated p-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-dim text-brand"
        >
          <FileText className="h-5 w-5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 className="truncate text-sm font-medium text-copy-primary">
            E-commerce Platform Spec
          </h3>
          <p className="text-[11px] text-copy-faint">
            Generated 2 minutes ago
          </p>
        </div>
      </div>
      <p className="line-clamp-3 text-xs text-copy-muted">
        Outlines the shopping cart, checkout, and inventory services along
        with their API contracts, data models, and event flows.
      </p>
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          disabled
          aria-label="Download spec"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </Button>
      </div>
    </article>
  );
}
