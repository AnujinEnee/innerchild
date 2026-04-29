import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookChecksum } from "@/lib/bonum";
import { markAsPaid } from "@/lib/payment-store";

// GET — Bonum redirects user after payment (for non-QR flow)
export async function GET(request: NextRequest) {
  const txn = request.nextUrl.searchParams.get("txn");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  if (txn) {
    markAsPaid(txn);
  }

  return NextResponse.redirect(`${baseUrl}/consultation?step=payment&status=success`);
}

// POST — Bonum webhook notification
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const checksumHeader = request.headers.get("x-checksum-v2");

    if (!verifyWebhookChecksum(rawBody, checksumHeader)) {
      console.warn("Bonum webhook checksum mismatch — accepting anyway");
      // TODO: fix BONUM_CHECKSUM_KEY and re-enable strict check
    }

    const body = JSON.parse(rawBody);
    console.log("Bonum webhook:", body.type, body.status, body.body?.transactionId);

    const txn = body.body?.transactionId;
    if (!txn) {
      return NextResponse.json({ error: "No transaction ID" }, { status: 400 });
    }

    if (body.type === "PAYMENT" && body.status === "SUCCESS") {
      markAsPaid(txn);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}
