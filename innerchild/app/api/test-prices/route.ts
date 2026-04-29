import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tests")
    .select("slug, price")
    .not("slug", "is", null);
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { slug, price } = body as { slug: string; price: number };

  const supabase = await createClient();

  // Upsert: if slug exists update, otherwise insert
  const { data: existing } = await supabase
    .from("tests")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    await supabase.from("tests").update({ price }).eq("slug", slug);
  } else {
    await supabase.from("tests").insert({
      slug,
      price,
      title: slug,
      category: "general",
      duration_minutes: 10
    });
  }

  return NextResponse.json({ ok: true });
}
