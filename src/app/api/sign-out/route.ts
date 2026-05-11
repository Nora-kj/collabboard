import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/auth/supabase-server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  const url = new URL("/sign-in", request.url);
  return NextResponse.redirect(url, { status: 303 });
}
