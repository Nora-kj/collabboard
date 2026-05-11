import "server-only";
import { customAlphabet } from "nanoid";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/auth/supabase-server";

const slugId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10);

export const createBoardForCurrentUser = async (): Promise<string> => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const slug = slugId();
  const { data: board, error: boardErr } = await supabase
    .from("boards")
    .insert({ owner: user.id, title: "Untitled board", slug })
    .select("id, slug")
    .single();
  if (boardErr || !board) throw boardErr ?? new Error("Failed to create board");

  const { error: memberErr } = await supabase
    .from("board_members")
    .insert({ board_id: board.id, user_id: user.id, role: "owner" });
  if (memberErr) throw memberErr;

  return board.slug;
};

export const ensureMembership = async (boardId: string, userId: string): Promise<void> => {
  // Service-role: bypass RLS so we can self-add the user to a public board.
  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin
    .from("board_members")
    .select("user_id")
    .eq("board_id", boardId)
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return;
  await admin
    .from("board_members")
    .insert({ board_id: boardId, user_id: userId, role: "editor" });
};
