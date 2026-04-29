"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { getSlugByDbTestId } from "@/lib/test-logics/registry";

interface Profile {
  id: string;
  last_name: string;
  first_name: string;
  email: string;
  phone: string | null;
  extra_phone: string | null;
  age: number | null;
  gender: string | null;
  profession: string | null;
  address: string | null;
  profile_image_url: string | null;
}

interface Consultation {
  id: string;
  date: string;
  time: string;
  type: string;
  status: string;
  price: number;
  paid_at: string | null;
  refunded_at: string | null;
  notes: string | null;
  created_at: string;
  meeting_link: string | null;
  beverage_preference: string | null;
  cancel_reason: string | null;
  refund_bank_name: string | null;
  refund_account_holder: string | null;
  refund_account_number: string | null;
  refund_iban: string | null;
  team_members: { first_name: string; last_name: string } | null;
}

interface TestResult {
  id: string;
  score: number;
  max_score: number;
  level: string;
  conclusion: string | null;
  recommendation: string | null;
  taken_at: string;
  raw_answers: Record<string, unknown> | null;
  duration_secs: number | null;
  tests: { id: string; title: string; category: string } | null;
}

interface SubmittedArticle {
  id: string;
  title: string;
  content: string;
  status: string;
  submitted_at: string;
}

const genderLabel: Record<string, string> = {
  male: "Эрэгтэй",
  female: "Эмэгтэй",
  other: "Бусад",
};

const consultationStatusMap: Record<string, { label: string; cls: string }> = {
  normal: { label: "Хэвийн", cls: "bg-purple-100 text-purple-700" },
  completed: { label: "Дууссан", cls: "bg-green-100 text-green-700" },
  cancelled: { label: "Цуцлагдсан", cls: "bg-red-100 text-red-600" },
  rescheduled: { label: "Өөрчлөгдсөн", cls: "bg-yellow-100 text-yellow-700" },
};

const articleStatusMap: Record<string, { label: string; cls: string }> = {
  pending: { label: "Хүлээгдэж байна", cls: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Нийтлэгдсэн", cls: "bg-green-100 text-green-700" },
  rejected: { label: "Татгалзсан", cls: "bg-red-100 text-red-600" },
};

const TABS = [
  { id: "profile", label: "Мэдээлэл" },
  { id: "consultations", label: "Зөвлөгөөний цаг" },
  { id: "tests", label: "Тест" },
  { id: "articles", label: "Нийтлэл" },
];

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [now] = useState(() => Date.now());
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [submittedArticles, setSubmittedArticles] = useState<
    SubmittedArticle[]
  >([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState(false);
  const [cancelModal, setCancelModal] = useState<string | null>(null);
  const [cancelForm, setCancelForm] = useState({ reason: "", bank_name: "", account_holder: "", account_number: "", iban: "" });
  const [cancelSaving, setCancelSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const sb = createClient();
    sb.auth.getUser().then(({ data: { user: u } }: { data: { user: { id: string } | null } }) => {
      console.log("Auth user id:", u?.id);
    });
    sb.from("users")
      .select(
        "id, last_name, first_name, email, phone, extra_phone, age, gender, profession, address, profile_image_url",
      )
      .eq("auth_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error("Profile fetch error:", JSON.stringify(error));
        if (data) {
          setProfile(data);
          setEditForm(data);
        }
        setProfileLoading(false);
      });
  }, [user]);

  useEffect(() => {
    if (!profile) return;
    const sb = createClient();
    sb.from("consultations")
      .select(
        "id, date, time, type, status, price, paid_at, refunded_at, notes, created_at, meeting_link, beverage_preference, cancel_reason, refund_bank_name, refund_account_holder, refund_account_number, refund_iban, team_members(first_name, last_name)",
      )
      .eq("client_id", profile.id)
      .order("date", { ascending: true })
      .order("time", { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error("Consultations fetch error:", JSON.stringify(error));
        setConsultations((data ?? []) as unknown as Consultation[]);
      });
    sb.from("test_results")
      .select(
        "id, score, max_score, level, conclusion, recommendation, taken_at, raw_answers, duration_secs, tests(id, title, category)",
      )
      .eq("client_id", profile.id)
      .order("taken_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error("Test results fetch error:", JSON.stringify(error));
        setTestResults((data ?? []) as unknown as TestResult[]);
      });
  }, [profile]);

  useEffect(() => {
    if (!user?.email) return;
    createClient()
      .from("submitted_articles")
      .select("id, title, content, status, submitted_at")
      .eq("author_email", user.email)
      .order("submitted_at", { ascending: false })
      .then(({ data }) => setSubmittedArticles(data ?? []));
  }, [user]);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    setSaveError("");
    const { error } = await createClient()
      .from("users")
      .update({
        last_name: editForm.last_name,
        first_name: editForm.first_name,
        phone: editForm.phone ?? null,
        age: editForm.age ?? null,
        gender: editForm.gender ?? null,
        profession: editForm.profession ?? null,
      })
      .eq("id", profile.id);
    if (error) {
      setSaveError("Хадгалахад алдаа гарлаа");
      setSaving(false);
      return;
    }
    setProfile((p) => (p ? { ...p, ...editForm } : p));
    setEditOpen(false);
    setSaving(false);
  }

  function openCancelModal(id: string) {
    setCancelForm({ reason: "", bank_name: "", account_holder: "", account_number: "", iban: "" });
    setCancelModal(id);
  }

  async function handleCancelConsultation() {
    if (!cancelModal) return;
    setCancelSaving(true);
    const { error } = await createClient()
      .from("consultations")
      .update({
        status: "cancelled",
        cancel_reason: cancelForm.reason || null,
        refund_bank_name: cancelForm.bank_name || null,
        refund_account_holder: cancelForm.account_holder || null,
        refund_account_number: cancelForm.account_number || null,
        refund_iban: cancelForm.iban || null,
      })
      .eq("id", cancelModal);
    setCancelSaving(false);
    if (error) { alert(`Алдаа: ${error.message}`); return; }
    setConsultations((prev) =>
      prev.map((c) => (c.id === cancelModal ? {
        ...c,
        status: "cancelled",
        cancel_reason: cancelForm.reason || null,
        refund_bank_name: cancelForm.bank_name || null,
        refund_account_holder: cancelForm.account_holder || null,
        refund_account_number: cancelForm.account_number || null,
        refund_iban: cancelForm.iban || null,
      } : c)),
    );
    setCancelModal(null);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile || !user) return;
    setUploading(true);
    const sb = createClient();
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await sb.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (!uploadError) {
      const {
        data: { publicUrl },
      } = sb.storage.from("avatars").getPublicUrl(path);
      await sb
        .from("users")
        .update({ profile_image_url: publicUrl })
        .eq("id", profile.id);
      setProfile((p) => (p ? { ...p, profile_image_url: publicUrl } : p));
    }
    setUploading(false);
    e.target.value = "";
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  const initials = profile
    ? `${profile.last_name?.[0] ?? ""}${profile.first_name?.[0] ?? ""}`.toUpperCase()
    : (user.email?.[0] ?? "U").toUpperCase();

  const fullName = profile
    ? `${profile.last_name} ${profile.first_name}`.trim()
    : "";

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      {/* ── Banner + Profile card ── */}
      <div>
        {/* Banner */}
        <div className="relative h-52 overflow-hidden bg-linear-to-br from-[#2d1b69] via-[#6d28d9] to-[#ec4899] sm:h-64">
          {/* decorative circles */}
          <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
          <div className="absolute -right-10 -bottom-10 h-80 w-80 rounded-full bg-white/5" />
          <div className="absolute left-1/4 top-6 h-32 w-32 rounded-full bg-pink-400/10" />
        </div>

        {/* Profile card — overlaps banner */}
        <div className="relative z-10 mx-auto -mt-16 max-w-2xl px-4">
          <div className="rounded-2xl bg-white px-4 pb-6 pt-4 shadow-xl sm:rounded-3xl sm:px-8 sm:pb-8 sm:pt-6">
            {/* Avatar */}
            <div className="flex justify-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="group relative -mt-14 h-20 w-20 shrink-0 cursor-pointer rounded-full border-4 border-white shadow-lg sm:-mt-16 sm:h-28 sm:w-28"
              >
                {profile?.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    alt=""
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-linear-to-br from-[#6d28d9] to-[#ec4899] text-3xl font-bold text-white">
                    {initials}
                  </div>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  {uploading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-6 w-6 text-white"
                      >
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                      <span className="mt-1 text-[10px] text-white">Солих</span>
                    </>
                  )}
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            {/* Name */}
            <div className="mt-3 text-center">
              {profileLoading ? (
                <div className="mx-auto h-7 w-40 animate-pulse rounded-lg bg-zinc-200" />
              ) : (
                <h1 className="text-lg font-bold text-zinc-900 sm:text-2xl">
                  {fullName || user.email}
                </h1>
              )}
              <div className="mt-1 flex items-center justify-center gap-1 text-sm text-zinc-400">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-3.5 w-3.5"
                >
                  <path d="M4 4h16v16H4z" />
                  <path d="M16 2v4M8 2v4M4 10h16" />
                </svg>
                {user.email}
              </div>
            </div>

            {/* Quick info strip */}
            <div className="mt-4 flex flex-wrap justify-center gap-2 rounded-xl bg-purple-50 px-3 py-3 sm:mt-5 sm:gap-4 sm:rounded-2xl sm:px-6 sm:py-4">
              {[
                { icon: "📞", label: profile?.phone ?? "—", key: "phone" },
                {
                  icon: "🎂",
                  label: profile?.age ? `${profile.age} нас` : "—",
                  key: "age",
                },
                {
                  icon: "👤",
                  label: profile?.gender ? genderLabel[profile.gender] : "—",
                  key: "gender",
                },
              ].map(({ icon, label, key }) => (
                <div
                  key={key}
                  className="flex items-center gap-1.5 text-xs text-zinc-600 sm:text-sm"
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {/* Edit button */}
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => {
                  setEditForm(profile ?? {});
                  setEditOpen(true);
                }}
                className="rounded-full border border-purple-200 px-6 py-2 text-sm font-medium text-purple-600 transition-colors hover:bg-purple-50"
              >
                Мэдээлэл засах
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="mx-auto mt-6 max-w-2xl px-4">
        <div className="flex overflow-x-auto rounded-2xl bg-white p-1.5 shadow-sm">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 whitespace-nowrap rounded-xl px-3 py-2.5 text-xs font-medium transition-colors sm:px-0 sm:text-sm ${
                activeTab === tab.id
                  ? "bg-linear-to-r from-purple-600 to-pink-500 text-white shadow"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="mx-auto max-w-2xl px-4 py-6 pb-20">
        {/* Мэдээлэл */}
        {activeTab === "profile" && (
          <div className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
            <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3 sm:mb-5 sm:pb-4">
              <span className="text-base">👤</span>
              <h2 className="text-base font-bold text-zinc-800">
                Хувийн мэдээлэл
              </h2>
            </div>
            <dl className="space-y-3">
              {[
                { label: "Овог", value: profile?.last_name },
                { label: "Нэр", value: profile?.first_name },
                { label: "И-мэйл", value: profile?.email },
                { label: "Утас", value: profile?.phone },
                { label: "Нас", value: profile?.age?.toString() },
                {
                  label: "Хүйс",
                  value: profile?.gender ? genderLabel[profile.gender] : null,
                },
                { label: "Мэргэжил / Боловсрол", value: profile?.profession },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <dt className="text-sm text-zinc-400">{label}</dt>
                  <dd className="text-sm font-medium text-zinc-800">
                    {value ?? "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Зөвлөгөөний цаг */}
        {activeTab === "consultations" && (() => {
          const enriched = consultations.map((c) => {
            const sessionTime = new Date(`${c.date}T${c.time}`);
            const isUpcoming = sessionTime.getTime() > now;
            const isCancelled = c.status === "cancelled";
            const effectiveStatus = isCancelled ? "cancelled" : !isUpcoming ? "completed" : c.status;
            return { ...c, sessionTime, isUpcoming, isCancelled, effectiveStatus };
          });
          const activeList = enriched.filter((c) => c.effectiveStatus === "normal" || c.effectiveStatus === "rescheduled");
          const completedList = enriched.filter((c) => c.effectiveStatus === "completed" || c.effectiveStatus === "cancelled");

          const renderCard = (c: typeof enriched[number]) => {
            const canCancel = c.effectiveStatus === "normal";
            const st = consultationStatusMap[c.effectiveStatus] ?? consultationStatusMap.normal;
            return (
              <div
                key={c.id}
                className={`rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 ${c.isCancelled ? "opacity-70" : ""}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap gap-2 sm:mb-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold sm:px-3 sm:py-1 sm:text-xs ${st.cls}`}
                      >
                        {st.label}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] text-zinc-600 sm:px-3 sm:py-1 sm:text-xs">
                        {c.type === "online" ? "🖥 Онлайн" : "🏢 Биечлэн"}
                      </span>
                      {c.type === "offline" && c.beverage_preference && (
                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] text-amber-700 sm:px-3 sm:py-1 sm:text-xs">
                          ☕ {{ water: "Ус", green_tea: "Ногоон цай", black_tea: "Хар цай", coffee: "Кофе" }[c.beverage_preference] ?? c.beverage_preference}
                        </span>
                      )}
                    </div>
                    <p className="text-base font-bold text-zinc-900 sm:text-lg">
                      {(() => { const d = new Date(c.date); return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`; })()}
                    </p>
                    <p className="mt-0.5 text-sm text-zinc-500">
                      {c.time.slice(0, 5)}
                    </p>
                    {c.team_members && (
                      <p className="mt-2 text-sm text-zinc-500">
                        Зөвлөгч:{" "}
                        <span className="font-medium text-purple-600">
                          {c.team_members.last_name}{" "}
                          {c.team_members.first_name}
                        </span>
                      </p>
                    )}

                    {c.type === "online" && !c.isCancelled && (
                      c.meeting_link ? (
                        <div className="mt-2 flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2">
                          <p className="min-w-0 flex-1 truncate text-xs text-blue-600">{c.meeting_link}</p>
                          <button
                            onClick={() => { navigator.clipboard.writeText(c.meeting_link!); alert("Линк хуулагдлаа!"); }}
                            className="shrink-0 rounded-lg bg-blue-100 px-2.5 py-1 text-[10px] font-medium text-blue-700 hover:bg-blue-200"
                          >
                            Хуулах
                          </button>
                        </div>
                      ) : c.isUpcoming ? (
                        <p className="mt-2 text-xs text-amber-500">
                          Зөвлөгч линк оруулаагүй байна. Зөвлөгөө эхлэхээс өмнө линк орно.
                        </p>
                      ) : null
                    )}

                    {c.notes && (
                      <p className="mt-1 text-sm text-zinc-400">
                        {c.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-row items-center justify-between gap-2 sm:flex-col sm:items-end sm:gap-1">
                    <p className="text-lg font-bold text-zinc-900 sm:text-xl">
                      {c.price.toLocaleString()}₮
                    </p>
                    <p
                      className={`text-xs font-medium ${c.refunded_at ? "text-red-500" : c.paid_at ? "text-green-600" : "text-yellow-600"}`}
                    >
                      {c.refunded_at ? "↩ Төлбөр буцаасан" : c.paid_at ? "✓ Төлсөн" : "⏳ Төлөөгүй"}
                    </p>
                    {canCancel && (
                      <button
                        onClick={() => openCancelModal(c.id)}
                        className="mt-2 rounded-full border border-red-200 px-4 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                      >
                        Цуцлах
                      </button>
                    )}
                    {c.isCancelled && c.isUpcoming && (
                      <button
                        onClick={async () => {
                          const { error } = await createClient().from("consultations").update({ status: "normal" }).eq("id", c.id);
                          if (error) { alert(`Алдаа: ${error.message}`); return; }
                          setConsultations((prev) => prev.map((x) => x.id === c.id ? { ...x, status: "normal" } : x));
                        }}
                        className="mt-2 rounded-full border border-purple-200 px-4 py-1.5 text-xs font-medium text-purple-600 transition-colors hover:bg-purple-50"
                      >
                        Сэргээх
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          };

          return (
            <div className="space-y-6">
              {/* Зөвлөгөөний цаг */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-zinc-800">
                    Зөвлөгөөний цаг
                  </h2>
                  <Link
                    href="/consultation"
                    className="rounded-full bg-linear-to-r from-purple-600 to-pink-500 px-4 py-1.5 text-xs font-medium text-white"
                  >
                    + Цаг захиалах
                  </Link>
                </div>

                {activeList.length === 0 ? (
                  <div className="rounded-2xl bg-white px-4 py-10 text-center shadow-sm sm:rounded-3xl sm:px-6 sm:py-16">
                    <p className="mb-4 text-zinc-400">
                      Одоогоор зөвлөгөөний цаг байхгүй байна
                    </p>
                    <Link
                      href="/consultation"
                      className="rounded-full border border-purple-200 px-6 py-2 text-sm text-purple-600 hover:bg-purple-50"
                    >
                      Цаг захиалах →
                    </Link>
                  </div>
                ) : (() => {
                  const groups = new Map<string, typeof activeList>();
                  for (const c of activeList) {
                    const d = new Date(c.date);
                    const key = `${d.getFullYear()} оны ${d.getMonth() + 1}-р сар`;
                    if (!groups.has(key)) groups.set(key, []);
                    groups.get(key)!.push(c);
                  }
                  return Array.from(groups.entries()).map(([month, items]) => (
                    <div key={month}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">{month}</p>
                      <div className="space-y-3">{items.map(renderCard)}</div>
                    </div>
                  ));
                })()}
              </div>

              {/* Дууссан зөвлөгөө */}
              {completedList.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-base font-bold text-zinc-800">
                    Дууссан зөвлөгөө
                  </h2>
                  {(() => {
                    const groups = new Map<string, typeof completedList>();
                    for (const c of completedList) {
                      const d = new Date(c.date);
                      const key = `${d.getFullYear()} оны ${d.getMonth() + 1}-р сар`;
                      if (!groups.has(key)) groups.set(key, []);
                      groups.get(key)!.push(c);
                    }
                    return Array.from(groups.entries()).map(([month, items]) => (
                      <div key={month}>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">{month}</p>
                        <div className="space-y-3">{items.map(renderCard)}</div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          );
        })()}

        {/* Цуцлах modal */}
        {cancelModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
            <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-md sm:rounded-2xl sm:p-6">
              <h3 className="mb-4 text-base font-bold text-zinc-800 sm:text-lg">Зөвлөгөөний цаг цуцлах</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600">Цуцлах шалтгаан</label>
                  <textarea
                    value={cancelForm.reason}
                    onChange={(e) => setCancelForm((f) => ({ ...f, reason: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-purple-400"
                    rows={2}
                    placeholder="Шалтгаанаа бичнэ үү..."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600">Банкны нэр</label>
                  <input
                    value={cancelForm.bank_name}
                    onChange={(e) => setCancelForm((f) => ({ ...f, bank_name: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-purple-400"
                    placeholder="Жишээ: Хаан банк"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600">Данс эзэмшигч</label>
                  <input
                    value={cancelForm.account_holder}
                    onChange={(e) => setCancelForm((f) => ({ ...f, account_holder: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-purple-400"
                    placeholder="Нэр"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600">Дансны дугаар</label>
                  <input
                    value={cancelForm.account_number}
                    onChange={(e) => setCancelForm((f) => ({ ...f, account_number: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-purple-400"
                    placeholder="Дансны дугаар"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600">IBAN</label>
                  <input
                    value={cancelForm.iban}
                    onChange={(e) => setCancelForm((f) => ({ ...f, iban: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-purple-400"
                    placeholder="IBAN (заавал биш)"
                  />
                </div>
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setCancelModal(null)}
                  className="flex-1 rounded-full border border-zinc-200 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Болих
                </button>
                <button
                  onClick={handleCancelConsultation}
                  disabled={cancelSaving}
                  className="flex-1 rounded-full bg-red-500 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {cancelSaving ? "Илгээж байна..." : "Цуцлах"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Тест */}
        {activeTab === "tests" && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-zinc-800">
              Тестийн үр дүн
            </h2>

            {testResults.length === 0 ? (
              <div className="rounded-2xl bg-white px-4 py-10 text-center shadow-sm sm:rounded-3xl sm:px-6 sm:py-16">
                <p className="text-zinc-400">
                  Одоогоор тест өгсөн бүртгэл байхгүй байна
                </p>
              </div>
            ) : (
              testResults.map((t) => {
                const pct = t.max_score > 0 ? Math.round((t.score / t.max_score) * 100) : 0;
                // conclusion may be JSON for complex tests — show level instead
                let displayConclusion = t.conclusion;
                if (displayConclusion) {
                  try { JSON.parse(displayConclusion); displayConclusion = null; } catch { /* plain text, keep it */ }
                }
                const slug = t.tests?.id ? getSlugByDbTestId(t.tests.id) : undefined;
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      if (slug && t.raw_answers) {
                        sessionStorage.setItem(`test_result_${slug}`, JSON.stringify({ answers: t.raw_answers, duration: t.duration_secs ?? 0 }));
                        router.push(`/tests/${slug}/result?from=dashboard`);
                      }
                    }}
                    className={`rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 ${slug && t.raw_answers ? "cursor-pointer transition-shadow hover:shadow-md" : ""}`}
                  >
                    <div className="flex items-center gap-3 sm:gap-5">
                      {/* Score circle */}
                      {t.max_score > 0 ? (
                        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center sm:h-18 sm:w-18">
                          <svg
                            className="h-14 w-14 -rotate-90 sm:h-18 sm:w-18"
                            viewBox="0 0 64 64"
                          >
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              fill="none"
                              stroke="#f3f0ff"
                              strokeWidth="6"
                            />
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              fill="none"
                              stroke={`url(#grad-${t.id})`}
                              strokeWidth="6"
                              strokeDasharray={`${2 * Math.PI * 28}`}
                              strokeDashoffset={`${2 * Math.PI * 28 * (1 - pct / 100)}`}
                              strokeLinecap="round"
                            />
                            <defs>
                              <linearGradient
                                id={`grad-${t.id}`}
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="0%"
                              >
                                <stop offset="0%" stopColor="#7c3aed" />
                                <stop offset="100%" stopColor="#ec4899" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <span className="absolute text-sm font-bold text-zinc-800">
                            {pct}%
                          </span>
                        </div>
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 sm:h-18 sm:w-18">
                          ✓
                        </div>
                      )}

                      <div className="flex-1">
                        {t.tests && (
                          <p className="mb-0.5 text-xs font-bold tracking-widest text-pink-500">
                            {t.tests.category.toUpperCase()}
                          </p>
                        )}
                        <h3 className="text-base font-semibold text-zinc-900">
                          {t.tests?.title}
                        </h3>
                        {displayConclusion && (
                          <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                            {displayConclusion}
                          </p>
                        )}
                        {t.recommendation && (
                          <p className="mt-0.5 text-sm italic text-zinc-400">
                            {t.recommendation}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                            {t.level}
                          </span>
                          {t.max_score > 0 && (
                            <span className="text-xs text-zinc-400">
                              {t.score}/{t.max_score} оноо
                            </span>
                          )}
                          <span className="text-xs text-zinc-400">
                            {new Date(t.taken_at).toLocaleDateString("mn-MN")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Нийтлэл */}
        {activeTab === "articles" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-800">
                Миний нийтлэлүүд
              </h2>
              <Link
                href="/submit-article"
                className="rounded-full bg-linear-to-r from-purple-600 to-pink-500 px-4 py-1.5 text-xs font-medium text-white"
              >
                + Нийтлэл бичих
              </Link>
            </div>

            {submittedArticles.length === 0 ? (
              <div className="rounded-2xl bg-white px-4 py-10 text-center shadow-sm sm:rounded-3xl sm:px-6 sm:py-16">
                <p className="mb-4 text-zinc-400">
                  Одоогоор илгээсэн нийтлэл байхгүй байна
                </p>
                <Link
                  href="/submit-article"
                  className="rounded-full border border-purple-200 px-6 py-2 text-sm text-purple-600 hover:bg-purple-50"
                >
                  Нийтлэл бичих →
                </Link>
              </div>
            ) : (
              submittedArticles.map((a) => {
                const st =
                  articleStatusMap[a.status] ?? articleStatusMap.pending;
                return (
                  <div
                    key={a.id}
                    className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-zinc-900 sm:text-base">
                          {a.title}
                        </h3>
                        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-zinc-500">
                          {a.content}
                        </p>
                        <p className="mt-2 text-xs text-zinc-400">
                          {new Date(a.submitted_at).toLocaleDateString("mn-MN")}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${st.cls}`}
                      >
                        {st.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ── Edit modal ── */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900">
                Мэдээлэл засах
              </h2>
              <button
                onClick={() => setEditOpen(false)}
                className="rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-gray-100 hover:text-zinc-700"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  { key: "last_name", label: "Овог" },
                  { key: "first_name", label: "Нэр" },
                  { key: "phone", label: "Утас", type: "tel" },
                  { key: "age", label: "Нас", type: "number" },
                  { key: "profession", label: "Мэргэжил / Боловсрол" },
                ] as { key: keyof Profile; label: string; type?: string }[]
              ).map(({ key, label, type }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-500">
                    {label}
                  </label>
                  <input
                    type={type ?? "text"}
                    value={(editForm[key] ?? "").toString()}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        [key]:
                          type === "number"
                            ? Number(e.target.value) || null
                            : e.target.value,
                      }))
                    }
                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  />
                </div>
              ))}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-500">
                  Хүйс
                </label>
                <select
                  value={editForm.gender ?? ""}
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      gender: e.target.value || null,
                    }))
                  }
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                >
                  <option value="">—</option>
                  <option value="male">Эрэгтэй</option>
                  <option value="female">Эмэгтэй</option>
                  <option value="other">Бусад</option>
                </select>
              </div>
            </div>

            {saveError && (
              <p className="mt-3 text-sm text-red-500">{saveError}</p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setEditOpen(false)}
                className="flex-1 rounded-full border border-gray-200 py-3 text-sm font-medium text-zinc-600 transition-colors hover:bg-gray-50"
              >
                Болих
              </button>
              <button
                disabled={saving}
                onClick={handleSave}
                className="flex-1 rounded-full bg-linear-to-r from-purple-600 to-pink-500 py-3 text-sm font-medium text-white disabled:opacity-60"
              >
                {saving ? "Хадгалж байна..." : "Хадгалах"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
