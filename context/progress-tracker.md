# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Editor Chrome

## Current Goal

- Ready for Feature 03.

## Completed

- Feature 01: Design System — shadcn/ui installed and initialized (Tailwind v4), all 7 components added (Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea), lucide-react installed, lib/utils.ts with cn() created, globals.css updated with full dark theme palette (--bg-base through --state-warning), shadcn semantic variables mapped to design system tokens, dark class applied to html element.
- Feature 02: Editor Chrome — `components/editor/editor-navbar.tsx` (fixed-height top bar with left/center/right sections and `PanelLeftOpen`/`PanelLeftClose` toggle), `components/editor/project-sidebar.tsx` (floating overlay with slide-in animation, My Projects / Shared tabs with empty placeholders, full-width New Project button with `Plus` icon), `components/editor/editor-dialog.tsx` (reusable dialog wrapper with title/description/footer slots using design tokens). Added missing `--color-base` token to `app/globals.css` so the documented `bg-base` utility resolves.

## In Progress

- None.

## Next Up

- Feature 03 (TBD) — see feature-specs directory.

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
