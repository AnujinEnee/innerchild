"use client";

import { useEffect, useState } from "react";
import { useTheme } from "../ThemeContext";
import { createClient } from "@/lib/supabase/client";

interface SalaryRecord {
  id: string;
  team_member_id: string;
  year: number;
  month: number;
  base_salary: number;
  bonus: number;
  consultation_income: number;
  deductions: number;
  paid: boolean;
  paid_at: string | null;
  note: string | null;
}

interface ConsultationRow {
  counselor_id: string;
  date: string;
  price: number;
  status: string;
}

interface Counselor {
  id: string;
  name: string;
  role: string;
  bank_account: string | null;
  records: SalaryRecord[];
}

const MONTH_NAMES = [
  "1-р сар", "2-р сар", "3-р сар", "4-р сар", "5-р сар", "6-р сар",
  "7-р сар", "8-р сар", "9-р сар", "10-р сар", "11-р сар", "12-р сар",
];

const ROLE_LABELS: Record<string, string> = {
  psychologist: "Сэтгэл зүйч",
  therapist: "Сэтгэл засалч",
};

function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function parseMonthKey(key: string): { year: number; month: number } {
  const [y, m] = key.split("-");
  return { year: parseInt(y), month: parseInt(m) };
}

export default function SalaryPage() {
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [allConsultations, setAllConsultations] = useState<ConsultationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCounselor, setIsCounselor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    monthKey(now.getFullYear(), now.getMonth() + 1)
  );
  const [editing, setEditing] = useState(false);
  const [editPercent, setEditPercent] = useState(50);

  async function fetchAll() {
    const role = localStorage.getItem("admin_role");
    const counselorId = localStorage.getItem("admin_counselor_id") ?? "";
    const myIsCounselor = role === "counselor" && !!counselorId;
    setIsCounselor(myIsCounselor);

    const supabase = createClient();
    const [{ data: members }, { data: records }, { data: consults }] = await Promise.all([
      supabase.from("team_members").select("id, last_name, first_name, role, bank_account").order("created_at"),
      supabase.from("salary_records").select("*").order("year").order("month"),
      supabase.from("consultations").select("counselor_id, date, price, status"),
    ]);

    setAllConsultations((consults ?? []) as ConsultationRow[]);

    let cs: Counselor[] = (members ?? []).map((m) => ({
      id: m.id,
      name: `${m.last_name} ${m.first_name}`.trim(),
      role: ROLE_LABELS[m.role] ?? m.role,
      bank_account: m.bank_account,
      records: (records ?? []).filter((r) => r.team_member_id === m.id),
    }));

    if (myIsCounselor) cs = cs.filter((c) => c.id === counselorId);

    setCounselors(cs);
    setSelectedId(cs[0]?.id ?? null);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
  }, []);

  function calcConsultationIncome(counselorId: string, year: number, month: number): number {
    if (!counselorId) return 0;
    const matched = allConsultations.filter((c) => {
      if (!c.counselor_id || c.counselor_id !== counselorId) return false;
      if (c.status === "cancelled") return false;
      const d = new Date(c.date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
    return matched.reduce((sum, c) => sum + (c.price ?? 0), 0);
  }

  const selected = counselors.find((c) => c.id === selectedId) ?? counselors[0];
  const { year: selYear, month: selMonth } = parseMonthKey(selectedMonth);
  const monthRecord = selected?.records.find(
    (r) => r.year === selYear && r.month === selMonth
  );

  // Бодит зөвлөгөөний орлого — consultations table-аас тооцоолно
  const realConsultIncome = selected ? calcConsultationIncome(selected.id, selYear, selMonth) : 0;
  // Цалин = нийт зөвлөгөөний орлогын хувиар
  const salaryPercent = 50;
  const salaryFromConsult = Math.round(realConsultIncome * (salaryPercent / 100));

  const totalSalary = salaryFromConsult;

  function startEdit() {
    setEditPercent(salaryPercent);
    setEditing(true);
  }

  async function saveEdit() {
    if (!selected) return;
    setSaving(true);
    const supabase = createClient();
    const currentConsultIncome = calcConsultationIncome(selected.id, selYear, selMonth);
    const payload = {
      team_member_id: selected.id,
      year: selYear,
      month: selMonth,
      base_salary: 0,
      bonus: editPercent,
      consultation_income: currentConsultIncome,
      deductions: 0,
      note: null,
    };

    if (monthRecord) {
      const { data, error } = await supabase.from("salary_records").update(payload).eq("id", monthRecord.id).select("id");
      if (error) { alert(`Алдаа: ${error.message}`); setSaving(false); return; }
      if (!data?.length) { alert("Өөрчлөлт хадгалагдсангүй. Supabase RLS эрхийг шалгана уу."); setSaving(false); return; }
      setCounselors((prev) =>
        prev.map((c) =>
          c.id === selected.id
            ? {
                ...c,
                records: c.records.map((r) =>
                  r.id === monthRecord.id ? { ...r, ...payload } : r
                ),
              }
            : c
        )
      );
    } else {
      const { data, error } = await supabase.from("salary_records").insert(payload).select().single();
      if (error) { alert(`Алдаа: ${error.message}`); setSaving(false); return; }
      if (data) {
        setCounselors((prev) =>
          prev.map((c) =>
            c.id === selected.id ? { ...c, records: [...c.records, data] } : c
          )
        );
      }
    }
    setSaving(false);
    setEditing(false);
  }

  async function togglePaid() {
    if (!monthRecord || !selected) return;
    const supabase = createClient();
    const newPaid = !monthRecord.paid;
    const newPaidAt = newPaid ? new Date().toISOString() : null;
    const { data, error } = await supabase.from("salary_records").update({ paid: newPaid, paid_at: newPaidAt }).eq("id", monthRecord.id).select("id");
    if (error) { alert(`Алдаа: ${error.message}`); return; }
    if (!data?.length) { alert("Өөрчлөлт хадгалагдсангүй. Supabase RLS эрхийг шалгана уу."); return; }
    setCounselors((prev) =>
      prev.map((c) =>
        c.id === selected.id
          ? {
              ...c,
              records: c.records.map((r) =>
                r.id === monthRecord.id ? { ...r, paid: newPaid, paid_at: newPaidAt } : r
              ),
            }
          : c
      )
    );
  }

  // Generate month list: all months from records + current month
  const allMonths = (() => {
    const set = new Set<string>();
    set.add(monthKey(now.getFullYear(), now.getMonth() + 1));
    counselors.forEach((c) =>
      c.records.forEach((r) => set.add(monthKey(r.year, r.month)))
    );
    return [...set].sort();
  })();

  const prevMonth = () => {
    const idx = allMonths.indexOf(selectedMonth);
    if (idx > 0) setSelectedMonth(allMonths[idx - 1]);
    else {
      // Go one month before
      const { year, month } = parseMonthKey(selectedMonth);
      if (month === 1) setSelectedMonth(monthKey(year - 1, 12));
      else setSelectedMonth(monthKey(year, month - 1));
    }
  };

  const nextMonth = () => {
    const idx = allMonths.indexOf(selectedMonth);
    if (idx < allMonths.length - 1) setSelectedMonth(allMonths[idx + 1]);
  };

  // Summary stats — зөвлөгөөний орлогын 50%
  const totalAllSalary = counselors.reduce((s, c) => {
    const ci = calcConsultationIncome(c.id, selYear, selMonth);
    return s + Math.round(ci * 0.5);
  }, 0);
  const totalPaid = counselors.reduce((s, c) => {
    const r = c.records.find((x) => x.year === selYear && x.month === selMonth);
    const ci = calcConsultationIncome(c.id, selYear, selMonth);
    return s + (r && r.paid ? Math.round(ci * 0.5) : 0);
  }, 0);

  const inputCls = dark
    ? "bg-white/10 text-white placeholder:text-white/30 focus:bg-white/15"
    : "border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-purple-500";

  if (loading) {
    return (
      <div className="py-20 text-center">
        <p className={`text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>Уншиж байна...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className={`text-xl font-bold sm:text-2xl ${dark ? "text-white" : "text-gray-900"}`}>Цалин</h1>
        {/* Month selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${dark ? "hover:bg-white/10 text-white/50" : "hover:bg-gray-100 text-gray-500"}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <span className={`min-w-30 text-center text-xs font-semibold sm:text-sm ${dark ? "text-white" : "text-gray-900"}`}>
            {selYear} {MONTH_NAMES[selMonth - 1]}
          </span>
          <button
            onClick={nextMonth}
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${dark ? "hover:bg-white/10 text-white/50" : "hover:bg-gray-100 text-gray-500"}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
      </div>

      {/* Stats — admin only */}
      {!isCounselor && (() => {
        const totalConsultIncome = counselors.reduce((s, c) => s + calcConsultationIncome(c.id, selYear, selMonth), 0);
        return <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:grid-cols-4 sm:gap-4">
        {[
          { label: "Нийт орлого", value: `${totalConsultIncome.toLocaleString()}₮`, color: "from-blue-500 to-indigo-600" },
          { label: "Нийт цалин (50%)", value: `${totalAllSalary.toLocaleString()}₮`, color: "from-purple-500 to-indigo-600" },
          { label: "Олгосон", value: `${totalPaid.toLocaleString()}₮`, color: "from-emerald-500 to-teal-600" },
          { label: "Олгоогүй", value: `${(totalAllSalary - totalPaid).toLocaleString()}₮`, color: "from-amber-500 to-orange-500" },
        ].map((s) => (
          <div key={s.label} className={`relative overflow-hidden rounded-xl p-3 sm:rounded-2xl sm:p-5 ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}>
            <div className={`absolute -right-3 -top-3 h-12 w-12 rounded-full bg-linear-to-br ${s.color} opacity-20 blur-xl sm:h-16 sm:w-16`} />
            <p className={`text-[10px] font-medium sm:text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>{s.label}</p>
            <p className={`mt-1 text-lg font-bold sm:mt-2 sm:text-2xl ${dark ? "text-white" : "text-gray-900"}`}>{s.value}</p>
          </div>
        ))}
      </div>;
      })()}

      {/* Counselor tabs */}
      <div className="mb-4 flex gap-2 overflow-x-auto sm:mb-6">
        {counselors.map((c) => {
          const r = c.records.find((x) => x.year === selYear && x.month === selMonth);
          return (
            <button
              key={c.id}
              onClick={() => { setSelectedId(c.id); setEditing(false); }}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 transition-all sm:gap-3 sm:rounded-2xl sm:px-5 sm:py-4 ${
                selectedId === c.id
                  ? dark ? "bg-purple-500/20 border border-purple-500/30" : "bg-purple-50 border border-purple-200"
                  : dark ? "bg-white/5 hover:bg-white/8" : "bg-white shadow-sm hover:shadow-md"
              }`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-purple-500/30 to-pink-500/30 sm:h-10 sm:w-10">
                <span className={`text-xs font-bold sm:text-sm ${dark ? "text-white" : "text-purple-700"}`}>{c.name.charAt(0)}</span>
              </div>
              <div className="text-left">
                <p className={`text-xs font-semibold sm:text-sm ${dark ? "text-white" : "text-gray-900"}`}>{c.name}</p>
                <p className={`text-[9px] sm:text-[10px] ${dark ? "text-white/40" : "text-gray-400"}`}>
                  {c.role} · {r ? (r.paid ? "Олгосон" : "Олгоогүй") : "Мэдээлэл байхгүй"}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className={`rounded-xl sm:rounded-2xl ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}>
          {/* Header */}
          <div className={`flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5 ${dark ? "border-b border-white/5" : "border-b border-gray-100"}`}>
            <div>
              <h2 className={`text-base font-bold sm:text-lg ${dark ? "text-white" : "text-gray-900"}`}>{selected.name}</h2>
              <p className={`text-[10px] sm:text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>{selected.role} · Данс: {selected.bank_account ?? "—"}</p>
            </div>
            <div className="flex gap-2">
              {!editing && !isCounselor && (
                <button onClick={startEdit} className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-medium text-white hover:bg-purple-700">
                  {monthRecord ? "Засах" : "Нэмэх"}
                </button>
              )}
            </div>
          </div>

          {/* Edit form — only percent */}
          {editing && (
            <div className="px-4 py-4 sm:px-6 sm:py-5">
              <div className="max-w-xs">
                <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Цалингийн хувь (%)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editPercent}
                    onChange={(e) => setEditPercent(Number(e.target.value))}
                    className={`w-24 rounded-xl px-4 py-2.5 text-lg font-bold text-center outline-none ${inputCls}`}
                  />
                  <span className={`text-lg font-bold ${dark ? "text-white/50" : "text-gray-400"}`}>%</span>
                </div>
                <p className={`mt-2 text-xs ${dark ? "text-white/30" : "text-gray-400"}`}>
                  Зөвлөгөөний орлого: {realConsultIncome.toLocaleString()}₮ × {editPercent}% = <span className="font-semibold text-emerald-500">{Math.round(realConsultIncome * (editPercent / 100)).toLocaleString()}₮</span>
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={saveEdit} disabled={saving} className="rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50">
                  {saving ? "Хадгалж байна..." : "Хадгалах"}
                </button>
                <button onClick={() => setEditing(false)} className={`rounded-xl px-5 py-2.5 text-xs font-medium ${dark ? "text-white/50 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"}`}>Болих</button>
              </div>
            </div>
          )}

          {/* Salary breakdown */}
          {!editing && monthRecord && (
            <div className="px-4 py-4 sm:px-6 sm:py-5">
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-xl p-4 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                  <p className={`text-[10px] font-medium ${dark ? "text-white/40" : "text-gray-400"}`}>Зөвлөгөөний нийт орлого</p>
                  <p className="mt-1 text-sm font-bold text-blue-500 sm:text-lg">{realConsultIncome.toLocaleString()}₮</p>
                </div>
                <div className={`rounded-xl p-4 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                  <p className={`text-[10px] font-medium ${dark ? "text-white/40" : "text-gray-400"}`}>Таны цалин ({salaryPercent}%)</p>
                  <p className="mt-1 text-sm font-bold text-emerald-500 sm:text-lg">{salaryFromConsult.toLocaleString()}₮</p>
                </div>
              </div>

              {/* Total */}
              <div className={`mt-3 flex flex-col gap-3 rounded-xl p-4 sm:mt-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 ${dark ? "bg-linear-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20" : "bg-purple-50 border border-purple-100"}`}>
                <div>
                  <p className={`text-[10px] font-medium sm:text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>Нийт цалин</p>
                  <p className={`mt-1 text-xl font-bold sm:text-2xl ${dark ? "text-white" : "text-gray-900"}`}>{totalSalary.toLocaleString()}₮</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className={`rounded-full px-2 py-1 text-[10px] font-semibold sm:px-3 sm:py-1.5 sm:text-xs ${monthRecord.paid ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500"}`}>
                    {monthRecord.paid
                      ? `Олгосон${monthRecord.paid_at ? ` · ${new Date(monthRecord.paid_at).toLocaleDateString("mn-MN")}` : ""}`
                      : "Олгоогүй"}
                  </span>
                  {!isCounselor && (
                    monthRecord.paid ? (
                      <button
                        onClick={togglePaid}
                        className="rounded-lg px-3 py-1.5 text-[10px] font-medium text-white bg-amber-600 hover:bg-amber-700 sm:rounded-xl sm:px-4 sm:py-2 sm:text-xs"
                      >
                        Буцаах
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowPayModal(true)}
                        className="rounded-lg px-3 py-1.5 text-[10px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 sm:rounded-xl sm:px-4 sm:py-2 sm:text-xs"
                      >
                        Олгох
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {!editing && !monthRecord && (
            <div className="px-4 py-6 sm:px-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className={`rounded-xl p-4 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                  <p className={`text-[10px] font-medium ${dark ? "text-white/40" : "text-gray-400"}`}>Зөвлөгөөний нийт орлого</p>
                  <p className="mt-1 text-sm font-bold text-blue-500 sm:text-lg">{realConsultIncome.toLocaleString()}₮</p>
                </div>
                <div className={`rounded-xl p-4 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                  <p className={`text-[10px] font-medium ${dark ? "text-white/40" : "text-gray-400"}`}>Таны цалин ({salaryPercent}%)</p>
                  <p className="mt-1 text-sm font-bold text-emerald-500 sm:text-lg">{salaryFromConsult.toLocaleString()}₮</p>
                </div>
              </div>
            </div>
          )}

          {/* History table */}
          {!editing && (
            <div className={`${dark ? "border-t border-white/5" : "border-t border-gray-100"}`}>
              <div className="px-4 py-3 sm:px-6 sm:py-4">
                <h3 className={`text-xs font-semibold sm:text-sm ${dark ? "text-white/60" : "text-gray-700"}`}>Цалингийн түүх</h3>
              </div>

              {/* Mobile history cards */}
              <div className="flex flex-col gap-2 px-4 pb-4 sm:hidden">
                {selected.records
                  .slice()
                  .sort((a, b) => b.year - a.year || b.month - a.month)
                  .map((r) => {
                    const ci = calcConsultationIncome(selected.id, r.year, r.month);
                    const salary = Math.round(ci * 0.5);
                    const isSelected = r.year === selYear && r.month === selMonth;
                    return (
                      <button
                        key={r.id}
                        onClick={() => setSelectedMonth(monthKey(r.year, r.month))}
                        className={`rounded-xl p-3 text-left transition-colors ${isSelected ? (dark ? "bg-purple-500/15 border border-purple-500/30" : "bg-purple-50 border border-purple-200") : (dark ? "bg-white/5 hover:bg-white/10" : "bg-gray-50 hover:bg-gray-100")}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-semibold ${dark ? "text-white" : "text-gray-900"}`}>{r.year} {MONTH_NAMES[r.month - 1]}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${r.paid ? (dark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-100 text-emerald-700") : (dark ? "bg-red-500/15 text-red-400" : "bg-red-100 text-red-700")}`}>
                            {r.paid ? "Олгосон" : "Олгоогүй"}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-3">
                          <span className="text-xs text-blue-500">Орлого: {ci.toLocaleString()}₮</span>
                          <span className="text-sm font-bold text-emerald-500">{salary.toLocaleString()}₮</span>
                        </div>
                      </button>
                    );
                  })}
              </div>

              {/* Desktop history table */}
              <table className="hidden w-full text-left text-sm sm:table">
                <thead className={dark ? "bg-white/5" : "bg-gray-50"}>
                  <tr>
                    <th className={`px-6 py-3 text-[11px] font-semibold uppercase tracking-wider ${dark ? "text-white/40" : "text-gray-500"}`}>Сар</th>
                    <th className={`px-6 py-3 text-[11px] font-semibold uppercase tracking-wider ${dark ? "text-white/40" : "text-gray-500"}`}>Нийт орлого</th>
                    <th className={`px-6 py-3 text-[11px] font-semibold uppercase tracking-wider ${dark ? "text-white/40" : "text-gray-500"}`}>Таны цалин</th>
                    <th className={`px-6 py-3 text-[11px] font-semibold uppercase tracking-wider ${dark ? "text-white/40" : "text-gray-500"}`}>Төлөв</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${dark ? "divide-white/5" : "divide-gray-100"}`}>
                  {selected.records
                    .slice()
                    .sort((a, b) => b.year - a.year || b.month - a.month)
                    .map((r) => {
                      const ci = calcConsultationIncome(selected.id, r.year, r.month);
                      const salary = Math.round(ci * 0.5);
                      const isSelected = r.year === selYear && r.month === selMonth;
                      return (
                        <tr
                          key={r.id}
                          onClick={() => setSelectedMonth(monthKey(r.year, r.month))}
                          className={`cursor-pointer ${isSelected ? (dark ? "bg-purple-500/10" : "bg-purple-50") : (dark ? "hover:bg-white/5" : "hover:bg-gray-50")}`}
                        >
                          <td className={`px-6 py-3.5 font-medium ${dark ? "text-white" : "text-gray-900"}`}>
                            {r.year} {MONTH_NAMES[r.month - 1]}
                          </td>
                          <td className="px-6 py-3.5 text-blue-500 font-semibold">{ci.toLocaleString()}₮</td>
                          <td className="px-6 py-3.5 text-emerald-500 font-bold">{salary.toLocaleString()}₮</td>
                          <td className="px-6 py-3.5">
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${r.paid ? (dark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-100 text-emerald-700") : (dark ? "bg-red-500/15 text-red-400" : "bg-red-100 text-red-700")}`}>
                              {r.paid ? "Олгосон" : "Олгоогүй"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {/* Pay modal */}
      {showPayModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`w-full max-w-sm rounded-2xl p-6 ${dark ? "bg-[#1e1e36]" : "bg-white"}`}>
            <h3 className={`mb-4 text-lg font-bold ${dark ? "text-white" : "text-gray-900"}`}>Цалин шилжүүлэх</h3>

            <div className={`mb-4 rounded-xl p-4 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
              <p className={`text-xs font-medium ${dark ? "text-white/40" : "text-gray-400"}`}>Хүлээн авагч</p>
              <p className={`mt-1 text-sm font-bold ${dark ? "text-white" : "text-gray-900"}`}>{selected.name}</p>
            </div>

            <div className={`mb-4 rounded-xl p-4 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
              <p className={`text-xs font-medium ${dark ? "text-white/40" : "text-gray-400"}`}>Банкны данс</p>
              <p className={`mt-1 text-sm font-bold ${dark ? "text-white" : "text-gray-900"}`}>{selected.bank_account || "Бүртгэгдээгүй"}</p>
            </div>

            <div className={`mb-6 rounded-xl p-4 ${dark ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-emerald-50 border border-emerald-100"}`}>
              <p className={`text-xs font-medium ${dark ? "text-emerald-400/60" : "text-emerald-600"}`}>Шилжүүлэх дүн</p>
              <p className="mt-1 text-2xl font-bold text-emerald-500">{totalSalary.toLocaleString()}₮</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { togglePaid(); setShowPayModal(false); }}
                className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Олгосон гэж тэмдэглэх
              </button>
              <button
                onClick={() => setShowPayModal(false)}
                className={`rounded-xl px-4 py-3 text-sm font-medium ${dark ? "text-white/50 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"}`}
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
