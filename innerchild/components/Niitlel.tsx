"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  image_url: string | null;
  author_name: string | null;
  reviewed_by: string | null;
  view_count: number | null;
  published_date: string | null;
  published_at: string | null;
  created_at: string;
  team_members: { first_name: string; last_name: string } | null;
}

function authorOf(a: Article) {
  if (a.team_members) return `${a.team_members.last_name} ${a.team_members.first_name}`.trim();
  return a.author_name ?? "";
}

function formatDate(input: string | null): string {
  if (!input) return "";
  const d = new Date(input);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function dateOf(a: Article) {
  return formatDate(a.published_at ?? a.published_date ?? a.created_at);
}

function excerptOf(html: string | null | undefined, max = 160): string {
  if (!html) return "";
  // Strip HTML tags and collapse whitespace, then truncate at a word boundary.
  const plain = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 60 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

function ArticleCard({ article, size }: { article: Article; size: "sm" | "md" }) {
  const isMd = size === "md";
  return (
    <Link
      href={`/niitlel/${article.id}`}
      className="group block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:border-purple-300 hover:shadow-md"
    >
      <div className={`overflow-hidden ${isMd ? "aspect-video" : "aspect-16/10"}`}>
        {article.image_url ? (
          <img
            src={article.image_url}
            alt={article.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-linear-to-br from-purple-100 to-pink-100" />
        )}
      </div>
      <div className={isMd ? "p-4 sm:p-5" : "p-3 sm:p-4"}>
        <p className={`mb-1.5 font-bold uppercase tracking-normal text-pink-500 ${isMd ? "text-[10px]" : "text-[9px]"}`}>
          {article.category}
        </p>
        <h4 className={`mb-2 line-clamp-2 font-bold leading-snug text-[#2d1b69] group-hover:text-purple-600 ${isMd ? "text-base sm:text-lg" : "text-sm"}`}>
          {article.title}
        </h4>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-400 sm:text-xs">
          <span className="truncate">{authorOf(article)}</span>
          {authorOf(article) && dateOf(article) && <span>•</span>}
          <span>{dateOf(article)}</span>
        </div>
        {article.reviewed_by && (
          <p className="mt-0.5 text-[10px] italic text-gray-400 sm:text-[11px]">
            Хянасан: {article.reviewed_by}
          </p>
        )}
        <p className={`mt-2 line-clamp-3 leading-relaxed text-gray-600 ${isMd ? "text-xs sm:text-sm" : "text-[11px] sm:text-xs"}`}>
          {excerptOf(article.content, isMd ? 180 : 120)}
        </p>
        <div className="mt-3 flex items-center justify-end gap-1 text-[11px] text-gray-400 sm:text-xs">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {(article.view_count ?? 0).toLocaleString()} уншсан
        </div>
      </div>
    </Link>
  );
}

export default function Niitlel() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createClient()
      .from("articles")
      .select(
        "id, title, content, category, image_url, author_name, reviewed_by, view_count, published_date, published_at, created_at, team_members(first_name, last_name)",
      )
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setArticles((data ?? []) as unknown as Article[]);
        setLoading(false);
      });
  }, []);

  const featured = articles[0] ?? null;
  const topRight = articles.slice(1, 2);
  const bottomRow = articles.slice(2, 5);

  if (loading) {
    return (
      <section className="bg-white px-6 py-12 sm:px-9 sm:py-20 md:px-16 lg:px-28">
        <div className="mb-6 sm:mb-10">
          <div className="mb-2 h-8 w-40 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-4 w-64 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="mb-4 grid gap-4 sm:grid-cols-2">
              <div className="aspect-video animate-pulse rounded-2xl bg-gray-200" />
              <div className="aspect-video animate-pulse rounded-2xl bg-gray-200" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-video animate-pulse rounded-2xl bg-gray-200" />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="h-80 animate-pulse rounded-2xl border-2 border-gray-200 bg-gray-100" />
            <div className="h-52 animate-pulse rounded-2xl border border-gray-200 bg-gray-100" />
          </div>
        </div>
      </section>
    );
  }

  if (articles.length === 0) return null;

  return (
    <section
      id="niitlel"
      className="bg-white px-6 py-12 sm:px-9 sm:py-20 md:px-16 lg:px-28"
    >
      {/* Section Header */}
      <div className="mb-6 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="mb-1 text-2xl font-bold text-[#2d1b69] sm:text-3xl md:text-4xl">
            Нийтлэл
          </h2>
          <p className="text-xs text-purple-500/70 sm:text-sm">
            Хамт Сэтгэл зүйгээ өөрөө үнэлж сурцгаая
          </p>
        </div>
        <Link
          href="/niitlel"
          className="flex w-fit items-center gap-2 rounded-full border border-purple-300 bg-white px-4 py-2 text-xs font-medium text-purple-700 shadow-sm transition-colors hover:bg-purple-50 hover:text-purple-900 sm:px-6 sm:py-2.5 sm:text-sm"
        >
          Бүгдийг үзэх
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-3.5 w-3.5 sm:h-4 sm:w-4"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left column: 6 articles in 2 rows */}
        <div>
          {/* Row 1: 2 equal cards */}
          {featured && (
            <div className="mb-4 grid gap-4 sm:grid-cols-2">
              <ArticleCard article={featured} size="md" />
              {topRight.map((a) => (
                <ArticleCard key={a.id} article={a} size="md" />
              ))}
            </div>
          )}

          {/* Row 2: 3 cards with images */}
          {bottomRow.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-3">
              {bottomRow.map((a) => (
                <ArticleCard key={a.id} article={a} size="md" />
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-4 lg:flex-col">
          {/* Trending card */}
          <div className="overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-md transition-all hover:shadow-lg">
            <div className="relative h-56 overflow-hidden sm:h-64">
              <img
                src="/55.png"
                alt="Сэтгэл зүйн тест"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="px-5 pb-5 pt-4 text-center">
              <h4 className="mb-3 text-base font-bold text-[#2d1b69] sm:text-lg">
                Өөрийгөө илүү сайн таних, сэтгэл зүйн байдлаа үнэлэхэд тусална.
              </h4>
              <Link
                href="/tests"
                className="inline-block rounded-full bg-linear-to-r from-pink-500 to-purple-400 px-6 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 sm:text-sm"
              >
                Тэст бөглөх
              </Link>
            </div>
          </div>

          {/* Online Therapy CTA */}
          <div className="rounded-2xl bg-[#2d1b69] p-5 text-center sm:p-6">
            <h4 className="mb-2 text-lg font-bold text-white sm:text-xl">
              Онлайн зөвлөгөө
            </h4>
            <p className="mb-4 text-xs text-purple-200/70 sm:text-sm">
              Гэрээсээ мэргэжлийн тусламж авах боломж.
            </p>
            <div className="flex flex-col gap-2.5">
              <Link
                href="/team"
                className="rounded-full bg-linear-to-r from-pink-500 to-purple-400 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90 sm:text-sm"
              >
                Сэтгэл зүйчээ сонгох
              </Link>
              <Link
                href="/privacy"
                className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/20 sm:text-sm"
              >
                Нууцлалын бодлого
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
