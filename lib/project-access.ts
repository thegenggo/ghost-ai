import { auth, currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export interface CurrentIdentity {
  userId: string;
  primaryEmail: string | null;
  emails: string[];
}

export type ProjectOwnership = "owned" | "shared";

export interface ProjectAccess {
  id: string;
  name: string;
  ownership: ProjectOwnership;
}

export async function getCurrentIdentity(): Promise<CurrentIdentity | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const emails =
    user?.emailAddresses?.map((entry) => entry.emailAddress) ?? [];
  const primaryEmail =
    user?.primaryEmailAddress?.emailAddress ?? emails[0] ?? null;

  return { userId, primaryEmail, emails };
}

export async function checkProjectAccess(
  projectId: string,
  identity: CurrentIdentity,
): Promise<ProjectAccess | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      ownerId: true,
      collaborators: { select: { email: true } },
    },
  });
  if (!project) return null;

  if (project.ownerId === identity.userId) {
    return { id: project.id, name: project.name, ownership: "owned" };
  }

  if (identity.emails.length > 0) {
    const lowered = new Set(
      identity.emails.map((email) => email.toLowerCase()),
    );
    const isCollaborator = project.collaborators.some((entry) =>
      lowered.has(entry.email.toLowerCase()),
    );
    if (isCollaborator) {
      return { id: project.id, name: project.name, ownership: "shared" };
    }
  }

  return null;
}
