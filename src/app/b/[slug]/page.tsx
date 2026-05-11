import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/auth/supabase-server";
import { ensureMembership } from "@/server/boards";
import { BoardClient } from "./board-client";

type PageProps = { params: Promise<{ slug: string }> };

export default async function BoardPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: board } = await supabase
    .from("boards")
    .select("id, slug, title, visibility")
    .eq("slug", slug)
    .maybeSingle();
  if (!board) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // Public board, anonymous viewer — sign them in via the client component
    if (board.visibility === "public") {
      return <BoardClient boardId={board.id} title={board.title} requiresAnonSignIn />;
    }
    notFound();
  }

  // Verify membership; auto-add for public boards
  const { data: membership } = await supabase
    .from("board_members")
    .select("role")
    .eq("board_id", board.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) {
    if (board.visibility !== "public") notFound();
    await ensureMembership(board.id, user.id);
  }

  return <BoardClient boardId={board.id} title={board.title} requiresAnonSignIn={false} />;
}
