"use client";
import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
  throttle: 16,
});

export type ObjectType = "sticky" | "rect";

export type StickyFields = {
  type: "sticky";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  rotation: number;
  z: number;
  createdBy: string;
  // text lives in a separate Y.Text inside the same object Y.Map at key "text"
};

export type RectFields = {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  rotation: number;
  z: number;
  createdBy: string;
};

export type Presence = {
  cursor: { x: number; y: number } | null;
  selection: string[];
  name: string;
  color: string;
};

export type UserMeta = {
  id: string;
  info: { name: string; color: string };
};

export const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useUpdateMyPresence,
  useOthers,
  useSelf,
  useStatus,
} = createRoomContext<Presence, never, UserMeta>(client);
