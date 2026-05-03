import { auth, currentUser } from "@clerk/nextjs/server";

import type { Project } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type ProjectOwnership = "owned" | "shared";

export interface ProjectListItem {
  id: string;
  name: string;
  ownership: ProjectOwnership;
}

export interface UserProjects {
  owned: ProjectListItem[];
  shared: ProjectListItem[];
}

export async function getUserProjects(): Promise<UserProjects> {
  const { userId } = await auth();
  if (!userId) {
    return { owned: [], shared: [] };
  }

  const user = await currentUser();
  const emails =
    user?.emailAddresses?.map((entry) => entry.emailAddress) ?? [];

  const ownedQuery = prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });

  const sharedQuery: Promise<Project[]> =
    emails.length === 0
      ? Promise.resolve([])
      : prisma.project.findMany({
          where: {
            ownerId: { not: userId },
            collaborators: { some: { email: { in: emails } } },
          },
          orderBy: { createdAt: "desc" },
        });

  const [owned, shared] = await Promise.all([ownedQuery, sharedQuery]);

  return {
    owned: owned.map((project) => toListItem(project, "owned")),
    shared: shared.map((project) => toListItem(project, "shared")),
  };
}

function toListItem(project: Project, ownership: ProjectOwnership): ProjectListItem {
  return { id: project.id, name: project.name, ownership };
}
