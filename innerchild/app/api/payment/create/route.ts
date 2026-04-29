import { NextRequest, NextResponse } from "next/server";
import { createBonumQR } from "@/lib/bonum";

export async function POST(request: NextRequest) {
  try {
    const { amount, counselorName, clientName } = await request.json();

    if (!amount) {
      return NextResponse.json({ error: "amount required" }, { status: 400 });
    }

    const transactionId = `ic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const { invoiceId, qrImage, qrCode, links } = await createBonumQR({
      amount,
      transactionId,
    });

    return NextResponse.json({ invoiceId, transactionId, qrImage, qrCode, links });
  } catch (err) {
    console.error("Payment create error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
