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

  // Read current count, then update. Not strictly atomic across replicas,
  // but acceptable for a view counter — the cookie dedup is the main guard.
  const { data: current } = await supabase
    .from("articles")
    .select("view_count")
    .eq("id", id)
    .single();

  if (!current) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const next = (current.view_count ?? 0) + 1;
  const { error } = await supabase
    .from("articles")
    .update({ view_count: next })
    .eq("id", id);

  if (error) {
    console.error("view_count update failed:", error.message);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
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
