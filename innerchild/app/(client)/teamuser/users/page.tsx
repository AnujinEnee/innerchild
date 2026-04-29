"use client";

import { useEffect, useState } from "react";
import { useTheme } from "../ThemeContext";
import { createClient } from "@/lib/supabase/client";

interface User {
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
  has_consultation: boolean;
  has_test: boolean;
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

interface ConsultRow {
  id: string;
  date: string;
  time: string;
  type: string;
  status: string;
  duration_minutes: number;
  price: number;
  paid_at: string | null;
  beverage_preference: string | null;
}

const GENDER: Record<string, string> = { male: "Эрэгтэй", female: "Эмэгтэй", other: "Бусад" };
const BEVERAGE: Record<string, string> = { water: "Ус", green_tea: "Ногоон цай", black_tea: "Хар цай", coffee: "Кофе" };

export default function TeamUserUsersPage() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState("");
  const [filter, setFilter] = useState<"all" | "mine">("all");

  // Detail modal
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [viewTests, setViewTests] = useState<TestResult[]>([]);
  const [viewConsults, setViewConsults] = useState<ConsultRow[]>([]);
  const [detailTab, setDetailTab] = useState<"info" | "tests" | "history">("info");
  const [detailLoading, setDetailLoading] = useState(false);

  async function fetchUsers() {
    const teamUserId = localStorage.getItem("team_user_id");
    if (!teamUserId) { setLoading(false); return; }

    const supabase = createClient();

    // Бүх хэрэглэгчдийг татна
    const { data: usersData, error: usersErr } = await supabase
      .from("users")
      .select("id, last_name, first_name, email, phone, age, gender, profession, address, registered_at")
      .order("registered_at", { ascending: true });

    if (usersErr) { console.error("Users fetch error:", usersErr); setLoading(false); return; }
    if (!usersData || usersData.length === 0) { setUsers([]); setLoading(false); return; }

    const ids = usersData.map((u) => u.id);
    const [{ data: consultData }, { data: testData }] = await Promise.all([
      supabase.from("consultations").select("client_id").eq("counselor_id", teamUserId).in("client_id", ids),
      supabase.from("test_results").select("client_id").in("client_id", ids),
    ]);

    const consultSet = new Set((consultData ?? []).map((c) => c.client_id));
    const testSet = new Set((testData ?? []).map((t) => t.client_id));

    setUsers(usersData.map((u) => ({
      ...u,
      has_consultation: consultSet.has(u.id),
      has_test: testSet.has(u.id),
    })));
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchUsers(); }, []);

  async function openDetail(u: User) {
    setViewUser(u);
    setDetailTab("info");
    setViewTests([]);
    setViewConsults([]);
    setDetailLoading(true);
    const supabase = createClient();
    const teamUserId = localStorage.getItem("team_user_id") ?? "";
    const [{ data: tests, error: testErr }, { data: consults, error: consultErr }] = await Promise.all([
      supabase.from("test_results").select("id, score, max_score, level, taken_at, conclusion, tests(title, category)").eq("client_id", u.id).order("taken_at", { ascending: false }),
      supabase.from("consultations").select("id, date, time, type, status, duration_minutes, price, paid_at, beverage_preference").eq("client_id", u.id).eq("counselor_id", teamUserId).order("date", { ascending: true }).order("time", { ascending: true }),
    ]);
    if (testErr) console.error("Test fetch error:", testErr);
    if (consultErr) console.error("Consult fetch error:", consultErr);
    setViewTests((tests ?? []) as unknown as TestResult[]);
    setViewConsults((consults ?? []) as unknown as ConsultRow[]);
    setDetailLoading(false);
  }

  const filtered = users.filter((u) => {
    if (filter === "mine" && !u.has_consultation) return false;
    if (searchName && !`${u.last_name} ${u.first_name}`.toLowerCase().includes(searchName.toLowerCase())) return false;
    return true;
  });

  const borderCls = dark ? "border-white/5" : "border-gray-200";

  return (
    <div>
      <div className="mb-4 flex items-center justify-between sm:mb-6">
        <h1 className={`text-xl font-bold sm:text-2xl ${dark ? "text-white" : "text-gray-900"}`}>Миний үйлчлүүлэгчид</h1>
        <p className={`text-xs sm:text-sm ${dark ? "text-white/40" : "text-gray-500"}`}>Нийт: {users.length}</p>
      </div>

      <div className="mb-3 flex gap-2">
        {([
          { key: "all" as const, label: "Бүгд", count: users.length },
          { key: "mine" as const, label: "Миний үйлчлүүлэгч", count: users.filter((u) => u.has_consultation).length },
        ]).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm ${
              filter === f.key
                ? "bg-pink-600 text-white shadow-lg shadow-pink-600/20"
                : dark ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold sm:text-[10px] ${filter === f.key ? "bg-white/20" : dark ? "bg-white/10" : "bg-gray-200"}`}>{f.count}</span>
          </button>
        ))}
      </div>

      <div className={`mb-4 rounded-xl p-3 sm:rounded-2xl sm:p-4 ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}>
        <div className="relative max-w-xs">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 sm:h-4 sm:w-4 ${dark ? "text-white/30" : "text-gray-400"}`}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Нэрээр хайх..."
            className={`w-full rounded-lg py-2 pl-9 pr-3 text-xs outline-none sm:rounded-xl sm:py-2.5 sm:pl-10 sm:pr-4 sm:text-sm ${dark ? "bg-white/10 text-white placeholder:text-white/30" : "border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-purple-500"}`}
          />
        </div>
      </div>

      {/* Desktop Table */}
      <div className={`hidden overflow-hidden rounded-2xl border sm:block ${borderCls} ${dark ? "bg-white/5" : "bg-white"}`}>
        {loading ? (
          <p className={`py-12 text-center text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>Уншиж байна...</p>
        ) : filtered.length === 0 ? (
          <p className={`py-12 text-center text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>Хэрэглэгч олдсонгүй</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className={`border-b ${borderCls} ${dark ? "bg-white/5" : "bg-gray-50"}`}>
              <tr>
                <th className={`px-6 py-3.5 text-xs font-semibold ${dark ? "text-white/40" : "text-gray-500"}`}>Нэр</th>
                <th className={`px-6 py-3.5 text-xs font-semibold ${dark ? "text-white/40" : "text-gray-500"}`}>И-мэйл</th>
                <th className={`px-6 py-3.5 text-xs font-semibold ${dark ? "text-white/40" : "text-gray-500"}`}>Утас</th>
                <th className={`px-6 py-3.5 text-xs font-semibold ${dark ? "text-white/40" : "text-gray-500"}`}>Мэргэжил</th>
                <th className={`px-6 py-3.5 text-xs font-semibold ${dark ? "text-white/40" : "text-gray-500"}`}>Бүртгүүлсэн</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${dark ? "divide-white/5" : "divide-gray-100"}`}>
              {filtered.map((u) => (
                <tr key={u.id} onClick={() => openDetail(u)} className={`cursor-pointer ${dark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${dark ? "text-purple-400" : "text-purple-600"}`}>
                      {u.last_name} {u.first_name}
                    </span>
                  </td>
                  <td className={`px-6 py-4 ${dark ? "text-white/40" : "text-gray-600"}`}>{u.email}</td>
                  <td className={`px-6 py-4 ${dark ? "text-white/40" : "text-gray-600"}`}>{u.phone ?? "—"}</td>
                  <td className={`px-6 py-4 ${dark ? "text-white/40" : "text-gray-600"}`}>{u.profession ?? "—"}</td>
                  <td className={`px-6 py-4 ${dark ? "text-white/40" : "text-gray-600"}`}>{new Date(u.registered_at).toLocaleDateString("mn-MN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile Card List */}
      <div className="flex flex-col gap-2 sm:hidden">
        {loading ? (
          <p className={`py-12 text-center text-xs ${dark ? "text-white/30" : "text-gray-400"}`}>Уншиж байна...</p>
        ) : filtered.length === 0 ? (
          <p className={`py-12 text-center text-xs ${dark ? "text-white/30" : "text-gray-400"}`}>Хэрэглэгч олдсонгүй</p>
        ) : filtered.map((u) => (
          <button
            key={u.id}
            onClick={() => openDetail(u)}
            className={`rounded-xl p-3 text-left transition-colors ${dark ? "bg-white/5 hover:bg-white/10" : "bg-white shadow-sm hover:bg-gray-50"}`}
          >
            <span className={`text-sm font-medium ${dark ? "text-purple-400" : "text-purple-600"}`}>{u.last_name} {u.first_name}</span>
            <div className={`mt-1 flex flex-wrap gap-x-3 text-[10px] ${dark ? "text-white/30" : "text-gray-400"}`}>
              <span>{u.email}</span>
              {u.phone && <span>{u.phone}</span>}
            </div>
          </button>
        ))}
      </div>

      {/* Detail Modal */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`w-full max-w-lg overflow-hidden rounded-2xl ${dark ? "bg-[#1e1e36]" : "bg-white"} max-h-[85vh] flex flex-col`}>
            {/* Header */}
            <div className="relative bg-linear-to-br from-pink-600 to-purple-700 px-6 py-6">
              <button onClick={() => setViewUser(null)} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold text-white">
                  {viewUser.first_name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{viewUser.last_name} {viewUser.first_name}</h2>
                  <p className="text-sm text-white/60">{viewUser.profession ?? ""}{viewUser.age ? ` · ${viewUser.age} нас` : ""}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className={`flex border-b ${dark ? "border-white/10" : "border-gray-200"}`}>
              {([
                { key: "info" as const, label: "Мэдээлэл" },
                { key: "tests" as const, label: `Тест (${viewTests.length})` },
                { key: "history" as const, label: `Хандалт (${viewConsults.length})` },
              ]).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setDetailTab(t.key)}
                  className={`relative flex-1 px-3 py-3 text-xs font-medium sm:text-sm ${
                    detailTab === t.key
                      ? dark ? "text-white" : "text-gray-900"
                      : dark ? "text-white/40 hover:text-white/60" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {t.label}
                  {detailTab === t.key && <span className="absolute bottom-0 left-0 h-0.5 w-full bg-pink-500" />}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              {detailLoading ? (
                <p className={`py-8 text-center text-xs ${dark ? "text-white/30" : "text-gray-400"}`}>Уншиж байна...</p>
              ) : (<>
              {/* Info */}
              {detailTab === "info" && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "И-мэйл", value: viewUser.email },
                    { label: "Утас", value: viewUser.phone ?? "—" },
                    { label: "Нас", value: viewUser.age ? `${viewUser.age}` : "—" },
                    { label: "Хүйс", value: viewUser.gender ? (GENDER[viewUser.gender] ?? viewUser.gender) : "—" },
                    { label: "Мэргэжил", value: viewUser.profession ?? "—" },
                    { label: "Хаяг", value: viewUser.address ?? "—" },
                    { label: "Элссэн огноо", value: new Date(viewUser.registered_at).toLocaleDateString("mn-MN") },
                    { label: "Нийт зөвлөгөө", value: `${viewConsults.filter((c) => {
                      if (c.status === "cancelled") return false;
                      const end = new Date(`${c.date}T${c.time}`);
                      end.setMinutes(end.getMinutes() + (c.duration_minutes ?? 60));
                      return end <= new Date();
                    }).length} удаа` },
                  ].map((item) => (
                    <div key={item.label} className={`rounded-xl p-3 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                      <p className={`text-[10px] font-medium ${dark ? "text-white/30" : "text-gray-400"}`}>{item.label}</p>
                      <p className={`mt-0.5 text-sm font-medium ${dark ? "text-white" : "text-gray-900"}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tests */}
              {detailTab === "tests" && (
                <div className="space-y-2">
                  {viewTests.length === 0 ? (
                    <p className={`py-8 text-center text-xs ${dark ? "text-white/30" : "text-gray-400"}`}>Тест бөглөөгүй байна</p>
                  ) : viewTests.map((t) => {
                    const pct = Math.round((t.score / t.max_score) * 100);
                    const lvl = ({ low: "Бага", medium: "Дунд", high: "Өндөр", normal: "Хэвийн" } as Record<string, string>)[t.level] ?? t.level;
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

              {/* History */}
              {detailTab === "history" && (
                <div className="space-y-2">
                  {viewConsults.length === 0 ? (
                    <p className={`py-8 text-center text-xs ${dark ? "text-white/30" : "text-gray-400"}`}>Хандалт байхгүй</p>
                  ) : viewConsults.map((h) => {
                    const end = new Date(`${h.date}T${h.time}`);
                    end.setMinutes(end.getMinutes() + (h.duration_minutes ?? 60));
                    const isOver = end <= new Date();
                    const eff = h.status === "cancelled" ? "cancelled" : isOver ? "completed" : "upcoming";
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
              </>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
