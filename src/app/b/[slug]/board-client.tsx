"use client";
import { useEffect } from "react";
import { ensureAnonymousSession } from "@/auth/anon";

type Props = {
  boardId: string;
  title: string;
  requiresAnonSignIn: boolean;
};

export function BoardClient({ boardId, title, requiresAnonSignIn }: Props) {
  useEffect(() => {
    if (requiresAnonSignIn) {
      ensureAnonymousSession().then(() => window.location.reload());
    }
  }, [requiresAnonSignIn]);

  if (requiresAnonSignIn) {
    return <main className="p-8 text-sm text-neutral-500">Joining as guest…</main>;
  }

  return (
    <main className="flex h-screen flex-col">
      <header className="border-b px-4 py-2 text-sm">
        Board: <span className="font-medium">{title}</span>
        <span className="ml-2 text-neutral-400">({boardId.slice(0, 8)})</span>
      </header>
      <div className="flex-1 bg-neutral-50 p-8 text-center text-neutral-400">
        Canvas mounts here in Task 14.
      </div>
    </main>
  );
}
