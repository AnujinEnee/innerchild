"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "../ThemeContext";
import { createClient } from "@/lib/supabase/client";

interface TeamMember {
  id: string;
  last_name: string;
  first_name: string;
  role: string;
  image_url: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  psychologist: "Сэтгэл зүйч",
  therapist: "Сэтгэл засалч",
};

export default function TeamUserTeamPage() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("team_user_id") ?? "";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMyId(id);
    async function load() {
      const { data, error } = await createClient()
        .from("team_members")
        .select("id, last_name, first_name, role, image_url")
        .order("created_at", { ascending: true });
      if (error) console.error("Team fetch error:", error.message, error.code, error.hint, error.details);
      setMembers(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const borderCls = dark ? "border-white/5" : "border-gray-200";

  return (
    <div>
      <h1 className={`mb-6 text-xl font-bold sm:text-2xl ${dark ? "text-white" : "text-gray-900"}`}>Багийн гишүүд</h1>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`rounded-xl p-4 sm:rounded-2xl sm:p-5 border ${borderCls}`}>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`h-12 w-12 shrink-0 animate-pulse rounded-full sm:h-14 sm:w-14 ${dark ? "bg-white/10" : "bg-gray-200"}`} />
                <div className="flex-1">
                  <div className={`mb-2 h-4 w-32 animate-pulse rounded ${dark ? "bg-white/10" : "bg-gray-200"}`} />
                  <div className={`h-3 w-20 animate-pulse rounded ${dark ? "bg-white/5" : "bg-gray-100"}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {[...members].sort((a, b) => (a.id === myId ? -1 : b.id === myId ? 1 : 0)).map((m) => {
            const isMe = m.id === myId;
            return (
              <div
                key={m.id}
                onClick={() => router.push(`/teamuser/team/${m.id}`)}
                className={`cursor-pointer rounded-xl p-4 transition-all sm:rounded-2xl sm:p-5 ${
                  isMe
                    ? dark ? "border border-pink-500/30 bg-pink-500/5 hover:border-pink-500/50" : "border border-pink-200 bg-pink-50 hover:border-pink-300"
                    : dark ? `border ${borderCls} bg-white/5 hover:bg-white/10` : `border ${borderCls} bg-white hover:shadow-md`
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={`h-12 w-12 shrink-0 overflow-hidden rounded-full sm:h-14 sm:w-14 ${dark ? "bg-white/10" : "bg-gray-100"}`}>
                    {m.image_url ? (
                      <img src={m.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-purple-100 text-lg font-bold text-purple-600 sm:text-xl">
                        {m.first_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`truncate text-sm font-semibold sm:text-base ${dark ? "text-white" : "text-gray-900"}`}>
                        {m.last_name} {m.first_name}
                      </span>
                      {isMe && (
                        <span className="shrink-0 rounded-full bg-pink-500/20 px-2 py-0.5 text-[9px] font-medium text-pink-500">Би</span>
                      )}
                    </div>
                    <p className={`text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>
                      {ROLE_LABELS[m.role] ?? m.role}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
