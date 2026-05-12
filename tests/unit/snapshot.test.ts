import { describe, it, expect } from "vitest";
import * as Y from "yjs";
import { createSticky, createRect } from "@/store/mutations";
import { boardSnapshot } from "@/store/snapshot";

describe("boardSnapshot", () => {
  it("returns objects + zOrder as plain JSON", () => {
    const doc = new Y.Doc();
    const a = createSticky(doc, { x: 10, y: 10, color: "#fef08a", text: "hello", createdBy: "u1" });
    const b = createRect(doc, { x: 100, y: 100, width: 80, height: 50, color: "#3b82f6", createdBy: "u1" });
    const snap = boardSnapshot(doc);
    expect(snap.zOrder).toEqual([a, b]);
    expect(snap.objects[a]).toMatchObject({ type: "sticky", x: 10, text: "hello" });
    expect(snap.objects[b]).toMatchObject({ type: "rect", width: 80 });
  });
});
