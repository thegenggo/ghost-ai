import { LiveblocksError } from "@liveblocks/node";
import { currentUser } from "@clerk/nextjs/server";

import { getCursorColor, getLiveblocksClient } from "@/lib/liveblocks";
import { checkProjectAccess, getCurrentIdentity } from "@/lib/project-access";

export async function POST(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await readJsonBody(request);
  if (body === null) {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const room = readTrimmedString(body, "room");
  if (!room) {
    return Response.json({ error: "Missing room" }, { status: 400 });
  }

  const access = await checkProjectAccess(room, identity);
  if (!access) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const liveblocks = getLiveblocksClient();

  try {
    await liveblocks.getOrCreateRoom(access.id, {
      defaultAccesses: [],
      metadata: { name: access.name },
    });
  } catch (error) {
    if (error instanceof LiveblocksError) {
      return Response.json(
        { error: "Failed to provision room" },
        { status: 502 },
      );
    }
    throw error;
  }

  const user = await currentUser();
  const name = buildDisplayName(user) ?? identity.primaryEmail ?? identity.userId;
  const avatar = user?.imageUrl;
  const color = getCursorColor(identity.userId);

  const session = liveblocks.prepareSession(identity.userId, {
    userInfo: { name, color, ...(avatar ? { avatar } : {}) },
  });
  session.allow(access.id, session.FULL_ACCESS);

  const { status, body: tokenBody } = await session.authorize();
  return new Response(tokenBody, { status });
}

async function readJsonBody(
  request: Request,
): Promise<Record<string, unknown> | null> {
  try {
    const value = await request.json();
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
  } catch {
    // fall through
  }
  return null;
}

function readTrimmedString(
  body: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = body[key];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

interface ClerkUserLike {
  firstName: string | null;
  lastName: string | null;
  username: string | null;
}

function buildDisplayName(user: ClerkUserLike | null): string | null {
  if (!user) return null;
  const fullName = [user.firstName, user.lastName]
    .filter((part): part is string => Boolean(part))
    .join(" ")
    .trim();
  if (fullName) return fullName;
  if (user.username) return user.username;
  return null;
}
