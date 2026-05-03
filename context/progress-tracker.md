# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Auth

## Current Goal

- Ready for Feature 04.

## Completed

- Feature 01: Design System — shadcn/ui installed and initialized (Tailwind v4), all 7 components added (Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea), lucide-react installed, lib/utils.ts with cn() created, globals.css updated with full dark theme palette (--bg-base through --state-warning), shadcn semantic variables mapped to design system tokens, dark class applied to html element.
- Feature 02: Editor Chrome — `components/editor/editor-navbar.tsx` (fixed-height top bar with left/center/right sections and `PanelLeftOpen`/`PanelLeftClose` toggle), `components/editor/project-sidebar.tsx` (floating overlay with slide-in animation, My Projects / Shared tabs with empty placeholders, full-width New Project button with `Plus` icon), `components/editor/editor-dialog.tsx` (reusable dialog wrapper with title/description/footer slots using design tokens). Added missing `--color-base` token to `app/globals.css` so the documented `bg-base` utility resolves.
- Feature 03: Auth — installed `@clerk/ui`; wrapped `app/layout.tsx` with `ClerkProvider` using the `dark` theme from `@clerk/ui/themes`, overriding Clerk appearance variables with the app's CSS custom properties (no hardcoded colors); created `proxy.ts` at the project root using `clerkMiddleware` + `createRouteMatcher`, public matcher derived from `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_URL` env vars, all other routes protected via `auth.protect()`; updated `app/page.tsx` to redirect authenticated users to `/editor` and unauthenticated users to `/sign-in`; added Clerk's `<UserButton>` to the right section of `components/editor/editor-navbar.tsx`. Added `NEXT_PUBLIC_CLERK_SIGN_IN_URL` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL` to `.env.local`.
- Route-group restructure — split `app/` into `(authenticated)` and `(unauthenticated)` route groups (URLs unchanged). `(authenticated)/layout.tsx` mounts `components/editor/editor-shell.tsx` (new client wrapper that owns sidebar open/close state and assembles `EditorNavbar` + `ProjectSidebar` around `{children}`); `(authenticated)/editor/page.tsx` renders the placeholder inside that shell. `(unauthenticated)/layout.tsx` owns the two-panel grid + `AuthMarketingPanel`; `sign-in` and `sign-up` pages collapse to one-line `<SignIn />` / `<SignUp />` renders. `app/page.tsx` (the `/` redirect) stays at root. `npm run build` passes — routes resolve to `/`, `/editor`, `/sign-in/[[...sign-in]]`, `/sign-up/[[...sign-up]]`.

## In Progress

- None.

## Next Up

- Feature 04 (TBD) — see feature-specs directory.

## Open Questions

- None.

## Architecture Decisions

- Using shadcn/ui on Tailwind v4 with CSS-variable-based dark theme (dark only, no light mode).
- All color tokens defined as CSS custom properties in globals.css; shadcn semantic vars (--background, --primary, etc.) point to design system vars (--bg-base, --accent-primary, etc.).
- @theme inline maps design system tokens to Tailwind utilities: bg-surface, text-copy-primary, border-surface-border, text-brand, bg-brand-dim, etc.
- html element carries class="dark" so shadcn dark: variants always activate.
- Auth uses Clerk via `@clerk/nextjs` and `@clerk/ui`; route protection lives in `proxy.ts` at the project root (Next.js 16 file-convention rename of `middleware.ts`). Protected-by-default, with sign-in / sign-up paths derived from `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_URL` exposed as public.
- `ClerkProvider` lives inside `<body>` in `app/layout.tsx` (required by `@clerk/nextjs` v7); appearance overrides reference the app's existing CSS variables — no hardcoded Clerk colors.

## Session Notes

- Do not modify components/ui/* after installation per ai-workflow-rules.md.
- Design system palette is defined in globals.css :root; all other files reference tokens, never raw hex values.
- Keep Clerk's default `<UserButton>` and built-in profile flows intact — do not rebuild Clerk internals.
