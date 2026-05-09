export const STICKY_COLORS = [
  "#fef08a", // yellow (default)
  "#fda4af", // pink
  "#bef264", // lime
  "#67e8f9", // cyan
  "#c4b5fd", // violet
  "#fdba74", // orange
] as const;

export const CURSOR_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
] as const;

export type StickyColor = (typeof STICKY_COLORS)[number];
export type CursorColor = (typeof CURSOR_COLORS)[number];

export const pickRandomCursorColor = (): CursorColor =>
  CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)]!;
