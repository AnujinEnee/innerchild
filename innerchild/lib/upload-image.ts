// Browser-side helper that uploads files directly to Cloudinary using a
// server-issued signature. Bypasses Vercel's 4.5 MB serverless body limit.

export async function uploadImage(file: File): Promise<string> {
  const signRes = await fetch("/api/upload/sign");
  if (!signRes.ok) {
    const data = await signRes.json().catch(() => ({}));
    throw new Error(data.error ?? "Cloudinary signature авч чадсангүй");
  }
  const { cloudName, apiKey, timestamp, folder, signature } = await signRes.json();

  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  fd.append("timestamp", timestamp);
  fd.append("api_key", apiKey);
  fd.append("signature", signature);

  const cloudRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: fd },
  );
  const data = await cloudRes.json();
  if (!cloudRes.ok || !data.secure_url) {
    throw new Error(data?.error?.message ?? "Cloudinary upload амжилтгүй");
  }
  return data.secure_url as string;
}
