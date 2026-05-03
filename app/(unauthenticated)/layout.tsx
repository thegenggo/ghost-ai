import type { ReactNode } from "react";

import { AuthMarketingPanel } from "@/components/auth/auth-marketing-panel";

/**
 * Renders a responsive two-column layout intended for unauthenticated pages.
 *
 * The layout shows a marketing panel in the left column on large screens and places
 * `children` centered in the main column.
 *
 * @param children - Content to render in the main column of the layout
 * @returns The layout's JSX element wrapping the provided `children`
 */
export default function UnauthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-base lg:grid-cols-2">
      <aside className="hidden bg-surface lg:block">
        <AuthMarketingPanel />
      </aside>
      <main className="flex items-center justify-center px-6 py-12">
        {children}
      </main>
    </div>
  );
}
