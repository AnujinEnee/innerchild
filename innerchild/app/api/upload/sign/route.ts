import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

// Returns Cloudinary upload signature so the browser can upload directly,
// bypassing Vercel's 4.5 MB request body limit on serverless functions.
export async function GET() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Cloudinary тохиргоо буруу" },
      { status: 500 },
    );
  }

  const folder = "innerchild";
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto
    .createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  return NextResponse.json({ cloudName, apiKey, timestamp, folder, signature });
}
