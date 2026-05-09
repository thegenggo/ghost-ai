import type { AiStatusEvent } from "@/lib/ai-agent";
import type { AiChatEvent } from "@/types/tasks";

declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
      thinking: boolean;
    };

    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar?: string;
        color: string;
      };
    };

    RoomEvent: AiStatusEvent | AiChatEvent;
  }
}

export {};
