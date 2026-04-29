"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";

interface UserArticle {
  id: string;
  title: string;
  content: string;
  author_name: string;
  author_email: string;
  submitted_at: string;
}

export default function UserArticlePage() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<UserArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createClient()
      .from("submitted_articles")
      .select("id, title, content, author_name, author_email, submitted_at")
      .eq("id", id)
      .eq("status", "approved")
      .single()
      .then(({ data }) => {
        setArticle(data ?? null);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#2d1b69]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-300/30 border-t-purple-300" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#2d1b69]">
        <p className="text-white">Нийтлэл олдсонгүй</p>
        <Link href="/niitlel?tab=users" className="text-sm text-purple-300 hover:text-white">← Буцах</Link>
      </div>
    );
  }

  const date = new Date(article.submitted_at).toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#2d1b69]">
      <Header />

      {/* Hero */}
      <div className="px-8 pt-32 pb-10 lg:px-40">
        <Link
          href="/niitlel?tab=users"
          className="mb-6 inline-flex items-center gap-2 text-sm text-purple-300 transition-colors hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Буцах
        </Link>
        <p className="mb-3 flex items-center gap-2 text-sm text-pink-300">
          <span className="inline-block h-3 w-3 rounded-full bg-pink-400" />
          Уншигчийн нийтлэл
        </p>
        <h1 className="max-w-3xl text-3xl font-bold leading-snug text-white md:text-4xl lg:text-5xl">
          {article.title}
        </h1>
        <p className="mt-4 text-sm text-purple-300/70">{date}</p>
      </div>

      {/* White content area */}
      <div className="mx-4 mt-4 rounded-[3rem] bg-white md:mx-10 lg:mx-40">
        <div className="px-8 py-12 md:px-16 lg:px-24">

          {/* Author row */}
          <div className="mb-10 flex items-center gap-4 border-b border-gray-100 pb-8">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-pink-400 to-purple-500 text-lg font-bold text-white">
              {article.author_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">{article.author_name}</p>
              <p className="text-xs text-pink-500">Уншигч</p>
            </div>
            <span className="ml-auto text-xs text-zinc-400">{date}</span>
          </div>

          {/* Article content */}
          <div className="prose prose-zinc max-w-none">
            {article.content.split("\n").map((paragraph, i) =>
              paragraph.trim() ? (
                <p key={i} className="mb-5 text-base leading-relaxed text-zinc-600">
                  {paragraph}
                </p>
              ) : (
                <div key={i} className="mb-5" />
              )
            )}
          </div>

          {/* CTA */}
          <div className="mt-16 overflow-hidden rounded-2xl bg-linear-to-r from-[#2d1b69] to-[#1e1145] px-8 py-10 md:px-12">
            <p className="mb-2 text-xs font-bold tracking-widest text-pink-400">INNER CHILD</p>
            <h2 className="mb-5 max-w-md text-xl font-bold text-white md:text-2xl">
              Та ч гэсэн нийтлэл бичих үү?
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/submit-article"
                className="rounded-full bg-linear-to-r from-pink-500 to-purple-400 px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Нийтлэл оруулах
              </Link>
              <Link
                href="/niitlel?tab=users"
                className="rounded-full border border-purple-400/40 px-6 py-2.5 text-sm text-purple-200 transition-colors hover:border-purple-300 hover:text-white"
              >
                Бусад нийтлэл
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="h-10" />
      <Footer />
    </div>
  );
}
