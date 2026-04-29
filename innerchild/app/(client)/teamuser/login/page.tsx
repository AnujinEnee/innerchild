"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function TeamUserLogin() {
  const [isRegister, setIsRegister] = useState(false);
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
    if (!email || !password || !confirmPassword) { setError("Бүх талбарыг бөглөнө үү."); return; }
    if (password !== confirmPassword) { setError("Нууц үг таарахгүй байна."); return; }
    if (password.length < 6) { setError("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой."); return; }

    setLoading(true);

    // 1. team_members дээр и-мэйл байгаа эсэхийг шалгана
    const { data: member, error: memberErr } = await supabase
      .from("team_members")
      .select("id, last_name, first_name")
      .eq("email", email)
      .maybeSingle();

    if (memberErr) { setError(`Алдаа: ${memberErr.message}`); setLoading(false); return; }
    if (!member) {
      setError("Таны и-мэйл системд бүртгэгдээгүй байна. Эхлээд admin-д хандан и-мэйлээ бүртгүүлнэ үү.");
      setLoading(false);
      return;
    }

    // 2. Supabase Auth дээр account үүсгэнэ
    const { data: authData, error: signUpErr } = await supabase.auth.signUp({ email, password });
    if (signUpErr) {
      const msg = signUpErr.message.includes("already registered")
        ? "Энэ и-мэйл хаяг бүртгэлтэй байна. Нэвтрэх хэсгээр орно уу."
        : signUpErr.message.includes("rate limit")
          ? "Хэт олон оролдлого хийлээ. Түр хүлээнэ үү."
          : signUpErr.message;
      setError(msg); setLoading(false); return;
    }

    // 3. team_members дээр auth_id хадгална
    if (authData.user) {
      await supabase
        .from("team_members")
        .update({ auth_id: authData.user.id })
        .eq("id", member.id);
    }

    // 4. Нэр, зураг автоматаар хадгална
    const { data: fullMember } = await supabase
      .from("team_members")
      .select("id, last_name, first_name, image_url")
      .eq("id", member.id)
      .single();

    if (fullMember) {
      localStorage.setItem("team_user_id", fullMember.id);
      localStorage.setItem("team_user_name", `${fullMember.last_name ?? ""} ${fullMember.first_name ?? ""}`.trim());
      if (fullMember.image_url) localStorage.setItem("team_user_image", fullMember.image_url);
      else localStorage.removeItem("team_user_image");
    }

    setLoading(false);
    setInfo(`Бүртгэл амжилттай! ${member.last_name} ${member.first_name}`);
    setTimeout(() => router.push("/teamuser"), 1500);
  }

  async function handleLogin(supabase: ReturnType<typeof createClient>) {
    if (!email || !password) return;
    setLoading(true);

    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signInErr) { setError("И-мэйл эсвэл нууц үг буруу байна."); setLoading(false); return; }

    // team_members дээр энэ email байгаа эсэхийг шалгана
    const { data: member } = await supabase
      .from("team_members")
      .select("id, last_name, first_name, image_url")
      .eq("email", email)
      .maybeSingle();

    if (!member) {
      await supabase.auth.signOut();
      setError("Таны и-мэйлтэй холбоотой багийн гишүүний мэдээлэл олдсонгүй.");
      setLoading(false);
      return;
    }

    localStorage.setItem("team_user_id", member.id);
    localStorage.setItem("team_user_name", `${member.last_name ?? ""} ${member.first_name ?? ""}`.trim());
    if (member.image_url) localStorage.setItem("team_user_image", member.image_url);
    else localStorage.removeItem("team_user_image");

    setLoading(false);
    router.push("/teamuser");
  }

  async function handleForgot(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!forgotEmail.trim()) { setForgotMsg("И-мэйл хаягаа оруулна уу"); return; }
    setForgotLoading(true);
    setForgotMsg("");
    const { error } = await createClient().auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/teamuser/login`,
    });
    setForgotLoading(false);
    if (error) { setForgotMsg(error.message); return; }
    setForgotMsg("Нууц үг сэргээх холбоосыг и-мэйл рүү илгээлээ.");
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

          <div className="mb-3 text-center">
            <span className="inline-block rounded-full bg-pink-500/20 px-4 py-1 text-xs font-semibold text-pink-800">
              Сэтгэл зүйч
            </span>
          </div>

          <h1 className="mb-8 text-center text-3xl font-bold italic text-gray-900">
            {isRegister ? "Бүртгүүлэх" : "Нэвтрэх"}
          </h1>

          {isRegister && (
            <p className="mb-6 rounded-xl bg-purple-500/10 px-4 py-3 text-xs leading-relaxed text-purple-900">
              Таны и-мэйл хаяг <strong>admin-д урьдчилан бүртгэгдсэн</strong> байх ёстой.
              Admin багийн хэсэгт таны и-мэйлийг нэмсний дараа бүртгүүлэх боломжтой.
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
              className="mt-4 rounded-full bg-linear-to-r from-pink-400 to-purple-700 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:brightness-110 disabled:opacity-60"
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

          {/* Forgot password modal */}
          {forgotMode && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                <h3 className="mb-2 text-lg font-bold text-gray-900">Нууц үг сэргээх</h3>
                <p className="mb-4 text-sm text-gray-500">Бүртгэлтэй и-мэйл хаягаа оруулна уу.</p>
                <form onSubmit={handleForgot} className="flex flex-col gap-3">
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="И-мэйл хаяг"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-purple-400"
                  />
                  {forgotMsg && (
                    <p className={`text-center text-sm ${forgotMsg.includes("илгээлээ") ? "text-green-600" : "text-red-500"}`}>{forgotMsg}</p>
                  )}
                  <button type="submit" disabled={forgotLoading} className="rounded-full bg-linear-to-r from-pink-400 to-purple-700 py-3 text-sm font-semibold text-white disabled:opacity-60">
                    {forgotLoading ? "Илгээж байна..." : "Илгээх"}
                  </button>
                  <button type="button" onClick={() => setForgotMode(false)} className="text-sm text-gray-500 hover:text-gray-700">
                    Буцах
                  </button>
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
                setEmail(""); setPassword(""); setConfirmPassword("");
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
