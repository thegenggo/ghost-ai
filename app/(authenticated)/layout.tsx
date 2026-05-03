import type { ReactNode } from "react";

import { EditorShell } from "@/components/editor/editor-shell";

/**
 * Wraps provided content in the EditorShell to form the authenticated application layout.
 *
 * @param children - Content to render inside the authenticated layout
 * @returns A React element that renders `children` within `EditorShell`
 */
export default function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <EditorShell>{children}</EditorShell>;
}
