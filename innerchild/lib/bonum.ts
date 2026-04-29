import crypto from "crypto";

const API_URL = process.env.BONUM_API_URL!;
const APP_SECRET = process.env.BONUM_APP_SECRET!;
const TERMINAL_ID = process.env.BONUM_TERMINAL_ID!;

let cachedToken: string | null = null;
let cachedRefreshToken: string | null = null;
let tokenExpiresAt = 0;

/** Auth — GET, returns accessToken + refreshToken */
export async function getBonumToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  // Try refresh first if we have a refresh token
  if (cachedRefreshToken) {
    try {
      const res = await fetch(`${API_URL}/bonum-gateway/ecommerce/auth/refresh`, {
        method: "GET",
        headers: { Authorization: `Bearer ${cachedRefreshToken}` },
      });
      const json = await res.json();
      if (json.accessToken) {
        cachedToken = json.accessToken;
        cachedRefreshToken = json.refreshToken ?? cachedRefreshToken;
        tokenExpiresAt = Date.now() + ((json.expiresIn ?? 1800) - 120) * 1000;
        return cachedToken!;
      }
    } catch {
      // Refresh failed, fall through to full auth
    }
  }

  const res = await fetch(`${API_URL}/bonum-gateway/ecommerce/auth/create`, {
    method: "GET",
    headers: {
      Authorization: `AppSecret ${APP_SECRET}`,
      "X-TERMINAL-ID": TERMINAL_ID,
    },
  });

  const json = await res.json();

  if ((json.status === 429 || json.message?.includes("Rate-Limit")) && cachedToken) {
    return cachedToken;
  }

  const token = json.accessToken;
  if (!token) {
    throw new Error(`Bonum auth failed: ${json.message ?? JSON.stringify(json)}`);
  }

  cachedToken = token;
  cachedRefreshToken = json.refreshToken ?? null;
  tokenExpiresAt = Date.now() + ((json.expiresIn ?? 1800) - 120) * 1000;
  return cachedToken!;
}

/** Create E-Commerce invoice */
export async function createBonumInvoice(params: {
  amount: number;
  transactionId: string;
  callbackUrl: string;
  description: string;
}): Promise<{ invoiceId: string; paymentUrl: string }> {
  const token = await getBonumToken();

  const res = await fetch(`${API_URL}/bonum-gateway/ecommerce/invoices`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-TERMINAL-ID": TERMINAL_ID,
      "Content-Type": "application/json",
      "Accept-Language": "mn",
    },
    body: JSON.stringify({
      amount: params.amount,
      callback: params.callbackUrl,
      transactionId: params.transactionId,
      expiresIn: 1800,
      items: [
        {
          title: params.description,
          remark: "Inner Child сэтгэл зүйн зөвлөгөө",
          amount: params.amount,
          count: 1,
        },
      ],
    }),
  });

  const json = await res.json();

  if (json.errorCode || json.status === 500 || json.status === 400) {
    throw new Error(`Bonum invoice failed: ${json.message ?? JSON.stringify(json)}`);
  }

  return {
    invoiceId: json.invoiceId ?? params.transactionId,
    paymentUrl: json.followUpLink ?? "",
  };
}

/** Create QR code payment — returns QR image + bank deeplinks */
export async function createBonumQR(params: {
  amount: number;
  transactionId: string;
  expiresIn?: number;
}): Promise<{
  invoiceId: string;
  qrImage: string;
  qrCode: string;
  links: { name: string; link: string; logo?: string }[];
}> {
  const token = await getBonumToken();

  const res = await fetch(`${API_URL}/mpay-service/merchant/transaction/qr/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-TERMINAL-ID": TERMINAL_ID,
      "Content-Type": "application/json",
      "Accept-Language": "mn",
    },
    body: JSON.stringify({
      amount: params.amount,
      transactionId: params.transactionId,
      expiresIn: params.expiresIn ?? 1800,
    }),
  });

  const json = await res.json();
  const data = json.data ?? json;

  if (!data.qrImage && !data.qrCode) {
    throw new Error(`Bonum QR failed: ${json.message ?? JSON.stringify(json)}`);
  }

  return {
    invoiceId: data.invoiceId ?? params.transactionId,
    qrImage: data.qrImage ?? "",
    qrCode: data.qrCode ?? "",
    links: data.links ?? [],
  };
}

/** Check if invoice/transaction is paid */
export async function checkBonumPayment(invoiceId: string): Promise<boolean> {
  const token = await getBonumToken();

  const res = await fetch(
    `${API_URL}/bonum-gateway/ecommerce/invoices/paid?invoiceId=${invoiceId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-TERMINAL-ID": TERMINAL_ID,
        Accept: "application/json",
      },
    },
  );

  const text = await res.text();
  if (!text) return false;
  try {
    const json = JSON.parse(text);
    return json.status === 200 || json.data?.paid === true || json.body?.status === "PAID";
  } catch {
    return false;
  }
}

/** Verify webhook checksum (HmacSHA256) */
export function verifyWebhookChecksum(rawBody: string, checksumHeader: string | null): boolean {
  const checksumKey = process.env.BONUM_CHECKSUM_KEY;
  if (!checksumKey || !checksumHeader) return true; // Skip if no key configured

  const hmac = crypto.createHmac("sha256", checksumKey);
  hmac.update(rawBody);
  const computed = hmac.digest("hex");

  return computed === checksumHeader;
}
