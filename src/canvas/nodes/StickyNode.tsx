"use client";
import { useRef, useState } from "react";
import { Group, Rect, Text } from "react-konva";
import { Html } from "react-konva-utils";
import type Konva from "konva";
import { useObject, useYDoc } from "@/store/yjs-bindings";
import { moveObject, updateText } from "@/store/mutations";

type Props = { id: string; selected: boolean; onSelect: (id: string) => void };

export function StickyNode({ id, selected, onSelect }: Props) {
  const bundle = useYDoc();
  const obj = useObject(bundle?.doc ?? null, id);
  const [editing, setEditing] = useState(false);
  const groupRef = useRef<Konva.Group>(null);

  if (!obj || obj.type !== "sticky") return null;
  const x = obj.x as number, y = obj.y as number;
  const w = obj.width as number, h = obj.height as number;
  const color = obj.color as string;
  const text = (obj.text as string | undefined) ?? "";

  return (
    <Group
      ref={groupRef}
      x={x} y={y}
      draggable
      onClick={(e) => { e.cancelBubble = true; onSelect(id); }}
      onTap={(e) => { e.cancelBubble = true; onSelect(id); }}
      onDblClick={() => setEditing(true)}
      onDragEnd={(e) => {
        if (!bundle) return;
        moveObject(bundle.doc, id, e.target.x(), e.target.y());
      }}
    >
      <Rect
        width={w} height={h}
        fill={color} cornerRadius={6}
        shadowBlur={selected ? 12 : 4} shadowOpacity={0.15}
        stroke={selected ? "#3b82f6" : "transparent"} strokeWidth={2}
      />
      {!editing && (
        <Text
          text={text} x={12} y={12}
          width={w - 24} height={h - 24}
          fontSize={16} fill="#1f2937" wrap="word"
        />
      )}
      {editing && (
        <Html groupProps={{ x: 12, y: 12 }} divProps={{ style: { width: w - 24, height: h - 24 } }}>
          <textarea
            autoFocus
            defaultValue={text}
            onBlur={(e) => {
              if (bundle) updateText(bundle.doc, id, e.target.value);
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") (e.target as HTMLTextAreaElement).blur();
            }}
            style={{
              width: "100%", height: "100%", resize: "none", border: "none",
              background: "transparent", outline: "none", fontSize: 16, fontFamily: "inherit",
            }}
          />
        </Html>
      )}
    </Group>
  );
}
