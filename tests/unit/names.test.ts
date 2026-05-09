import { describe, it, expect } from "vitest";
import { generateAnonymousName } from "@/auth/names";

describe("generateAnonymousName", () => {
  it("returns 'Anonymous <Animal>' format", () => {
    const name = generateAnonymousName();
    expect(name).toMatch(/^Anonymous [A-Z][a-z]+$/);
  });

  it("returns varying names across calls", () => {
    const names = new Set(Array.from({ length: 50 }, generateAnonymousName));
    expect(names.size).toBeGreaterThan(1);
  });
});
