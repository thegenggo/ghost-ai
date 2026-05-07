"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useId,
  useState,
} from "react";
import {
  Bot,
  Download,
  FileText,
  Send,
  Sparkles,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
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

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
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
            <TabsTrigger value="specs" className={TAB_TRIGGER_CLASSES}>
              Specs
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent
          value="architect"
          className="flex min-h-0 flex-1 flex-col"
        >
          <ArchitectTab />
        </TabsContent>
        <TabsContent
          value="specs"
          className="flex min-h-0 flex-1 flex-col"
        >
          <SpecsTab />
        </TabsContent>
      </Tabs>
    </aside>
  );
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

function ArchitectTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const inputId = useId();

  const submit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${prev.length}`,
        role: "user",
        content: trimmed,
      },
    ]);
    setDraft("");
  };

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

  const handlePromptSelect = (prompt: string) => {
    setDraft(prompt);
  };

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
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                    message.role === "user"
                      ? "border-2 border-brand/50 bg-brand-dim text-copy-primary"
                      : "border border-surface-border bg-elevated text-ai-text"
                  )}
                >
                  {message.content}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
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
            placeholder="Describe a system to design..."
            rows={1}
            className="min-h-[72px] max-h-[160px] resize-none text-copy-primary"
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Send message"
            disabled={draft.trim().length === 0}
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

function SpecsTab() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-surface-border px-4 py-3">
        <Button
          type="button"
          size="default"
          className={cn(ACCENT_BUTTON_CLASSES, "w-full")}
        >
          <Sparkles className="h-4 w-4" />
          Generate Spec
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <DemoSpecCard />
      </div>
    </div>
  );
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
