import { NextResponse } from "next/server";
import { Liveblocks } from "@liveblocks/node";
import { createSupabaseServerClient } from "@/auth/supabase-server";
import { pickRandomCursorColor } from "@/lib/colors";

export async function POST(request: Request) {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) return new NextResponse("Server misconfigured", { status: 500 });
  const liveblocks = new Liveblocks({ secret });

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { room } = await request.json();
  if (typeof room !== "string") return new NextResponse("Bad request", { status: 400 });

  // room id == board id (UUID).
  const { data: board } = await supabase
    .from("boards")
    .select("id, visibility")
    .eq("id", room)
    .maybeSingle();
  if (!board) return new NextResponse("Forbidden", { status: 403 });

  const { data: membership } = await supabase
    .from("board_members")
    .select("role")
    .eq("board_id", board.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership && board.visibility !== "public") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_color")
    .eq("id", user.id)
    .maybeSingle();
  const name = profile?.display_name ?? "Guest";
  const color = profile?.avatar_color ?? pickRandomCursorColor();

  const session = liveblocks.prepareSession(user.id, { userInfo: { name, color } });
  session.allow(board.id, session.FULL_ACCESS);
  const { status, body } = await session.authorize();
  return new NextResponse(body, { status });
}
