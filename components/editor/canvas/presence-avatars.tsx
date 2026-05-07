"use client";

import { UserButton, useAuth } from "@clerk/nextjs";
import { shallow, useOthersMapped } from "@liveblocks/react/suspense";

const AVATAR_SIZE = 28;
const MAX_VISIBLE = 5;

export function PresenceAvatars() {
  const { userId } = useAuth();

  const others = useOthersMapped(
    (other) => ({
      id: other.id,
      name: other.info?.name ?? "",
      avatar: other.info?.avatar,
      color: other.info?.color ?? "#52A8FF",
    }),
    shallow,
  );

  const collaborators = others.filter(([, info]) => info.id !== userId);
  const visible = collaborators.slice(0, MAX_VISIBLE);
  const overflowCount = collaborators.length - visible.length;

  const hasCollaborators = collaborators.length > 0;

  return (
    <div
      className="flex items-center gap-2 rounded-full border border-surface-border bg-elevated/95 px-2 py-1 shadow-lg backdrop-blur"
      role="group"
      aria-label="Active participants"
    >
      {hasCollaborators ? (
        <div className="flex items-center -space-x-2">
          {visible.map(([connectionId, info]) => (
            <CollaboratorAvatar
              key={connectionId}
              name={info.name}
              avatar={info.avatar}
              color={info.color}
            />
          ))}
          {overflowCount > 0 ? (
            <div
              className="relative flex items-center justify-center rounded-full bg-subtle text-[11px] font-medium text-copy-secondary ring-2 ring-elevated"
              style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
              aria-label={`${overflowCount} more participant${
                overflowCount === 1 ? "" : "s"
              }`}
              title={`${overflowCount} more`}
            >
              +{overflowCount}
            </div>
          ) : null}
        </div>
      ) : null}

      {hasCollaborators ? (
        <span aria-hidden className="h-5 w-px bg-surface-border" />
      ) : null}

      <div
        className="flex items-center justify-center"
        style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
      >
        <UserButton
          appearance={{
            elements: {
              avatarBox: { width: AVATAR_SIZE, height: AVATAR_SIZE },
            },
          }}
        />
      </div>
    </div>
  );
}

interface CollaboratorAvatarProps {
  name: string;
  avatar?: string;
  color: string;
}

function CollaboratorAvatar({ name, avatar, color }: CollaboratorAvatarProps) {
  const initials = getInitials(name);

  return (
    <div
      className="relative overflow-hidden rounded-full ring-2 ring-elevated"
      style={{
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        backgroundColor: color,
      }}
      aria-label={name || "Participant"}
      title={name || "Participant"}
    >
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[11px] font-medium text-white">
          {initials}
        </div>
      )}
    </div>
  );
}

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return parts[0]!.charAt(0).toUpperCase();
  }
  return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
}
