"use client";
import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect } from "react-konva";
import type Konva from "konva";
import type * as Y from "yjs";
import { type Camera, zoomAround, screenToWorld } from "./camera";
import { useYDoc, useObjects, useZOrder } from "@/store/yjs-bindings";
import { useSelf } from "@/store/liveblocks";
import { StickyNode } from "./nodes/StickyNode";
import { RectNode } from "./nodes/RectNode";
import { Toolbar } from "./Toolbar";
import type { ToolId } from "./tools/select-tool";
import { createSticky, createRect } from "@/store/mutations";
import { STICKY_COLORS } from "@/lib/colors";

const INITIAL_CAMERA: Camera = { x: 0, y: 0, scale: 1 };

export function Board() {
  const bundle = useYDoc();
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [camera, setCamera] = useState<Camera>(INITIAL_CAMERA);
  const [isPanning, setIsPanning] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<ToolId>("select");
  const self = useSelf();
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
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-neutral-100">
      <Toolbar value={tool} onChange={setTool} />
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        x={camera.x}
        y={camera.y}
        scaleX={camera.scale}
        scaleY={camera.scale}
        onWheel={handleWheel}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) setSelectedId(null);
          handleMouseDown(e);
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={(e) => {
          if (tool === "select") return;
          if (!bundle || !self) return;
          const stage = e.target.getStage();
          const pointer = stage?.getPointerPosition();
          if (!pointer) return;
          const world = screenToWorld(pointer, camera);
          if (tool === "sticky") {
            createSticky(bundle.doc, {
              x: world.x - 90, y: world.y - 90,
              color: STICKY_COLORS[0]!, text: "",
              createdBy: self.id,
            });
          } else if (tool === "rect") {
            createRect(bundle.doc, {
              x: world.x - 60, y: world.y - 40,
              width: 120, height: 80,
              color: "#3b82f6",
              createdBy: self.id,
            });
          }
          setTool("select");
        }}
      >
        <Layer listening={false}>
          <Rect x={-1} y={-1} width={2} height={2} fill="#888" />
        </Layer>
        <Layer>
          {orderedIds.map((id) => {
            const obj = bundle?.doc.getMap<Y.Map<unknown>>("objects").get(id);
            const type = obj?.get("type");
            if (type === "sticky") return <StickyNode key={id} id={id} selected={selectedId === id} onSelect={setSelectedId} />;
            if (type === "rect") return <RectNode key={id} id={id} selected={selectedId === id} onSelect={setSelectedId} />;
            return null;
          })}
        </Layer>
      </Stage>
    </div>
  );
}
