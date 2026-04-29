"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";

interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  url: string;
  type: "youtube" | "podcast";
  category: string | null;
  thumbnail: string | null;
}

function getYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/,
  );
  return match ? match[1] : null;
}

function getThumb(item: ContentItem): string {
  if (item.thumbnail) return item.thumbnail;
  const id = getYoutubeId(item.url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
}

function VideoCard({
  item,
  onPlay,
  active,
}: {
  item: ContentItem;
  onPlay: () => void;
  active: boolean;
}) {
  const thumb = getThumb(item);
  return (
    <button
      onClick={onPlay}
      className={`group w-full text-left overflow-hidden rounded-2xl border bg-white transition-all hover:shadow-lg ${active ? "border-purple-500 shadow-md" : "border-gray-200 hover:border-purple-300"}`}
    >
      <div className="relative aspect-video overflow-hidden bg-gray-100">
        {thumb ? (
          <img
            src={thumb}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10">
              <polygon points="5 3 19 12 5 21" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full text-white backdrop-blur-sm transition-transform group-hover:scale-110 ${active ? "bg-purple-600" : "bg-purple-600/80"}`}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-5 w-5">
              <polygon points="5 3 19 12 5 21" />
            </svg>
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[#2d1b69]">
          {item.title}
        </h3>
        {item.description && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-gray-500">{item.description}</p>
        )}
        {item.category && (
          <p className="mt-2 text-xs font-medium text-[#f97316]">{item.category}</p>
        )}
      </div>
    </button>
  );
}

function Player({ item, onClose }: { item: ContentItem; onClose: () => void }) {
  const youtubeId = getYoutubeId(item.url);
  const embedUrl = youtubeId
    ? `https://www.youtube.com/embed/${youtubeId}?autoplay=1`
    : item.url;
  return (
    <div className="mb-10">
      <div className="relative z-0 overflow-hidden rounded-2xl bg-black shadow-xl">
        <div className="aspect-video w-full">
          <iframe
            src={embedUrl}
            title={item.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[#2d1b69]">
            {item.title}
          </h3>
          {item.category && (
            <p className="mt-1 text-xs font-medium text-[#f97316]">{item.category}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded-full border border-gray-200 px-4 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
        >
          Хаах
        </button>
      </div>
      {item.description && (
        <p className="mt-3 text-sm leading-relaxed text-gray-500 text-justify">{item.description}</p>
      )}
    </div>
  );
}

export default function ContentPage() {
  return (
    <Suspense>
      <ContentInner />
    </Suspense>
  );
}

function ContentInner() {
  const searchParams = useSearchParams();
  const playId = searchParams.get("play");

  const [youtube, setYoutube] = useState<ContentItem[]>([]);
  const [podcast, setPodcast] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<ContentItem | null>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    createClient()
      .from("content")
      .select("id, title, description, url, type, category, thumbnail")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .then(({ data }: { data: ContentItem[] | null }) => {
        const items = (data ?? []) as ContentItem[];
        setYoutube(items.filter((c) => c.type === "youtube"));
        setPodcast(items.filter((c) => c.type === "podcast"));
        if (playId) {
          const target = items.find((c) => c.id === playId);
          if (target) setPlaying(target);
        }
        setLoading(false);
      });
  }, [playId]);

  return (
    <div className="isolate min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <div className="bg-[#2d1b69] px-6 pt-28 pb-10 sm:px-9 sm:pt-36 sm:pb-14 md:px-16 lg:px-28">
        <h1 className="mb-3 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
          Сэтгэл зүйн чанартай{" "}
          <span className="bg-linear-to-r from-pink-300 to-purple-300 bg-clip-text italic text-transparent">
            контент
          </span>
        </h1>
        <p className="mb-6 max-w-lg text-sm text-purple-300/70">
          Та бидний оролцсон болон бүтээсэн контентуудыг нэг дороос харах
          боломжтой. Видео, подкаст.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/consultation"
            className="rounded-full bg-linear-to-r from-pink-500 to-purple-400 px-7 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Зөвлөгөө авах
          </Link>
          <Link
            href="/niitlel"
            className="flex items-center gap-2 rounded-full border border-purple-400/40 px-7 py-3 text-sm text-purple-200 transition-colors hover:border-purple-300 hover:text-white"
          >
            Нийтлэл
          </Link>
        </div>
      </div>

      {/* Content area */}
      <div className="px-6 py-8 sm:px-9 sm:py-12 md:px-16 lg:px-28">
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-gray-100">
                <div className="aspect-video animate-pulse bg-gray-200" />
                <div className="p-4">
                  <div className="mb-2 h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Player */}
            {playing && (
              <div ref={playerRef} className="mb-10 scroll-mt-20">
                <Player item={playing} onClose={() => setPlaying(null)} />
              </div>
            )}

            {/* YouTube Section */}
            {youtube.length > 0 && (
              <section className="mb-12">
                <h2 className="mb-6 text-2xl font-bold text-[#2d1b69] md:text-3xl">
                  Бидний контентууд
                </h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {youtube.map((item) => (
                    <VideoCard
                      key={item.id}
                      item={item}
                      active={playing?.id === item.id}
                      onPlay={() => { setPlaying(item); setTimeout(() => playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100); }}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Podcast Section */}
            {podcast.length > 0 && (
              <section>
                <h2 className="mb-6 text-2xl font-bold text-[#2d1b69] md:text-3xl">
                  Подкаст
                </h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {podcast.map((item) => (
                    <VideoCard
                      key={item.id}
                      item={item}
                      active={playing?.id === item.id}
                      onPlay={() => { setPlaying(item); setTimeout(() => playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100); }}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Empty state */}
            {youtube.length === 0 && podcast.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <p className="text-lg font-medium text-gray-400">Контент байхгүй байна</p>
                <p className="mt-2 text-sm text-gray-300">Удахгүй шинэ контент нэмэгдэнэ</p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="h-10" />
      <Footer />
    </div>
  );
}
