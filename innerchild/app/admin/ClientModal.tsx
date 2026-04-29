"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "./ThemeContext";
import { createClient } from "@/lib/supabase/client";
import { getSlugByDbTestId } from "@/lib/test-logics/registry";

interface UserData {
  id: string;
  last_name: string;
  first_name: string;
  email: string;
  phone: string | null;
  age: number | null;
  gender: string | null;
  profession: string | null;
  address: string | null;
  bank_name: string | null;
  bank_account: string | null;
  registered_at: string;
}

interface ConsultationRow {
  id: string;
  date: string;
  time: string;
  type: "online" | "offline";
  status: "normal" | "cancelled" | "completed";
  duration_minutes: number;
  price: number;
  paid_at: string | null;
  beverage_preference: string | null;
  notes: string | null;
  team_members: { last_name: string; first_name: string } | null;
}

interface TestResultRow {
  id: string;
  score: number;
  max_score: number;
  level: "low" | "medium" | "high" | "normal";
  taken_at: string;
  conclusion: string | null;
  recommendation: string | null;
  raw_answers: Record<string, unknown> | null;
  test_id: string;
  tests: { title: string; category: string } | null;
}

const GENDER_LABELS: Record<string, string> = { male: "Эрэгтэй", female: "Эмэгтэй", other: "Бусад" };
const LEVEL_LABELS: Record<string, string> = { low: "Бага", medium: "Дунд", high: "Өндөр", normal: "Хэвийн" };
const STATUS_LABELS: Record<string, string> = { normal: "Хэвийн", cancelled: "Цуцлагдсан", completed: "Дууссан" };
const TYPE_LABELS: Record<string, string> = { online: "Онлайн", offline: "Биечлэн" };

export function useClientModal() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  function openClient(userId: string) {
    setSelectedUserId(userId);
  }

  function closeClient() {
    setSelectedUserId(null);
  }

  return { selectedUserId, openClient, closeClient };
}

export default function ClientModal({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const router = useRouter();
  const [tab, setTab] = useState<"info" | "tests" | "history">("info");

  function openFullResult(t: TestResultRow) {
    const slug = getSlugByDbTestId(t.test_id);
    if (!slug) return;
    // Pre-populate sessionStorage so the public result page can render
    // the full rich UI from raw_answers (same flow as the user's own view).
    try {
      sessionStorage.setItem(
        `test_result_${slug}`,
        JSON.stringify({
          answers: t.raw_answers ?? {},
          duration: 0,
          paid: true,
          saved: true,
        }),
      );
    } catch { /* ignore */ }
    router.push(`/tests/${slug}/result?from=dashboard`);
  }
  const [user, setUser] = useState<UserData | null>(null);
  const [consultations, setConsultations] = useState<ConsultationRow[]>([]);
  const [testResults, setTestResults] = useState<TestResultRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const supabase = createClient();
      const [userRes, consultsRes, testsRes] = await Promise.all([
        supabase
          .from("users")
          .select("id, last_name, first_name, email, phone, age, gender, profession, address, bank_name, bank_account, registered_at")
          .eq("id", userId)
          .single(),
        supabase
          .from("consultations")
          .select("id, date, time, type, status, duration_minutes, price, paid_at, beverage_preference, notes, team_members(last_name, first_name)")
          .eq("client_id", userId)
          .order("date", { ascending: true })
          .order("time", { ascending: true }),
        supabase
          .from("test_results")
          .select("id, score, max_score, level, taken_at, conclusion, recommendation, raw_answers, test_id, tests(title, category)")
          .eq("client_id", userId)
          .order("taken_at", { ascending: false }),
      ]);
      setUser(userRes.data ?? null);
      setConsultations((consultsRes.data as unknown as ConsultationRow[]) ?? []);
      setTestResults((testsRes.data as unknown as TestResultRow[]) ?? []);
      setLoading(false);
    }
    fetchData();
  }, [userId]);

  function levelColor(level: string) {
    const l = LEVEL_LABELS[level] ?? level;
    switch (l) {
      case "Бага": return dark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-100 text-emerald-700";
      case "Дунд": return dark ? "bg-amber-500/15 text-amber-400" : "bg-amber-100 text-amber-700";
      case "Өндөр": return dark ? "bg-red-500/15 text-red-400" : "bg-red-100 text-red-700";
      default: return dark ? "bg-blue-500/15 text-blue-400" : "bg-blue-100 text-blue-700";
    }
  }

  const now = new Date();
  const completedCount = consultations.filter((c) => {
    if (c.status === "cancelled") return false;
    if (c.status === "completed") return true;
    const end = new Date(`${c.date}T${c.time}`);
    end.setMinutes(end.getMinutes() + (c.duration_minutes ?? 60));
    return end <= now;
  }).length;
  const displayName = user ? `${user.last_name} ${user.first_name}` : "...";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`w-full max-w-2xl rounded-2xl ${dark ? "bg-[#1e1e36]" : "bg-white"} max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="relative bg-linear-to-br from-purple-600 to-indigo-700 px-6 py-6">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold text-white">
              {user ? user.first_name.charAt(0) : "?"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{displayName}</h2>
              <p className="text-sm text-white/60">{user?.profession ?? ""}{user?.age ? ` · ${user.age} нас` : ""}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${dark ? "border-white/10" : "border-gray-200"}`}>
          {([
            { key: "info" as const, label: "Мэдээлэл" },
            { key: "tests" as const, label: `Тестийн үр дүн (${testResults.length})` },
            { key: "history" as const, label: `Хандалт (${consultations.length})` },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex-1 px-4 py-3.5 text-sm font-medium transition-colors ${
                tab === t.key
                  ? dark ? "text-white" : "text-gray-900"
                  : dark ? "text-white/40 hover:text-white/60" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {t.label}
              {tab === t.key && <span className="absolute bottom-0 left-0 h-0.5 w-full bg-purple-600" />}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <p className={`text-sm ${dark ? "text-white/40" : "text-gray-400"}`}>Уншиж байна...</p>
            </div>
          ) : (
            <>
              {/* Info Tab */}
              {tab === "info" && user && (
                <div>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { label: "И-мэйл", value: user.email },
                      { label: "Утас", value: user.phone ?? "—" },
                      { label: "Нас", value: user.age ? `${user.age}` : "—" },
                      { label: "Хүйс", value: user.gender ? (GENDER_LABELS[user.gender] ?? user.gender) : "—" },
                      { label: "Мэргэжил", value: user.profession ?? "—" },
                      { label: "Хаяг", value: user.address ?? "—" },
                      { label: "Бүртгүүлсэн", value: new Date(user.registered_at).toLocaleDateString("mn-MN") },
                      { label: "Нийт зөвлөгөө", value: `${completedCount} удаа` },
                    ]).map((item) => (
                      <div key={item.label} className={`rounded-xl p-3.5 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                        <p className={`text-[10px] font-medium ${dark ? "text-white/30" : "text-gray-400"}`}>{item.label}</p>
                        <p className={`mt-1 text-sm font-semibold ${dark ? "text-white" : "text-gray-900"}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href="/admin/consultations" onClick={onClose} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${dark ? "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"}`}>
                      Зөвлөгөө →
                    </Link>
                    <Link href="/admin/tests" onClick={onClose} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${dark ? "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"}`}>
                      Тестүүд →
                    </Link>
                    <Link href="/admin/users" onClick={onClose} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${dark ? "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"}`}>
                      Хэрэглэгчид →
                    </Link>
                  </div>

                  {user.bank_name && user.bank_account && (
                    <div className={`mt-3 flex items-center justify-between rounded-xl p-4 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${dark ? "bg-white/10" : "bg-gray-200"}`}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`h-5 w-5 ${dark ? "text-white/50" : "text-gray-500"}`}>
                            <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
                          </svg>
                        </div>
                        <div>
                          <p className={`text-[10px] font-medium ${dark ? "text-white/30" : "text-gray-400"}`}>Буцаалтын данс</p>
                          <p className={`text-sm font-semibold ${dark ? "text-white" : "text-gray-900"}`}>{user.bank_name}</p>
                          <p className={`text-xs ${dark ? "text-white/50" : "text-gray-500"}`}>{user.bank_account}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tests Tab */}
              {tab === "tests" && (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <Link href="/admin/tests" onClick={onClose} className="text-xs font-medium text-purple-500 hover:text-purple-400">
                      Бүх тестүүд →
                    </Link>
                  </div>
                  {testResults.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className={`text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>Тест бөглөөгүй байна</p>
                    </div>
                  ) : (
                    testResults.map((t) => {
                      const levelLabel = LEVEL_LABELS[t.level] ?? t.level;
                      const pct = t.max_score > 0 ? Math.round((t.score / t.max_score) * 100) : 0;
                      return (
                        <div key={t.id} className={`rounded-xl p-5 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div>
                              <p className={`text-base font-bold ${dark ? "text-white" : "text-gray-900"}`}>{t.tests?.title ?? "—"}</p>
                              <p className={`mt-0.5 text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>{t.tests?.category} · {new Date(t.taken_at).toLocaleDateString("mn-MN")}</p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${levelColor(t.level)}`}>
                              {levelLabel}
                            </span>
                          </div>

                          {/* Score */}
                          <div className="mt-4">
                            <div className="flex items-end justify-between">
                              <span className={`text-3xl font-bold ${dark ? "text-white" : "text-gray-900"}`}>{t.score}<span className={`text-base font-normal ${dark ? "text-white/30" : "text-gray-400"}`}> / {t.max_score}</span></span>
                              <span className={`text-sm font-semibold ${pct >= 70 ? "text-red-500" : pct >= 40 ? "text-amber-500" : "text-emerald-500"}`}>{pct}%</span>
                            </div>
                            <div className={`mt-2 h-3 w-full overflow-hidden rounded-full ${dark ? "bg-white/10" : "bg-gray-200"}`}>
                              <div
                                className={`h-full rounded-full transition-all ${
                                  t.level === "low" || t.level === "normal" ? "bg-emerald-500" : t.level === "medium" ? "bg-amber-500" : "bg-red-500"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>

                          {/* Conclusion */}
                          {t.conclusion && (
                            <div className={`mt-4 rounded-lg p-3 ${dark ? "bg-white/5" : "bg-white"}`}>
                              <p className={`mb-1 text-[10px] font-semibold uppercase tracking-wider ${dark ? "text-white/30" : "text-gray-400"}`}>Дүгнэлт</p>
                              <p className={`text-sm leading-relaxed ${dark ? "text-white/70" : "text-gray-600"}`}>{t.conclusion}</p>
                            </div>
                          )}

                          {/* Recommendation */}
                          {t.recommendation && (
                            <div className={`mt-2 rounded-lg p-3 ${dark ? "bg-purple-500/10 border border-purple-500/20" : "bg-purple-50 border border-purple-100"}`}>
                              <p className={`mb-1 text-[10px] font-semibold uppercase tracking-wider ${dark ? "text-purple-400/50" : "text-purple-400"}`}>Зөвлөмж</p>
                              <p className={`text-sm leading-relaxed ${dark ? "text-purple-200/70" : "text-purple-700"}`}>{t.recommendation}</p>
                            </div>
                          )}

                          {/* Full result button */}
                          {getSlugByDbTestId(t.test_id) && t.raw_answers && (
                            <button
                              onClick={() => openFullResult(t)}
                              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-pink-500 to-purple-500 px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                            >
                              Дэлгэрэнгүй харах
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                              </svg>
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* History Tab */}
              {tab === "history" && (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <Link href="/admin/consultations" onClick={onClose} className="text-xs font-medium text-purple-500 hover:text-purple-400">
                      Бүх зөвлөгөө →
                    </Link>
                  </div>
                  {consultations.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className={`text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>Хандалтын түүх байхгүй</p>
                    </div>
                  ) : (
                    consultations.map((h) => {
                      const end = new Date(`${h.date}T${h.time}`);
                      end.setMinutes(end.getMinutes() + (h.duration_minutes ?? 60));
                      const isOver = end <= now;
                      const isCancelled = h.status === "cancelled";
                      const effectiveStatus = isCancelled ? "cancelled" : isOver ? "completed" : "normal";
                      const BEVERAGE: Record<string, string> = { water: "Ус", green_tea: "Ногоон цай", black_tea: "Хар цай", coffee: "Кофе" };
                      return (
                        <div key={h.id} className={`rounded-xl p-4 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                effectiveStatus === "completed"
                                  ? dark ? "bg-emerald-500/15" : "bg-emerald-100"
                                  : effectiveStatus === "cancelled"
                                  ? dark ? "bg-red-500/15" : "bg-red-100"
                                  : dark ? "bg-purple-500/15" : "bg-purple-100"
                              }`}>
                                {effectiveStatus === "completed" ? (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-emerald-500"><path d="M20 6L9 17l-5-5" /></svg>
                                ) : effectiveStatus === "cancelled" ? (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-red-500"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                ) : (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-purple-500"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                )}
                              </div>
                              <div>
                                <p className={`text-sm font-medium ${dark ? "text-white" : "text-gray-900"}`}>
                                  {TYPE_LABELS[h.type]} · {h.duration_minutes} мин
                                  {h.type === "offline" && h.beverage_preference && (
                                    <span className={`ml-2 text-xs ${dark ? "text-amber-400" : "text-amber-600"}`}>☕ {BEVERAGE[h.beverage_preference] ?? h.beverage_preference}</span>
                                  )}
                                </p>
                                <p className={`text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>
                                  {h.date} · {h.time}{h.team_members ? ` · ${h.team_members.last_name} ${h.team_members.first_name}` : ""}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                                effectiveStatus === "completed"
                                  ? dark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-700"
                                  : effectiveStatus === "cancelled"
                                  ? dark ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-700"
                                  : dark ? "bg-purple-500/20 text-purple-400" : "bg-purple-100 text-purple-700"
                              }`}>
                                {effectiveStatus === "completed" ? "Дууссан" : effectiveStatus === "cancelled" ? "Цуцлагдсан" : "Хүлээгдэж буй"}
                              </span>
                              <span className={`text-xs font-semibold ${dark ? "text-white" : "text-gray-900"}`}>{h.price?.toLocaleString() ?? "—"}₮</span>
                              {h.paid_at && <span className="text-[9px] text-emerald-500">Төлсөн</span>}
                            </div>
                          </div>
                          {h.notes && (
                            <p className={`mt-2 text-xs leading-relaxed ${dark ? "text-white/40" : "text-gray-500"}`}>{h.notes}</p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
