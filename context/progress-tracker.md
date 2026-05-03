# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature 05 (Planning)

## Current Goal

- Ready for Feature 05.

## Completed

- Feature 01: Design System — shadcn/ui installed and initialized (Tailwind v4), all 7 components added (Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea), lucide-react installed, lib/utils.ts with cn() created, globals.css updated with full dark theme palette (--bg-base through --state-warning), shadcn semantic variables mapped to design system tokens, dark class applied to html element.
- Feature 02: Editor Chrome — `components/editor/editor-navbar.tsx` (fixed-height top bar with left/center/right sections and `PanelLeftOpen`/`PanelLeftClose` toggle), `components/editor/project-sidebar.tsx` (floating overlay with slide-in animation, My Projects / Shared tabs with empty placeholders, full-width New Project button with `Plus` icon), `components/editor/editor-dialog.tsx` (reusable dialog wrapper with title/description/footer slots using design tokens). Added missing `--color-base` token to `app/globals.css` so the documented `bg-base` utility resolves.
- Feature 03: Auth — installed `@clerk/ui`; wrapped `app/layout.tsx` with `ClerkProvider` using the `dark` theme from `@clerk/ui/themes`, overriding Clerk appearance variables with the app's CSS custom properties (no hardcoded colors); created `proxy.ts` at the project root using `clerkMiddleware` + `createRouteMatcher`, public matcher derived from `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_URL` env vars, all other routes protected via `auth.protect()`; updated `app/page.tsx` to redirect authenticated users to `/editor` and unauthenticated users to `/sign-in`; added Clerk's `<UserButton>` to the right section of `components/editor/editor-navbar.tsx`. Added `NEXT_PUBLIC_CLERK_SIGN_IN_URL` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL` to `.env.local`.
- Route-group restructure — split `app/` into `(authenticated)` and `(unauthenticated)` route groups (URLs unchanged). `(authenticated)/layout.tsx` mounts `components/editor/editor-shell.tsx` (new client wrapper that owns sidebar open/close state and assembles `EditorNavbar` + `ProjectSidebar` around `{children}`); `(authenticated)/editor/page.tsx` renders the placeholder inside that shell. `(unauthenticated)/layout.tsx` owns the two-panel grid + `AuthMarketingPanel`; `sign-in` and `sign-up` pages collapse to one-line `<SignIn />` / `<SignUp />` renders. `app/page.tsx` (the `/` redirect) stays at root. `npm run build` passes — routes resolve to `/`, `/editor`, `/sign-in/[[...sign-in]]`, `/sign-up/[[...sign-up]]`.
- Feature 04: Project Dialogs & Editor Home — added shadcn `dropdown-menu` (`components/ui/dropdown-menu.tsx`); `lib/slugify.ts` (NFKD + diacritic strip → lowercase kebab); `lib/mock-projects.ts` exports `MockProject` type and a 3-row `MOCK_PROJECTS` seed (2 owned, 1 shared); `hooks/use-project-dialogs.ts` is a single source of truth for dialog kind / target / loading / submit handlers (mock submits fake a 250ms delay then close); `components/editor/project-dialogs-context.tsx` exposes `openCreate`/`openRename`/`openDelete` to descendants; `components/editor/editor-home.tsx` (client) renders the `/editor` heading, description, and `New Project` button wired to context; `app/(authenticated)/editor/page.tsx` collapses to a single `<EditorHome />`; `components/editor/dialogs/{create,rename,delete}-project-dialog.tsx` mount/unmount via parent (state resets on remount, no setState-in-effect); Create has live slug preview; Rename auto-focuses + selects via stable ref callback and Enter submits via `<form>`; Delete has destructive-only confirm. `components/editor/project-sidebar.tsx` now lists projects per tab with hover-revealed `MoreHorizontal` dropdown (Rename + destructive Delete) for owned projects only, and a `md:hidden` backdrop scrim that closes the sidebar on tap. `components/editor/editor-shell.tsx` owns the dialog hook, provides the context, passes mock data + handlers into the sidebar, and conditionally mounts each dialog. `npm run lint` and `npm run build` pass.

## In Progress

- None.

## Next Up

- Feature 05 (TBD) — see feature-specs directory.

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
- React 19 lint rule `react-hooks/set-state-in-effect` blocks `setState` inside `useEffect`. For dialogs that need fresh state per open, mount/unmount conditionally from the parent rather than syncing props → state in an effect.
- `MOCK_PROJECTS` (in `lib/mock-projects.ts`) is placeholder seed data only — replace with real project queries once persistence lands.
