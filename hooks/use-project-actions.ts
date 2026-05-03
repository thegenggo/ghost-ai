"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { slugify } from "@/lib/slugify";
import type { ProjectListItem } from "@/lib/projects";

type DialogKind = "create" | "rename" | "delete" | null;

export interface UseProjectActions {
  dialog: DialogKind;
  isLoading: boolean;

  createName: string;
  createRoomId: string;
  setCreateName: (name: string) => void;

  renameTarget: ProjectListItem | null;
  renameName: string;
  setRenameName: (name: string) => void;

  deleteTarget: ProjectListItem | null;

  openCreate: () => void;
  openRename: (project: ProjectListItem) => void;
  openDelete: (project: ProjectListItem) => void;
  close: () => void;

  submitCreate: () => Promise<void>;
  submitRename: () => Promise<void>;
  submitDelete: () => Promise<void>;
}

const SUFFIX_LENGTH = 4;

function generateSuffix(): string {
  const random = Math.random().toString(36).slice(2, 2 + SUFFIX_LENGTH);
  return random.padEnd(SUFFIX_LENGTH, "0");
}

export function useProjectActions(): UseProjectActions {
  const router = useRouter();
  const pathname = usePathname();

  const [dialog, setDialog] = useState<DialogKind>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [createName, setCreateName] = useState("");
  const [createSuffix, setCreateSuffix] = useState("");

  const [renameTarget, setRenameTarget] = useState<ProjectListItem | null>(
    null,
  );
  const [renameName, setRenameName] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<ProjectListItem | null>(
    null,
  );

  const createRoomId = useMemo(() => {
    const slug = slugify(createName);
    if (!slug || !createSuffix) return "";
    return `${slug}-${createSuffix}`;
  }, [createName, createSuffix]);

  const close = useCallback(() => {
    setDialog(null);
    setIsLoading(false);
    setCreateName("");
    setCreateSuffix("");
    setRenameTarget(null);
    setRenameName("");
    setDeleteTarget(null);
  }, []);

  const openCreate = useCallback(() => {
    setCreateName("");
    setCreateSuffix(generateSuffix());
    setIsLoading(false);
    setDialog("create");
  }, []);

  const openRename = useCallback((project: ProjectListItem) => {
    setRenameTarget(project);
    setRenameName(project.name);
    setIsLoading(false);
    setDialog("rename");
  }, []);

  const openDelete = useCallback((project: ProjectListItem) => {
    setDeleteTarget(project);
    setIsLoading(false);
    setDialog("delete");
  }, []);

  const submitCreate = useCallback(async () => {
    const trimmed = createName.trim();
    if (!trimmed || !createRoomId) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: createRoomId, name: trimmed }),
      });
      if (!response.ok) {
        setIsLoading(false);
        return;
      }
      const data = (await response.json()) as { project?: { id?: string } };
      const projectId = data.project?.id ?? createRoomId;
      close();
      router.push(`/editor/${projectId}`);
    } catch {
      setIsLoading(false);
    }
  }, [createName, createRoomId, close, router]);

  const submitRename = useCallback(async () => {
    if (!renameTarget) return;
    const trimmed = renameName.trim();
    if (!trimmed || trimmed === renameTarget.name) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${renameTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!response.ok) {
        setIsLoading(false);
        return;
      }
      close();
      router.refresh();
    } catch {
      setIsLoading(false);
    }
  }, [renameTarget, renameName, close, router]);

  const submitDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setIsLoading(false);
        return;
      }
      const activePath = `/editor/${deleteTarget.id}`;
      const isActive =
        pathname === activePath || pathname?.startsWith(`${activePath}/`);
      close();
      if (isActive) {
        router.push("/editor");
      } else {
        router.refresh();
      }
    } catch {
      setIsLoading(false);
    }
  }, [deleteTarget, pathname, close, router]);

  return {
    dialog,
    isLoading,
    createName,
    createRoomId,
    setCreateName,
    renameTarget,
    renameName,
    setRenameName,
    deleteTarget,
    openCreate,
    openRename,
    openDelete,
    close,
    submitCreate,
    submitRename,
    submitDelete,
  };
}
