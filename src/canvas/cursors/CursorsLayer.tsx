"use client";
import { Layer, Group, Path, Text, Rect } from "react-konva";
import { useOthers } from "@/store/liveblocks";
import type { Camera } from "../camera";

const CURSOR_PATH = "M0 0 L0 16 L4 12 L7 18 L9 17 L6 11 L11 11 Z";

type Props = { camera: Camera };

export function CursorsLayer({ camera }: Props) {
  const others = useOthers();
  return (
    <Layer listening={false}>
      {others.map((other) => {
        const c = other.presence.cursor;
        if (!c) return null;
        const name = other.info?.name ?? "Guest";
        const color = other.info?.color ?? "#3b82f6";
        const labelW = Math.min(160, 8 + name.length * 7);
        const inv = 1 / camera.scale;
        return (
          <Group key={other.connectionId} x={c.x} y={c.y} scaleX={inv} scaleY={inv} listening={false}>
            <Path data={CURSOR_PATH} fill={color} stroke="#ffffff" strokeWidth={1.5} />
            <Group x={14} y={14}>
              <Rect width={labelW} height={20} fill={color} cornerRadius={4} />
              <Text text={name} x={6} y={3} fill="#ffffff" fontSize={12} />
            </Group>
          </Group>
        );
      })}
    </Layer>
  );
}
