import { describe, it, expect } from "vitest";
import { screenToWorld, worldToScreen, zoomAround, clampZoom } from "@/canvas/camera";

const cam = { x: 100, y: 50, scale: 2 };

describe("screenToWorld / worldToScreen", () => {
  it("inverts each other", () => {
    const world = { x: 320, y: 200 };
    const screen = worldToScreen(world, cam);
    const back = screenToWorld(screen, cam);
    expect(back.x).toBeCloseTo(world.x);
    expect(back.y).toBeCloseTo(world.y);
  });
});

describe("clampZoom", () => {
  it("clamps to [0.1, 4]", () => {
    expect(clampZoom(0.05)).toBe(0.1);
    expect(clampZoom(10)).toBe(4);
    expect(clampZoom(1)).toBe(1);
  });
});

describe("zoomAround", () => {
  it("keeps the world point under the cursor stable", () => {
    const screenAnchor = { x: 400, y: 300 };
    const before = screenToWorld(screenAnchor, cam);
    const next = zoomAround(cam, screenAnchor, 1.25);
    const after = screenToWorld(screenAnchor, next);
    expect(after.x).toBeCloseTo(before.x);
    expect(after.y).toBeCloseTo(before.y);
    expect(next.scale).toBeCloseTo(2.5);
  });
});
