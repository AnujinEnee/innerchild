"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  image_url: string | null;
  published_at: string | null;
  published_date: string | null;
  created_at: string;
  author_id: string | null;
  author_name: string | null;
  reviewed_by: string | null;
  view_count: number | null;
  team_members: {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
    image_url: string | null;
    bio: string | null;
    expertise: string | null;
  } | null;
}

function parseList(val: string | null): string[] {
  if (!val) return [];
  try { const p = JSON.parse(val); if (Array.isArray(p)) return p; } catch {}
  return val.split(",").map((s) => s.trim()).filter(Boolean);
}

function AuthorHoverCard({ member, children }: {
  member: { id: string; first_name: string; last_name: string; role: string; image_url: string | null; bio: string | null; expertise?: string | null };
  children: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  const name = `${member.last_name} ${member.first_name}`.trim();
  const role = member.role === "psychologist" ? "Сэтгэл зүйч" : member.role === "therapist" ? "Сэтгэл засалч" : member.role;

  return (
    <span className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span className="cursor-pointer">
        {children}
      </span>
      {show && (
        <div className="absolute left-0 top-full z-50 pt-2">
        <div className="w-64 rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-purple-100">
              {member.image_url ? (
                <img src={member.image_url} alt={name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-bold text-purple-400">{member.first_name.charAt(0)}</div>
              )}
            </div>
            <div>
              <Link href={`/team/${member.id}`} className="text-sm font-semibold text-[#2d1b69] hover:underline">{name}</Link>
              <p className="text-xs text-gray-500">{role}</p>
            </div>
          </div>
          {(() => {
            const list = parseList(member.expertise ?? null);
            return list.length > 0 ? (
              <div className="mt-3">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Мэргэшиж буй салбарууд</p>
                <div className="flex flex-wrap gap-1">
                  {list.map((item, i) => (
                    <span key={i} className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] text-[#2d1b69]">{item}</span>
                  ))}
                </div>
              </div>
            ) : null;
          })()}
          <div className="mt-3 border-t border-gray-100 pt-2">
            <Link href={`/team/${member.id}`} className="text-xs font-medium text-[#2d1b69] hover:underline">Дэлгэрэнгүй →</Link>
          </div>
        </div>
        </div>
      )}
    </span>
  );
}

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeHeading, setActiveHeading] = useState("");
  const [reviewedMember, setReviewedMember] = useState<{ id: string; first_name: string; last_name: string; role: string; image_url: string | null; bio: string | null; expertise: string | null } | null>(null);
  const [progress, setProgress] = useState(0);
  const [related, setRelated] = useState<{ id: string; title: string; category: string; image_url: string | null; published_date: string | null; published_at: string | null; created_at: string }[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("articles")
      .select(
        "id, title, content, category, image_url, published_at, published_date, created_at, author_id, author_name, reviewed_by, view_count, team_members(id, first_name, last_name, role, image_url, bio, expertise)",
      )
      .eq("id", id)
      .eq("status", "published")
      .single()
      .then(async ({ data }) => {
        setArticle((data as unknown as Article) ?? null);
        // Fire-and-forget view count increment (server dedups by 24h cookie).
        if (data?.id) {
          fetch(`/api/articles/${data.id}/view`, { method: "POST" })
            .then((r) => r.json())
            .then((result) => {
              if (result.counted && typeof result.view_count === "number") {
                setArticle((prev) => (prev ? { ...prev, view_count: result.view_count } : prev));
              }
            })
            .catch(() => { /* ignore */ });
        }
        // Fetch reviewed_by member by name
        if (data?.reviewed_by) {
          const parts = data.reviewed_by.split(" ");
          if (parts.length >= 2) {
            const { data: member } = await supabase
              .from("team_members")
              .select("id, first_name, last_name, role, image_url, bio, expertise")
              .eq("last_name", parts[0])
              .eq("first_name", parts.slice(1).join(" "))
              .maybeSingle();
            if (member) setReviewedMember(member as typeof reviewedMember);
          }
        }
        setLoading(false);
      });
  }, [id]);

  // Extract H2 headings for Table of Contents
  const { headings, contentWithIds } = useMemo(() => {
    const h: { id: string; text: string }[] = [];
    let idx = 0;
    const raw = article?.content ?? "";
    const hasHtml = raw.includes("<") && raw.includes(">");
    const processed = hasHtml
      ? raw.replace(/<h2[^>]*>(.*?)<\/h2>/gi, (_, text) => {
          const clean = text.replace(/<[^>]*>/g, "").trim();
          const base = clean.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "") || "section";
          const hid = `${base}-${idx++}`;
          h.push({ id: hid, text: clean });
          return `<h2 id="${hid}">${text}</h2>`;
        })
      : raw;
    return { headings: h, contentWithIds: processed };
  }, [article?.content]);

  useEffect(() => {
    if (headings.length === 0) return;
    if (!activeHeading) setActiveHeading(headings[0].id);

    const handleScroll = () => {
      let current = headings[0]?.id ?? "";
      for (const h of headings) {
        const el = document.getElementById(h.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 100) current = h.id;
        }
      }
      setActiveHeading(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headings]);

  // Reading progress
  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Related articles
  useEffect(() => {
    if (!article) return;
    createClient()
      .from("articles")
      .select("id, title, category, image_url, published_date, published_at, created_at")
      .eq("status", "published")
      .eq("category", article.category)
      .neq("id", article.id)
      .limit(3)
      .then(({ data }) => setRelated((data ?? []) as typeof related));
  }, [article]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
        <p className="text-zinc-500">Нийтлэл олдсонгүй</p>
        <Link href="/niitlel" className="text-sm text-purple-600 hover:underline">← Буцах</Link>
      </div>
    );
  }

  const dateStr = article.published_date ?? article.published_at ?? article.created_at;
  const d = new Date(dateStr);
  const date = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;

  const authorName = article.team_members
    ? `${article.team_members.last_name} ${article.team_members.first_name}`.trim()
    : article.author_name;


  const isHtml = article.content.includes("<") && article.content.includes(">");

  // Note: article.content is admin-authored trusted HTML from Tiptap editor, not user-generated content
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "var(--font-montserrat), Arial, sans-serif" }}>
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 z-60 h-0.5 bg-linear-to-r from-pink-500 to-purple-500 transition-all duration-150" style={{ width: `${progress}%` }} />

      <Header />

      {/* Header spacer with gradient */}
      <div className="h-20 bg-[#2d1b69] sm:h-24" />

      {/* Article header */}
      <div className="px-4 pt-6 sm:px-9 sm:pt-10 md:px-16 lg:px-28">
        <div className="mx-auto max-w-5xl">
          <Link href="/niitlel" className="mb-5 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-[#2d1b69]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Нийтлэл
          </Link>

          {/* Category badge */}
          <div className="mb-4">
            <span className="rounded-full bg-[#f97316]/10 px-3 py-1 text-xs font-semibold text-[#f97316]">
              {article.category}
            </span>
          </div>

          <h1 className="mb-5 text-2xl font-bold leading-tight text-zinc-900 sm:text-3xl md:text-4xl lg:text-5xl">
            {article.title}
          </h1>

          <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
            {authorName && (
              <span className="flex items-center gap-2">
                {article.team_members?.image_url && (
                  <img src={article.team_members.image_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                )}
                {article.team_members ? (
                  <AuthorHoverCard member={article.team_members}><span className="font-medium text-[#2d1b69] underline underline-offset-2 decoration-zinc-300 hover:decoration-[#2d1b69] cursor-pointer">{authorName}</span></AuthorHoverCard>
                ) : (
                  <span className="font-medium text-zinc-900">{authorName}</span>
                )}
              </span>
            )}
            <span className="text-zinc-300">·</span>
            <span>{date}</span>
            {article.reviewed_by && (
              <>
                <span className="text-zinc-300">·</span>
                <span className="flex items-center gap-1">
                  <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-green-500">
                    <circle cx="12" cy="12" r="10" fill="currentColor" />
                    <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2" fill="none" />
                  </svg>
                  Хянасан:{" "}
                  {reviewedMember ? (
                    <AuthorHoverCard member={reviewedMember}><span className="font-medium text-[#2d1b69] underline underline-offset-2 decoration-zinc-300 hover:decoration-[#2d1b69] cursor-pointer">{article.reviewed_by}</span></AuthorHoverCard>
                  ) : (
                    <span className="font-medium text-zinc-700">{article.reviewed_by}</span>
                  )}
                </span>
              </>
            )}
          </div>

          {/* Article image */}
          {article.image_url && (
            <div className="mb-8 overflow-hidden rounded-2xl shadow-sm">
              <img src={article.image_url} alt={article.title} className="w-full object-cover" />
            </div>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="px-6 pb-8 sm:px-9 sm:pb-12 md:px-16 lg:px-28">
        <div className="mx-auto max-w-5xl lg:grid lg:grid-cols-[240px_1fr] lg:gap-12">

          {/* Sidebar — author card */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">

              {headings.length > 0 && (
                <div className="mb-6 rounded-xl bg-[#2d1b69] p-5">
                  <p className="mb-4 text-sm font-bold text-white">Агуулгын жагсаалт</p>
                  <nav className="flex flex-col border-l-2 border-purple-400/30">
                    {headings.map((h) => (
                      <a
                        key={h.id}
                        href={`#${h.id}`}
                        className={`flex items-center gap-1.5 border-l-2 -ml-0.5 py-1.5 pl-4 text-sm transition-colors hover:border-[#f97316] hover:text-white ${
                          activeHeading === h.id ? "border-[#f97316] font-medium text-white" : "border-transparent text-purple-200/70"
                        }`}
                      >
                        {activeHeading === h.id && <span className="text-[#f97316] text-xs">▶</span>}
                        {h.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              <div className="rounded-xl border border-gray-100 p-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Холбоос</p>
                <div className="flex flex-col gap-2">
                  <Link href="/consultation" className="text-xs font-medium text-[#2d1b69] hover:underline">Зөвлөгөө авах →</Link>
                  <Link href="/niitlel" className="text-xs font-medium text-[#2d1b69] hover:underline">Бусад нийтлэл →</Link>
                  <Link href="/tests" className="text-xs font-medium text-[#2d1b69] hover:underline">Тест өгөх →</Link>
                </div>
              </div>
            </div>
          </aside>

          {/* Main article */}
          <article>

            {/* Mobile Table of Contents */}
            {headings.length > 0 && (
              <div className="mb-6 rounded-xl bg-[#2d1b69] p-5 lg:hidden">
                <p className="mb-4 text-sm font-bold text-white">Агуулгын жагсаалт</p>
                <nav className="flex flex-col border-l-2 border-purple-400/30">
                  {headings.map((h) => (
                    <a key={h.id} href={`#${h.id}`} className={`flex items-center gap-1.5 border-l-2 -ml-0.5 py-1.5 pl-4 text-sm transition-colors hover:border-[#f97316] hover:text-white ${activeHeading === h.id ? "border-[#f97316] font-medium text-white" : "border-transparent text-purple-200/70"}`}>
                      {activeHeading === h.id && <span className="text-[#f97316] text-xs">▶</span>}
                      {h.text}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {/* Article body — admin-authored trusted HTML from Tiptap editor */}
            {isHtml ? (
              <div
                className="article-body prose prose-zinc max-w-none text-[17px] text-zinc-700 [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#2d1b69] [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-zinc-800 [&_p]:mb-0 [&_p]:text-justify [&_b]:font-semibold [&_b]:text-zinc-800 [&_strong]:font-semibold [&_strong]:text-zinc-800 [&_ul]:my-5 [&_ul]:list-none [&_ul]:pl-0 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:relative [&_li]:mb-3 [&_li]:pl-5 [&_li]:leading-relaxed [&_ul>li]:before:absolute [&_ul>li]:before:left-0 [&_ul>li]:before:top-2.5 [&_ul>li]:before:h-2 [&_ul>li]:before:w-2 [&_ul>li]:before:rounded-sm [&_ul>li]:before:bg-[#2d1b69] [&_ul>li]:before:content-[''] [&_em]:italic [&_a]:text-[#2d1b69] [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:my-8 [&_blockquote]:border-l-4 [&_blockquote]:border-[#2d1b69] [&_blockquote]:pl-6 [&_blockquote]:text-lg [&_blockquote]:italic [&_blockquote]:text-zinc-600 [&_hr]:my-8 [&_hr]:border-gray-200"
                style={{ lineHeight: 1.85 }}
                dangerouslySetInnerHTML={{ __html: contentWithIds }}
              />
            ) : (
              <div className="prose prose-zinc max-w-none">
                {article.content.split("\n").map((paragraph, i) =>
                  paragraph.trim() ? (
                    <p key={i} className="mb-6 text-[17px] leading-[1.85] text-zinc-700 text-justify">
                      {paragraph}
                    </p>
                  ) : (
                    <div key={i} className="mb-6" />
                  ),
                )}
              </div>
            )}

            {/* View count — at the bottom of the article body */}
            <div className="mt-10 flex items-center justify-end gap-1.5 border-t border-zinc-100 pt-5 text-sm text-zinc-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {(article.view_count ?? 0).toLocaleString()} уншсан
            </div>

            {/* Related articles */}
            {related.length > 0 && (
              <div className="mt-12 border-t border-zinc-100 pt-10">
                <h3 className="mb-6 text-lg font-bold text-zinc-900">Холбоотой нийтлэлүүд</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {related.map((r) => (
                    <Link key={r.id} href={`/niitlel/${r.id}`} className="group block overflow-hidden rounded-xl border border-zinc-100 transition-all hover:border-zinc-200 hover:shadow-md">
                      {r.image_url && (
                        <div className="aspect-16/10 overflow-hidden bg-zinc-100">
                          <img src={r.image_url} alt={r.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        </div>
                      )}
                      <div className="p-3 sm:p-4">
                        <p className="mb-1 text-[10px] font-semibold text-[#f97316]">{r.category}</p>
                        <h4 className="line-clamp-2 text-sm font-bold text-zinc-900 group-hover:text-[#2d1b69]">{r.title}</h4>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="mt-12 overflow-hidden rounded-2xl bg-[#2d1b69] px-6 py-8 sm:px-8 sm:py-10">
              <p className="mb-2 text-[10px] font-bold tracking-widest text-pink-400">INNER CHILD</p>
              <h2 className="mb-4 max-w-md text-lg font-bold text-white sm:text-xl">
                Мэргэжлийн сэтгэл зүйчтэй зөвлөлдөх үү?
              </h2>
              <div className="flex flex-wrap gap-3">
                <Link href="/consultation" className="rounded-full bg-linear-to-r from-pink-500 to-purple-400 px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90">
                  Цаг захиалах
                </Link>
                <Link href="/niitlel" className="rounded-full border border-purple-400/40 px-6 py-2.5 text-sm text-purple-200 transition-colors hover:border-purple-300 hover:text-white">
                  Бусад нийтлэл
                </Link>
              </div>
            </div>
          </article>
        </div>
      </div>

      <div className="h-10" />
      <Footer />
    </div>
  );
}
