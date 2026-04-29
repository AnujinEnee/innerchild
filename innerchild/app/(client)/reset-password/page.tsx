"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  // Exchange the recovery code/token for a session on mount.
  useEffect(() => {
    const supabase = createClient();
    async function init() {
      const code = searchParams.get("code");

      // PKCE flow: ?code=... in query.
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) { setError(error.message); return; }
        setReady(true);
        return;
      }

      // Implicit flow: tokens in URL hash (#access_token=...&refresh_token=...&type=recovery)
      const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const type = params.get("type");
      if (accessToken && refreshToken && type === "recovery") {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) { setError(error.message); return; }
        setReady(true);
        // Clean tokens out of the URL.
        if (typeof window !== "undefined") {
          window.history.replaceState({}, "", window.location.pathname);
        }
        return;
      }

      // No token at all — maybe the user opened this page directly.
      // If they're already signed in (e.g. via PASSWORD_RECOVERY event from another tab), let them set a new password.
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setReady(true);
      } else {
        setError("Холбоос буруу эсвэл хугацаа дууссан байна. Дахин нууц үг сэргээх хүсэлт илгээнэ үү.");
      }
    }
    init();
  }, [searchParams]);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password.length < 6) { setError("Нууц үг хамгийн багадаа 6 тэмдэгттэй байх ёстой"); return; }
    if (password !== confirm) { setError("Нууц үг таарахгүй байна"); return; }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) { setError(error.message); return; }
    setDone(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1e1145] px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="mb-2 text-center text-2xl font-bold text-zinc-900">Нууц үг сэргээх</h1>
        <p className="mb-6 text-center text-sm text-zinc-500">Шинэ нууц үгээ оруулна уу</p>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {done ? (
          <div className="rounded-xl bg-green-50 px-4 py-4 text-center text-sm text-green-700">
            Нууц үг амжилттай шинэчлэгдлээ! Нэвтрэх хуудас руу шилжиж байна...
          </div>
        ) : ready ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Шинэ нууц үг"
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-purple-400"
              autoFocus
              required
              minLength={6}
            />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Нууц үг давтах"
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-purple-400"
              required
              minLength={6}
            />
            <button
              type="submit"
              disabled={saving}
              className="mt-2 rounded-full bg-linear-to-r from-pink-500 to-purple-500 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Хадгалж байна..." : "Нууц үг шинэчлэх"}
            </button>
          </form>
        ) : (
          !error && (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600" />
            </div>
          )
        )}

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-purple-600 hover:underline">
            Нэвтрэх хуудас руу буцах
          </Link>
        </div>
      </div>
    </main>
  );
}
