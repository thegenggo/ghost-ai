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

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "status";
  content: string;
  status?: "pending" | "complete" | "error";
}

interface ActiveRun {
  runId: string;
  accessToken: string;
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
  "bg-brand text-white hover:bg-brand/90 dark:hover:bg-brand/90";

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
      const validated = parseAiChatMessage(message);
      if (!validated) {
        setChatError("Message could not be sent");
        return false;
      }
      try {
        broadcast({ type: AI_CHAT_EVENT_TYPE, message: validated });
      } catch (caught) {
        const text =
          caught instanceof Error ? caught.message : "Failed to send message";
        setChatError(text);
        return false;
      }
      setChatMessages((prev) =>
        prev.some((msg) => msg.id === validated.id)
          ? prev
          : [...prev, validated],
      );
      setChatError(null);
      return true;
    },
    [broadcast, senderId, senderName],
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
      {feedState ? <FeedStatusBanner state={feedState} /> : null}
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
          <ArchitectTab projectId={projectId} isAiActive={isAiActive} />
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

interface FeedStatusBannerProps {
  state: FeedState;
}

function FeedStatusBanner({ state }: FeedStatusBannerProps) {
  const isActive = state.level === "start" || state.level === "processing";
  const fallback =
    state.level === "complete"
      ? "Design ready"
      : state.level === "error"
      ? "AI ran into an issue"
      : "Working...";
  const text = state.text || fallback;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "shrink-0 border-b border-surface-border px-4 py-2",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
          state.level === "error"
            ? "border-error/40 text-error"
            : state.level === "complete"
            ? "border-success/40 text-success"
            : "border-ai/40 text-ai-text",
        )}
      >
        <FeedStatusIcon level={state.level} />
        <span className="truncate">{text}</span>
        {isActive ? (
          <span className="sr-only">Generating</span>
        ) : null}
      </div>
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
  isAiActive: boolean;
}

function ArchitectTab({ projectId, isAiActive }: ArchitectTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();

  const updateAssistantMessage = useCallback(
    (
      runId: string,
      patch: { content?: string; status?: ChatMessage["status"] },
    ) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === runId
            ? {
                ...msg,
                content: patch.content ?? msg.content,
                status: patch.status ?? msg.status,
              }
            : msg,
        ),
      );
    },
    [],
  );

  const handleRunComplete = useCallback(
    (
      runId: string,
      summary: string | undefined,
      level: "complete" | "error",
    ) => {
      const fallback =
        level === "complete" ? "Design ready" : "Design failed";
      updateAssistantMessage(runId, {
        content: summary ?? fallback,
        status: level,
      });
      setActiveRun((current) =>
        current?.runId === runId ? null : current,
      );
    },
    [updateAssistantMessage],
  );

  const submit = useCallback(async () => {
    const trimmed = draft.trim();
    if (!trimmed || !projectId || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const userMessageId = `user-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: "user", content: trimmed },
    ]);
    setDraft("");

    try {
      const triggerResponse = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          projectId,
          roomId: projectId,
        }),
      });
      if (!triggerResponse.ok) {
        throw new Error(
          `Failed to start design agent (${triggerResponse.status})`,
        );
      }
      const { runId } = (await triggerResponse.json()) as { runId: string };

      const tokenResponse = await fetch("/api/ai/design/token", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ runId }),
      });
      if (!tokenResponse.ok) {
        throw new Error(
          `Failed to authorize design agent (${tokenResponse.status})`,
        );
      }
      const { token } = (await tokenResponse.json()) as { token: string };

      setMessages((prev) => [
        ...prev,
        {
          id: runId,
          role: "assistant",
          content: "Reading your prompt...",
          status: "pending",
        },
      ]);
      setActiveRun({ runId, accessToken: token });
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Something went wrong";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [draft, isSubmitting, projectId]);

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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <ArchitectEmptyState onSelectPrompt={handlePromptSelect} />
        ) : (
          <ul className="flex flex-col gap-3">
            {messages.map((message) => (
              <li
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <ChatBubble message={message} />
              </li>
            ))}
          </ul>
        )}
        {error ? (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-error">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </p>
        ) : null}
      </div>
      {activeRun ? (
        <RunSubscriber
          runId={activeRun.runId}
          accessToken={activeRun.accessToken}
          onStatus={updateAssistantMessage}
          onComplete={handleRunComplete}
        />
      ) : null}
      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-surface-border px-4 py-3"
      >
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

interface ChatBubbleProps {
  message: ChatMessage;
}

function ChatBubble({ message }: ChatBubbleProps) {
  if (message.role === "user") {
    return (
      <div className="max-w-[85%] rounded-2xl border-2 border-brand/50 bg-brand-dim px-3 py-2 text-sm whitespace-pre-wrap wrap-anywhere text-copy-primary">
        {message.content}
      </div>
    );
  }

  return (
    <div className="flex max-w-[85%] items-start gap-2">
      <div
        className={cn(
          "rounded-2xl border bg-elevated px-3 py-2 text-sm whitespace-pre-wrap wrap-anywhere text-ai-text",
          message.status === "error"
            ? "border-error/40"
            : message.status === "complete"
            ? "border-success/40"
            : "border-surface-border",
        )}
      >
        <span className="flex items-center gap-1.5">
          <AssistantIcon status={message.status} />
          <span>{message.content}</span>
        </span>
      </div>
    </div>
  );
}

function AssistantIcon({ status }: { status?: ChatMessage["status"] }) {
  if (status === "complete") {
    return <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />;
  }
  if (status === "error") {
    return <AlertCircle className="h-3.5 w-3.5 shrink-0 text-error" />;
  }
  if (status === "pending") {
    return <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-ai-text" />;
  }
  return <Bot className="h-3.5 w-3.5 shrink-0 text-ai-text" />;
}

interface RunSubscriberProps {
  runId: string;
  accessToken: string;
  onStatus: (
    runId: string,
    patch: { content?: string; status?: ChatMessage["status"] },
  ) => void;
  onComplete: (
    runId: string,
    summary: string | undefined,
    level: "complete" | "error",
  ) => void;
}

function RunSubscriber({
  runId,
  accessToken,
  onStatus,
  onComplete,
}: RunSubscriberProps) {
  const { run, error } = useRealtimeRun<typeof designAgentTask>(runId, {
    accessToken,
    onComplete: (completedRun, err) => {
      const summary =
        readMetadataString(completedRun?.metadata, "planSummary") ??
        readMetadataString(completedRun?.metadata, "message");
      const failed = Boolean(err) || completedRun?.status === "FAILED";
      onComplete(runId, summary, failed ? "error" : "complete");
    },
  });

  const statusMessage = run?.metadata
    ? readMetadataString(run.metadata, "message")
    : undefined;

  useEffect(() => {
    if (statusMessage) {
      onStatus(runId, { content: statusMessage, status: "pending" });
    }
  }, [statusMessage, onStatus, runId]);

  useEffect(() => {
    if (error) {
      onComplete(runId, error.message, "error");
    }
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
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
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
  return (
    <li
      className={cn(
        "flex flex-col gap-1",
        isOwn ? "items-end" : "items-start",
      )}
    >
      <div className="flex items-center gap-2 text-[11px]">
        <span className="font-medium text-copy-secondary">
          {isOwn ? "You" : message.sender}
        </span>
        <span className="text-copy-faint">{time}</span>
      </div>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap wrap-anywhere text-copy-primary",
          isOwn
            ? "border border-brand/40 bg-brand-dim"
            : "border border-surface-border bg-elevated",
        )}
      >
        {message.content}
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
