import { FileText, Sparkles, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: FeatureItem[] = [
  {
    icon: Sparkles,
    title: "AI Architecture Generation",
    description:
      "Describe your system, AI maps it to nodes and edges on a live canvas.",
  },
  {
    icon: Users,
    title: "Real-time Collaboration",
    description:
      "Live cursors, presence indicators, and shared node editing across your team.",
  },
  {
    icon: FileText,
    title: "Instant Spec Generation",
    description:
      "Export a complete Markdown technical spec directly from the canvas graph.",
  },
];

export function AuthMarketingPanel() {
  return (
    <div className="flex h-full flex-col justify-between gap-12 px-12 py-12">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-md bg-brand"
        />
        <span className="font-sans text-lg font-semibold tracking-tight text-copy-primary">
          Ghost AI
        </span>
      </div>

      <div className="space-y-12">
        <div className="space-y-4">
          <h1 className="font-sans text-4xl font-semibold leading-tight tracking-tight text-copy-primary">
            Design systems at the
            <br />
            speed of thought.
          </h1>
          <p className="max-w-md leading-relaxed text-copy-secondary">
            Describe your architecture in plain English. Ghost AI maps it to a
            shared canvas your whole team can refine in real time.
          </p>
        </div>

        <ul className="space-y-6">
          {features.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex items-start gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-dim">
                <Icon className="h-4 w-4 text-brand" />
              </span>
              <div className="space-y-1">
                <p className="font-sans text-sm font-semibold text-copy-primary">
                  {title}
                </p>
                <p className="text-sm text-copy-muted">{description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-copy-faint">
        © {new Date().getFullYear()} Ghost AI. All rights reserved.
      </p>
    </div>
  );
}
