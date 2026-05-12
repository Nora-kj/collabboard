export type Camera = { x: number; y: number; scale: number };
export type Point = { x: number; y: number };

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 4;

export const clampZoom = (s: number): number =>
  Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, s));

export const screenToWorld = (p: Point, cam: Camera): Point => ({
  x: (p.x - cam.x) / cam.scale,
  y: (p.y - cam.y) / cam.scale,
});

export const worldToScreen = (p: Point, cam: Camera): Point => ({
  x: p.x * cam.scale + cam.x,
  y: p.y * cam.scale + cam.y,
});

export const zoomAround = (cam: Camera, screenAnchor: Point, factor: number): Camera => {
  const nextScale = clampZoom(cam.scale * factor);
  const realFactor = nextScale / cam.scale;
  return {
    scale: nextScale,
    x: screenAnchor.x - (screenAnchor.x - cam.x) * realFactor,
    y: screenAnchor.y - (screenAnchor.y - cam.y) * realFactor,
  };
};
