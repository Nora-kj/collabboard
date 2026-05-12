"use client";
import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect } from "react-konva";
import type Konva from "konva";
import { type Camera, zoomAround } from "./camera";
import { useYDoc, useObjects, useZOrder } from "@/store/yjs-bindings";

const INITIAL_CAMERA: Camera = { x: 0, y: 0, scale: 1 };

export function Board() {
  const bundle = useYDoc();
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [camera, setCamera] = useState<Camera>(INITIAL_CAMERA);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ camX: number; camY: number; ptrX: number; ptrY: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({ width: el.clientWidth, height: el.clientHeight });
    });
    ro.observe(el);
    setSize({ width: el.clientWidth, height: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition() ?? { x: size.width / 2, y: size.height / 2 };
    if (e.evt.ctrlKey || e.evt.metaKey) {
      const factor = e.evt.deltaY < 0 ? 1.05 : 1 / 1.05;
      setCamera((cam) => zoomAround(cam, pointer, factor));
    } else {
      setCamera((cam) => ({ ...cam, x: cam.x - e.evt.deltaX, y: cam.y - e.evt.deltaY }));
    }
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button !== 1) return;
    e.evt.preventDefault();
    setIsPanning(true);
    panStart.current = {
      camX: camera.x, camY: camera.y,
      ptrX: e.evt.clientX, ptrY: e.evt.clientY,
    };
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isPanning || !panStart.current) return;
    const dx = e.evt.clientX - panStart.current.ptrX;
    const dy = e.evt.clientY - panStart.current.ptrY;
    setCamera((cam) => ({ ...cam, x: panStart.current!.camX + dx, y: panStart.current!.camY + dy }));
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    panStart.current = null;
  };

  const objectIds = useObjects(bundle?.doc ?? null);
  const zOrder = useZOrder(bundle?.doc ?? null);
  const orderedIds = zOrder.length === objectIds.length ? zOrder : objectIds;

  return (
    <div ref={containerRef} className="h-full w-full overflow-hidden bg-neutral-100">
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        x={camera.x}
        y={camera.y}
        scaleX={camera.scale}
        scaleY={camera.scale}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer listening={false}>
          <Rect x={-1} y={-1} width={2} height={2} fill="#888" />
        </Layer>
        <Layer>
          {orderedIds.map((id) => (
            <Rect key={`pl-${id}`} x={0} y={0} width={0} height={0} />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
