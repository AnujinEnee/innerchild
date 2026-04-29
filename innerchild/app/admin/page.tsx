"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "./ThemeContext";
import ClientModal, { useClientModal } from "./ClientModal";
import { createClient } from "@/lib/supabase/client";

const BEVERAGE_LABELS: Record<string, string> = {
  water: "Ус",
  green_tea: "Ногоон цай",
  black_tea: "Хар цай",
  coffee: "Кофе",
};

const LEVEL_LABELS: Record<string, string> = { low: "Бага", medium: "Дунд", high: "Өндөр", normal: "Хэвийн" };
const LEVEL_SEVERITY: Record<string, "low" | "medium" | "high"> = {
  low: "low", medium: "medium", high: "high", normal: "low",
  "Сэтгэл гутралгүй": "low", "Хөнгөн сэтгэл гутрал": "medium", "Дунд зэргийн сэтгэл гутрал": "medium", "Гүн сэтгэл гутрал": "high",
  "Маш бага / түгшилтгүй": "low", "Дундажнаас бага": "low", "Дунд зэргийн түгшүүр": "medium", "Өндөр түгшүүр": "high", "Маш өндөр түгшүүр": "high",
  "Бага зэргийн стресс": "low", "Дунд зэргийн стресс": "medium", "Их буюу архаг стресс": "high",
  "Эрсдэл бага / Эмгэг илрээгүй": "low", "Хөнгөн зэрэг": "low", "Дунд зэрэг": "medium", "Хүнд зэрэг": "high", "Маш хүнд зэрэг": "high",
  "Донтох бодис хэрэглэдэггүй": "low", "Донтох бодис хэрэглэдэг": "medium", "Донтох бодисын хамааралтай": "high",
  "Бага стресс": "low", "Дунд стресс": "medium", "Өндөр стресс": "high",
};

interface DashboardConsultation {
  id: string;
  type: "online" | "offline";
  date: string;
  time: string;
  status: "normal" | "cancelled" | "completed";
  beverage_preference: string | null;
  price: number;
  refunded_at: string | null;
  users: { id: string; last_name: string; first_name: string; bank_name: string | null; bank_account: string | null } | null;
  team_members: { last_name: string; first_name: string } | null;
}

interface DashboardUser {
  id: string;
  last_name: string;
  first_name: string;
  email: string;
  phone: string | null;
  profession: string | null;
  registered_at: string;
}

interface DashboardTestResult {
  id: string;
  score: number;
  max_score: number;
  level: string;
  taken_at: string;
  conclusion: string | null;
  recommendation: string | null;
  users: { id: string; last_name: string; first_name: string } | null;
  tests: { title: string; category: string } | null;
}

interface TestModal {
  testName: string;
  category: string;
  userId: string;
  clientName: string;
  date: string;
  score: number;
  maxScore: number;
  level: string;
  conclusion: string | null;
  recommendation: string | null;
}

interface RefundModal {
  id: string;
  clientName: string;
  price: number;
  refunded: boolean;
  bankName: string | null;
  bankAccount: string | null;
  date: string;
}

export default function AdminDashboard() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const { selectedUserId, openClient, closeClient } = useClientModal();

  const [statsData, setStatsData] = useState({ users: 0, activeConsultations: 0, articles: 0, revenue: 0, testRevenue: 0, allRevenue: 0 });
  const [upcomingConsultations, setUpcomingConsultations] = useState<DashboardConsultation[]>([]);
  const [todayConsultations, setTodayConsultations] = useState<DashboardConsultation[]>([]);
  const [cancelledConsultations, setCancelledConsultations] = useState<DashboardConsultation[]>([]);
  const [newUsers, setNewUsers] = useState<DashboardUser[]>([]);
  const [recentTestResults, setRecentTestResults] = useState<DashboardTestResult[]>([]);
  const [refundModal, setRefundModal] = useState<RefundModal | null>(null);
  const [testModal, setTestModal] = useState<TestModal | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      const supabase = createClient();
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      const cutoff14 = new Date(today); cutoff14.setDate(today.getDate() - 14);
      const cutoff7 = new Date(today); cutoff7.setDate(today.getDate() - 7);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

      const [
        usersCount,
        activeConsultsCount,
        articlesCount,
        revenueRows,
        upcomingRows,
        todayRows,
        cancelledRows,
        newUsersRows,
        testRows,
        testPaymentRows,
        allConsultRevenueRows,
        allTestPaymentRows,
      ] = await Promise.all([
        supabase.from("users").select("id", { count: "exact", head: true }),
        supabase.from("consultations").select("id", { count: "exact", head: true }).eq("status", "normal").gte("date", todayStr),
        supabase.from("articles").select("id", { count: "exact", head: true }),
        supabase.from("consultations").select("price").neq("status", "cancelled").gte("date", `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`),
        supabase.from("consultations")
          .select("id, type, date, time, status, beverage_preference, price, refunded_at, users!client_id(id, last_name, first_name, bank_name, bank_account), team_members!counselor_id(last_name, first_name)")
          .eq("status", "normal").gte("date", todayStr)
          .order("date").order("time").limit(6),
        supabase.from("consultations")
          .select("id, type, date, time, status, beverage_preference, price, refunded_at, users!client_id(id, last_name, first_name, bank_name, bank_account), team_members!counselor_id(last_name, first_name)")
          .eq("date", todayStr).order("time"),
        supabase.from("consultations")
          .select("id, type, date, time, status, beverage_preference, price, refunded_at, users!client_id(id, last_name, first_name, bank_name, bank_account), team_members!counselor_id(last_name, first_name)")
          .eq("status", "cancelled").is("refunded_at", null)
          .gte("date", todayStr)
          .order("updated_at", { ascending: false }).limit(5),
        supabase.from("users")
          .select("id, last_name, first_name, email, phone, profession, registered_at")
          .gte("registered_at", cutoff14.toISOString())
          .order("registered_at", { ascending: false }),
        supabase.from("test_results")
          .select("id, score, max_score, level, taken_at, conclusion, recommendation, users!client_id(id, last_name, first_name), tests!test_id(title, category)")
          .gte("taken_at", cutoff7.toISOString())
          .order("taken_at", { ascending: false }).limit(8),
        supabase.from("test_payments")
          .select("amount")
          .gte("paid_at", startOfMonth),
        // All-time consultation revenue (excluding cancelled).
        supabase.from("consultations")
          .select("price")
          .neq("status", "cancelled"),
        // All-time test payments.
        supabase.from("test_payments")
          .select("amount"),
      ]);

      const consultRevenue = (revenueRows.data ?? []).reduce((s: number, c: { price: number }) => s + c.price, 0);
      const testRevenue = (testPaymentRows.data ?? []).reduce((s: number, t: { amount: number }) => s + t.amount, 0);
      const allConsultRevenue = (allConsultRevenueRows.data ?? []).reduce((s: number, c: { price: number }) => s + c.price, 0);
      const allTestRevenue = (allTestPaymentRows.data ?? []).reduce((s: number, t: { amount: number }) => s + t.amount, 0);

      setStatsData({
        users: usersCount.count ?? 0,
        activeConsultations: activeConsultsCount.count ?? 0,
        articles: articlesCount.count ?? 0,
        revenue: consultRevenue + testRevenue,
        testRevenue,
        allRevenue: allConsultRevenue + allTestRevenue,
      });
      setUpcomingConsultations((upcomingRows.data as unknown as DashboardConsultation[]) ?? []);
      setTodayConsultations((todayRows.data as unknown as DashboardConsultation[]) ?? []);
      setCancelledConsultations((cancelledRows.data as unknown as DashboardConsultation[]) ?? []);
      setNewUsers((newUsersRows.data as DashboardUser[]) ?? []);
      setRecentTestResults((testRows.data as unknown as DashboardTestResult[]) ?? []);
    }
    loadDashboard();
  }, []);

  async function handleRefund(id: string) {
    await createClient().from("consultations").update({ refunded_at: new Date().toISOString() }).eq("id", id);
    setCancelledConsultations((prev) => prev.map((c) => c.id === id ? { ...c, refunded_at: new Date().toISOString() } : c));
    setRefundModal(null);
  }

  const formatRevenue = (v: number) => `${v.toLocaleString()}₮`;

  const statCards = [
    { label: "Нийт хэрэглэгчид", value: statsData.users.toLocaleString(), color: "from-purple-500 to-indigo-600", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
    { label: "Зөвлөгөө (идэвхтэй)", value: String(statsData.activeConsultations), color: "from-pink-500 to-rose-600", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> },
    { label: "Нийтлэл", value: String(statsData.articles), color: "from-blue-500 to-cyan-600", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg> },
    { label: "Энэ сарын орлого", value: formatRevenue(statsData.revenue), color: "from-emerald-500 to-teal-600", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg> },
    { label: "Тестийн орлого", value: formatRevenue(statsData.testRevenue), color: "from-amber-500 to-orange-600", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /></svg> },
    { label: "Бүх орлого", value: formatRevenue(statsData.allRevenue), color: "from-fuchsia-500 to-purple-600", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><path d="M3 3v18h18" /><path d="M7 14l4-4 4 4 5-5" /></svg> },
  ];

  function clientName(c: DashboardConsultation) {
    return c.users ? `${c.users.last_name} ${c.users.first_name}` : "—";
  }
  function counselorName(c: DashboardConsultation) {
    return c.team_members ? `${c.team_members.last_name} ${c.team_members.first_name}` : "—";
  }

  return (
    <div>
      {/* Welcome */}
      <div className={`mb-8 rounded-2xl p-6 ${dark ? "bg-linear-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20" : "bg-linear-to-r from-purple-50 to-indigo-50 border border-purple-100"}`}>
        <h1 className={`text-2xl font-bold ${dark ? "text-white" : "text-gray-900"}`}>Сайн байна уу! 👋</h1>
        <p className={`mt-1 text-sm ${dark ? "text-white/50" : "text-gray-500"}`}>Өнөөдрийн тойм — {new Date().toLocaleDateString("mn-MN")}</p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className={`relative overflow-hidden rounded-2xl p-6 ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}
          >
            <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-linear-to-br ${stat.color} opacity-20 blur-xl`} />
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br ${stat.color} text-white`}>
              {stat.icon}
            </div>
            <p className={`text-sm font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>{stat.label}</p>
            <p className={`mt-1 text-3xl font-bold ${dark ? "text-white" : "text-gray-900"}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming Bookings */}
        <div className={`rounded-2xl lg:col-span-2 ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}>
          <div className={`flex items-center justify-between px-6 py-5 ${dark ? "border-b border-white/5" : "border-b border-gray-100"}`}>
            <h2 className={`font-semibold ${dark ? "text-white" : "text-gray-900"}`}>Удахгүй болох зөвлөгөө</h2>
            <Link href="/admin/consultations" className="text-xs font-medium text-purple-500 hover:text-purple-400">
              Бүгдийг харах →
            </Link>
          </div>
          <div className={`divide-y ${dark ? "divide-white/5" : "divide-gray-50"}`}>
            {upcomingConsultations.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className={`text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>Удахгүй болох зөвлөгөө байхгүй</p>
              </div>
            ) : upcomingConsultations.map((b) => (
              <div key={b.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-purple-500/30 to-pink-500/30">
                    <span className={`text-sm font-semibold ${dark ? "text-white" : "text-purple-700"}`}>
                      {b.users?.first_name?.charAt(0) ?? "?"}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => b.users && openClient(b.users.id)} className={`text-sm font-medium hover:underline ${dark ? "text-purple-400" : "text-purple-600"}`}>
                        {clientName(b)}
                      </button>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        b.type === "online" ? "bg-green-500/15 text-green-500" : "bg-purple-500/15 text-purple-500"
                      }`}>
                        {b.type === "online" ? "Онлайн" : "Биечлэн"}
                      </span>
                      {b.type === "offline" && b.beverage_preference && (
                        <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${dark ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-600"}`}>
                          ☕ {BEVERAGE_LABELS[b.beverage_preference] ?? b.beverage_preference}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>
                      {counselorName(b)} · {b.date} · {b.time}
                    </p>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${dark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-700"}`}>
                  Хэвийн
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Consultations */}
        <div className={`rounded-2xl ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}>
          <div className={`flex items-center justify-between px-6 py-5 ${dark ? "border-b border-white/5" : "border-b border-gray-100"}`}>
            <h2 className={`font-semibold ${dark ? "text-white" : "text-gray-900"}`}>Өнөөдөр болох зөвлөгөө</h2>
            <Link href="/admin/consultations" className="text-xs font-medium text-purple-500 hover:text-purple-400">
              Харах →
            </Link>
          </div>
          {(() => {
            const nowTime = new Date();
            const upcoming = todayConsultations.filter((c) => {
              if (c.status === "cancelled") return false;
              const end = new Date(`${c.date}T${c.time}`); end.setMinutes(end.getMinutes() + 60);
              return end > nowTime;
            });
            const archived = todayConsultations.filter((c) => {
              if (c.status === "cancelled") return true;
              const end = new Date(`${c.date}T${c.time}`); end.setMinutes(end.getMinutes() + 60);
              return end <= nowTime;
            });
            return upcoming.length === 0 && archived.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className={`text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>Өнөөдөр зөвлөгөө байхгүй</p>
            </div>
          ) : (<>
            {upcoming.length > 0 ? (
            <div className={`divide-y ${dark ? "divide-white/5" : "divide-gray-50"}`}>
              {upcoming.map((c) => (
                <div
                  key={c.id}
                  className={`px-6 py-4 cursor-pointer transition-colors ${dark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}
                  onClick={() => c.users && openClient(c.users.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${dark ? "text-white" : "text-gray-900"}`}>{clientName(c)}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        c.type === "online" ? "bg-green-500/15 text-green-500" : "bg-purple-500/15 text-purple-500"
                      }`}>
                        {c.type === "online" ? "Онлайн" : "Биечлэн"}
                      </span>
                      {c.type === "offline" && c.beverage_preference && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] ${dark ? "bg-amber-500/15 text-amber-400" : "bg-amber-50 text-amber-700"}`}>
                          ☕ {BEVERAGE_LABELS[c.beverage_preference] ?? c.beverage_preference}
                        </span>
                      )}
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${dark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-700"}`}>
                      Удахгүй
                    </span>
                  </div>
                  <div className={`mt-1.5 flex items-center gap-3 text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>
                    <span className="flex items-center gap-1">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                      </svg>
                      {c.time?.slice(0, 5)}
                    </span>
                    <span>{counselorName(c)}</span>
                  </div>
                </div>
              ))}
            </div>
            ) : (
              <div className="px-6 py-8 text-center">
                <p className={`text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>Өнөөдөр удахгүй болох зөвлөгөө байхгүй</p>
              </div>
            )}
            {archived.length > 0 && (
              <details className={`border-t ${dark ? "border-white/5" : "border-gray-100"}`}>
                <summary className={`px-6 py-3 cursor-pointer text-xs font-medium ${dark ? "text-white/30 hover:text-white/50" : "text-gray-400 hover:text-gray-600"}`}>
                  Архив ({archived.length})
                </summary>
                <div className={`divide-y ${dark ? "divide-white/5" : "divide-gray-50"}`}>
                  {archived.map((c) => {
                    const isCancelled = c.status === "cancelled";
                    return (
                    <div
                      key={c.id}
                      className={`px-6 py-3 opacity-60 cursor-pointer transition-colors ${dark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}
                      onClick={() => c.users && openClient(c.users.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm ${dark ? "text-white/60" : "text-gray-500"}`}>{clientName(c)}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            c.type === "online" ? "bg-green-500/15 text-green-500" : "bg-purple-500/15 text-purple-500"
                          }`}>
                            {c.type === "online" ? "Онлайн" : "Биечлэн"}
                          </span>
                        </div>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          isCancelled ? dark ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-600"
                            : dark ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-700"
                        }`}>
                          {isCancelled ? "Цуцлагдсан" : "Дууссан"}
                        </span>
                      </div>
                      <div className={`mt-1 text-xs ${dark ? "text-white/30" : "text-gray-400"}`}>
                        {c.time?.slice(0, 5)} · {counselorName(c)}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </details>
            )}
          </>);
          })()}
          <div className={`px-6 py-3 text-center ${dark ? "border-t border-white/5" : "border-t border-gray-100"}`}>
            <p className={`text-xs font-medium ${dark ? "text-white/30" : "text-gray-400"}`}>
              Нийт {todayConsultations.length} зөвлөгөө
            </p>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Cancelled */}
        <div className={`rounded-2xl ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}>
          <div className={`flex items-center justify-between px-6 py-5 ${dark ? "border-b border-white/5" : "border-b border-gray-100"}`}>
            <h2 className={`font-semibold ${dark ? "text-white" : "text-gray-900"}`}>Цуцалсан зөвлөгөө</h2>
            <Link href="/admin/consultations" className="text-xs font-medium text-purple-500 hover:text-purple-400">
              Бүгдийг харах →
            </Link>
          </div>
          <div className={`divide-y ${dark ? "divide-white/5" : "divide-gray-50"}`}>
            {cancelledConsultations.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className={`text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>Цуцалсан зөвлөгөө байхгүй</p>
              </div>
            ) : cancelledConsultations.map((c) => (
              <div key={c.id} className={`flex w-full items-center justify-between px-6 py-4 transition-colors ${dark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${dark ? "bg-red-500/15" : "bg-red-100"}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke={dark ? "#f87171" : "#ef4444"} strokeWidth="2" className="h-4 w-4">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </div>
                  <div>
                    <button onClick={() => c.users && openClient(c.users.id)} className={`text-sm font-medium hover:underline ${dark ? "text-purple-400" : "text-purple-600"}`}>
                      {clientName(c)}
                    </button>
                    <p className={`text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>{c.date} · {c.time} · {counselorName(c)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRefundModal({
                      id: c.id,
                      clientName: clientName(c),
                      price: c.price,
                      refunded: !!c.refunded_at,
                      bankName: c.users?.bank_name ?? null,
                      bankAccount: c.users?.bank_account ?? null,
                      date: c.date,
                    })}
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors ${
                      c.refunded_at
                        ? dark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-100 text-emerald-700"
                        : dark ? "bg-red-500/15 text-red-400 hover:bg-red-500/25" : "bg-red-100 text-red-700 hover:bg-red-200"
                    }`}
                  >
                    {c.refunded_at ? "Буцаагдсан" : "Төлбөр буцаах"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* New Members */}
        <div className={`rounded-2xl ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}>
          <div className={`flex items-center justify-between px-6 py-5 ${dark ? "border-b border-white/5" : "border-b border-gray-100"}`}>
            <h2 className={`font-semibold ${dark ? "text-white" : "text-gray-900"}`}>Шинэ гишүүд</h2>
            <Link href="/admin/users" className="text-xs font-medium text-purple-500 hover:text-purple-400">
              Бүгдийг харах →
            </Link>
          </div>
          {newUsers.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className={`text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>Сүүлийн 14 хоногт шинэ гишүүн байхгүй</p>
            </div>
          ) : (
            <div className={`divide-y ${dark ? "divide-white/5" : "divide-gray-50"}`}>
              {newUsers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => openClient(m.id)}
                  className={`flex w-full items-center gap-3 px-6 py-4 text-left transition-colors ${dark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-emerald-500/30 to-teal-500/30">
                    <span className={`text-sm font-semibold ${dark ? "text-white" : "text-emerald-700"}`}>
                      {m.first_name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${dark ? "text-white" : "text-gray-900"}`}>{m.last_name} {m.first_name}</p>
                    <p className={`text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>{m.profession ?? ""}{m.phone ? ` · ${m.phone}` : ""}</p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-500">Шинэ</span>
                    <p className={`mt-1 text-[10px] ${dark ? "text-white/30" : "text-gray-400"}`}>{new Date(m.registered_at).toLocaleDateString("mn-MN")}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className={`px-6 py-3 text-center ${dark ? "border-t border-white/5" : "border-t border-gray-100"}`}>
            <p className={`text-xs font-medium ${dark ? "text-white/30" : "text-gray-400"}`}>Сүүлийн 14 хоног</p>
          </div>
        </div>

        {/* Recent Test Results */}
        <div className={`rounded-2xl ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}>
          <div className={`flex items-center justify-between px-6 py-5 ${dark ? "border-b border-white/5" : "border-b border-gray-100"}`}>
            <h2 className={`font-semibold ${dark ? "text-white" : "text-gray-900"}`}>Тестийн үр дүн</h2>
            <Link href="/admin/tests" className="text-xs font-medium text-purple-500 hover:text-purple-400">
              Бүгдийг харах →
            </Link>
          </div>
          {recentTestResults.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className={`text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>Сүүлийн 7 хоногт тест бөглөөгүй</p>
            </div>
          ) : (
            <div className={`divide-y ${dark ? "divide-white/5" : "divide-gray-50"}`}>
              {recentTestResults.map((t) => {
                const levelLabel = LEVEL_LABELS[t.level] ?? t.level;
                const severity = LEVEL_SEVERITY[t.level] ?? "medium";
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      if (t.users) {
                        setTestModal({
                          testName: t.tests?.title ?? "—",
                          category: t.tests?.category ?? "—",
                          userId: t.users.id,
                          clientName: `${t.users.last_name} ${t.users.first_name}`,
                          date: new Date(t.taken_at).toLocaleDateString("mn-MN"),
                          score: t.score,
                          maxScore: t.max_score,
                          level: levelLabel,
                          conclusion: t.conclusion,
                          recommendation: t.recommendation,
                        });
                      }
                    }}
                    className={`flex w-full items-center justify-between px-6 py-4 text-left transition-colors ${dark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        severity === "low" ? dark ? "bg-emerald-500/15" : "bg-emerald-100"
                        : severity === "medium" ? dark ? "bg-amber-500/15" : "bg-amber-100"
                        : dark ? "bg-red-500/15" : "bg-red-100"
                      }`}>
                        <span className={`text-xs font-bold ${
                          severity === "low" ? "text-emerald-500"
                          : severity === "medium" ? "text-amber-500"
                          : "text-red-500"
                        }`}>{t.score}</span>
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${dark ? "text-white" : "text-gray-900"}`}>
                          {t.users ? `${t.users.last_name} ${t.users.first_name}` : "—"}
                        </p>
                        <p className={`text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>{t.tests?.title ?? "—"}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        severity === "low" ? dark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-700"
                        : severity === "medium" ? dark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-700"
                        : dark ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-700"
                      }`}>
                        {levelLabel}
                      </span>
                      <p className={`text-[10px] ${dark ? "text-white/30" : "text-gray-400"}`}>{new Date(t.taken_at).toLocaleDateString("mn-MN")}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          <div className={`px-6 py-3 text-center ${dark ? "border-t border-white/5" : "border-t border-gray-100"}`}>
            <p className={`text-xs font-medium ${dark ? "text-white/30" : "text-gray-400"}`}>Сүүлийн 7 хоног</p>
          </div>
        </div>
      </div>

      {selectedUserId && <ClientModal userId={selectedUserId} onClose={closeClient} />}

      {/* Test Detail Modal */}
      {testModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`w-full max-w-lg rounded-2xl ${dark ? "bg-[#1e1e36]" : "bg-white"} overflow-hidden`}>
            <div className="relative bg-linear-to-br from-indigo-600 to-purple-700 px-6 py-5">
              <button
                onClick={() => setTestModal(null)}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <p className="text-xs font-medium text-white/50">{testModal.category}</p>
              <h2 className="mt-1 text-lg font-bold text-white">{testModal.testName}</h2>
              <div className="mt-3 flex items-center gap-3">
                <button onClick={() => { setTestModal(null); openClient(testModal.userId); }} className="text-sm font-medium text-white/80 hover:text-white hover:underline">
                  {testModal.clientName}
                </button>
                <span className="text-xs text-white/40">·</span>
                <span className="text-xs text-white/40">{testModal.date}</span>
              </div>
            </div>

            <div className={`flex items-center gap-4 px-6 py-4 ${dark ? "border-b border-white/5" : "border-b border-gray-100"}`}>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                testModal.level === "Бага" ? dark ? "bg-emerald-500/15" : "bg-emerald-100"
                : testModal.level === "Дунд" ? dark ? "bg-amber-500/15" : "bg-amber-100"
                : dark ? "bg-red-500/15" : "bg-red-100"
              }`}>
                <span className={`text-lg font-bold ${
                  testModal.level === "Бага" ? "text-emerald-500"
                  : testModal.level === "Дунд" ? "text-amber-500"
                  : "text-red-500"
                }`}>{testModal.score}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={dark ? "text-white/40" : "text-gray-500"}>Оноо: {testModal.score} / {testModal.maxScore}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                    testModal.level === "Бага" ? dark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-700"
                    : testModal.level === "Дунд" ? dark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-700"
                    : dark ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-700"
                  }`}>{testModal.level}</span>
                </div>
                <div className={`mt-1.5 h-2 w-full overflow-hidden rounded-full ${dark ? "bg-white/10" : "bg-gray-200"}`}>
                  <div
                    className={`h-full rounded-full ${
                      testModal.level === "Бага" ? "bg-emerald-500" : testModal.level === "Дунд" ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${(testModal.score / testModal.maxScore) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {testModal.conclusion && (
                <div className={`rounded-xl p-4 ${
                  testModal.level === "Бага" ? dark ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-emerald-50 border border-emerald-200"
                  : testModal.level === "Дунд" ? dark ? "bg-amber-500/10 border border-amber-500/20" : "bg-amber-50 border border-amber-200"
                  : dark ? "bg-red-500/10 border border-red-500/20" : "bg-red-50 border border-red-200"
                }`}>
                  <p className={`mb-1 text-xs font-semibold ${
                    testModal.level === "Бага" ? "text-emerald-500" : testModal.level === "Дунд" ? "text-amber-500" : "text-red-500"
                  }`}>Дүгнэлт</p>
                  <p className={`text-sm leading-relaxed ${dark ? "text-white/70" : "text-gray-700"}`}>{testModal.conclusion}</p>
                </div>
              )}
              {testModal.recommendation && (
                <div className={`rounded-xl p-4 ${dark ? "bg-purple-500/10 border border-purple-500/20" : "bg-purple-50 border border-purple-200"}`}>
                  <p className="mb-1 text-xs font-semibold text-purple-500">Зөвлөмж</p>
                  <p className={`text-sm leading-relaxed ${dark ? "text-white/70" : "text-gray-700"}`}>{testModal.recommendation}</p>
                </div>
              )}
              <button onClick={() => setTestModal(null)} className={`w-full rounded-xl py-2.5 text-sm font-medium ${dark ? "text-white/50 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"}`}>
                Хаах
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`w-full max-w-md rounded-2xl ${dark ? "bg-[#1e1e36]" : "bg-white"} overflow-hidden`}>
            <div className="relative bg-linear-to-br from-red-600 to-rose-700 px-6 py-5">
              <button
                onClick={() => setRefundModal(null)}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-white">
                    <path d="M3 9l4-4 4 4" /><path d="M7 5v9a4 4 0 004 4h6" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Төлбөр буцаалт</h2>
                  <p className="text-sm text-white/60">{refundModal.clientName}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className={`rounded-xl p-4 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                  <p className={`text-[10px] font-semibold ${dark ? "text-white/30" : "text-gray-400"}`}>Буцаах дүн</p>
                  <p className={`mt-1 text-lg font-bold ${dark ? "text-white" : "text-gray-900"}`}>{refundModal.price.toLocaleString()}₮</p>
                </div>
                <div className={`rounded-xl p-4 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                  <p className={`text-[10px] font-semibold ${dark ? "text-white/30" : "text-gray-400"}`}>Төлөв</p>
                  <p className={`mt-1 text-sm font-semibold ${refundModal.refunded ? "text-emerald-500" : "text-red-500"}`}>
                    {refundModal.refunded ? "Буцаагдсан" : "Буцаагдаагүй"}
                  </p>
                </div>
              </div>

              <div className={`mb-4 rounded-xl p-4 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                <p className={`mb-2 text-[10px] font-semibold ${dark ? "text-white/30" : "text-gray-400"}`}>Буцаах данс</p>
                <p className={`text-sm font-medium ${dark ? "text-white" : "text-gray-900"}`}>{refundModal.bankName ?? "—"}</p>
                <p className={`text-xs ${dark ? "text-white/50" : "text-gray-500"}`}>{refundModal.bankAccount ?? "—"}</p>
              </div>

              <div className={`mb-6 rounded-xl p-4 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                <p className={`text-[10px] font-semibold ${dark ? "text-white/30" : "text-gray-400"}`}>Зөвлөгөөний огноо</p>
                <p className={`mt-1 text-sm ${dark ? "text-white" : "text-gray-900"}`}>{refundModal.date}</p>
              </div>

              <div className="flex gap-2">
                {!refundModal.refunded && (
                  <button
                    onClick={() => handleRefund(refundModal.id)}
                    className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    Буцаалт хийх
                  </button>
                )}
                <button
                  onClick={() => setRefundModal(null)}
                  className={`rounded-xl px-5 py-2.5 text-sm font-medium ${dark ? "text-white/50 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"}`}
                >
                  Хаах
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
