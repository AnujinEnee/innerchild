"use client";

import { useEffect, useState } from "react";
import { useTheme } from "../ThemeContext";
import { createClient } from "@/lib/supabase/client";
import ClientModal, { useClientModal } from "../ClientModal";

interface User {
  id: string;
  last_name: string;
  first_name: string;
  email: string;
  phone: string | null;
  age: number | null;
  profession: string | null;
  bank_account: string | null;
  registered_at: string;
  has_consultation: boolean;
  has_test: boolean;
}

type Category = "Бүгд" | "Зөвлөгөө авсан" | "Тест өгсөн" | "Идэвхгүй";

export default function UsersPage() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category>("Бүгд");
  const [searchName, setSearchName] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchBank, setSearchBank] = useState("");
  const { selectedUserId, openClient, closeClient } = useClientModal();

  async function fetchUsers() {
    const role = localStorage.getItem("admin_role");
    const counselorId = localStorage.getItem("admin_counselor_id") ?? "";
    const isCounselor = role === "counselor" && !!counselorId;

    const supabase = createClient();

    let clientIds: string[] | null = null;
    if (isCounselor) {
      const { data: myConsults } = await supabase
        .from("consultations")
        .select("client_id")
        .eq("counselor_id", counselorId);
      clientIds = [...new Set((myConsults ?? []).map((c: { client_id: string }) => c.client_id).filter(Boolean))] as string[];
      if (clientIds.length === 0) { setUsers([]); setLoading(false); return; }
    }

    const query = supabase
      .from("users")
      .select("id, last_name, first_name, email, phone, age, profession, bank_account, registered_at")
      .order("registered_at", { ascending: false });
    const { data: usersData } = clientIds
      ? await query.in("id", clientIds)
      : await query;

    if (!usersData) { setLoading(false); return; }

    const ids = usersData.map((u) => u.id);

    const [{ data: consultData }, { data: testData }] = await Promise.all([
      supabase.from("consultations").select("client_id").in("client_id", ids),
      supabase.from("test_results").select("client_id").in("client_id", ids),
    ]);

    const consultSet = new Set((consultData ?? []).map((c) => c.client_id));
    const testSet = new Set((testData ?? []).map((t) => t.client_id));

    setUsers(
      usersData.map((u) => ({
        ...u,
        has_consultation: consultSet.has(u.id),
        has_test: testSet.has(u.id),
      }))
    );
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, []);

  const filtered = users
    .filter((u) => {
      if (category === "Зөвлөгөө авсан") return u.has_consultation;
      if (category === "Тест өгсөн") return u.has_test;
      if (category === "Идэвхгүй") return !u.has_consultation && !u.has_test;
      return true;
    })
    .filter((u) => {
      const fullName = `${u.last_name} ${u.first_name}`.toLowerCase();
      if (searchName && !fullName.includes(searchName.toLowerCase())) return false;
      if (searchPhone && !(u.phone ?? "").includes(searchPhone)) return false;
      if (searchBank && !(u.bank_account ?? "").includes(searchBank)) return false;
      return true;
    });

  const counts = {
    "Бүгд": users.length,
    "Зөвлөгөө авсан": users.filter((u) => u.has_consultation).length,
    "Тест өгсөн": users.filter((u) => u.has_test).length,
    "Идэвхгүй": users.filter((u) => !u.has_consultation && !u.has_test).length,
  };

  const thBg = dark ? "bg-white/5" : "bg-gray-50";
  const thText = dark ? "text-white/40" : "text-gray-500";
  const tdSub = dark ? "text-white/40" : "text-gray-600";
  const rowHover = dark ? "hover:bg-white/5" : "hover:bg-gray-50";
  const borderCls = dark ? "border-white/5" : "border-gray-200";

  function categoryBadge(type: "consultation" | "test" | "inactive") {
    if (type === "consultation") return dark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-100 text-emerald-700";
    if (type === "test") return dark ? "bg-blue-500/15 text-blue-400" : "bg-blue-100 text-blue-700";
    return dark ? "bg-white/10 text-white/40" : "bg-gray-100 text-gray-500";
  }

  function BadgeList({ u }: { u: User }) {
    return (
      <div className="flex flex-wrap gap-1">
        {u.has_consultation && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${categoryBadge("consultation")}`}>Зөвлөгөө</span>
        )}
        {u.has_test && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${categoryBadge("test")}`}>Тест</span>
        )}
        {!u.has_consultation && !u.has_test && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${categoryBadge("inactive")}`}>Идэвхгүй</span>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between sm:mb-6">
        <h1 className={`text-xl font-bold sm:text-2xl ${dark ? "text-white" : "text-gray-900"}`}>Хэрэглэгчид</h1>
        <p className={`text-xs sm:text-sm ${dark ? "text-white/40" : "text-gray-500"}`}>Нийт: {users.length}</p>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:grid-cols-4 sm:gap-4">
        {([
          { label: "Нийт", value: counts["Бүгд"], color: "from-purple-500 to-indigo-600" },
          { label: "Зөвлөгөө", value: counts["Зөвлөгөө авсан"], color: "from-emerald-500 to-teal-600" },
          { label: "Тест", value: counts["Тест өгсөн"], color: "from-blue-500 to-cyan-600" },
          { label: "Идэвхгүй", value: counts["Идэвхгүй"], color: "from-gray-400 to-gray-500" },
        ]).map((s) => (
          <div key={s.label} className={`relative overflow-hidden rounded-xl p-3 sm:rounded-2xl sm:p-5 ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}>
            <div className={`absolute -right-3 -top-3 h-12 w-12 rounded-full bg-linear-to-br ${s.color} opacity-20 blur-xl sm:h-16 sm:w-16`} />
            <p className={`text-[10px] font-medium sm:text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>{s.label}</p>
            <p className={`mt-1 text-xl font-bold sm:mt-2 sm:text-2xl ${dark ? "text-white" : "text-gray-900"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Category Filters */}
      <div className="mb-3 flex gap-1.5 overflow-x-auto sm:mb-4 sm:gap-2">
        {(["Бүгд", "Зөвлөгөө авсан", "Тест өгсөн", "Идэвхгүй"] as Category[]).map((f) => (
          <button
            key={f}
            onClick={() => setCategory(f)}
            className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm ${
              category === f
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                : dark ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f}
            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold sm:text-[10px] ${category === f ? "bg-white/20" : dark ? "bg-white/10" : "bg-gray-200"}`}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className={`mb-4 grid grid-cols-1 gap-2 rounded-xl p-3 sm:grid-cols-3 sm:gap-3 sm:rounded-2xl sm:p-4 ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}>
        {[
          { value: searchName, setter: setSearchName, placeholder: "Нэрээр хайх...", type: "text" },
          { value: searchPhone, setter: setSearchPhone, placeholder: "Утасны дугаараар...", type: "tel" },
          { value: searchBank, setter: setSearchBank, placeholder: "Дансны дугаараар...", type: "tel" },
        ].map(({ value, setter, placeholder, type }) => (
          <div key={placeholder} className="relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 sm:h-4 sm:w-4 ${dark ? "text-white/30" : "text-gray-400"}`}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type={type}
              value={value}
              onChange={(e) => setter(e.target.value)}
              placeholder={placeholder}
              className={`w-full rounded-lg py-2 pl-9 pr-3 text-xs outline-none sm:rounded-xl sm:py-2.5 sm:pl-10 sm:pr-4 sm:text-sm ${dark ? "bg-white/10 text-white placeholder:text-white/30 focus:bg-white/15" : "border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-purple-500"}`}
            />
          </div>
        ))}
        {(searchName || searchPhone || searchBank) && (
          <button
            onClick={() => { setSearchName(""); setSearchPhone(""); setSearchBank(""); }}
            className={`rounded-lg px-3 py-2 text-xs font-medium sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm ${dark ? "text-white/50 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"}`}
          >
            Цэвэрлэх
          </button>
        )}
      </div>

      {/* Desktop Table */}
      <div className={`hidden overflow-hidden rounded-2xl border sm:block ${borderCls} ${dark ? "bg-white/5" : "bg-white"}`}>
        {loading ? (
          <div className="py-12 text-center">
            <p className={`text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>Уншиж байна...</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className={`border-b ${borderCls} ${thBg}`}>
              <tr>
                <th className={`px-6 py-3.5 text-xs font-semibold ${thText}`}>Нэр</th>
                <th className={`px-6 py-3.5 text-xs font-semibold ${thText}`}>И-мэйл</th>
                <th className={`px-6 py-3.5 text-xs font-semibold ${thText}`}>Утас</th>
                <th className={`px-6 py-3.5 text-xs font-semibold ${thText}`}>Мэргэжил</th>
                <th className={`px-6 py-3.5 text-xs font-semibold ${thText}`}>Ангилал</th>
                <th className={`px-6 py-3.5 text-xs font-semibold ${thText}`}>Бүртгүүлсэн</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${dark ? "divide-white/5" : "divide-gray-100"}`}>
              {filtered.map((u) => (
                <tr key={u.id} onClick={() => openClient(u.id)} className={`cursor-pointer ${rowHover}`}>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${dark ? "text-purple-400" : "text-purple-600"}`}>
                      {u.last_name} {u.first_name}
                    </span>
                  </td>
                  <td className={`px-6 py-4 ${tdSub}`}>{u.email}</td>
                  <td className={`px-6 py-4 ${tdSub}`}>{u.phone ?? "—"}</td>
                  <td className={`px-6 py-4 ${tdSub}`}>{u.profession ?? "—"}</td>
                  <td className="px-6 py-4"><BadgeList u={u} /></td>
                  <td className={`px-6 py-4 ${tdSub}`}>
                    {new Date(u.registered_at).toLocaleDateString("mn-MN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className={`text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>Хэрэглэгч олдсонгүй</p>
          </div>
        )}
      </div>

      {/* Mobile Card List */}
      <div className="flex flex-col gap-2 sm:hidden">
        {loading ? (
          <div className="py-12 text-center">
            <p className={`text-xs ${dark ? "text-white/30" : "text-gray-400"}`}>Уншиж байна...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className={`text-xs ${dark ? "text-white/30" : "text-gray-400"}`}>Хэрэглэгч олдсонгүй</p>
          </div>
        ) : (
          filtered.map((u) => (
            <button
              key={u.id}
              onClick={() => openClient(u.id)}
              className={`rounded-xl p-3 text-left transition-colors ${dark ? "bg-white/5 hover:bg-white/10" : "bg-white shadow-sm hover:bg-gray-50"}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${dark ? "text-purple-400" : "text-purple-600"}`}>
                  {u.last_name} {u.first_name}
                </span>
                <BadgeList u={u} />
              </div>
              <div className={`mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] ${dark ? "text-white/30" : "text-gray-400"}`}>
                <span>{u.email}</span>
                {u.phone && <span>{u.phone}</span>}
              </div>
            </button>
          ))
        )}
      </div>

      {selectedUserId && <ClientModal userId={selectedUserId} onClose={closeClient} />}
    </div>
  );
}
