"use client";

import { useEffect, useState } from "react";
import { useTheme } from "../ThemeContext";
import ClientModal, { useClientModal } from "../ClientModal";
import { nameMatch } from "../clientData";
import { createClient } from "@/lib/supabase/client";

type ConsultType = "online" | "offline";
type ConsultStatus = "normal" | "cancelled" | "completed";
type BeverageType = "water" | "green_tea" | "black_tea" | "coffee" | null;

interface Booking {
  id: string;
  client_id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  counselor_name: string;
  type: ConsultType;
  date: string;
  time: string;
  duration_minutes: number;
  status: ConsultStatus;
  price: number;
  beverage_preference: BeverageType;
  paid_at: string | null;
  refunded_at: string | null;
  notes: string | null;
  meeting_link: string | null;
  cancel_reason: string | null;
  refund_bank_name: string | null;
  refund_account_holder: string | null;
  refund_account_number: string | null;
  refund_iban: string | null;
}

const BEVERAGE_LABELS: Record<string, string> = {
  water: "Ус", green_tea: "Ногоон цай", black_tea: "Цай", coffee: "Кофе",
};

function paidAtMs(b: Booking): number {
  return b.paid_at ? new Date(b.paid_at).getTime() : 0;
}

function canCancel(b: Booking): boolean {
  const hoursSincePaid = (Date.now() - paidAtMs(b)) / (1000 * 60 * 60);
  return hoursSincePaid < 24;
}

function getCancelTimeLeft(b: Booking): string {
  const msLeft = paidAtMs(b) + 24 * 60 * 60 * 1000 - Date.now();
  if (msLeft <= 0) return "";
  const hours = Math.floor(msLeft / (1000 * 60 * 60));
  const mins = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}ц ${mins}м`;
}

function isSessionOver(b: Booking): boolean {
  const start = new Date(`${b.date}T${b.time}`).getTime();
  const end = start + b.duration_minutes * 60 * 1000;
  return Date.now() > end;
}

export default function ConsultationsPage() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const { selectedUserId, openClient, closeClient } = useClientModal();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("Бүгд");
  const [tab, setTab] = useState<"active" | "archive">("active");
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ date: "", time: "", duration_minutes: 60 });
  const [searchName, setSearchName] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchDate, setSearchDate] = useState("");

  async function fetchBookings() {
    const role = localStorage.getItem("admin_role");
    const counselorId = localStorage.getItem("admin_counselor_id") ?? "";
    const isCounselor = role === "counselor" && !!counselorId;

    const supabase = createClient();
    let query = supabase
      .from("consultations")
      .select("*, users(last_name, first_name, email, phone), team_members(last_name, first_name)")
      .order("date", { ascending: false })
      .order("time", { ascending: false });
    if (isCounselor) query = query.eq("counselor_id", counselorId);
    const { data } = await query;

    setBookings(
      (data ?? []).map((row) => ({
        id: row.id,
        client_id: row.client_id,
        client_name: row.users
          ? `${row.users.last_name ?? ""} ${row.users.first_name ?? ""}`.trim()
          : "Тодорхойгүй",
        client_email: row.users?.email ?? "",
        client_phone: row.users?.phone ?? null,
        counselor_name: row.team_members
          ? `${row.team_members.last_name ?? ""} ${row.team_members.first_name ?? ""}`.trim()
          : "Тодорхойгүй",
        type: row.type,
        date: row.date,
        time: row.time,
        duration_minutes: row.duration_minutes,
        status: row.status,
        price: row.price,
        beverage_preference: row.beverage_preference,
        paid_at: row.paid_at,
        refunded_at: row.refunded_at,
        notes: row.notes,
        meeting_link: row.meeting_link,
        cancel_reason: row.cancel_reason ?? null,
        refund_bank_name: row.refund_bank_name ?? null,
        refund_account_holder: row.refund_account_holder ?? null,
        refund_account_number: row.refund_account_number ?? null,
        refund_iban: row.refund_iban ?? null,
      }))
    );
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchBookings(); }, []);

  async function cancelBooking(id: string) {
    const { error } = await createClient().from("consultations").update({ status: "cancelled" }).eq("id", id);
    if (error) { alert(`Алдаа: ${error.message}`); return; }
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "cancelled" as const } : b));
    if (viewBooking?.id === id) setViewBooking((prev) => prev ? { ...prev, status: "cancelled" as const } : null);
  }

  async function restoreBooking(id: string) {
    const { error } = await createClient().from("consultations").update({ status: "normal", refunded_at: null }).eq("id", id);
    if (error) { alert(`Алдаа: ${error.message}`); return; }
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "normal" as const, refunded_at: null } : b));
    if (viewBooking?.id === id) setViewBooking((prev) => prev ? { ...prev, status: "normal" as const, refunded_at: null } : null);
  }

  async function toggleRefund(id: string) {
    const b = bookings.find((x) => x.id === id);
    if (!b) return;
    const newRefundedAt = b.refunded_at ? null : new Date().toISOString();
    const { error } = await createClient().from("consultations").update({ refunded_at: newRefundedAt }).eq("id", id);
    if (error) { alert(`Алдаа: ${error.message}`); return; }
    setBookings((prev) => prev.map((x) => x.id === id ? { ...x, refunded_at: newRefundedAt } : x));
    if (viewBooking?.id === id) setViewBooking((prev) => prev ? { ...prev, refunded_at: newRefundedAt } : null);
  }

  function startEdit() {
    if (!viewBooking) return;
    setEditForm({ date: viewBooking.date, time: viewBooking.time, duration_minutes: viewBooking.duration_minutes });
    setEditing(true);
  }

  async function saveEdit() {
    if (!viewBooking) return;
    const { error } = await createClient().from("consultations").update({
      date: editForm.date,
      time: editForm.time,
      duration_minutes: editForm.duration_minutes,
    }).eq("id", viewBooking.id);
    if (error) { alert(`Алдаа: ${error.message}`); return; }
    const updated = { ...viewBooking, date: editForm.date, time: editForm.time, duration_minutes: editForm.duration_minutes };
    setBookings((prev) => prev.map((b) => b.id === viewBooking.id ? updated : b));
    setViewBooking(updated);
    setEditing(false);
  }

  const activeBookings = bookings.filter((b) => !isSessionOver(b) && !(b.status === "cancelled" && b.refunded_at));
  const archiveBookings = bookings.filter((b) => isSessionOver(b) || (b.status === "cancelled" && !!b.refunded_at));
  const currentList = tab === "active" ? activeBookings : archiveBookings;

  const statusFilter = (b: Booking) => {
    if (filter === "Хэвийн") return b.status === "normal";
    if (filter === "Цуцлагдсан") return b.status === "cancelled";
    return true;
  };

  const filtered = currentList
    .filter(statusFilter)
    .filter((b) => {
      if (searchName && !nameMatch(b.client_name, searchName)) return false;
      if (searchPhone && !(b.client_phone ?? "").includes(searchPhone)) return false;
      if (searchDate && b.date !== searchDate) return false;
      return true;
    })
    .slice()
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`).getTime();
      const dateB = new Date(`${b.date}T${b.time}`).getTime();
      return tab === "active" ? dateA - dateB : dateB - dateA;
    });

  const counts = {
    Бүгд: currentList.length,
    Хэвийн: currentList.filter((b) => b.status === "normal").length,
    Цуцлагдсан: currentList.filter((b) => b.status === "cancelled").length,
  };

  const totalIncome = bookings.filter((b) => b.status === "normal").reduce((s, b) => s + b.price, 0);
  const refundTotal = bookings.filter((b) => b.refunded_at !== null).reduce((s, b) => s + b.price, 0);

  const thBg = dark ? "bg-white/5" : "bg-gray-50";
  const thText = dark ? "text-white/40" : "text-gray-500";
  const tdText = dark ? "text-white" : "text-gray-900";
  const tdSub = dark ? "text-white/40" : "text-gray-500";
  const rowHover = dark ? "hover:bg-white/5" : "hover:bg-gray-50";
  const borderCls = dark ? "border-white/5" : "border-gray-200";

  function statusLabel(b: Booking) {
    const over = isSessionOver(b);
    if (b.status === "cancelled") return { label: "Цуцлагдсан · Буцаалт", bg: dark ? "bg-red-500/15" : "bg-red-50", text: "text-red-500" };
    if (over) return { label: "Зөвлөгөө өгсөн", bg: dark ? "bg-blue-500/15" : "bg-blue-50", text: "text-blue-500" };
    return { label: "Хэвийн", bg: dark ? "bg-emerald-500/15" : "bg-emerald-50", text: "text-emerald-500" };
  }

  function cancelInfo(b: Booking) {
    if (b.status === "cancelled") return { label: "Цуцлагдсан", bg: dark ? "bg-red-500/15" : "bg-red-50", text: "text-red-500" };
    if (isSessionOver(b)) return { label: "Хугацаа дууссан", bg: dark ? "bg-white/5" : "bg-gray-100", text: dark ? "text-white/30" : "text-gray-400" };
    if (!canCancel(b)) return { label: "Цуцлах боломжгүй", bg: dark ? "bg-white/5" : "bg-gray-100", text: dark ? "text-white/30" : "text-gray-400" };
    return { label: `Боломжтой (${getCancelTimeLeft(b)})`, bg: dark ? "bg-emerald-500/15" : "bg-emerald-50", text: "text-emerald-500" };
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between sm:mb-6">
        <h1 className={`text-xl font-bold sm:text-2xl ${dark ? "text-white" : "text-gray-900"}`}>Зөвлөгөөний захиалга</h1>
        <p className={`text-xs sm:text-sm ${dark ? "text-white/40" : "text-gray-500"}`}>Нийт: {bookings.length}</p>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:grid-cols-4 sm:gap-4">
        {[
          { label: "Идэвхтэй", value: String(activeBookings.length), color: "from-purple-500 to-indigo-600" },
          { label: "Архив (өгсөн)", value: String(archiveBookings.filter((b) => b.status === "normal").length), color: "from-blue-500 to-cyan-600" },
          { label: "Нийт орлого", value: `${totalIncome.toLocaleString()}₮`, color: "from-emerald-500 to-teal-600" },
          { label: "Буцаалт", value: `${refundTotal.toLocaleString()}₮`, color: "from-red-500 to-rose-600" },
        ].map((s) => (
          <div key={s.label} className={`relative overflow-hidden rounded-xl p-3 sm:rounded-2xl sm:p-5 ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}>
            <div className={`absolute -right-3 -top-3 h-12 w-12 rounded-full bg-linear-to-br ${s.color} opacity-20 blur-xl sm:h-16 sm:w-16`} />
            <p className={`text-[10px] font-medium sm:text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>{s.label}</p>
            <p className={`mt-1 text-lg font-bold sm:mt-2 sm:text-2xl ${dark ? "text-white" : "text-gray-900"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex items-center gap-6">
        {([
          { key: "active" as const, label: "Идэвхтэй", count: activeBookings.length },
          { key: "archive" as const, label: "Архив", count: archiveBookings.length },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setFilter("Бүгд"); }}
            className={`relative pb-2 text-sm font-semibold transition-colors ${
              tab === t.key
                ? dark ? "text-white" : "text-gray-900"
                : dark ? "text-white/40 hover:text-white/60" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {t.label}
            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tab === t.key ? "bg-purple-600 text-white" : dark ? "bg-white/10" : "bg-gray-200"}`}>
              {t.count}
            </span>
            {tab === t.key && <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-purple-600" />}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-3 flex gap-1.5 overflow-x-auto sm:mb-4 sm:gap-2">
        {(["Бүгд", "Хэвийн", "Цуцлагдсан"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm ${
              filter === f
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                : dark ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f}
            <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${filter === f ? "bg-white/20" : dark ? "bg-white/10" : "bg-gray-200"}`}>
              {counts[f as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>

      {/* Search Filters */}
      <div className={`mb-4 grid grid-cols-1 gap-2 rounded-xl p-3 sm:grid-cols-3 sm:gap-3 sm:rounded-2xl sm:p-4 ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}>
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 sm:h-4 sm:w-4 ${dark ? "text-white/30" : "text-gray-400"}`}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Нэрээр хайх..."
            className={`w-full rounded-lg py-2 pl-9 pr-3 text-xs outline-none sm:rounded-xl sm:py-2.5 sm:pl-10 sm:pr-4 sm:text-sm ${dark ? "bg-white/10 text-white placeholder:text-white/30 focus:bg-white/15" : "border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-purple-500"}`}
          />
        </div>
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 sm:h-4 sm:w-4 ${dark ? "text-white/30" : "text-gray-400"}`}>
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
          </svg>
          <input
            type="tel"
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            placeholder="Утасны дугаараар..."
            className={`w-full rounded-lg py-2 pl-9 pr-3 text-xs outline-none sm:rounded-xl sm:py-2.5 sm:pl-10 sm:pr-4 sm:text-sm ${dark ? "bg-white/10 text-white placeholder:text-white/30 focus:bg-white/15" : "border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-purple-500"}`}
          />
        </div>
        <div className="relative">
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className={`w-full rounded-lg px-3 py-2 text-xs outline-none sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm ${dark ? "bg-white/10 text-white focus:bg-white/15" : "border border-gray-200 text-gray-900 focus:border-purple-500"}`}
          />
        </div>
        {(searchName || searchPhone || searchDate) && (
          <button
            onClick={() => { setSearchName(""); setSearchPhone(""); setSearchDate(""); }}
            className={`rounded-lg px-3 py-2 text-xs font-medium sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm ${dark ? "text-white/50 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"}`}
          >
            Цэвэрлэх
          </button>
        )}
      </div>

      {/* Detail Modal */}
      {viewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`w-full max-w-md rounded-2xl ${dark ? "bg-[#1e1e36]" : "bg-white"} overflow-hidden`}>
            <div className="relative bg-linear-to-br from-purple-600 to-indigo-700 px-6 py-6">
              <button onClick={() => { setViewBooking(null); setEditing(false); }} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              {(() => {
                const sl = statusLabel(viewBooking);
                return (
                  <span className={`absolute left-6 top-4 rounded-full px-3 py-1 text-[10px] font-semibold backdrop-blur-sm ${sl.bg} ${sl.text}`}>
                    {sl.label}
                  </span>
                );
              })()}
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-lg font-bold text-white">
                  {viewBooking.client_name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{viewBooking.client_name}</h2>
                  <p className="text-sm text-white/60">{viewBooking.client_email}</p>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 pt-5">
              {!editing ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className={`rounded-xl p-3 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                    <p className={`text-[10px] font-medium ${dark ? "text-white/30" : "text-gray-400"}`}>Огноо</p>
                    <p className={`mt-0.5 text-sm font-semibold ${dark ? "text-white" : "text-gray-900"}`}>{viewBooking.date}</p>
                  </div>
                  <div className={`rounded-xl p-3 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                    <p className={`text-[10px] font-medium ${dark ? "text-white/30" : "text-gray-400"}`}>Цаг</p>
                    <p className={`mt-0.5 text-sm font-semibold ${dark ? "text-white" : "text-gray-900"}`}>{viewBooking.time}</p>
                  </div>
                  <div className={`rounded-xl p-3 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                    <p className={`text-[10px] font-medium ${dark ? "text-white/30" : "text-gray-400"}`}>Хугацаа</p>
                    <p className={`mt-0.5 text-sm font-semibold ${dark ? "text-white" : "text-gray-900"}`}>{viewBooking.duration_minutes} мин</p>
                  </div>
                  <div className={`rounded-xl p-3 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                    <p className={`text-[10px] font-medium ${dark ? "text-white/30" : "text-gray-400"}`}>Зөвлөгч</p>
                    <p className={`mt-0.5 text-sm font-semibold ${dark ? "text-white" : "text-gray-900"}`}>{viewBooking.counselor_name}</p>
                  </div>
                  <div className={`rounded-xl p-3 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                    <p className={`text-[10px] font-medium ${dark ? "text-white/30" : "text-gray-400"}`}>Утас</p>
                    <p className={`mt-0.5 text-sm font-semibold ${dark ? "text-white" : "text-gray-900"}`}>{viewBooking.client_phone ?? "—"}</p>
                  </div>
                  {!isSessionOver(viewBooking) && viewBooking.status === "normal" && (
                    <div className="flex items-end">
                      <button
                        onClick={startEdit}
                        className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-medium transition-colors ${
                          dark ? "bg-white/10 text-white hover:bg-white/15" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Засах
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className={`rounded-xl p-4 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`mb-1 block text-[10px] font-medium ${dark ? "text-white/40" : "text-gray-400"}`}>Огноо</label>
                      <input
                        type="date"
                        value={editForm.date}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${dark ? "bg-white/10 text-white" : "border border-gray-200 text-gray-900"}`}
                      />
                    </div>
                    <div>
                      <label className={`mb-1 block text-[10px] font-medium ${dark ? "text-white/40" : "text-gray-400"}`}>Цаг</label>
                      <input
                        type="time"
                        value={editForm.time}
                        onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                        className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${dark ? "bg-white/10 text-white" : "border border-gray-200 text-gray-900"}`}
                      />
                    </div>
                    <div>
                      <label className={`mb-1 block text-[10px] font-medium ${dark ? "text-white/40" : "text-gray-400"}`}>Хугацаа (мин)</label>
                      <select
                        value={editForm.duration_minutes}
                        onChange={(e) => setEditForm({ ...editForm, duration_minutes: Number(e.target.value) })}
                        className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${dark ? "bg-white/10 text-white" : "border border-gray-200 text-gray-900"}`}
                      >
                        {[30, 45, 60, 90, 120].map((m) => (
                          <option key={m} value={m}>{m} мин</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={saveEdit} className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-medium text-white hover:bg-purple-700">
                      Хадгалах
                    </button>
                    <button onClick={() => setEditing(false)} className={`rounded-lg px-4 py-2 text-xs font-medium ${dark ? "text-white/50 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"}`}>
                      Болих
                    </button>
                  </div>
                </div>
              )}

              {/* Badges */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {viewBooking.type === "online" ? (
                  <span className="rounded-full bg-green-500/15 px-3 py-1.5 text-xs font-medium text-green-500">
                    Онлайн
                  </span>
                ) : (
                  <span className="rounded-full bg-purple-500/15 px-3 py-1.5 text-xs font-medium text-purple-500">
                    Биечлэн{viewBooking.beverage_preference && ` · ${BEVERAGE_LABELS[viewBooking.beverage_preference]}`}
                  </span>
                )}
                {viewBooking.type === "online" && viewBooking.meeting_link && (
                  <a
                    href={viewBooking.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 px-3 py-1.5 text-xs font-medium text-blue-500 hover:bg-blue-500/25"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path d="M15 3h6v6M14 10l6.1-6.1M10 5H5a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5" /></svg>
                    Линк нээх
                  </a>
                )}
                {viewBooking.type === "online" && !viewBooking.meeting_link && (
                  <span className={`rounded-full px-3 py-1.5 text-xs font-medium ${dark ? "bg-yellow-500/10 text-yellow-400" : "bg-yellow-50 text-yellow-600"}`}>
                    Линк оруулаагүй
                  </span>
                )}
              </div>

              {/* Payment */}
              <div className={`mt-4 flex items-center justify-between rounded-xl p-4 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                <div>
                  <p className={`text-xs font-medium ${dark ? "text-white/40" : "text-gray-400"}`}>Төлбөр</p>
                  <p className={`mt-1 text-lg font-bold ${dark ? "text-white" : "text-gray-900"}`}>
                    {viewBooking.price.toLocaleString()}₮
                  </p>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-500">
                  Төлсөн
                </span>
              </div>

              {/* Refund toggle */}
              {viewBooking.status === "cancelled" && (
                <div className={`mt-3 flex items-center justify-between rounded-xl p-4 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                  <div>
                    <p className={`text-xs font-medium ${dark ? "text-white/40" : "text-gray-400"}`}>Буцаалт хийгдсэн эсэх</p>
                    <p className={`mt-0.5 text-sm font-semibold ${viewBooking.refunded_at ? "text-emerald-500" : dark ? "text-red-400" : "text-red-500"}`}>
                      {viewBooking.refunded_at ? "Тийм — буцаагдсан" : "Үгүй — буцаагдаагүй"}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleRefund(viewBooking.id)}
                    className={`relative h-7 w-12 rounded-full transition-colors ${viewBooking.refunded_at ? "bg-emerald-500" : dark ? "bg-white/20" : "bg-gray-300"}`}
                  >
                    <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${viewBooking.refunded_at ? "left-5.5" : "left-0.5"}`} />
                  </button>
                </div>
              )}

              {/* Цуцлах шалтгаан & банкны мэдээлэл */}
              {viewBooking.status === "cancelled" && (viewBooking.cancel_reason || viewBooking.refund_bank_name) && (
                <div className={`mt-4 rounded-xl p-4 ${dark ? "bg-white/5 border border-white/10" : "bg-zinc-50 border border-zinc-100"}`}>
                  <p className={`mb-2 text-xs font-semibold ${dark ? "text-white/60" : "text-zinc-500"}`}>Цуцлалтын мэдээлэл</p>
                  {viewBooking.cancel_reason && (
                    <div className="mb-2">
                      <p className={`text-[10px] ${dark ? "text-white/40" : "text-zinc-400"}`}>Шалтгаан</p>
                      <p className={`text-sm ${dark ? "text-white/80" : "text-zinc-700"}`}>{viewBooking.cancel_reason}</p>
                    </div>
                  )}
                  {viewBooking.refund_bank_name && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className={`text-[10px] ${dark ? "text-white/40" : "text-zinc-400"}`}>Банк</p>
                        <p className={`text-sm font-medium ${dark ? "text-white/80" : "text-zinc-700"}`}>{viewBooking.refund_bank_name}</p>
                      </div>
                      <div>
                        <p className={`text-[10px] ${dark ? "text-white/40" : "text-zinc-400"}`}>Данс эзэмшигч</p>
                        <p className={`text-sm font-medium ${dark ? "text-white/80" : "text-zinc-700"}`}>{viewBooking.refund_account_holder}</p>
                      </div>
                      <div>
                        <p className={`text-[10px] ${dark ? "text-white/40" : "text-zinc-400"}`}>Дансны дугаар</p>
                        <p className={`text-sm font-medium ${dark ? "text-white/80" : "text-zinc-700"}`}>{viewBooking.refund_account_number}</p>
                      </div>
                      {viewBooking.refund_iban && (
                        <div>
                          <p className={`text-[10px] ${dark ? "text-white/40" : "text-zinc-400"}`}>IBAN</p>
                          <p className={`text-sm font-medium ${dark ? "text-white/80" : "text-zinc-700"}`}>{viewBooking.refund_iban}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Cancel info */}
              {!isSessionOver(viewBooking) && viewBooking.status === "normal" && !canCancel(viewBooking) && (
                <div className={`mt-4 flex items-center gap-2 rounded-xl px-4 py-3 ${dark ? "bg-red-500/10 border border-red-500/20" : "bg-red-50 border border-red-100"}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0 text-red-500">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p className="text-xs text-red-500">24 цаг өнгөрсөн тул цуцлах боломжгүй</p>
                </div>
              )}
              {!isSessionOver(viewBooking) && viewBooking.status === "normal" && canCancel(viewBooking) && (
                <div className={`mt-4 flex items-center gap-2 rounded-xl px-4 py-3 ${dark ? "bg-amber-500/10 border border-amber-500/20" : "bg-amber-50 border border-amber-100"}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0 text-amber-500">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                  <p className="text-xs text-amber-500">Цуцлах боломжтой: {getCancelTimeLeft(viewBooking)}</p>
                </div>
              )}

              {/* Actions */}
              {!isSessionOver(viewBooking) && viewBooking.status === "normal" && (
                <div className="mt-4 flex gap-2">
                  <button onClick={() => { setViewBooking(null); setEditing(false); }} className="flex-1 rounded-xl bg-purple-600 py-2.5 text-sm font-medium text-white hover:bg-purple-700">
                    Хаах
                  </button>
                  {canCancel(viewBooking) && (
                    <button onClick={() => cancelBooking(viewBooking.id)} className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700">
                      Цуцлах
                    </button>
                  )}
                </div>
              )}
              {!isSessionOver(viewBooking) && viewBooking.status === "cancelled" && (
                <div className="mt-4">
                  <button onClick={() => restoreBooking(viewBooking.id)} className={`w-full rounded-xl py-2.5 text-sm font-medium ${dark ? "bg-white/10 text-white hover:bg-white/15" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                    Сэргээх
                  </button>
                </div>
              )}
              {isSessionOver(viewBooking) && viewBooking.status === "normal" && (
                <div className={`mt-4 flex items-center gap-2 rounded-xl px-4 py-3 ${dark ? "bg-blue-500/10 border border-blue-500/20" : "bg-blue-50 border border-blue-100"}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0 text-blue-500">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <p className="text-xs text-blue-500">Зөвлөгөө амжилттай өгөгдсөн</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Card List */}
      <div className="flex flex-col gap-2 sm:hidden">
        {loading ? (
          <p className={`py-12 text-center text-xs ${dark ? "text-white/30" : "text-gray-400"}`}>Уншиж байна...</p>
        ) : filtered.length === 0 ? (
          <p className={`py-12 text-center text-xs ${dark ? "text-white/30" : "text-gray-400"}`}>Захиалга олдсонгүй</p>
        ) : (
          filtered.map((b) => {
            const sl = statusLabel(b);
            return (
              <button
                key={b.id}
                onClick={() => setViewBooking(b)}
                className={`rounded-xl p-3 text-left transition-colors ${dark ? "bg-white/5 hover:bg-white/10" : "bg-white shadow-sm hover:bg-gray-50"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-medium ${dark ? "text-purple-400" : "text-purple-600"}`}>{b.client_name}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${sl.bg} ${sl.text}`}>{sl.label}</span>
                </div>
                <div className={`mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] ${dark ? "text-white/30" : "text-gray-400"}`}>
                  <span>{b.date} {b.time}</span>
                  <span>{b.type === "online" ? "Онлайн" : "Биечлэн"}</span>
                  <span>{b.price.toLocaleString()}₮</span>
                </div>
                <div className={`mt-1 text-[10px] ${dark ? "text-white/20" : "text-gray-300"}`}>{b.counselor_name}</div>
              </button>
            );
          })
        )}
      </div>

      {/* Desktop Table */}
      <div className={`hidden overflow-x-auto overflow-hidden rounded-2xl border sm:block ${borderCls} ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}>
        {loading ? (
          <div className="py-12 text-center">
            <p className={`text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>Уншиж байна...</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className={`sticky top-0 z-10 border-b ${borderCls} ${thBg}`}>
              <tr>
                <th className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider ${thText}`}>Нэр</th>
                <th className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider ${thText}`}>Утас</th>
                <th className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider ${thText}`}>Төрөл</th>
                <th className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider ${thText}`}>Огноо / Цаг</th>
                <th className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider ${thText}`}>Зөвлөгч</th>
                <th className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider ${thText}`}>Төлбөр</th>
                <th className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider ${thText}`}>Буцаалт</th>
                <th className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider ${thText}`}>Цуцлалт</th>
                <th className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider ${thText}`}>Төлөв</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => {
                const ci = cancelInfo(b);
                const sl = statusLabel(b);
                const stripe = !dark && i % 2 === 1 ? "bg-gray-50/50" : "";
                return (
                  <tr key={b.id} className={`cursor-pointer border-b ${dark ? "border-white/5" : "border-gray-100"} ${stripe} ${rowHover}`} onClick={() => setViewBooking(b)}>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); openClient(b.client_id); }}
                        className={`text-sm font-medium hover:underline ${dark ? "text-purple-400" : "text-purple-600"}`}
                      >
                        {b.client_name}
                      </button>
                      <p className={`text-[11px] ${tdSub}`}>{b.client_email}</p>
                    </td>
                    <td className={`px-4 py-3.5 text-xs ${tdSub}`}>{b.client_phone ?? "—"}</td>
                    <td className="px-4 py-3.5">
                      {b.type === "online" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-1 text-[10px] font-semibold text-green-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Онлайн
                        </span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 px-2.5 py-1 text-[10px] font-semibold text-purple-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" /> Биечлэн
                          </span>
                          {b.beverage_preference && (
                            <span className={`inline-flex items-center gap-1 text-[10px] ${dark ? "text-white/30" : "text-gray-400"}`}>☕ {BEVERAGE_LABELS[b.beverage_preference]}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className={`px-4 py-3.5 ${tdText}`}>
                      <p className="text-sm font-medium">{b.date}</p>
                      <p className={`text-[11px] ${tdSub}`}>{b.time?.slice(0, 5)} · {b.duration_minutes} мин</p>
                    </td>
                    <td className={`px-4 py-3.5 text-sm ${tdText}`}>{b.counselor_name}</td>
                    <td className="px-4 py-3.5">
                      <p className={`text-sm font-semibold ${tdText}`}>{b.price.toLocaleString()}₮</p>
                      <p className="text-[10px] font-semibold text-emerald-500">Төлсөн</p>
                    </td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      {b.status === "cancelled" ? (
                        <button
                          onClick={() => toggleRefund(b.id)}
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                            b.refunded_at
                              ? "bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25"
                              : "bg-red-500/15 text-red-500 hover:bg-red-500/25"
                          }`}
                        >
                          {b.refunded_at ? "Тийм" : "Үгүй"}
                        </button>
                      ) : (
                        <span className={`text-[10px] ${dark ? "text-white/20" : "text-gray-300"}`}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${ci.bg} ${ci.text}`}>
                        {ci.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${sl.bg} ${sl.text}`}>
                        {sl.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className={`text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>Захиалга олдсонгүй</p>
          </div>
        )}
      </div>

      {selectedUserId && <ClientModal userId={selectedUserId} onClose={closeClient} />}
    </div>
  );
}
