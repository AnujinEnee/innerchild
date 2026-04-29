"use client";

import { useEffect, useState } from "react";
import { useTheme } from "../ThemeContext";
import { createClient } from "@/lib/supabase/client";

interface Subscription {
  id: string;
  email: string;
  subscribed_at: string;
}

export default function NewsletterPage() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchSubs() {
    const supabase = createClient();
    const { data } = await supabase
      .from("newsletter_subscriptions")
      .select("id, email, subscribed_at")
      .is("unsubscribed_at", null)
      .order("subscribed_at", { ascending: false });
    setSubs(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSubs();
  }, []);

  async function removeSub(id: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("newsletter_subscriptions")
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq("id", id)
      .select("id");
    if (error) { alert(`Алдаа: ${error.message}`); return; }
    if (!data?.length) { alert("Өөрчлөлт хадгалагдсангүй. RLS эрхийг шалгана уу."); return; }
    setSubs((prev) => prev.filter((s) => s.id !== id));
  }

  const filtered = subs.filter((s) =>
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10">
      <h1 className={`mb-1 text-2xl font-bold ${dark ? "text-white" : "text-gray-900"}`}>
        Нийтлэл илгээх
      </h1>
      <p className={`mb-8 text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}>
        Вэбсайтын Footer-оор бүртгүүлсэн email хаягууд
      </p>

      <div className={`rounded-2xl border p-6 ${dark ? "border-white/10 bg-white/5" : "border-gray-200 bg-white"}`}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <input
            type="text"
            placeholder="Email хайх..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-64 rounded-xl border px-4 py-2 text-sm outline-none transition-colors ${
              dark
                ? "border-white/10 bg-white/5 text-white placeholder-gray-500 focus:border-purple-500"
                : "border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-purple-400"
            }`}
          />
          <span className={`text-sm font-medium ${dark ? "text-purple-400" : "text-purple-600"}`}>
            Нийт: {subs.length}
          </span>
        </div>

        {loading ? (
          <p className={`py-10 text-center text-sm ${dark ? "text-gray-500" : "text-gray-400"}`}>
            Уншиж байна...
          </p>
        ) : filtered.length === 0 ? (
          <p className={`py-10 text-center text-sm ${dark ? "text-gray-500" : "text-gray-400"}`}>
            {subs.length === 0 ? "Одоохондоо бүртгэлтэй email байхгүй байна." : "Хайлтад тохирох email олдсонгүй."}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((sub, i) => (
              <div
                key={sub.id}
                className={`flex items-center justify-between rounded-xl px-4 py-3 ${dark ? "bg-white/5" : "bg-gray-50"}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                    dark ? "bg-purple-500/20 text-purple-400" : "bg-purple-100 text-purple-600"
                  }`}>
                    {i + 1}
                  </span>
                  <div>
                    <span className={`text-sm font-medium ${dark ? "text-white" : "text-gray-800"}`}>
                      {sub.email}
                    </span>
                    <p className={`text-[10px] ${dark ? "text-white/30" : "text-gray-400"}`}>
                      {new Date(sub.subscribed_at).toLocaleDateString("mn-MN")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeSub(sub.id)}
                  className={`rounded-lg px-3 py-1 text-xs transition-colors ${
                    dark ? "text-red-400 hover:bg-red-500/10" : "text-red-500 hover:bg-red-50"
                  }`}
                >
                  Устгах
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
