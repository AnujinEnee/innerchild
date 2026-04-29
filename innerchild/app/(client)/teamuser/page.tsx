"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "./ThemeContext";
import { createClient } from "@/lib/supabase/client";

const BEVERAGE: Record<string, string> = { water: "Ус", green_tea: "Ногоон цай", black_tea: "Хар цай", coffee: "Кофе" };

interface Consultation {
  id: string;
  type: "online" | "offline";
  date: string;
  time: string;
  status: string;
  duration_minutes: number;
  price: number;
  beverage_preference: string | null;
  client_name: string;
  counselor_name: string;
}

interface RecentUser {
  id: string;
  last_name: string;
  first_name: string;
  phone: string | null;
  registered_at: string;
}

export default function TeamUserDashboard() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  const [upcoming, setUpcoming] = useState<Consultation[]>([]);
  const [todayList, setTodayList] = useState<Consultation[]>([]);
  const [cancelled, setCancelled] = useState<Consultation[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [stats, setStats] = useState({ active: 0, completed: 0, salary: 0 });

  async function fetchAll() {
    const supabase = createClient();
    const teamUserId = localStorage.getItem("team_user_id");
    if (!teamUserId) { setLoading(false); return; }

    const [{ data: consultData, error: cErr }, { data: salaryData, error: sErr }, { data: usersData, error: uErr }] = await Promise.all([
      supabase.from("consultations")
        .select("id, type, date, time, status, duration_minutes, price, beverage_preference, client_id, users(last_name, first_name), team_members(last_name, first_name)")
        .eq("counselor_id", teamUserId)
        .order("date", { ascending: true })
        .order("time", { ascending: true }),
      supabase.from("salary_records")
        .select("year, month, base_salary, bonus, consultation_income, deductions")
        .eq("team_member_id", teamUserId)
        .order("year", { ascending: false }).order("month", { ascending: false }).limit(1),
      supabase.from("users")
        .select("id, last_name, first_name, phone, registered_at")
        .order("registered_at", { ascending: false }).limit(5),
    ]);

    if (cErr) console.error("Consultations error:", cErr);
    if (sErr) console.error("Salary error:", sErr);
    if (uErr) console.error("Users error:", uErr);

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const allC: Consultation[] = (consultData ?? []).map((c: Record<string, unknown>) => {
      const u = c.users as { last_name: string; first_name: string } | null;
      const t = c.team_members as { last_name: string; first_name: string } | null;
      return {
        id: c.id as string,
        type: c.type as "online" | "offline",
        date: c.date as string,
        time: c.time as string,
        status: c.status as string,
        duration_minutes: c.duration_minutes as number,
        price: c.price as number,
        beverage_preference: c.beverage_preference as string | null,
        client_name: u ? `${u.last_name ?? ""} ${u.first_name ?? ""}`.trim() : "Тодорхойгүй",
        counselor_name: t ? `${t.last_name ?? ""} ${t.first_name ?? ""}`.trim() : "",
      };
    });

    // Upcoming: ирээдүйн, цуцлагдаагүй
    const upcomingList = allC.filter((c) => {
      if (c.status === "cancelled") return false;
      const end = new Date(`${c.date}T${c.time}`);
      end.setMinutes(end.getMinutes() + (c.duration_minutes ?? 60));
      return end > now;
    });

    // Today
    const todayOnly = allC.filter((c) => c.date === todayStr && c.status !== "cancelled");

    // Cancelled (зөвхөн ирээдүйн)
    const cancelledList = allC.filter((c) => {
      if (c.status !== "cancelled") return false;
      const end = new Date(`${c.date}T${c.time}`);
      end.setMinutes(end.getMinutes() + (c.duration_minutes ?? 60));
      return end > now;
    }).slice(-5);

    // Stats
    const activeCount = upcomingList.length;
    const completedCount = allC.filter((c) => {
      if (c.status === "cancelled") return false;
      if (c.status === "completed") return true;
      const end = new Date(`${c.date}T${c.time}`);
      end.setMinutes(end.getMinutes() + (c.duration_minutes ?? 60));
      return end <= now;
    }).length;

    // Энэ сарын зөвлөгөөний орлогын 50% = цалин
    const thisMonth = now.getMonth() + 1;
    const thisYear = now.getFullYear();
    const monthConsultIncome = allC.filter((c) => {
      if (c.status === "cancelled") return false;
      const d = new Date(c.date);
      return d.getFullYear() === thisYear && d.getMonth() + 1 === thisMonth;
    }).reduce((sum, c) => sum + (c.price ?? 0), 0);
    const salaryTotal = Math.round(monthConsultIncome * 0.5);

    setUpcoming(upcomingList);
    setTodayList(todayOnly);
    setCancelled(cancelledList);
    setRecentUsers((usersData ?? []) as RecentUser[]);
    setStats({ active: activeCount, completed: completedCount, salary: salaryTotal });
    setLoading(false);
  }

  useEffect(() => {
    const savedName = localStorage.getItem("team_user_name");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedName) setName(savedName);
    fetchAll();
  }, []);

  function effStatus(c: Consultation): "upcoming" | "completed" | "cancelled" {
    if (c.status === "cancelled") return "cancelled";
    const end = new Date(`${c.date}T${c.time}`);
    end.setMinutes(end.getMinutes() + (c.duration_minutes ?? 60));
    return end <= new Date() ? "completed" : "upcoming";
  }

  const borderCls = dark ? "border-white/5" : "border-gray-200";

  if (loading) return <p className={`py-20 text-center text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>Уншиж байна...</p>;

  return (
    <div>
      <h2 className={`mb-1 text-center text-xl font-bold sm:text-2xl ${dark ? "text-white" : "text-gray-900"}`}>
        Сайн байна уу, {name}!
      </h2>
      <p className={`mb-6 text-center text-xs sm:text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}>
        Өнөөдрийн тойм — {new Date().toLocaleDateString("mn-MN")}
      </p>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "Хүлээгдэж буй", value: stats.active, color: "from-pink-500 to-rose-600" },
          { label: "Дууссан", value: stats.completed, color: "from-purple-500 to-violet-600" },
          { label: "Энэ сарын цалин (50%)", value: `${stats.salary.toLocaleString()}₮`, color: "from-emerald-500 to-teal-600" },
        ].map((s) => (
          <div key={s.label} className={`relative overflow-hidden rounded-xl p-3 sm:rounded-2xl sm:p-5 ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}>
            <div className={`absolute -right-3 -top-3 h-12 w-12 rounded-full bg-linear-to-br ${s.color} opacity-20 blur-xl sm:h-16 sm:w-16`} />
            <p className={`text-[10px] font-medium sm:text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>{s.label}</p>
            <p className={`mt-1 text-lg font-bold sm:mt-2 sm:text-2xl ${dark ? "text-white" : "text-gray-900"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left — Upcoming */}
        <div className={`rounded-xl sm:rounded-2xl ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}>
          <div className={`flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5 ${dark ? "border-b border-white/5" : "border-b border-gray-100"}`}>
            <h3 className={`text-sm font-semibold sm:text-base ${dark ? "text-white" : "text-gray-900"}`}>Удахгүй болох зөвлөгөө</h3>
            <Link href="/teamuser/consultations" className="text-xs font-medium text-pink-500 hover:text-pink-400">Бүгдийг харах →</Link>
          </div>
          {upcoming.length === 0 ? (
            <p className={`px-6 py-8 text-center text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>Удахгүй болох зөвлөгөө байхгүй</p>
          ) : (
            <div className={`divide-y ${dark ? "divide-white/5" : "divide-gray-50"}`}>
              {upcoming.slice(0, 6).map((c) => (
                <div key={c.id} className={`px-4 py-3 sm:px-6 sm:py-4 ${dark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <p className={`text-sm font-medium ${dark ? "text-white" : "text-gray-900"}`}>{c.client_name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold sm:text-[10px] ${c.type === "online" ? "bg-green-500/15 text-green-500" : "bg-purple-500/15 text-purple-500"}`}>
                        {c.type === "online" ? "Онлайн" : "Биечлэн"}
                      </span>
                      {c.type === "offline" && c.beverage_preference && (
                        <span className={`rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] ${dark ? "bg-amber-500/15 text-amber-400" : "bg-amber-50 text-amber-700"}`}>
                          ☕ {BEVERAGE[c.beverage_preference] ?? c.beverage_preference}
                        </span>
                      )}
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold sm:text-[10px] ${dark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-700"}`}>Хэвийн</span>
                  </div>
                  <div className={`mt-1 flex items-center gap-3 text-[10px] sm:text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>
                    <span>{c.counselor_name}</span>
                    <span>{c.date} · {c.time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — Today */}
        <div className={`rounded-xl sm:rounded-2xl ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}>
          <div className={`flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5 ${dark ? "border-b border-white/5" : "border-b border-gray-100"}`}>
            <h3 className={`text-sm font-semibold sm:text-base ${dark ? "text-white" : "text-gray-900"}`}>Өнөөдөр болох зөвлөгөө</h3>
            <Link href="/teamuser/consultations" className="text-xs font-medium text-pink-500 hover:text-pink-400">Харах →</Link>
          </div>
          {todayList.length === 0 ? (
            <p className={`px-6 py-8 text-center text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>Өнөөдөр зөвлөгөө байхгүй</p>
          ) : (
            <div className={`divide-y ${dark ? "divide-white/5" : "divide-gray-50"}`}>
              {todayList.map((c) => {
                const eff = effStatus(c);
                return (
                  <div key={c.id} className={`px-4 py-3 sm:px-6 sm:py-4 ${dark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <p className={`text-sm font-medium ${dark ? "text-white" : "text-gray-900"}`}>{c.client_name}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold sm:text-[10px] ${c.type === "online" ? "bg-green-500/15 text-green-500" : "bg-purple-500/15 text-purple-500"}`}>
                          {c.type === "online" ? "Онлайн" : "Биечлэн"}
                        </span>
                        {c.type === "offline" && c.beverage_preference && (
                          <span className={`rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] ${dark ? "bg-amber-500/15 text-amber-400" : "bg-amber-50 text-amber-700"}`}>
                            ☕ {BEVERAGE[c.beverage_preference] ?? c.beverage_preference}
                          </span>
                        )}
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold sm:text-[10px] ${
                        eff === "completed" ? (dark ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-700")
                        : (dark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-700")
                      }`}>
                        {eff === "completed" ? "Дууссан" : "Удахгүй"}
                      </span>
                    </div>
                    <div className={`mt-1 flex items-center gap-3 text-[10px] sm:text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>
                      <span>{c.time}</span>
                      <span>{c.counselor_name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className={`px-4 py-2.5 text-center sm:px-6 sm:py-3 ${dark ? "border-t border-white/5" : "border-t border-gray-100"}`}>
            <p className={`text-[10px] font-medium sm:text-xs ${dark ? "text-white/30" : "text-gray-400"}`}>
              Нийт {todayList.length} зөвлөгөө · {todayList.filter((c) => effStatus(c) === "completed").length} дууссан
            </p>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-2">
        {/* Cancelled */}
        <div className={`rounded-xl sm:rounded-2xl ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}>
          <div className={`flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5 ${dark ? "border-b border-white/5" : "border-b border-gray-100"}`}>
            <h3 className={`text-sm font-semibold sm:text-base ${dark ? "text-white" : "text-gray-900"}`}>Цуцалсан зөвлөгөө</h3>
            <Link href="/teamuser/consultations" className="text-xs font-medium text-pink-500 hover:text-pink-400">Бүгдийг харах →</Link>
          </div>
          {cancelled.length === 0 ? (
            <p className={`px-6 py-8 text-center text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>Цуцалсан зөвлөгөө байхгүй</p>
          ) : (
            <div className={`divide-y ${dark ? "divide-white/5" : "divide-gray-50"}`}>
              {cancelled.map((c) => (
                <div key={c.id} className={`flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 ${dark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}>
                  <div>
                    <p className={`text-sm font-medium ${dark ? "text-white" : "text-gray-900"}`}>{c.client_name}</p>
                    <p className={`text-[10px] sm:text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>{c.date} · {c.time}</p>
                  </div>
                  <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[9px] font-semibold text-red-500 sm:text-[10px]">Цуцлагдсан</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent users */}
        <div className={`rounded-xl sm:rounded-2xl ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}>
          <div className={`flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5 ${dark ? "border-b border-white/5" : "border-b border-gray-100"}`}>
            <h3 className={`text-sm font-semibold sm:text-base ${dark ? "text-white" : "text-gray-900"}`}>Шинэ хэрэглэгчид</h3>
            <Link href="/teamuser/users" className="text-xs font-medium text-pink-500 hover:text-pink-400">Бүгдийг харах →</Link>
          </div>
          {recentUsers.length === 0 ? (
            <p className={`px-6 py-8 text-center text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>Хэрэглэгч байхгүй</p>
          ) : (
            <div className={`divide-y ${dark ? "divide-white/5" : "divide-gray-50"}`}>
              {recentUsers.map((u) => (
                <div key={u.id} className={`flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 ${dark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${dark ? "bg-pink-500/15 text-pink-400" : "bg-pink-100 text-pink-600"}`}>
                      {u.first_name.charAt(0)}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${dark ? "text-white" : "text-gray-900"}`}>{u.last_name} {u.first_name}</p>
                      <p className={`text-[10px] sm:text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>{u.phone ?? "—"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-semibold text-emerald-500 sm:text-[10px]">Шинэ</span>
                    <p className={`mt-0.5 text-[9px] sm:text-[10px] ${dark ? "text-white/30" : "text-gray-400"}`}>{new Date(u.registered_at).toLocaleDateString("mn-MN")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
