import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Bumps articles.view_count by 1 for the given id, but only if this browser
// hasn't already viewed it in the last 24h (cookie-based dedup).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const cookieName = `viewed_${id}`;
  if (req.cookies.get(cookieName)?.value === "1") {
    return NextResponse.json({ counted: false });
  }

  const supabase = await createClient();

  // Atomic increment via SECURITY DEFINER RPC (bypasses articles RLS which
  // blocks anon UPDATE). See migration 017_article_view_rpc.sql.
  const { data: next, error } = await supabase.rpc("increment_article_view", {
    p_article_id: id,
  });

  if (error) {
    console.error("view_count update failed:", error.message);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  if (next === null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const res = NextResponse.json({ counted: true, view_count: next });
  res.cookies.set(cookieName, "1", {
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
    sameSite: "lax",
    httpOnly: false,
  });
  return res;
}
