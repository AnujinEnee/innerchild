"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLogin() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const router = useRouter();

  async function handleRegister(supabase: ReturnType<typeof createClient>) {
    if (!name || !email || !password || !confirmPassword) return;
    if (password !== confirmPassword) { setError("Нууц үг таарахгүй байна."); return; }
    setLoading(true);
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) {
      const msg = error.message.includes("already registered")
        ? "Энэ и-мэйл хаяг бүртгэлтэй байна. Нэвтрэх хэсгээр орно уу."
        : error.message.includes("rate limit")
          ? "Хэт олон оролдлого хийлээ. Түр хүлээнэ үү."
          : error.message;
      setError(msg); setLoading(false); return;
    }

    if (signUpData.user) {
      await supabase.from("admin_users").insert({
        id: signUpData.user.id,
        name,
        email,
        created_at: new Date().toISOString(),
      });
    }

    setLoading(false);
    setInfo("Бүртгэл амжилттай. И-мэйлээ шалгаж баталгаажуулна уу.");
  }

  async function handleLogin(supabase: ReturnType<typeof createClient>) {
    if (!email || !password) return;
    setLoading(true);
    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError("И-мэйл эсвэл нууц үг буруу байна."); return; }

    localStorage.setItem("admin_role", "admin");
    localStorage.removeItem("admin_counselor_id");

    if (signInData.user) {
      const { data: adminUser } = await supabase
        .from("admin_users")
        .select("name, image_url")
        .eq("id", signInData.user.id)
        .maybeSingle();
      const nameToUse = adminUser?.name || (signInData.user.user_metadata?.name as string | undefined) || "";
      if (nameToUse) localStorage.setItem("admin_name", nameToUse);
      if (adminUser?.image_url) localStorage.setItem("admin_image", adminUser.image_url);
      else localStorage.removeItem("admin_image");
    }

    router.push("/admin");
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setInfo("");
    const supabase = createClient();
    if (isRegister) {
      await handleRegister(supabase);
    } else {
      await handleLogin(supabase);
    }
  }

  const eyeOpen = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
  const eyeOff = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-pink-200 via-purple-300 to-purple-900 p-4">
      <div className="flex w-full max-w-240 rounded-3xl bg-white/20 p-4 shadow-2xl backdrop-blur-xl">
        {/* Left - Form */}
        <div className="flex w-full flex-col justify-center px-10 py-12 sm:px-14 lg:w-[42%]">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <img src="/1.png" alt="Inner Child" className="h-10" />
          </div>

          <h1 className="mb-10 text-center text-3xl font-bold italic text-gray-900">
            {isRegister ? "Бүртгүүлэх" : "Нэвтрэх"}
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {isRegister && (
              <div className="flex items-center gap-3 border-b border-gray-400/60 pb-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Хэрэглэгчийн нэр"
                  className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-500"
                />
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0 text-gray-600">
                  <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v2h20v-2c0-3.3-6.7-5-10-5z" />
                </svg>
              </div>
            )}

            <div className="flex items-center gap-3 border-b border-gray-400/60 pb-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="И-мэйл"
                className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-500"
              />
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0 text-gray-600">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
            </div>

            <div className="flex items-center gap-3 border-b border-gray-400/60 pb-2">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Нууц үг"
                className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-500"
              />
              <button type="button" onClick={() => setShowPassword((s) => !s)} className="shrink-0 text-gray-500 hover:text-gray-700">
                {showPassword ? eyeOff : eyeOpen}
              </button>
            </div>

            {isRegister && (
              <div className="flex items-center gap-3 border-b border-gray-400/60 pb-2">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Нууц үг давтах"
                  className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-500"
                />
                <button type="button" onClick={() => setShowConfirmPassword((s) => !s)} className="shrink-0 text-gray-500 hover:text-gray-700">
                  {showConfirmPassword ? eyeOff : eyeOpen}
                </button>
              </div>
            )}

            {error && <p className="text-center text-sm text-red-600">{error}</p>}
            {info && <p className="text-center text-sm text-green-700">{info}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-4 rounded-full bg-linear-to-r from-purple-400 to-purple-900 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "Түр хүлээнэ үү..." : isRegister ? "Бүртгүүлэх" : "Нэвтрэх"}
            </button>
          </form>

          {!isRegister && (
            <button
              type="button"
              onClick={() => { setForgotMode(true); setForgotEmail(email); setForgotMsg(""); }}
              className="mt-4 w-full text-center text-sm text-purple-700 hover:underline"
            >
              Нууц үгээ мартсан уу?
            </button>
          )}

          {forgotMode && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                <h3 className="mb-2 text-lg font-bold text-gray-900">Нууц үг сэргээх</h3>
                <p className="mb-4 text-sm text-gray-500">Бүртгэлтэй и-мэйл хаягаа оруулна уу.</p>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!forgotEmail.trim()) { setForgotMsg("И-мэйл хаягаа оруулна уу"); return; }
                  setForgotLoading(true); setForgotMsg("");
                  const { error } = await createClient().auth.resetPasswordForEmail(forgotEmail, { redirectTo: `${window.location.origin}/admin/login` });
                  setForgotLoading(false);
                  if (error) { setForgotMsg(error.message); return; }
                  setForgotMsg("Нууц үг сэргээх холбоосыг и-мэйл рүү илгээлээ.");
                }} className="flex flex-col gap-3">
                  <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="И-мэйл хаяг" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-purple-400" />
                  {forgotMsg && <p className={`text-center text-sm ${forgotMsg.includes("илгээлээ") ? "text-green-600" : "text-red-500"}`}>{forgotMsg}</p>}
                  <button type="submit" disabled={forgotLoading} className="rounded-full bg-linear-to-r from-purple-400 to-purple-900 py-3 text-sm font-semibold text-white disabled:opacity-60">
                    {forgotLoading ? "Илгээж байна..." : "Илгээх"}
                  </button>
                  <button type="button" onClick={() => setForgotMode(false)} className="text-sm text-gray-500 hover:text-gray-700">Буцах</button>
                </form>
              </div>
            </div>
          )}

          <p className="mt-4 text-center text-sm text-gray-700">
            {isRegister ? "Бүртгэлтэй юу?" : "Бүртгэл байхгүй юу?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setName(""); setEmail(""); setPassword(""); setConfirmPassword("");
                setError(""); setInfo("");
              }}
              className="font-semibold text-purple-900 hover:underline"
            >
              {isRegister ? "Нэвтрэх" : "Бүртгүүлэх"}
            </button>
          </p>
        </div>

        {/* Right - Image */}
        <div className="hidden lg:flex lg:w-[58%] lg:items-center lg:justify-center">
          <img
            src="/z.png"
            alt="Inner Child"
            className="max-h-[520px] w-auto object-contain drop-shadow-2xl"
          />
        </div>
      </div>
    </div>
  );
}
