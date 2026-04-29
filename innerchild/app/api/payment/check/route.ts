import { NextRequest, NextResponse } from "next/server";
import { checkBonumPayment } from "@/lib/bonum";
import { isPaid, markAsPaid } from "@/lib/payment-store";

export async function GET(request: NextRequest) {
  const transactionId = request.nextUrl.searchParams.get("transactionId");

  if (!transactionId) {
    return NextResponse.json({ error: "transactionId required" }, { status: 400 });
  }

  if (isPaid(transactionId)) {
    return NextResponse.json({ paid: true });
  }

  try {
    const paid = await checkBonumPayment(transactionId);
    if (paid) markAsPaid(transactionId);
    return NextResponse.json({ paid });
  } catch {
    return NextResponse.json({ paid: false });
  }
}
