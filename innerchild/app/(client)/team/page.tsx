"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";

interface TeamMember {
  id: string;
  last_name: string;
  first_name: string;
  role: string;
  image_url: string | null;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  psychologist: "Сэтгэл зүйч",
  therapist: "Сэтгэл засалч",
};

export default function TeamPage() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createClient()
      .from("team_members")
      .select("id, last_name, first_name, role, image_url, created_at")
      .order("created_at")
      .then(({ data }) => {
        setTeamMembers(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <div className="bg-[#2d1b69] px-6 pt-28 pb-10 sm:px-9 sm:pt-36 sm:pb-14 md:px-16 lg:px-28">
        <h1 className="mb-3 text-4xl font-bold text-white md:text-5xl text-center">
          Манай{" "}
          <span className="bg-linear-to-r from-pink-300 to-purple-300 bg-clip-text italic text-transparent">
            хамт олон
          </span>
        </h1>
        <p className="mb-6  text-sm text-purple-300/70 text-center">
          Мэргэжлийн сэтгэл зүйчид, засалчид таны сэтгэлийн эрүүл мэндийн төлөө
          хамтран ажиллана.
        </p>
      </div>

      {/* Content area */}
      <div className="px-6 py-8 sm:px-9 sm:py-12 md:px-16 lg:px-28">
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="overflow-hidden rounded-2xl bg-[#f8f6fc]">
                <div className="aspect-3/4 animate-pulse bg-gray-200" />
                <div className="p-5">
                  <div className="mb-2 h-3 w-20 animate-pulse rounded bg-gray-200" />
                  <div className="mb-1 h-5 w-40 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {teamMembers.map((member) => (
              <Link
                key={member.id}
                href={`/team/${member.id}`}
                className="group overflow-hidden rounded-2xl bg-[#f8f6fc] transition-shadow hover:shadow-lg"
              >
                <div className="aspect-3/4 overflow-hidden bg-zinc-200">
                  {member.image_url ? (
                    <img
                      src={member.image_url}
                      alt={`${member.last_name} ${member.first_name}`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-purple-100 text-5xl font-bold text-purple-400">
                      {member.first_name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <p className="mb-1 text-xs font-bold tracking-widest text-[#f97316]">
                    {ROLE_LABELS[member.role] ?? member.role}
                  </p>
                  <h3 className="text-base font-bold text-[#2d1b69] group-hover:text-purple-600">
                    {member.last_name} {member.first_name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 overflow-hidden rounded-2xl bg-linear-to-r from-[#2d1b69] to-[#1e1145] px-8 py-12 md:px-12">
          <img src="/1.png" alt="Inner Child Logo" className="mb-4 h-10" />
          <h2 className="mb-6 max-w-md text-2xl font-bold text-white md:text-3xl">
            Та дотоод хүүхэддээ цаг гаргахдаа бэлэн үү?
          </h2>
          <Link
            href="/consultation"
            className="inline-block rounded-full bg-linear-to-r from-pink-500 to-purple-400 px-7 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Зөвлөгөө авах
          </Link>
        </div>
      </div>

      <div className="h-10" />
      <Footer />
    </div>
  );
}
