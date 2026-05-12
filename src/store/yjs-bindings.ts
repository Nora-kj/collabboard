"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import * as Y from "yjs";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import { useRoom } from "./liveblocks";

type DocBundle = { doc: Y.Doc; provider: LiveblocksYjsProvider };

export const useYDoc = (): DocBundle | null => {
  const room = useRoom();
  const [bundle, setBundle] = useState<DocBundle | null>(null);
  useEffect(() => {
    const doc = new Y.Doc();
    const provider = new LiveblocksYjsProvider(room, doc);
    setBundle({ doc, provider });
    return () => {
      provider.destroy();
      doc.destroy();
      setBundle(null);
    };
  }, [room]);
  return bundle;
};

const EMPTY: string[] = [];
const NOOP = () => {};

const shallowEqArray = <T,>(a: readonly T[], b: readonly T[]): boolean => {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};

const shallowEqObject = (
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): boolean => {
  if (a === b) return true;
  const ak = Object.keys(a);
  if (ak.length !== Object.keys(b).length) return false;
  for (const k of ak) if (a[k] !== b[k]) return false;
  return true;
};

export const useObjects = (doc: Y.Doc | null): string[] => {
  const objects = doc?.getMap<Y.Map<unknown>>("objects") ?? null;
  const cacheRef = useRef<string[]>(EMPTY);
  return useSyncExternalStore(
    (cb) => {
      if (!objects) return NOOP;
      const observer = () => cb();
      objects.observe(observer);
      return () => objects.unobserve(observer);
    },
    () => {
      if (!objects) return EMPTY;
      const next = Array.from(objects.keys());
      if (shallowEqArray(cacheRef.current, next)) return cacheRef.current;
      cacheRef.current = next;
      return next;
    },
    () => EMPTY,
  );
};

export const useObject = (
  doc: Y.Doc | null,
  id: string,
): Record<string, unknown> | null => {
  const map =
    (doc?.getMap<Y.Map<unknown>>("objects").get(id) as
      | Y.Map<unknown>
      | undefined) ?? null;
  const cacheRef = useRef<Record<string, unknown> | null>(null);
  return useSyncExternalStore(
    (cb) => {
      if (!map) return NOOP;
      const observer = () => cb();
      map.observeDeep(observer);
      return () => map.unobserveDeep(observer);
    },
    () => {
      if (!map) return null;
      const next = snapshotObject(map);
      const prev = cacheRef.current;
      if (prev && shallowEqObject(prev, next)) return prev;
      cacheRef.current = next;
      return next;
    },
    () => null,
  );
};

const snapshotObject = (m: Y.Map<unknown>): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of m.entries()) {
    out[k] = v instanceof Y.Text ? v.toString() : v;
  }
  return out;
};

export const useZOrder = (doc: Y.Doc | null): string[] => {
  const arr = doc?.getArray<string>("zOrder") ?? null;
  const cacheRef = useRef<string[]>(EMPTY);
  return useSyncExternalStore(
    (cb) => {
      if (!arr) return NOOP;
      const observer = () => cb();
      arr.observe(observer);
      return () => arr.unobserve(observer);
    },
    () => {
      if (!arr) return EMPTY;
      const next = arr.toArray();
      if (shallowEqArray(cacheRef.current, next)) return cacheRef.current;
      cacheRef.current = next;
      return next;
    },
    () => EMPTY,
  );
};
