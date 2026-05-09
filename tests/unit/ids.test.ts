import { describe, it, expect } from "vitest";
import { createId } from "@/lib/ids";

describe("createId", () => {
  it("returns a string of length 12", () => {
    expect(createId()).toHaveLength(12);
  });

  it("returns unique ids", () => {
    const ids = new Set(Array.from({ length: 1000 }, createId));
    expect(ids.size).toBe(1000);
  });
});
