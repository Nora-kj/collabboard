"use client";
import { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { ensureAnonymousSession } from "@/auth/anon";
import { RoomProvider } from "@/store/liveblocks";
import { generateAnonymousName } from "@/auth/names";
import { pickRandomCursorColor } from "@/lib/colors";
import { PresenceBar } from "@/canvas/presence/PresenceBar";

const Board = dynamic(() => import("@/canvas/Board").then((m) => m.Board), { ssr: false });

type Props = { boardId: string; title: string; requiresAnonSignIn: boolean };

export function BoardClient({ boardId, title, requiresAnonSignIn }: Props) {
  useEffect(() => {
    if (requiresAnonSignIn) {
      ensureAnonymousSession().then(() => window.location.reload());
    }
  }, [requiresAnonSignIn]);

  const initialPresence = useMemo(
    () => ({ cursor: null, selection: [], name: generateAnonymousName(), color: pickRandomCursorColor() }),
    [],
  );

  if (requiresAnonSignIn) {
    return <main className="p-8 text-sm text-neutral-500">Joining as guest…</main>;
  }

  return (
    <RoomProvider id={boardId} initialPresence={initialPresence}>
      <main className="flex h-screen flex-col">
        <header className="flex items-center justify-between border-b px-4 py-2 text-sm">
          <div>
            <span className="font-medium">{title}</span>
            <span className="ml-2 text-neutral-400">({boardId.slice(0, 8)})</span>
          </div>
          <PresenceBar />
        </header>
        <div className="flex-1">
          <Board />
        </div>
      </main>
    </RoomProvider>
  );
}
