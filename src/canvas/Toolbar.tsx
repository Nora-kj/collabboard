"use client";
import { type ToolId } from "./tools/select-tool";

type Props = { value: ToolId; onChange: (t: ToolId) => void };

const buttons: { id: ToolId; label: string }[] = [
  { id: "select", label: "Select" },
  { id: "sticky", label: "Sticky" },
  { id: "rect", label: "Rect" },
];

export function Toolbar({ value, onChange }: Props) {
  return (
    <div className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 gap-1 rounded-full border bg-white px-1 py-1 shadow">
      {buttons.map((b) => (
        <button
          key={b.id}
          onClick={() => onChange(b.id)}
          className={`rounded-full px-3 py-1 text-sm ${value === b.id ? "bg-black text-white" : "hover:bg-neutral-100"}`}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}
