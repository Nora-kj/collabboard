"use client";
import { Rect } from "react-konva";
import { useObject, useYDoc } from "@/store/yjs-bindings";
import { moveObject } from "@/store/mutations";

type Props = { id: string; selected: boolean; onSelect: (id: string) => void };

export function RectNode({ id, selected, onSelect }: Props) {
  const bundle = useYDoc();
  const obj = useObject(bundle?.doc ?? null, id);
  if (!obj || obj.type !== "rect") return null;
  return (
    <Rect
      x={obj.x as number} y={obj.y as number}
      width={obj.width as number} height={obj.height as number}
      fill={obj.color as string}
      cornerRadius={4}
      stroke={selected ? "#3b82f6" : "transparent"}
      strokeWidth={2}
      draggable
      onClick={(e) => { e.cancelBubble = true; onSelect(id); }}
      onDragEnd={(e) => {
        if (!bundle) return;
        moveObject(bundle.doc, id, e.target.x(), e.target.y());
      }}
    />
  );
}
