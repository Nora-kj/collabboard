"use client";
import { useOthers, useSelf } from "@/store/liveblocks";

const initials = (name: string) =>
  name.split(/\s+/).map((p) => p[0]?.toUpperCase() ?? "").slice(0, 2).join("");

export function PresenceBar() {
  const self = useSelf();
  const others = useOthers();
  const selfPill = self ? (
    <Pill key="self" name={self.info?.name ?? "You"} color={self.info?.color ?? "#000"} you />
  ) : null;
  return (
    <div className="flex items-center gap-1">
      {selfPill}
      {others.map((o) => (
        <Pill key={o.connectionId} name={o.info?.name ?? "Guest"} color={o.info?.color ?? "#888"} />
      ))}
    </div>
  );
}

function Pill({ name, color, you = false }: { name: string; color: string; you?: boolean }) {
  return (
    <div
      title={name + (you ? " (you)" : "")}
      className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-medium text-white shadow"
      style={{ backgroundColor: color, marginLeft: -6 }}
    >
      {initials(name)}
    </div>
  );
}
