import type * as Y from "yjs";
import * as YNS from "yjs";

export type SnapshotObject = Record<string, unknown>;
export type Snapshot = {
  objects: Record<string, SnapshotObject>;
  zOrder: string[];
};

export const boardSnapshot = (doc: Y.Doc): Snapshot => {
  const objects = doc.getMap<Y.Map<unknown>>("objects");
  const zOrder = doc.getArray<string>("zOrder").toArray();
  const out: Record<string, SnapshotObject> = {};
  for (const [id, m] of objects.entries()) {
    const obj: SnapshotObject = {};
    for (const [k, v] of m.entries()) {
      obj[k] = v instanceof YNS.Text ? v.toString() : v;
    }
    out[id] = obj;
  }
  return { objects: out, zOrder };
};
