import * as Y from "yjs";
import { createId } from "@/lib/ids";

const STICKY_DEFAULT_W = 180;
const STICKY_DEFAULT_H = 180;

export type CreateStickyArgs = {
  x: number;
  y: number;
  color: string;
  text?: string;
  createdBy: string;
};

export type CreateRectArgs = {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  createdBy: string;
};

const objects = (doc: Y.Doc) => doc.getMap<Y.Map<unknown>>("objects");
const zOrder = (doc: Y.Doc) => doc.getArray<string>("zOrder");

export const createSticky = (doc: Y.Doc, args: CreateStickyArgs): string => {
  const id = createId();
  doc.transact(() => {
    const map = new Y.Map<unknown>();
    map.set("type", "sticky");
    map.set("x", args.x);
    map.set("y", args.y);
    map.set("width", STICKY_DEFAULT_W);
    map.set("height", STICKY_DEFAULT_H);
    map.set("color", args.color);
    map.set("rotation", 0);
    map.set("z", zOrder(doc).length);
    map.set("createdBy", args.createdBy);
    const text = new Y.Text();
    if (args.text) text.insert(0, args.text);
    map.set("text", text);
    objects(doc).set(id, map);
    zOrder(doc).push([id]);
  });
  return id;
};

export const createRect = (doc: Y.Doc, args: CreateRectArgs): string => {
  const id = createId();
  doc.transact(() => {
    const map = new Y.Map<unknown>();
    map.set("type", "rect");
    map.set("x", args.x);
    map.set("y", args.y);
    map.set("width", args.width);
    map.set("height", args.height);
    map.set("color", args.color);
    map.set("rotation", 0);
    map.set("z", zOrder(doc).length);
    map.set("createdBy", args.createdBy);
    objects(doc).set(id, map);
    zOrder(doc).push([id]);
  });
  return id;
};

export const moveObject = (doc: Y.Doc, id: string, x: number, y: number): void => {
  const obj = objects(doc).get(id);
  if (!obj) return;
  doc.transact(() => {
    obj.set("x", x);
    obj.set("y", y);
  });
};

export const resizeObject = (doc: Y.Doc, id: string, width: number, height: number): void => {
  const obj = objects(doc).get(id);
  if (!obj) return;
  doc.transact(() => {
    obj.set("width", width);
    obj.set("height", height);
  });
};

export const updateText = (doc: Y.Doc, id: string, value: string): void => {
  const obj = objects(doc).get(id);
  if (!obj) return;
  const text = obj.get("text") as Y.Text | undefined;
  if (!text) return;
  doc.transact(() => {
    text.delete(0, text.length);
    text.insert(0, value);
  });
};

export const changeColor = (doc: Y.Doc, id: string, color: string): void => {
  const obj = objects(doc).get(id);
  if (!obj) return;
  doc.transact(() => obj.set("color", color));
};

export const deleteObject = (doc: Y.Doc, id: string): void => {
  doc.transact(() => {
    objects(doc).delete(id);
    const z = zOrder(doc);
    const idx = z.toArray().indexOf(id);
    if (idx >= 0) z.delete(idx, 1);
  });
};
