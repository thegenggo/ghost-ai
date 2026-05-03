import type { ReactNode } from "react";

import { EditorShell } from "@/components/editor/editor-shell";

export default function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <EditorShell>{children}</EditorShell>;
}
