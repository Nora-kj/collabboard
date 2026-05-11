"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/auth/supabase-client";

export default function SignInPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const { error: signUpErr } = await supabase.auth.signUp({ email, password });
        if (signUpErr) {
          setStatus(signUpErr.message);
          return;
        }
      }
      router.push("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleMagic = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    if (error) setStatus(error.message);
    else setStatus("Check your email for a magic link.");
  };

  return (
    <main className="mx-auto mt-24 max-w-sm p-6">
      <h1 className="mb-6 text-2xl font-bold">Sign in</h1>
      <div className="mb-4 flex gap-2 text-sm">
        <button
          onClick={() => setMode("password")}
          className={`rounded px-3 py-1 ${mode === "password" ? "bg-black text-white" : "border"}`}
        >Password</button>
        <button
          onClick={() => setMode("magic")}
          className={`rounded px-3 py-1 ${mode === "magic" ? "bg-black text-white" : "border"}`}
        >Magic link</button>
      </div>
      <form onSubmit={mode === "password" ? handlePassword : handleMagic} className="space-y-3">
        <input
          type="email" required placeholder="you@example.com"
          value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />
        {mode === "password" && (
          <input
            type="password" required placeholder="password (8+ chars)"
            value={password} onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            className="w-full rounded border px-3 py-2"
          />
        )}
        <button
          type="submit" disabled={busy}
          className="w-full rounded bg-black py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {mode === "password" ? "Sign in / sign up" : "Send magic link"}
        </button>
      </form>
      {status && <p className="mt-3 text-sm text-neutral-600">{status}</p>}
    </main>
  );
}
