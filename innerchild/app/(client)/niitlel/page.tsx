"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";
import { ALL_TESTS } from "@/lib/test-logics/registry";

interface UserArticle {
  id: string;
  title: string;
  content: string;
  submitted_at: string;
  author_name: string;
}

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  subcategory: string | null;
  image_url: string | null;
  author_name: string | null;
  view_count: number | null;
  published_at: string | null;
  published_date: string | null;
  created_at: string;
  team_members: { first_name: string; last_name: string } | null;
}

const tabs = [
  { id: "undsen", label: "Үндсэн нийтлэл" },
  { id: "users", label: "Хүмүүсийн нийтлэл" },
];

const contentData: Record<
  string,
  {
    featured: {
      category: string;
      title: string;
      author: string;
      image: string;
      date: string;
    };
    articles: {
      category: string;
      title: string;
      author: string;
      date: string;
      image?: string;
    }[];
  }
> = {
  undsen: {
    featured: {
      category: "СЭТГЭЛ ЗҮЙ",
      title: "Дотоод хүүхдээ таньж мэдэх нь яагаад чухал вэ?",
      author: "Б. Солонго, Сэтгэл зүйч",
      image: "/articles/featured.jpg",
      date: "2026.03.15",
    },
    articles: [
      {
        category: "ӨӨРИЙГӨӨ ХӨГЖҮҮЛЭХ",
        title: "Өдөр тутмын 7 дадал сэтгэцийн эрүүл мэндэд тустай",
        author: "А. Болор",
        date: "2026.03.10",
      },
      {
        category: "ХАРИЛЦАА",
        title: "Хайрын хэлний тухай ойлголт таны харилцааг хэрхэн өөрчлөх вэ?",
        author: "Д. Анужин",
        date: "2026.03.08",
      },
      {
        category: "СЭТГЭЛ ЗАСАЛ",
        title: "Стрессийг даван туулах 5 энгийн арга зам",
        author: "Г. Тэмүүлэн, PhD",
        date: "2026.03.05",
      },
      {
        category: "СЭТГЭЛ ЗҮЙ",
        title: "Хүүхдийн сэтгэл зүйд нөлөөлөх гэр бүлийн орчин",
        author: "О. Батбаяр",
        date: "2026.02.28",
      },
    ],
  },
  test: {
    featured: {
      category: "ТЕСТ",
      title: "Таны сэтгэл санааны байдлыг тодорхойлох тест",
      author: "Inner Child баг",
      image: "/articles/test.jpg",
      date: "2026.03.12",
    },
    articles: [],
  },
};

function plainExcerpt(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&hellip;/g, "…")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(parseInt(n, 10)))
    .replace(/\s+/g, " ")
    .trim();
}

function NiitlelContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get("tab");
    return tab && tabs.some((t) => t.id === tab) ? tab : "undsen";
  });
  const [userArticles, setUserArticles] = useState<UserArticle[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [articleCategory, setArticleCategory] = useState("Бүгд");
  const [articleSubcategory, setArticleSubcategory] = useState<string | null>(
    null,
  );
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const data = contentData[activeTab] ?? null;

  useEffect(() => {
    createClient()
      .from("submitted_articles")
      .select("id, title, content, author_name, submitted_at")
      .eq("status", "approved")
      .order("submitted_at", { ascending: false })
      .then(({ data }) => setUserArticles(data ?? []));
  }, []);

  useEffect(() => {
    createClient()
      .from("articles")
      .select(
        "id, title, content, category, subcategory, image_url, author_name, view_count, published_at, published_date, created_at, team_members(first_name, last_name)",
      )
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .then(({ data }) => {
        setArticles((data ?? []) as unknown as Article[]);
        setArticlesLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <div className="bg-[#2d1b69] px-6 pt-28 pb-10 sm:px-9 sm:pt-36 sm:pb-14 md:px-16 lg:px-28">
        <h1 className="mb-3 text-2xl font-bold text-white sm:text-3xl md:text-4xl">
          Хамтдаа сэтгэл зүйгээ үнэлж{" "}
          <span className="bg-linear-to-r from-pink-400 to-purple-300 bg-clip-text italic text-transparent">
            сурцгаая
          </span>
        </h1>

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <Link
            href="/consultation"
            className="w-full rounded-full bg-linear-to-r from-pink-500 to-purple-400 px-7 py-3 text-center text-sm font-medium text-white transition-opacity hover:opacity-90 sm:w-auto"
          >
            Зөвлөгөө авах
          </Link>
          <Link
            href="/content"
            className="flex w-full items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-7 py-3 text-sm text-white backdrop-blur transition-colors hover:bg-white/20 sm:w-auto"
          >
            Контент үзэх
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <circle cx="12" cy="12" r="10" />
              <polygon points="10 8 16 12 10 16" fill="currentColor" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 sm:px-8 lg:px-40">
        <div className="flex gap-1 overflow-x-auto border-b border-zinc-200 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 rounded-t-lg px-4 py-3 text-xs font-medium transition-colors sm:px-6 sm:text-sm ${
                activeTab === tab.id
                  ? "border-b-2 border-pink-400 text-zinc-900"
                  : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Үндсэн нийтлэл tab - Supabase */}
      {activeTab === "undsen" && (
        <div className="mx-2 mt-4 rounded-xl bg-zinc-50 p-3 sm:mx-8 sm:mt-8 sm:rounded-[3rem] sm:p-8 md:mx-10 md:p-12 lg:mx-40">
          {/* Category filters — built dynamically from articles */}
          {articles.length > 0 &&
            (() => {
              const groupMap = new Map<string, Set<string>>();
              for (const a of articles) {
                if (!a.category) continue;
                if (!groupMap.has(a.category))
                  groupMap.set(a.category, new Set());
                if (a.subcategory) groupMap.get(a.category)!.add(a.subcategory);
              }
              const groups = Array.from(groupMap.entries()).map(
                ([label, subs]) => ({
                  label,
                  subcategories: Array.from(subs),
                }),
              );
              const currentSubs =
                groups.find((g) => g.label === expandedGroup)?.subcategories ??
                [];

              return (
                <div className="mb-6 sm:mb-8">
                  <div className="flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible sm:pb-0">
                    <button
                      onClick={() => {
                        setArticleCategory("Бүгд");
                        setArticleSubcategory(null);
                        setExpandedGroup(null);
                      }}
                      className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-colors sm:px-5 sm:text-sm ${
                        articleCategory === "Бүгд"
                          ? "bg-purple-600 text-white"
                          : "border border-purple-200 text-purple-600 hover:border-purple-400"
                      }`}
                    >
                      Бүгд
                    </button>
                    {groups.map((g) => (
                      <button
                        key={g.label}
                        onClick={() => {
                          if (expandedGroup === g.label) {
                            setExpandedGroup(null);
                          } else {
                            setExpandedGroup(g.label);
                            setArticleCategory(g.label);
                            setArticleSubcategory(null);
                          }
                        }}
                        className={`flex shrink-0 items-center gap-1 rounded-full px-4 py-2 text-xs font-medium transition-colors sm:px-5 sm:text-sm ${
                          articleCategory === g.label ||
                          expandedGroup === g.label
                            ? "bg-purple-600 text-white"
                            : "border border-purple-200 text-purple-600 hover:border-purple-400"
                        }`}
                      >
                        {g.label}
                        {g.subcategories.length > 0 && (
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className={`h-3 w-3 transition-transform ${expandedGroup === g.label ? "rotate-180" : ""}`}
                          >
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                  {expandedGroup && currentSubs.length > 0 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible sm:pb-0">
                      {currentSubs.map((sub) => (
                        <button
                          key={sub}
                          onClick={() => {
                            setArticleCategory(expandedGroup);
                            setArticleSubcategory(sub);
                          }}
                          className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-colors sm:px-5 sm:text-sm ${
                            articleSubcategory === sub
                              ? "bg-amber-500 text-white"
                              : "border border-zinc-200 text-zinc-600 hover:border-zinc-400"
                          }`}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

          {articlesLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600" />
              <p className="ml-3 text-sm text-zinc-400">Уншиж байна...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-zinc-400">Нийтлэгдсэн нийтлэл байхгүй байна</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {articles
                .filter((a) => {
                  if (articleCategory === "Бүгд") return true;
                  if (articleSubcategory)
                    return a.subcategory === articleSubcategory;
                  return a.category === articleCategory;
                })
                .map((article) => {
                  const author = article.team_members
                    ? `${article.team_members.last_name} ${article.team_members.first_name}`.trim()
                    : (article.author_name ?? null);
                  const date = new Date(
                    article.published_date ??
                      article.published_at ??
                      article.created_at,
                  ).toLocaleDateString("mn-MN");
                  return (
                    <Link
                      key={article.id}
                      href={`/niitlel/${article.id}`}
                      className="flex h-full flex-col rounded-xl bg-[#f8f6fc] p-3 transition-shadow hover:shadow-md sm:rounded-2xl sm:p-6"
                    >
                      {article.image_url && (
                        <div className="mb-3 aspect-[16/9] overflow-hidden rounded-lg bg-zinc-200 sm:mb-4 sm:rounded-xl">
                          <img
                            src={article.image_url}
                            alt={article.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <p className="mb-1 text-[10px] font-bold tracking-normal text-[#f97316] sm:mb-2 sm:text-xs">
                        {article.subcategory ?? article.category}
                      </p>
                      {/* Fixed-height block (5 lines). Title takes 1-2 lines naturally; excerpt fills the rest, overflow hidden. */}
                      <div className="mb-3 h-28 overflow-hidden sm:mb-4 sm:h-34">
                        <h3 className="mb-1 line-clamp-2 text-sm font-bold leading-snug text-[#2d1b69] sm:mb-2 sm:text-base">
                          {article.title}
                        </h3>
                        <p className="text-xs leading-relaxed text-zinc-500 sm:text-sm">
                          {plainExcerpt(article.content)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-zinc-900">{date}</p>
                        {author && (
                          <p className="text-xs font-medium text-zinc-900">
                            {author}
                          </p>
                        )}
                      </div>
                      <div className="mt-2 flex items-center justify-end gap-1 text-[11px] text-zinc-400 sm:text-xs">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        {(article.view_count ?? 0).toLocaleString()} уншсан
                      </div>
                    </Link>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Content - white rounded area (test tab) */}
      {activeTab === "test" && data && (
        <div className="mx-2 mt-4 rounded-xl bg-zinc-50 p-3 sm:mx-8 sm:mt-8 sm:rounded-[3rem] sm:p-8 md:mx-10 md:p-12 lg:mx-40">
          {/* Featured (not for test tab) */}
          {activeTab !== "test" && (
            <Link
              href="/niitlel"
              className="group mb-8 grid gap-4 sm:mb-10 sm:gap-8 md:grid-cols-[1.2fr_1fr]"
            >
              <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-zinc-200">
                <img
                  src={data.featured.image}
                  alt={data.featured.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col justify-center">
                <p className="mb-2 text-xs font-bold tracking-normal text-purple-600">
                  {data.featured.category}
                </p>
                <h2 className="mb-3 text-2xl font-bold leading-snug text-zinc-900 group-hover:text-purple-600 md:text-3xl">
                  {data.featured.title}
                </h2>
                <p className="mb-4 text-sm text-zinc-500">
                  {data.featured.author} · {data.featured.date}
                </p>
                <span className="inline-flex w-fit items-center gap-2 text-sm font-medium text-purple-600 group-hover:underline">
                  Дэлгэрэнгүй унших
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-4 w-4"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>
          )}

          {/* Articles */}
          {activeTab === "test" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {ALL_TESTS.map((test) => (
                <Link
                  key={test.slug}
                  href={`/tests/${test.slug}`}
                  className="group rounded-2xl border border-zinc-200 bg-white p-5 transition-all hover:border-purple-300 hover:shadow-lg"
                >
                  <h3 className="mb-2 text-base font-bold text-zinc-900 group-hover:text-purple-600">
                    {test.name}
                  </h3>
                  <p className="mb-4 line-clamp-2 text-sm text-zinc-500">
                    {test.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-zinc-400">
                    <span>{test.questionCount} асуулт</span>
                    <span>~{test.estimatedMinutes} мин</span>
                    <span className="rounded-full border border-orange-300 bg-orange-50 px-2.5 py-0.5 text-orange-500">
                      {test.category}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {data.articles.map((article) => (
                <Link
                  key={article.title}
                  href="/niitlel"
                  className="group rounded-2xl bg-[#f8f6fc] p-6 transition-shadow hover:shadow-lg"
                >
                  <p className="mb-2 text-xs font-bold tracking-normal text-[#f97316]">
                    {article.category}
                  </p>
                  <h3 className="mb-2 text-base font-bold leading-snug text-[#2d1b69] group-hover:text-purple-600">
                    {article.title}
                  </h3>
                  <p className="text-sm text-zinc-500">
                    {article.author} · {article.date}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* User submitted articles tab */}
      {activeTab === "users" && (
        <div className="mx-2 mt-4 rounded-xl bg-zinc-50 p-3 sm:mx-8 sm:mt-8 sm:rounded-[3rem] sm:p-8 md:mx-10 md:p-12 lg:mx-40">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold text-zinc-900 sm:text-2xl">
              Хүмүүсийн нийтлэл
            </h2>
            <Link
              href="/submit-article"
              className="w-full rounded-full bg-linear-to-r from-pink-500 to-purple-400 px-5 py-2 text-center text-sm font-medium text-white transition-opacity hover:opacity-90 sm:w-auto"
            >
              + Нийтлэл оруулах
            </Link>
          </div>
          {userArticles.length === 0 ? (
            <div className="py-16 text-center">
              <p className="mb-4 text-zinc-400">
                Одоохондоо нийтлэгдсэн нийтлэл байхгүй байна.
              </p>
              <Link
                href="/submit-article"
                className="text-sm font-medium text-purple-600 hover:underline"
              >
                Анхны нийтлэлийг та оруулаарай →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {userArticles.map((a) => (
                <Link
                  key={a.id}
                  href={`/niitlel/user/${a.id}`}
                  className="group relative overflow-hidden rounded-2xl border border-pink-100 bg-linear-to-br from-pink-50 to-purple-50 p-4 transition-shadow hover:shadow-md block sm:p-6"
                >
                  {/* Accent bar */}
                  <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-linear-to-b from-pink-400 to-purple-400" />
                  {/* Author avatar */}
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-pink-400 to-purple-500 text-sm font-bold text-white">
                      {a.author_name?.charAt(0).toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-800">
                        {a.author_name}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {new Date(a.submitted_at).toLocaleDateString("mn-MN")}
                      </p>
                    </div>
                    <span className="ml-auto rounded-full bg-pink-100 px-3 py-1 text-[10px] font-semibold text-pink-600">
                      Уншигчийн нийтлэл
                    </span>
                  </div>
                  <h3 className="mb-2 text-base font-bold leading-snug text-zinc-900 group-hover:text-purple-700">
                    {a.title}
                  </h3>
                  <p className="line-clamp-3 text-sm leading-relaxed text-zinc-500">
                    {a.content}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Spacing before footer */}
      <div className="h-10 pb-10" />

      <Footer />
    </div>
  );
}

export default function NiitlelPage() {
  return (
    <Suspense>
      <NiitlelContent />
    </Suspense>
  );
}
