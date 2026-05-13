"use client";
import { STICKY_COLORS } from "@/lib/colors";

type Props = { onPick: (c: string) => void };

export function ColorPopover({ onPick }: Props) {
  return (
    <div className="absolute right-3 top-3 z-10 flex gap-1 rounded-full border bg-white p-1 shadow">
      {STICKY_COLORS.map((c) => (
        <button
          key={c}
          onClick={() => onPick(c)}
          className="h-6 w-6 rounded-full border"
          style={{ backgroundColor: c }}
          aria-label={`Color ${c}`}
        />
      ))}
    </div>
  );
}
