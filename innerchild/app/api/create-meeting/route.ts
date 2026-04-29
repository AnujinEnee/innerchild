import { NextRequest, NextResponse } from "next/server";
import { createZoomMeeting } from "@/lib/zoom";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { consultationId, counselorName, clientName, date, time, durationMinutes } =
      await request.json();

    if (!consultationId || !date || !time || !durationMinutes) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const timeClean = time.slice(0, 5); // "HH:mm"
    const startTime = `${date}T${timeClean}:00+08:00`; // Asia/Ulaanbaatar UTC+8

    const { joinUrl, meetingId } = await createZoomMeeting({
      topic: `Inner Child - ${counselorName || "Зөвлөгч"} & ${clientName || "Зөвлүүлэгч"}`,
      startTime,
      durationMinutes,
    });

    const { error: updateError } = await supabaseAdmin
      .from("consultations")
      .update({ meeting_link: joinUrl })
      .eq("id", consultationId);

    if (updateError) {
      console.error("Failed to update consultation with meeting link:", updateError);
      return NextResponse.json({ error: "Failed to save meeting link" }, { status: 500 });
    }

    return NextResponse.json({ meetLink: joinUrl, meetingId });
  } catch (err) {
    console.error("create-meeting error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
