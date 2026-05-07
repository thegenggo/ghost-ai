"use client";

import { useAuth } from "@clerk/nextjs";
import { shallow, useOthersMapped } from "@liveblocks/react/suspense";
import { useViewport } from "@xyflow/react";

export function LiveCursors() {
  const { userId } = useAuth();
  const { x: vx, y: vy, zoom } = useViewport();

  const others = useOthersMapped(
    (other) => ({
      id: other.id,
      name: other.info?.name ?? "",
      color: other.info?.color ?? "#52A8FF",
      cursor: other.presence.cursor,
    }),
    shallow,
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {others.map(([connectionId, info]) => {
        if (info.id === userId || !info.cursor) return null;
        const screenX = info.cursor.x * zoom + vx;
        const screenY = info.cursor.y * zoom + vy;
        return (
          <Cursor
            key={connectionId}
            x={screenX}
            y={screenY}
            name={info.name}
            color={info.color}
          />
        );
      })}
    </div>
  );
}

interface CursorProps {
  x: number;
  y: number;
  name: string;
  color: string;
}

function Cursor({ x, y, name, color }: CursorProps) {
  return (
    <div
      className="absolute left-0 top-0 select-none"
      style={{
        transform: `translate(${x}px, ${y}px)`,
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block" }}
        aria-hidden
      >
        <path
          d="M3 2L17 9L10 11L7 17L3 2Z"
          fill={color}
          stroke="#0f0f10"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
      {name ? (
        <div
          className="ml-3 -mt-1 inline-block whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-medium text-white shadow-sm"
          style={{ backgroundColor: color }}
        >
          {name}
        </div>
      ) : null}
    </div>
  );
}
