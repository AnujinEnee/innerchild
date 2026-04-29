import { NextResponse } from "next/server";

// Deprecated. Image uploads now go directly from the browser to Cloudinary
// using a signature obtained from /api/upload/sign — this avoids Vercel's
// 4.5 MB serverless request body limit. See lib/upload-image.ts.
export async function POST() {
  return NextResponse.json(
    { error: "Deprecated. Use /api/upload/sign + browser-direct upload (lib/upload-image.ts)." },
    { status: 410 },
  );
}
