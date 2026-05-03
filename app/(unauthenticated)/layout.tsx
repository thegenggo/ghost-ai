import type { ReactNode } from "react";

import { AuthMarketingPanel } from "@/components/auth/auth-marketing-panel";

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
