"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";

export default function SubmitArticlePage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", title: "", content: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim())    errs.name    = "Нэрээ бичнэ үү";
    if (!form.email.trim())   errs.email   = "И-мэйл хаягаа бичнэ үү";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "И-мэйл хаяг буруу байна";
    if (!form.title.trim())   errs.title   = "Гарчиг бичнэ үү";
    if (!form.content.trim()) errs.content = "Агуулга бичнэ үү";
    return errs;
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    const { error } = await createClient().from("submitted_articles").insert({
      title:        form.title.trim(),
      content:      form.content.trim(),
      author_name:  form.name.trim(),
      author_email: form.email.trim().toLowerCase(),
    });
    setSubmitting(false);
    if (error) {
      setErrors({ submit: `Илгээхэд алдаа гарлаа: ${error.message}` });
      return;
    }
    setDone(true);
  }

  return (
    <div className="min-h-screen bg-[#2d1b69]">
      <Header />

      <div className="px-8 pt-32 pb-20 lg:px-40">
        <p className="mb-3 flex items-center gap-2 text-sm text-purple-300">
          <span className="inline-block h-3 w-3 rounded-full bg-pink-400" />
          Нийтлэл оруулах
        </p>
        <h1 className="mb-10 text-4xl font-bold text-white md:text-5xl">
          Нийтлэлээ{" "}
          <span className="bg-linear-to-r from-pink-300 to-purple-300 bg-clip-text italic text-transparent">
            хуваалцаарай
          </span>
        </h1>

        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 md:p-10">
          {done ? (
            /* ── Success ── */
            <div className="py-6 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8 text-emerald-500">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h2 className="mb-2 text-xl font-bold text-zinc-900">Амжилттай илгээгдлээ!</h2>
              <p className="mb-2 text-sm text-zinc-500">
                Таны нийтлэлийг admin шалгаад нийтлэх эсэхийг шийднэ.
              </p>
              <p className="mb-8 text-xs text-zinc-400">
                Хэрэв и-мэйл нь бүртгэлтэй хаяг бол <span className="font-medium text-purple-600">Миний хуудас → Нийтлэл</span> хэсэгт харагдана.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { setDone(false); setForm({ name: "", email: "", title: "", content: "" }); }}
                  className="rounded-xl border border-purple-200 px-8 py-3 text-sm font-medium text-purple-600 transition-colors hover:bg-purple-50"
                >
                  Дахин бичих
                </button>
                <button
                  onClick={() => router.push("/niitlel")}
                  className="rounded-xl bg-linear-to-r from-pink-500 to-purple-500 px-8 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  Нийтлэл рүү буцах
                </button>
              </div>
            </div>
          ) : (
            /* ── Form ── */
            <>
              <h2 className="mb-1 text-xl font-bold text-zinc-900">Нийтлэл бичих</h2>
              <p className="mb-6 text-sm text-zinc-500">
                Нэр болон и-мэйл хаягаа оруулаад нийтлэлээ бичнэ үү.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Name + Email row */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Нэр" error={errors.name}>
                    <input
                      type="text"
                      placeholder="Таны нэр"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className={inputCls(errors.name)}
                    />
                  </Field>
                  <Field label="И-мэйл" error={errors.email}>
                    <input
                      type="email"
                      placeholder="example@email.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className={inputCls(errors.email)}
                    />
                  </Field>
                </div>

                {/* Title */}
                <Field label="Гарчиг" error={errors.title}>
                  <input
                    type="text"
                    placeholder="Нийтлэлийн гарчиг"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className={inputCls(errors.title)}
                  />
                </Field>

                {/* Content */}
                <Field label="Агуулга" error={errors.content}>
                  <textarea
                    placeholder="Нийтлэлийнхээ агуулгыг бичнэ үү..."
                    rows={9}
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    className={`resize-none ${inputCls(errors.content)}`}
                  />
                </Field>

                {errors.submit && <p className="text-sm text-red-500">{errors.submit}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 rounded-xl bg-linear-to-r from-pink-500 to-purple-500 py-3.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? "Илгээж байна..." : "Илгээх"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

function inputCls(error?: string) {
  return `w-full rounded-xl border px-4 py-3 text-sm text-zinc-900 outline-none focus:border-purple-400 ${
    error ? "border-red-300 bg-red-50" : "border-zinc-200"
  }`;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-zinc-500">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
