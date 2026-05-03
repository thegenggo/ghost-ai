# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Foundation / Design System

## Current Goal

- Ready for Feature 02.

## Completed

- Feature 01: Design System — shadcn/ui installed and initialized (Tailwind v4), all 7 components added (Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea), lucide-react installed, lib/utils.ts with cn() created, globals.css updated with full dark theme palette (--bg-base through --state-warning), shadcn semantic variables mapped to design system tokens, dark class applied to html element.

## In Progress

- None.

## Next Up

- Feature 02 (TBD) — see feature-specs directory.

## Open Questions

- None.

## Architecture Decisions

- Using shadcn/ui on Tailwind v4 with CSS-variable-based dark theme (dark only, no light mode).
- All color tokens defined as CSS custom properties in globals.css; shadcn semantic vars (--background, --primary, etc.) point to design system vars (--bg-base, --accent-primary, etc.).
- @theme inline maps design system tokens to Tailwind utilities: bg-surface, text-copy-primary, border-surface-border, text-brand, bg-brand-dim, etc.
- html element carries class="dark" so shadcn dark: variants always activate.

## Session Notes

- Do not modify components/ui/* after installation per ai-workflow-rules.md.
- Design system palette is defined in globals.css :root; all other files reference tokens, never raw hex values.
