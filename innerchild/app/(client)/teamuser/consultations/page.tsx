"use client";

import { useEffect, useState } from "react";
import { useTheme } from "../ThemeContext";
import { createClient } from "@/lib/supabase/client";

interface ClientDetail {
  id: string;
  last_name: string;
  first_name: string;
  email: string;
  phone: string | null;
  age: number | null;
  gender: string | null;
  profession: string | null;
  address: string | null;
  registered_at: string;
}

interface TestResult {
  id: string;
  score: number;
  max_score: number;
  level: string;
  taken_at: string;
  conclusion: string | null;
  tests: { title: string; category: string } | null;
}

interface Booking {
  id: string;
  client_id: string;
  client_name: string;
  client_phone: string | null;
  type: "online" | "offline";
  date: string;
  time: string;
  duration_minutes: number;
  status: string;
  price: number;
  paid_at: string | null;
  notes: string | null;
  meeting_link: string | null;
  beverage_preference: string | null;
}

export default function TeamUserConsultationsPage() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "archive">("active");
  const [searchName, setSearchName] = useState("");
  const [viewClient, setViewClient] = useState<ClientDetail | null>(null);
  const [clientBookings, setClientBookings] = useState<Booking[]>([]);
  const [clientTests, setClientTests] = useState<TestResult[]>([]);
  const [clientTab, setClientTab] = useState<"info" | "tests" | "history">("info");
  const [linkBookingId, setLinkBookingId] = useState<string | null>(null);
  const [linkInput, setLinkInput] = useState("");
  const [savingLink, setSavingLink] = useState(false);

  async function fetchBookings() {
    const teamUserId = localStorage.getItem("team_user_id");
    if (!teamUserId) { setLoading(false); return; }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("consultations")
      .select("id, client_id, type, date, time, duration_minutes, status, price, paid_at, notes, meeting_link, beverage_preference")
      .eq("counselor_id", teamUserId)
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (error) { console.error("Consultations fetch error:", error); setLoading(false); return; }

    const rows = data ?? [];
    // Fetch client info separately to avoid RLS recursion on users table
    const clientIds = [...new Set(rows.map((r) => r.client_id).filter(Boolean))];
    const clientMap: Record<string, { last_name: string; first_name: string; phone: string | null }> = {};
    if (clientIds.length > 0) {
      const { data: clients } = await supabase
        .from("users")
        .select("id, last_name, first_name, phone")
        .in("id", clientIds);
      for (const c of clients ?? []) {
        clientMap[c.id] = c;
      }
    }

    setBookings(
      rows.map((row) => {
        const client = clientMap[row.client_id];
        return {
          id: row.id,
          client_id: row.client_id,
          client_name: client
            ? `${client.last_name ?? ""} ${client.first_name ?? ""}`.trim()
            : "Тодорхойгүй",
          client_phone: client?.phone ?? null,
          type: row.type,
          date: row.date,
          time: row.time,
          duration_minutes: row.duration_minutes,
          status: row.status,
          price: row.price,
          paid_at: row.paid_at,
          notes: row.notes,
          meeting_link: row.meeting_link,
          beverage_preference: row.beverage_preference,
        };
      })
    );
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBookings();
  }, []);

  async function openClientDetail(clientId: string) {
    const supabase = createClient();
    const [{ data: userData }, { data: testData }] = await Promise.all([
      supabase.from("users").select("id, last_name, first_name, email, phone, age, gender, profession, address, registered_at").eq("id", clientId).maybeSingle(),
      supabase.from("test_results").select("id, score, max_score, level, taken_at, conclusion, tests(title, category)").eq("client_id", clientId).order("taken_at", { ascending: false }),
    ]);
    if (userData) {
      setViewClient(userData);
      setClientBookings(bookings.filter((b) => b.client_id === clientId));
      setClientTests((testData ?? []) as unknown as TestResult[]);
      setClientTab("info");
    }
  }

  function openLinkEditor(b: Booking) {
    setLinkBookingId(b.id);
    setLinkInput(b.meeting_link ?? "");
  }

  async function saveLink() {
    if (!linkBookingId) return;
    setSavingLink(true);
    const supabase = createClient();
    const link = linkInput.trim() || null;
    const { data: updateData, error } = await supabase.from("consultations").update({ meeting_link: link }).eq("id", linkBookingId).select("id");
    if (error) { alert(`Алдаа: ${error.message}`); setSavingLink(false); return; }
    if (!updateData?.length) { alert("Хадгалагдсангүй. RLS эрхийг шалгана уу."); setSavingLink(false); return; }
    setBookings((prev) => prev.map((b) => b.id === linkBookingId ? { ...b, meeting_link: link } : b));
    setLinkBookingId(null);
    setLinkInput("");
    setSavingLink(false);
  }

  const now = new Date();
  const active = bookings.filter((b) => {
    if (b.status === "completed" || b.status === "cancelled") return false;
    const dt = new Date(`${b.date}T${b.time}`);
    return dt > now;
  });
  const archive = bookings.filter((b) => {
    if (b.status === "completed" || b.status === "cancelled") return true;
    const dt = new Date(`${b.date}T${b.time}`);
    return dt <= now;
  });
  const list = tab === "active" ? active : archive;

  const filtered = list.filter((b) => {
    if (!searchName) return true;
    return b.client_name.toLowerCase().includes(searchName.toLowerCase());
  });

  const borderCls = dark ? "border-white/5" : "border-gray-200";

  function getEffectiveStatus(b: Booking): "active" | "completed" | "cancelled" {
    if (b.status === "cancelled") return "cancelled";
    if (b.status === "completed") return "completed";
    const end = new Date(`${b.date}T${b.time}`);
    end.setMinutes(end.getMinutes() + (b.duration_minutes ?? 60));
    return end <= now ? "completed" : "active";
  }

  function statusBadge(eff: string) {
    if (eff === "active") return dark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-100 text-emerald-700";
    if (eff === "completed") return dark ? "bg-blue-500/15 text-blue-400" : "bg-blue-100 text-blue-700";
    return dark ? "bg-red-500/15 text-red-400" : "bg-red-100 text-red-700";
  }

  function statusLabel(eff: string) {
    if (eff === "active") return "Хүлээгдэж буй";
    if (eff === "completed") return "Дууссан";
    return "Цуцлагдсан";
  }

  const completedCount = bookings.filter((b) => getEffectiveStatus(b) === "completed").length;

  return (
    <div>
      <h1 className={`mb-6 text-2xl font-bold ${dark ? "text-white" : "text-gray-900"}`}>Миний зөвлөгөөнүүд</h1>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Хүлээгдэж буй", value: active.length, color: "from-emerald-500 to-teal-600" },
          { label: "Дууссан", value: completedCount, color: "from-blue-500 to-cyan-600" },
          { label: "Нийт орлого", value: `${bookings.filter((b) => b.paid_at && b.status !== "cancelled").reduce((s, b) => s + b.price, 0).toLocaleString()}₮`, color: "from-pink-500 to-rose-600" },
        ].map((s) => (
          <div key={s.label} className={`relative overflow-hidden rounded-2xl p-5 ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}>
            <div className={`absolute -right-3 -top-3 h-16 w-16 rounded-full bg-linear-to-br ${s.color} opacity-20 blur-xl`} />
            <p className={`text-xs font-medium ${dark ? "text-white/40" : "text-gray-500"}`}>{s.label}</p>
            <p className={`mt-2 text-2xl font-bold ${dark ? "text-white" : "text-gray-900"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        {(["active", "archive"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
              tab === t
                ? "bg-pink-600 text-white shadow-lg shadow-pink-600/25"
                : dark ? "text-white/50 hover:bg-white/5" : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {t === "active" ? `Идэвхтэй (${active.length})` : `Архив (${archive.length})`}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className={`mb-4 rounded-2xl p-4 ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}>
        <div className="relative max-w-xs">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${dark ? "text-white/30" : "text-gray-400"}`}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Үйлчлүүлэгчийн нэрээр хайх..."
            className={`w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none ${dark ? "bg-white/10 text-white placeholder:text-white/30" : "border border-gray-200 text-gray-900 placeholder:text-gray-400"}`}
          />
        </div>
      </div>

      {/* List */}
      <div className={`overflow-hidden rounded-2xl border ${borderCls} ${dark ? "bg-white/5" : "bg-white"}`}>
        {loading ? (
          <p className={`py-12 text-center text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>Уншиж байна...</p>
        ) : filtered.length === 0 ? (
          <p className={`py-12 text-center text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>Зөвлөгөө олдсонгүй</p>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((b) => (
              <div key={b.id} className={`flex items-center justify-between px-6 py-4 ${dark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); openClientDetail(b.client_id); }}
                      className={`font-medium hover:underline ${dark ? "text-purple-400" : "text-purple-600"}`}
                    >{b.client_name}</button>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${statusBadge(getEffectiveStatus(b))}`}>
                      {statusLabel(getEffectiveStatus(b))}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] ${dark ? "bg-white/10 text-white/50" : "bg-gray-100 text-gray-500"}`}>
                      {b.type === "online" ? "Онлайн" : "Биечлэн"}
                    </span>
                    {b.type === "offline" && b.beverage_preference && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${dark ? "bg-amber-500/15 text-amber-400" : "bg-amber-50 text-amber-700"}`}>
                        ☕ {{ water: "Ус", green_tea: "Ногоон цай", black_tea: "Хар цай", coffee: "Кофе" }[b.beverage_preference] ?? b.beverage_preference}
                      </span>
                    )}
                  </div>
                  <div className={`mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs ${dark ? "text-white/30" : "text-gray-400"}`}>
                    <span>{b.date}</span>
                    <span>{b.time}</span>
                    <span>{b.duration_minutes} мин</span>
                    {b.client_phone && <span>{b.client_phone}</span>}
                  </div>
                  {/* Online meeting link */}
                  {b.type === "online" && (
                    <div className="mt-2 flex items-center gap-2">
                      {b.meeting_link ? (
                        <a
                          href={b.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-medium ${dark ? "bg-blue-500/15 text-blue-400 hover:bg-blue-500/25" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3"><path d="M15 3h6v6M14 10l6.1-6.1M10 5H5a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5" /></svg>
                          Линк нээх
                        </a>
                      ) : null}
                      <button
                        onClick={(e) => { e.stopPropagation(); openLinkEditor(b); }}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-medium ${dark ? "bg-purple-500/15 text-purple-400 hover:bg-purple-500/25" : "bg-purple-50 text-purple-600 hover:bg-purple-100"}`}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        {b.meeting_link ? "Линк солих" : "Линк нэмэх"}
                      </button>
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-sm font-semibold ${dark ? "text-white" : "text-gray-900"}`}>{b.price.toLocaleString()}₮</p>
                  <p className={`text-[10px] ${b.paid_at ? (dark ? "text-emerald-400" : "text-emerald-600") : (dark ? "text-yellow-400" : "text-yellow-600")}`}>
                    {b.paid_at ? "Төлсөн" : "Төлөгдөөгүй"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Client Detail Modal */}
      {viewClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`w-full max-w-lg overflow-hidden rounded-2xl ${dark ? "bg-[#1e1e36]" : "bg-white"} max-h-[85vh] overflow-y-auto`}>
            {/* Header */}
            <div className="relative bg-linear-to-br from-pink-600 to-purple-700 px-6 py-6">
              <button onClick={() => setViewClient(null)} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold text-white">
                  {viewClient.first_name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{viewClient.last_name} {viewClient.first_name}</h2>
                  <p className="text-sm text-white/60">{viewClient.profession ?? ""}{viewClient.age ? ` · ${viewClient.age} нас` : ""}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className={`flex border-b ${dark ? "border-white/10" : "border-gray-200"}`}>
              {([
                { key: "info" as const, label: "Мэдээлэл" },
                { key: "tests" as const, label: `Тест (${clientTests.length})` },
                { key: "history" as const, label: `Хандалт (${clientBookings.length})` },
              ]).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setClientTab(t.key)}
                  className={`relative flex-1 px-3 py-3 text-xs font-medium transition-colors sm:text-sm ${
                    clientTab === t.key
                      ? dark ? "text-white" : "text-gray-900"
                      : dark ? "text-white/40 hover:text-white/60" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {t.label}
                  {clientTab === t.key && <span className="absolute bottom-0 left-0 h-0.5 w-full bg-pink-500" />}
                </button>
              ))}
            </div>

            <div className="p-5 sm:p-6">
              {/* Info Tab */}
              {clientTab === "info" && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "И-мэйл", value: viewClient.email },
                    { label: "Утас", value: viewClient.phone ?? "—" },
                    { label: "Нас", value: viewClient.age ? `${viewClient.age}` : "—" },
                    { label: "Хүйс", value: viewClient.gender ? ({ male: "Эрэгтэй", female: "Эмэгтэй", other: "Бусад" }[viewClient.gender] ?? viewClient.gender) : "—" },
                    { label: "Мэргэжил", value: viewClient.profession ?? "—" },
                    { label: "Хаяг", value: viewClient.address ?? "—" },
                    { label: "Элссэн огноо", value: new Date(viewClient.registered_at).toLocaleDateString("mn-MN") },
                    { label: "Нийт зөвлөгөө", value: `${clientBookings.length} удаа` },
                  ].map((item) => (
                    <div key={item.label} className={`rounded-xl p-3 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                      <p className={`text-[10px] font-medium ${dark ? "text-white/30" : "text-gray-400"}`}>{item.label}</p>
                      <p className={`mt-0.5 text-sm font-medium ${dark ? "text-white" : "text-gray-900"}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tests Tab */}
              {clientTab === "tests" && (
                <div className="space-y-2">
                  {clientTests.length === 0 ? (
                    <p className={`py-8 text-center text-xs ${dark ? "text-white/30" : "text-gray-400"}`}>Тест бөглөөгүй байна</p>
                  ) : clientTests.map((t) => {
                    const pct = Math.round((t.score / t.max_score) * 100);
                    const lvl = { low: "Бага", medium: "Дунд", high: "Өндөр", normal: "Хэвийн" }[t.level] ?? t.level;
                    const lvlCls = t.level === "low" ? (dark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-100 text-emerald-700")
                      : t.level === "high" ? (dark ? "bg-red-500/15 text-red-400" : "bg-red-100 text-red-700")
                      : (dark ? "bg-amber-500/15 text-amber-400" : "bg-amber-100 text-amber-700");
                    return (
                      <div key={t.id} className={`rounded-xl p-3 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-medium ${dark ? "text-white" : "text-gray-900"}`}>{t.tests?.title ?? "—"}</p>
                            <p className={`text-[10px] ${dark ? "text-white/40" : "text-gray-500"}`}>{t.tests?.category} · {new Date(t.taken_at).toLocaleDateString("mn-MN")}</p>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${lvlCls}`}>{lvl}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className={`h-1.5 flex-1 overflow-hidden rounded-full ${dark ? "bg-white/10" : "bg-gray-200"}`}>
                            <div className={`h-full rounded-full ${t.level === "low" ? "bg-emerald-500" : t.level === "high" ? "bg-red-500" : "bg-amber-500"}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className={`text-[10px] font-semibold ${dark ? "text-white/60" : "text-gray-600"}`}>{t.score}/{t.max_score}</span>
                        </div>
                        {t.conclusion && <p className={`mt-1.5 text-[10px] ${dark ? "text-white/40" : "text-gray-500"}`}>{t.conclusion}</p>}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* History Tab */}
              {clientTab === "history" && (
                <div className="space-y-2">
                  {clientBookings.length === 0 ? (
                    <p className={`py-8 text-center text-xs ${dark ? "text-white/30" : "text-gray-400"}`}>Хандалт байхгүй</p>
                  ) : clientBookings.map((h) => {
                    const end = new Date(`${h.date}T${h.time}`);
                    end.setMinutes(end.getMinutes() + (h.duration_minutes ?? 60));
                    const isOver = end <= new Date();
                    const isCan = h.status === "cancelled";
                    const eff = isCan ? "cancelled" : isOver ? "completed" : "upcoming";
                    const BEVERAGE: Record<string, string> = { water: "Ус", green_tea: "Ногоон цай", black_tea: "Хар цай", coffee: "Кофе" };
                    return (
                      <div key={h.id} className={`flex items-center justify-between rounded-xl p-3 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                        <div>
                          <p className={`text-sm font-medium ${dark ? "text-white" : "text-gray-900"}`}>{h.date} · {h.time}</p>
                          <div className={`mt-0.5 flex flex-wrap gap-2 text-[10px] ${dark ? "text-white/40" : "text-gray-500"}`}>
                            <span>{h.type === "online" ? "Онлайн" : "Биечлэн"}</span>
                            <span>{h.duration_minutes} мин</span>
                            <span>{h.price.toLocaleString()}₮</span>
                            {h.type === "offline" && h.beverage_preference && (
                              <span>☕ {BEVERAGE[h.beverage_preference] ?? h.beverage_preference}</span>
                            )}
                          </div>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                          eff === "completed" ? (dark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-100 text-emerald-700")
                          : eff === "cancelled" ? (dark ? "bg-red-500/15 text-red-400" : "bg-red-100 text-red-700")
                          : (dark ? "bg-purple-500/15 text-purple-400" : "bg-purple-100 text-purple-700")
                        }`}>
                          {eff === "completed" ? "Дууссан" : eff === "cancelled" ? "Цуцлагдсан" : "Хүлээгдэж буй"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Link Editor Modal */}
      {linkBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`w-full max-w-sm rounded-2xl p-5 ${dark ? "bg-[#1e1e36]" : "bg-white"}`}>
            <h3 className={`mb-4 text-sm font-bold ${dark ? "text-white" : "text-gray-900"}`}>Онлайн зөвлөгөөний линк</h3>
            <input
              type="url"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              placeholder="https://zoom.us/j/... эсвэл Google Meet линк"
              className={`mb-4 w-full rounded-xl px-4 py-2.5 text-sm outline-none ${dark ? "bg-white/10 text-white placeholder:text-white/30" : "border border-gray-200 text-gray-900 placeholder:text-gray-400"}`}
            />
            <div className="flex gap-2">
              <button
                onClick={saveLink}
                disabled={savingLink}
                className="flex-1 rounded-xl bg-purple-600 py-2.5 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {savingLink ? "Хадгалж байна..." : "Хадгалах"}
              </button>
              <button
                onClick={() => { setLinkBookingId(null); setLinkInput(""); }}
                className={`flex-1 rounded-xl py-2.5 text-xs font-medium ${dark ? "text-white/50 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"}`}
              >
                Болих
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
