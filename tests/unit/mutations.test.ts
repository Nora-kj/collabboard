import { describe, it, expect, beforeEach } from "vitest";
import * as Y from "yjs";
import {
  createSticky, createRect, moveObject, updateText, changeColor, deleteObject,
} from "@/store/mutations";

let doc: Y.Doc;
beforeEach(() => { doc = new Y.Doc(); });

describe("createSticky", () => {
  it("inserts an object map and appends to zOrder", () => {
    const id = createSticky(doc, { x: 10, y: 20, color: "#fef08a", text: "hi", createdBy: "u1" });
    const objects = doc.getMap("objects");
    const zOrder = doc.getArray<string>("zOrder");
    expect(objects.has(id)).toBe(true);
    expect(zOrder.toArray()).toEqual([id]);
    const obj = objects.get(id) as Y.Map<unknown>;
    expect(obj.get("type")).toBe("sticky");
    expect(obj.get("x")).toBe(10);
    expect(obj.get("y")).toBe(20);
    expect(obj.get("color")).toBe("#fef08a");
    expect((obj.get("text") as Y.Text).toString()).toBe("hi");
  });
});

describe("createRect", () => {
  it("inserts a rect", () => {
    const id = createRect(doc, { x: 0, y: 0, width: 100, height: 60, color: "#3b82f6", createdBy: "u1" });
    const obj = doc.getMap("objects").get(id) as Y.Map<unknown>;
    expect(obj.get("type")).toBe("rect");
    expect(obj.get("width")).toBe(100);
  });
});

describe("moveObject", () => {
  it("updates x and y", () => {
    const id = createRect(doc, { x: 0, y: 0, width: 50, height: 50, color: "#000", createdBy: "u1" });
    moveObject(doc, id, 30, 40);
    const obj = doc.getMap("objects").get(id) as Y.Map<unknown>;
    expect(obj.get("x")).toBe(30);
    expect(obj.get("y")).toBe(40);
  });

  it("is a no-op when object missing", () => {
    expect(() => moveObject(doc, "missing", 1, 1)).not.toThrow();
  });
});

describe("updateText", () => {
  it("replaces sticky text using Y.Text delta", () => {
    const id = createSticky(doc, { x: 0, y: 0, color: "#fef08a", text: "old", createdBy: "u1" });
    updateText(doc, id, "new value");
    const obj = doc.getMap("objects").get(id) as Y.Map<unknown>;
    expect((obj.get("text") as Y.Text).toString()).toBe("new value");
  });
});

describe("changeColor", () => {
  it("changes color", () => {
    const id = createRect(doc, { x: 0, y: 0, width: 10, height: 10, color: "#000", createdBy: "u1" });
    changeColor(doc, id, "#ff0000");
    expect((doc.getMap("objects").get(id) as Y.Map<unknown>).get("color")).toBe("#ff0000");
  });
});

describe("deleteObject", () => {
  it("removes from objects and zOrder", () => {
    const id = createRect(doc, { x: 0, y: 0, width: 10, height: 10, color: "#000", createdBy: "u1" });
    deleteObject(doc, id);
    expect(doc.getMap("objects").has(id)).toBe(false);
    expect(doc.getArray<string>("zOrder").toArray()).toEqual([]);
  });
});
