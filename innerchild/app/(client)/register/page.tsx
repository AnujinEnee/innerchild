"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/client";

const genderMap: Record<string, "male" | "female" | "other"> = {
  Эрэгтэй: "male",
  Эмэгтэй: "female",
  Бусад: "other",
};

const TOTAL_STEPS = 8;

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-purple-300">Уншиж байна...</div>}>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromConsultation = searchParams.get("from") === "consultation";

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    lastName: "",
    firstName: "",
    age: 20,
    gender: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    extraPhone: "",
    profession: "",
    address: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const progress = (step / TOTAL_STEPS) * 100;

  function validate(): string {
    if (step === 1 && !form.lastName.trim()) return "Овгоо оруулна уу";
    if (step === 2 && !form.firstName.trim()) return "Нэрээ оруулна уу";
    if (step === 4 && !form.gender) return "Хүйсээ сонгоно уу";
    if (step === 5) {
      if (!form.email.trim()) return "И-мэйл хаягаа оруулна уу";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "И-мэйл хаяг буруу байна";
      if (form.password.length < 6) return "Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой";
      if (form.password !== form.confirmPassword) return "Нууц үг таарахгүй байна";
    }
    return "";
  }

  function next() {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    if (step < TOTAL_STEPS) setStep(step + 1);
  }

  function back() {
    setError("");
    if (step > 1) setStep(step - 1);
  }

  async function handleRegister() {
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });
      if (signUpError) {
        const msg = signUpError.message.includes("already registered")
          ? "Энэ и-мэйл хаяг бүртгэлтэй байна"
          : signUpError.message;
        setError(msg);
        setLoading(false);
        return;
      }
      if (data.user) {
        const { error: insertError } = await supabase.from("users").insert({
          auth_id: data.user.id,
          last_name: form.lastName,
          first_name: form.firstName,
          email: form.email,
          phone: form.phone || null,
          extra_phone: form.extraPhone || null,
          age: form.age,
          gender: genderMap[form.gender] ?? "other",
          profession: form.profession || null,
        });
        if (insertError) {
          setError("Мэдээлэл хадгалахад алдаа гарлаа: " + insertError.message);
          setLoading(false);
          return;
        }
      }
      setLoading(false);
      if (fromConsultation) {
        router.push("/consultation?step=payment");
      } else {
        setStep(TOTAL_STEPS);
      }
    } catch {
      setError("Алдаа гарлаа. Дахин оролдоно уу.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-linear-to-br from-pink-200 via-purple-300 to-purple-900">
      <Header />

      <div className="flex flex-1 items-center justify-center p-4 pt-24">
        <div className="flex w-full max-w-240 rounded-3xl bg-white/20 shadow-2xl backdrop-blur-xl">

          {/* Left — Form */}
          <div className="flex w-full flex-col justify-center px-10 py-12 sm:px-14 lg:w-[42%]">

            {/* Progress bar */}
            <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-white transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>

            <div className="mx-auto w-full max-w-md">

              {/* Step 1: Last Name */}
              {step === 1 && (
                <StepLayout title="Овогоо оруулна уу">
                  <FloatingInput label="Овог" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
                </StepLayout>
              )}

              {/* Step 2: First Name */}
              {step === 2 && (
                <StepLayout title="Нэрээ оруулна уу">
                  <FloatingInput label="Нэр" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
                </StepLayout>
              )}

              {/* Step 3: Age */}
              {step === 3 && (
                <StepLayout title="Таны нас">
                  <div className="flex items-center justify-center gap-6">
                    <button
                      onClick={() => setForm({ ...form, age: Math.max(1, form.age - 1) })}
                      className="flex h-16 w-16 items-center justify-center rounded-xl border border-gray-200 text-2xl text-gray-600 hover:bg-gray-50"
                    >−</button>
                    <span className="min-w-15 text-center text-5xl font-bold text-gray-900">{form.age}</span>
                    <button
                      onClick={() => setForm({ ...form, age: form.age + 1 })}
                      className="flex h-16 w-16 items-center justify-center rounded-xl border border-gray-200 text-2xl text-gray-600 hover:bg-gray-50"
                    >+</button>
                  </div>
                </StepLayout>
              )}

              {/* Step 4: Gender */}
              {step === 4 && (
                <StepLayout title="Хүйсээ сонгоно уу">
                  <div className="flex flex-col gap-3">
                    {["Эрэгтэй", "Эмэгтэй", "Бусад"].map((g) => (
                      <button
                        key={g}
                        onClick={() => setForm({ ...form, gender: g })}
                        className={`rounded-2xl border px-6 py-4 text-left text-base font-medium transition-colors ${
                          form.gender === g ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >{g}</button>
                    ))}
                  </div>
                </StepLayout>
              )}

              {/* Step 5: Email + Password */}
              {step === 5 && (
                <StepLayout title="Нэвтрэх мэдээлэл" subtitle="И-мэйл хаяг болон нууц үгээ оруулна уу">
                  <div className="flex flex-col gap-4">
                    <FloatingInput label="И-мэйл" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                    <FloatingInput label="Нууц үг" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
                    <FloatingInput label="Нууц үг давтах" type="password" value={form.confirmPassword} onChange={(v) => setForm({ ...form, confirmPassword: v })} />
                  </div>
                </StepLayout>
              )}

              {/* Step 6: Phone */}
              {step === 6 && (
                <StepLayout title="Утасны дугаар" subtitle="Манай ажилтан тантай холбогдох тул утасны дугаараа оруулна уу">
                  <FloatingInput label="Утасны дугаар" type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                </StepLayout>
              )}

              {/* Step 7: Summary before submit */}
              {step === 7 && (
                <StepLayout title="Мэдээллээ шалгана уу" subtitle="Бүртгэлийн мэдээллээ баталгаажуулна уу">
                  <div className="rounded-2xl border border-gray-100 bg-white/60 p-5 text-sm text-gray-700 space-y-2">
                    {[
                      { label: "Овог нэр", value: `${form.lastName} ${form.firstName}` },
                      { label: "Нас", value: `${form.age}` },
                      { label: "Хүйс", value: form.gender || "—" },
                      { label: "И-мэйл", value: form.email },
                      { label: "Утас", value: form.phone || "—" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between gap-4">
                        <span className="text-gray-400">{label}</span>
                        <span className="font-medium text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                </StepLayout>
              )}

              {/* Step 10: Success */}
              {step === TOTAL_STEPS && (
                <div className="flex flex-col items-center text-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-10 w-10 text-green-600">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="mb-2 text-2xl font-bold text-zinc-900">Амжилттай бүртгэгдлээ!</h2>
                  <p className="mb-8 text-sm text-zinc-500">
                    Таны бүртгэл амжилттай хийгдлээ. Та одоо манай үйлчилгээг ашиглах боломжтой.
                  </p>
                  <button
                    onClick={() => router.push("/")}
                    className="w-full rounded-full bg-linear-to-r from-purple-500 to-pink-400 py-4 text-base font-medium text-white transition-opacity hover:opacity-90"
                  >
                    Нүүр хуудас руу очих
                  </button>
                </div>
              )}

              {/* Navigation buttons */}
              {step < TOTAL_STEPS && (
                <div className="mt-8 flex flex-col gap-3">
                  {error && <p className="text-center text-sm text-red-600">{error}</p>}

                  <button
                    disabled={loading}
                    onClick={() => {
                      if (step === 7) handleRegister();
                      else next();
                    }}
                    className="w-full rounded-full bg-linear-to-r from-purple-500 to-pink-400 py-4 text-base font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {loading ? "Түр хүлээнэ үү..." : step === 7 ? "Бүртгүүлэх" : "Үргэлжлүүлэх"}
                  </button>

                  {step > 1 && (
                    <button
                      onClick={back}
                      disabled={loading}
                      className="w-full rounded-full border border-white/30 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-white/20"
                    >
                      ← Буцах
                    </button>
                  )}

                  {step <= 6 && (
                    <button
                      onClick={next}
                      disabled={loading}
                      className="text-center text-sm text-gray-500 hover:text-gray-700"
                    >
                      Алгасах →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right — Image */}
          <div className="hidden items-center justify-center lg:flex lg:w-[58%]">
            <img
              src={`/${Math.min(step, 9)}${Math.min(step, 9)}.png`}
              alt=""
              className="max-h-80 w-auto -scale-x-100 object-contain transition-all duration-300"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StepLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center">
      <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="mb-8 text-center text-sm leading-relaxed text-gray-500">{subtitle}</p>}
      {!subtitle && <div className="mb-8" />}
      <div className="w-full">{children}</div>
    </div>
  );
}

function FloatingInput({ label, value, onChange, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="relative rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-5 transition-colors focus-within:border-blue-400 focus-within:bg-blue-50/30">
      <label className="absolute top-2 left-4 text-xs text-gray-400">{label}</label>
      <div className="flex items-center">
        <input
          type={isPassword ? (show ? "text" : "password") : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-base text-gray-900 outline-none"
        />
        {isPassword && (
          <button type="button" onClick={() => setShow((s) => !s)} className="ml-2 shrink-0 text-gray-400 hover:text-gray-600">
            {show ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
