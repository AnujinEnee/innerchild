"use client";

import { useEffect, useState } from "react";
import { useTheme } from "../ThemeContext";
import { createClient } from "@/lib/supabase/client";

interface SalaryRecord {
  id: string;
  month: number;
  year: number;
  paid: boolean;
  paid_at: string | null;
}

const MONTH_NAMES = ["1-р сар", "2-р сар", "3-р сар", "4-р сар", "5-р сар", "6-р сар", "7-р сар", "8-р сар", "9-р сар", "10-р сар", "11-р сар", "12-р сар"];

export default function TeamUserSalaryPage() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState<{ date: string; price: number; status: string }[]>([]);

  useEffect(() => {
    async function fetch() {
      const teamUserId = localStorage.getItem("team_user_id");
      if (!teamUserId) { setLoading(false); return; }
      const supabase = createClient();
      const [{ data }, { data: consults }] = await Promise.all([
        supabase.from("salary_records").select("id, month, year, paid, paid_at").eq("team_member_id", teamUserId).order("year", { ascending: false }).order("month", { ascending: false }),
        supabase.from("consultations").select("date, price, status").eq("counselor_id", teamUserId),
      ]);
      setRecords(data ?? []);
      setConsultations((consults ?? []) as { date: string; price: number; status: string }[]);
      setLoading(false);
    }
    fetch();
  }, []);

  function consultIncome(year: number, month: number) {
    return consultations
      .filter((c) => {
        if (c.status === "cancelled") return false;
        const d = new Date(c.date);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      })
      .reduce((sum, c) => sum + (c.price ?? 0), 0);
  }

  // Current month stats
  const now = new Date();
  const currentIncome = consultIncome(now.getFullYear(), now.getMonth() + 1);
  const currentSalary = Math.round(currentIncome * 0.5);

  const borderCls = dark ? "border-white/5" : "border-gray-200";

  return (
    <div>
      <h1 className={`mb-6 text-2xl font-bold ${dark ? "text-white" : "text-gray-900"}`}>Миний цалин</h1>

      {/* Current month */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className={`relative overflow-hidden rounded-2xl p-5 ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}>
          <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 opacity-20 blur-xl" />
          <p className={`text-xs font-medium ${dark ? "text-white/40" : "text-gray-500"}`}>Энэ сарын нийт орлого</p>
          <p className={`mt-2 text-2xl font-bold text-blue-500`}>{currentIncome.toLocaleString()}₮</p>
        </div>
        <div className={`relative overflow-hidden rounded-2xl p-5 ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}>
          <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-linear-to-br from-emerald-500 to-teal-600 opacity-20 blur-xl" />
          <p className={`text-xs font-medium ${dark ? "text-white/40" : "text-gray-500"}`}>Таны цалин (50%)</p>
          <p className="mt-2 text-2xl font-bold text-emerald-500">{currentSalary.toLocaleString()}₮</p>
        </div>
      </div>

      {/* History */}
      <div className={`overflow-hidden rounded-2xl border ${borderCls} ${dark ? "bg-white/5" : "bg-white"}`}>
        <div className="px-6 py-4">
          <h3 className={`text-sm font-semibold ${dark ? "text-white/60" : "text-gray-700"}`}>Цалингийн түүх</h3>
        </div>
        {loading ? (
          <p className={`py-12 text-center text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>Уншиж байна...</p>
        ) : records.length === 0 ? (
          <p className={`py-12 text-center text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>Цалингийн мэдээлэл байхгүй байна</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className={`border-y ${borderCls} ${dark ? "bg-white/5" : "bg-gray-50"}`}>
              <tr>
                <th className={`px-6 py-3 text-[11px] font-semibold uppercase tracking-wider ${dark ? "text-white/40" : "text-gray-500"}`}>Сар</th>
                <th className={`px-6 py-3 text-[11px] font-semibold uppercase tracking-wider ${dark ? "text-white/40" : "text-gray-500"}`}>Нийт орлого</th>
                <th className={`px-6 py-3 text-[11px] font-semibold uppercase tracking-wider ${dark ? "text-white/40" : "text-gray-500"}`}>Таны цалин</th>
                <th className={`px-6 py-3 text-[11px] font-semibold uppercase tracking-wider ${dark ? "text-white/40" : "text-gray-500"}`}>Төлөв</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${dark ? "divide-white/5" : "divide-gray-100"}`}>
              {records.map((r) => {
                const ci = consultIncome(r.year, r.month);
                const salary = Math.round(ci * 0.5);
                return (
                  <tr key={r.id} className={dark ? "hover:bg-white/5" : "hover:bg-gray-50"}>
                    <td className={`px-6 py-3.5 font-medium ${dark ? "text-white" : "text-gray-900"}`}>{r.year} {MONTH_NAMES[r.month - 1]}</td>
                    <td className="px-6 py-3.5 font-semibold text-blue-500">{ci.toLocaleString()}₮</td>
                    <td className="px-6 py-3.5 font-bold text-emerald-500">{salary.toLocaleString()}₮</td>
                    <td className="px-6 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        r.paid
                          ? dark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-100 text-emerald-700"
                          : dark ? "bg-yellow-500/15 text-yellow-400" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {r.paid ? `Олгосон${r.paid_at ? ` · ${new Date(r.paid_at).toLocaleDateString("mn-MN")}` : ""}` : "Хүлээгдэж буй"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
