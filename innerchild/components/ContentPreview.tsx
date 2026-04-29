"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface ContentItem {
  id: string;
  title: string;
  url: string;
  category: string | null;
  description: string | null;
  thumbnail: string | null;
}

function getYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function getThumb(item: ContentItem): string {
  if (item.thumbnail) return item.thumbnail;
  const id = getYoutubeId(item.url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
}

export default function ContentPreview() {
  const [videos, setVideos] = useState<ContentItem[]>([]);

  useEffect(() => {
    createClient()
      .from("content")
      .select("id, title, url, category, description, thumbnail")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }) => setVideos((data ?? []) as ContentItem[]));
  }, []);

  if (videos.length === 0) return null;

  return (
    <section className="px-6 py-12 sm:px-9 sm:py-20 md:px-16 lg:px-28">
      <div className="mb-6 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-[#2d1b69] sm:text-3xl md:text-4xl">
          Контент
        </h2>
        <Link
          href="/content"
          className="flex w-fit items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-xs font-medium text-[#2d1b69] transition-colors hover:border-[#2d1b69] hover:bg-purple-50 sm:px-6 sm:py-2.5 sm:text-sm"
        >
          Бүгдийг үзэх
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => {
          const thumb = getThumb(video);
          return (
            <Link
              key={video.id}
              href={`/content?play=${video.id}`}
              className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:border-purple-300 hover:shadow-lg"
            >
              <div className="relative aspect-video overflow-hidden bg-gray-100">
                {thumb && (
                  <img
                    src={thumb}
                    alt={video.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2d1b69]/80 text-white backdrop-blur-sm transition-transform group-hover:scale-110">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-5 w-5">
                      <polygon points="5 3 19 12 5 21" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[#2d1b69]">
                  {video.title}
                </h3>
                {video.description && (
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-gray-500">{video.description}</p>
                )}
                {video.category && (
                  <p className="mt-2 text-xs font-medium text-[#f97316]">{video.category}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
