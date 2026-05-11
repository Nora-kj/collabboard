import { NextResponse } from "next/server";
import { createBoardForCurrentUser } from "@/server/boards";

export async function GET(request: Request) {
  const slug = await createBoardForCurrentUser();
  return NextResponse.redirect(new URL(`/b/${slug}`, request.url));
}
