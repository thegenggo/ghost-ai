import { Liveblocks } from "@liveblocks/node";

const globalForLiveblocks = globalThis as unknown as {
  liveblocks: Liveblocks | undefined;
};

export function getLiveblocksClient(): Liveblocks {
  if (globalForLiveblocks.liveblocks) {
    return globalForLiveblocks.liveblocks;
  }

  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET_KEY is not set");
  }

  const client = new Liveblocks({ secret });
  if (process.env.NODE_ENV !== "production") {
    globalForLiveblocks.liveblocks = client;
  }
  return client;
}

const CURSOR_COLORS = [
  "#52A8FF",
  "#BF7AF0",
  "#FF990A",
  "#FF6166",
  "#F75F8F",
  "#62C073",
  "#0AC7B4",
  "#FBBF24",
] as const;

export function getCursorColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % CURSOR_COLORS.length;
  return CURSOR_COLORS[index];
}
