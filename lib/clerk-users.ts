import { clerkClient } from "@clerk/nextjs/server";

export interface CollaboratorRecord {
  id: string;
  email: string;
  createdAt: Date;
}

export interface EnrichedCollaborator {
  id: string;
  email: string;
  displayName: string | null;
  imageUrl: string | null;
}

export async function enrichCollaborators(
  rows: CollaboratorRecord[],
): Promise<EnrichedCollaborator[]> {
  if (rows.length === 0) return [];

  const emails = Array.from(
    new Set(rows.map((row) => row.email.toLowerCase())),
  );
  const users = await fetchUsersByEmails(emails);

  return rows.map((row) => {
    const user = users.get(row.email.toLowerCase());
    return {
      id: row.id,
      email: row.email,
      displayName: user ? buildDisplayName(user) : null,
      imageUrl: user?.imageUrl ?? null,
    };
  });
}

interface ClerkUserSummary {
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  imageUrl: string;
  emailAddresses: ReadonlyArray<{ emailAddress: string }>;
}

async function fetchUsersByEmails(
  emails: string[],
): Promise<Map<string, ClerkUserSummary>> {
  const result = new Map<string, ClerkUserSummary>();
  if (emails.length === 0) return result;

  try {
    const client = await clerkClient();
    const { data } = await client.users.getUserList({
      emailAddress: emails,
      limit: Math.min(Math.max(emails.length, 10) * 2, 500),
    });

    const wanted = new Set(emails);
    for (const user of data) {
      for (const entry of user.emailAddresses ?? []) {
        const key = entry.emailAddress.toLowerCase();
        if (wanted.has(key) && !result.has(key)) {
          result.set(key, {
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            imageUrl: user.imageUrl,
            emailAddresses: user.emailAddresses,
          });
        }
      }
    }
  } catch {
    // Soft-fail: dialog will fall back to email-only display.
  }

  return result;
}

function buildDisplayName(user: ClerkUserSummary): string | null {
  const fullName = [user.firstName, user.lastName]
    .filter((part): part is string => Boolean(part))
    .join(" ")
    .trim();
  if (fullName) return fullName;
  if (user.username) return user.username;
  return null;
}
