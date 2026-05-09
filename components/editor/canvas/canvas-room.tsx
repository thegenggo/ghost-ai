"use client";

import {
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";
import type { ReactNode } from "react";

interface CanvasRoomProps {
  roomId: string;
  children: ReactNode;
}

export function CanvasRoom({ roomId, children }: CanvasRoomProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, thinking: false }}
      >
        {children}
      </RoomProvider>
    </LiveblocksProvider>
  );
}
