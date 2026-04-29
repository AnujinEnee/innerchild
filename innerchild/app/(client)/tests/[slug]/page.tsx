"use client";

import { use, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PrivacyContent from "@/components/PrivacyContent";
import { getTestMeta } from "@/lib/test-logics/registry";
import { notFound } from "next/navigation";

export default function TestDescriptionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const test = getTestMeta(slug);
  if (!test) notFound();

  const [agreed, setAgreed] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <div className="bg-[#2d1b69] px-6 pt-28 pb-10 sm:px-9 sm:pt-36 sm:pb-14 md:px-16 lg:px-28">
        <Link
          href="/tests"
          className="mb-4 inline-flex items-center gap-2 text-sm text-purple-300 transition-colors hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Бүх тестүүд
        </Link>
        <h1 className="mb-3 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
          {test.name}
        </h1>
      </div>

      {/* Content */}
      <div className="px-6 py-8 sm:px-9 sm:py-12 md:px-16 lg:px-28">
        <div className="mx-auto max-w-2xl">
          {test.image && (
            <div className="mb-6 overflow-hidden rounded-2xl">
              <img src={test.image} alt={test.name} className="h-full w-full object-cover" />
            </div>
          )}

          <p className="mb-6 text-sm leading-relaxed text-gray-500 text-justify">
            {test.description}
          </p>

          <div className="mb-8 flex flex-wrap gap-3 text-sm text-gray-500">
            <div className="rounded-xl border border-gray-200 px-4 py-2">
              {test.questionCount} асуулт
            </div>
            <div className="rounded-xl border border-gray-200 px-4 py-2">
              ~{test.estimatedMinutes} минут
            </div>
            <div className="rounded-xl border border-purple-200 px-4 py-2 text-purple-600">
              {test.category}
            </div>
          </div>


          {/* Нууцлалын мэдэгдэл */}
          <div className="mb-6 rounded-2xl border border-purple-100 bg-purple-50/50 p-5">
            <h3 className="mb-3 text-sm font-semibold text-[#2d1b69]">Тест өгөхийн өмнө</h3>
            <ul className="mb-4 space-y-2 text-xs leading-relaxed text-zinc-600">
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-purple-400">•</span>
                Таны хариултууд нууцлалтай хадгалагдах бөгөөд зөвхөн таны үр дүнг тооцоолоход ашиглагдана.
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-purple-400">•</span>
                Асуултуудад аль болох үнэн зөв хариулна уу.
              </li>
            </ul>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-purple-600"
              />
              <span className="text-xs text-zinc-600">
                Би дээрх нөхцлийг хүлээн зөвшөөрч байна.{" "}
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setPrivacyOpen(true); }}
                  className="text-purple-600 underline hover:text-purple-800"
                >
                  Нууцлалын бодлого
                </button>
              </span>
            </label>
          </div>

          {agreed ? (
            <Link
              href={`/tests/${test.slug}/take`}
              className="inline-block w-full rounded-full bg-linear-to-r from-pink-500 to-purple-500 px-8 py-3.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Тест эхлэх
            </Link>
          ) : (
            <button
              disabled
              className="w-full rounded-full bg-linear-to-r from-pink-500 to-purple-500 px-8 py-3.5 text-sm font-semibold text-white opacity-40 cursor-not-allowed"
            >
              Тест эхлэх
            </button>
          )}
        </div>
      </div>

      {/* Нууцлалын бодлого modal */}
      {privacyOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 sm:px-6">
              <h2 className="text-lg font-bold text-[#2d1b69]">Нууцлалын бодлого</h2>
              <button
                onClick={() => setPrivacyOpen(false)}
                className="rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              <PrivacyContent />
            </div>
            <div className="border-t border-zinc-100 px-5 py-4 sm:px-6">
              <button
                onClick={() => { setAgreed(true); setPrivacyOpen(false); }}
                className="w-full rounded-full bg-linear-to-r from-pink-500 to-purple-500 px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Зөвшөөрөх
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-10" />
      <Footer />
    </main>
  );
}
