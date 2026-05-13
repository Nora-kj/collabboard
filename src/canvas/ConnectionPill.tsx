"use client";
import { useStatus } from "@/store/liveblocks";

const STYLES: Record<string, string> = {
  connected: "bg-green-500",
  connecting: "bg-yellow-500",
  reconnecting: "bg-yellow-500",
  disconnected: "bg-red-500",
  initial: "bg-neutral-400",
};

const LABELS: Record<string, string> = {
  connected: "live",
  connecting: "connecting…",
  reconnecting: "reconnecting…",
  disconnected: "offline",
  initial: "starting…",
};

export function ConnectionPill() {
  const status = useStatus();
  const cls = STYLES[status] ?? "bg-neutral-400";
  const label = LABELS[status] ?? status;
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-2 py-0.5 text-xs">
      <span className={`inline-block h-2 w-2 rounded-full ${cls}`} />
      {label}
    </span>
  );
}
