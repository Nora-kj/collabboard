import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/auth/supabase-server";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: boards } = await supabase
    .from("boards")
    .select("id, slug, title, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main className="mx-auto max-w-3xl p-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">CollabBoard</h1>
        <form action="/api/sign-out" method="post">
          <button className="rounded border px-3 py-1 text-sm">Sign out</button>
        </form>
      </header>
      <form action="/api/boards/new" method="post" className="mb-6">
        <button
          type="submit"
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white"
        >
          + New board
        </button>
      </form>
      <ul className="divide-y rounded border">
        {boards?.map((b) => (
          <li key={b.id}>
            <Link href={`/b/${b.slug}`} className="block px-4 py-3 hover:bg-neutral-50">
              <div className="font-medium">{b.title}</div>
              <div className="text-xs text-neutral-500">/{b.slug}</div>
            </Link>
          </li>
        ))}
        {!boards?.length && (
          <li className="px-4 py-6 text-center text-sm text-neutral-500">
            No boards yet — click &quot;New board&quot; above.
          </li>
        )}
      </ul>
    </main>
  );
}
