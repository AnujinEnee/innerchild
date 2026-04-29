"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";

interface TeamMember {
  id: string;
  last_name: string;
  first_name: string;
  role: string;
  expertise: string | null;
  education: string | null;
  experience: string | null;
  additional_experience: string | null;
  bio: string | null;
  phone: string | null;
  email: string | null;
  image_url: string | null;
  online_price: number | null;
  offline_price: number | null;
  online_duration: number | null;
  offline_duration: number | null;
  online_enabled: boolean;
  offline_enabled: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  psychologist: "Сэтгэл зүйч",
  therapist: "Сэтгэл засалч",
};

function parseList(val: string | null): string[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return val
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function TeamMemberPage() {
  const { id } = useParams<{ id: string }>();
  const [member, setMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createClient()
      .from("team_members")
      .select(
        "id, last_name, first_name, role, expertise, education, experience, additional_experience, bio, phone, email, image_url, online_price, offline_price, online_duration, offline_duration, online_enabled, offline_enabled",
      )
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setMember(data ?? null);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
        <p className="text-zinc-500">Мэдээлэл олдсонгүй</p>
        <Link href="/team" className="text-sm text-purple-600 hover:underline">
          ← Буцах
        </Link>
      </div>
    );
  }

  const fullName = `${member.last_name} ${member.first_name}`.trim();
  const roleLabel = ROLE_LABELS[member.role] ?? member.role;

  const listFields = [
    { label: "Боловсролын туршлага", val: member.education },
    { label: "Ажлын туршлага", val: member.experience },
    { label: "Нэмэлт туршлага", val: member.additional_experience },
    { label: "Мэргэшиж буй салбарууд", val: member.expertise },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#2d1b69" }}>
      <Header />

      {/* Hero */}
      <div className="px-4 pt-24 pb-4 sm:px-9 sm:pt-36 sm:pb-8 md:px-16 lg:px-28">
        <Link
          href="/team"
          className="mb-4 inline-flex items-center gap-2 text-sm text-purple-300 transition-colors hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Буцах
        </Link>
        <h1 className="mb-3 text-2xl font-bold text-white text-center sm:text-4xl md:text-5xl">
          Таны хажууд байх{" "}
          <span className="bg-linear-to-r from-pink-300 to-purple-300 bg-clip-text italic text-transparent">
            хамт олон
          </span>
        </h1>
      </div>

      {/* White content area */}
      <div className="mx-3 rounded-2xl bg-white px-4 py-6 sm:mx-9 sm:rounded-[2.5rem] sm:px-9 sm:py-12 md:mx-16 md:px-16 lg:mx-28 lg:px-28">
        {/* Photo + Name & contact */}
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-8">
          <div className="h-48 w-48 shrink-0 overflow-hidden rounded-2xl bg-purple-100 sm:h-72 sm:w-72 lg:h-96 lg:w-96">
            {member.image_url ? (
              <img
                src={member.image_url}
                alt={fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-5xl font-bold text-purple-300">
                {member.first_name.charAt(0)}
              </div>
            )}
          </div>
          <div className="text-center sm:text-left">
            <p className="mb-1 text-xs font-bold tracking-widest text-[#f97316]">
              {roleLabel}
            </p>
            <h2 className="text-xl font-bold text-[#2d1b69] sm:text-2xl">{fullName}</h2>
            <div className="mt-3 flex flex-col gap-2">
              {member.phone && (
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="h-3.5 w-3.5 text-gray-400"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  {member.phone}
                </span>
              )}
              {member.email && (
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="h-3.5 w-3.5 text-gray-400"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 7l-10 7L2 7" />
                  </svg>
                  {member.email}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-gray-100" />

        {/* List fields */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
          {listFields.map((item) => {
            const list = parseList(item.val);
            if (list.length === 0) return null;
            return (
              <div key={item.label} className="rounded-xl bg-gray-50 p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {item.label}
                </p>
                <ul className="flex flex-col gap-2">
                  {list.map((entry, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-[#2d1b69]"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500" />
                      {entry}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Bio */}
        {member.bio && (
          <div className="mt-5 rounded-xl bg-gray-50 p-4 sm:mt-6 sm:p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Намтар
            </h3>
            <div
              className="prose prose-sm max-w-none text-sm leading-relaxed text-justify text-gray-600 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1"
              dangerouslySetInnerHTML={{ __html: member.bio }}
            />
          </div>
        )}

        {/* CTA — only when this member offers consultations */}
        {(member.online_enabled || member.offline_enabled) && (
          <div className="mt-6 overflow-hidden rounded-xl bg-linear-to-r from-[#2d1b69] to-[#1e1145] px-5 py-8 sm:mt-8 sm:rounded-2xl sm:px-8 sm:py-12 md:px-12">
            <p className="mb-2 text-xs font-bold tracking-widest text-pink-400">
              {fullName}
            </p>
            <h2 className="mb-4 text-lg font-bold text-white sm:mb-6 sm:text-2xl md:text-3xl">
              Зөвлөгөөний цаг захиалах
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <Link
                href={`/consultation?counselor=${member.id}`}
                className="w-full rounded-full bg-linear-to-r from-pink-500 to-purple-400 px-7 py-3 text-center text-sm font-medium text-white transition-opacity hover:opacity-90 sm:w-auto"
              >
                Цаг захиалах
              </Link>
              <Link
                href="/team"
                className="w-full rounded-full border border-purple-400/40 px-7 py-3 text-center text-sm text-purple-200 transition-colors hover:border-purple-300 hover:text-white sm:w-auto"
              >
                Бусад гишүүд
              </Link>
            </div>
          </div>
        )}

        <div className="h-6" />
      </div>

      <Footer />
    </div>
  );
}
