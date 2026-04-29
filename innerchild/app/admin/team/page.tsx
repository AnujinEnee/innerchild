"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RichTextEditor from "@/components/RichTextEditor";
import { useTheme } from "../ThemeContext";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/upload-image";

type TaskType = "online" | "offline";
type TeamRole = string;

interface WorkTask {
  id: string;
  team_member_id: string;
  date: string;
  time: string;
  duration_minutes: number;
  client_name: string | null;
  type: TaskType;
  done: boolean;
  income: number;
}

interface ConsultationRecord {
  id: string;
  date: string;
  time: string;
  duration_minutes: number;
  type: "online" | "offline";
  status: string;
  price: number;
  paid_at: string | null;
  client_name: string | null;
}

interface TeamMember {
  id: string;
  last_name: string;
  first_name: string;
  role: TeamRole;
  expertise: string | null;
  education: string | null;
  experience: string | null;
  additional_experience: string | null;
  bio: string | null;
  phone: string | null;
  address: string | null;
  bank_name: string | null;
  bank_account: string | null;
  image_url: string | null;
  email: string | null;
  online_price: number | null;
  offline_price: number | null;
  online_duration: number | null;
  offline_duration: number | null;
  online_enabled: boolean;
  offline_enabled: boolean;
  tasks: WorkTask[];
  consultations: ConsultationRecord[];
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  "1-р сар",
  "2-р сар",
  "3-р сар",
  "4-р сар",
  "5-р сар",
  "6-р сар",
  "7-р сар",
  "8-р сар",
  "9-р сар",
  "10-р сар",
  "11-р сар",
  "12-р сар",
];

const ROLE_LABELS: Record<string, string> = {
  psychologist: "Сэтгэл зүйч",
  therapist: "Сэтгэл засалч",
};
const roleLabel = (role: string) => ROLE_LABELS[role] ?? role;

function parseList(val: string | null): string[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return val.split(",").map((s) => s.trim()).filter(Boolean);
}

function ListInput({
  items,
  onChange,
  placeholder,
  inputCls,
  dark,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  inputCls: string;
  dark: boolean;
}) {
  const [draft, setDraft] = useState("");
  function add() {
    const v = draft.trim();
    if (!v || items.includes(v)) return;
    onChange([...items, v]);
    setDraft("");
  }
  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`}
        />
        <button
          type="button"
          onClick={add}
          className="shrink-0 rounded-xl bg-purple-600 px-3 py-2 text-xs font-medium text-white hover:bg-purple-700"
        >
          +
        </button>
      </div>
      {items.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs ${dark ? "bg-white/10 text-white/70" : "bg-purple-100 text-purple-700"}`}
            >
              {item}
              <button
                type="button"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                className={`ml-0.5 ${dark ? "text-white/40 hover:text-white" : "text-purple-400 hover:text-purple-700"}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const emptyForm = {
  last_name: "",
  first_name: "",
  role: "psychologist" as TeamRole,
  expertise: [] as string[],
  education: [] as string[],
  experience: [] as string[],
  additional_experience: [] as string[],
  bio: "",
  phone: "",
  address: "",
  bank_name: "",
  bank_account: "",
  image_url: "",
  email: "",
  online_price: 50000,
  offline_price: 80000,
  online_duration: 60,
  offline_duration: 60,
  online_enabled: true,
  offline_enabled: true,
};

export default function TeamPage() {
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [activeTab, setActiveTab] = useState<"list" | "register">("list");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewMember, setViewMember] = useState<TeamMember | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [isCounselor, setIsCounselor] = useState(false);
  const [myCounselorId, setMyCounselorId] = useState("");
  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  function setField<K extends keyof typeof emptyForm>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    let error = "";
    if ((key === "last_name" || key === "first_name") && /\d/.test(value)) {
      error = "Нэрэнд тоо оруулах боломжгүй";
    }
    if (
      (key === "phone" || key === "bank_account") &&
      /[a-zA-Zа-яА-ЯөӨүҮёЁ]/.test(value)
    ) {
      error = "Зөвхөн тоо оруулна уу";
    }
    setFormErrors((prev) => ({ ...prev, [key]: error }));
  }

  async function fetchAll() {
    const supabase = createClient();
    const [{ data: mData }, { data: tData }, { data: cData }] =
      await Promise.all([
        supabase
          .from("team_members")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("work_tasks")
          .select("*")
          .order("date", { ascending: true }),
        supabase
          .from("consultations")
          .select(
            "id, date, time, duration_minutes, type, status, price, paid_at, counselor_id, users(first_name, last_name)",
          )
          .order("date", { ascending: true }),
      ]);

    const tasks: WorkTask[] = (tData ?? []).map((t) => ({
      id: t.id,
      team_member_id: t.team_member_id,
      date: t.date,
      time: t.time,
      duration_minutes: t.duration_minutes,
      client_name: t.client_name,
      type: t.type,
      done: t.done,
      income: t.income,
    }));

    const consultations: (ConsultationRecord & { counselor_id: string })[] = (
      cData ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ).map((c: any) => ({
      id: c.id,
      counselor_id: c.counselor_id,
      date: c.date,
      time: c.time,
      duration_minutes: c.duration_minutes ?? 60,
      type: c.type,
      status: c.status,
      price: c.price,
      paid_at: c.paid_at,
      client_name: c.users
        ? `${c.users.last_name ?? ""} ${c.users.first_name ?? ""}`.trim()
        : null,
    }));

    setMembers(
      (mData ?? []).map((m) => ({
        id: m.id,
        last_name: m.last_name,
        first_name: m.first_name,
        role: m.role,
        expertise: m.expertise,
        education: m.education,
        experience: m.experience,
        additional_experience: m.additional_experience ?? null,
        bio: m.bio,
        phone: m.phone,
        address: m.address,
        bank_name: m.bank_name ?? null,
        bank_account: m.bank_account,
        image_url: m.image_url,
        email: m.email ?? null,
        online_price: m.online_price ?? 50000,
        offline_price: m.offline_price ?? 80000,
        online_duration: m.online_duration ?? 60,
        offline_duration: m.offline_duration ?? 60,
        online_enabled: m.online_enabled ?? true,
        offline_enabled: m.offline_enabled ?? true,
        tasks: tasks.filter((t) => t.team_member_id === m.id),
        consultations: consultations.filter((c) => c.counselor_id === m.id),
      })),
    );
    setLoading(false);
  }

  useEffect(() => {
    const role = localStorage.getItem("admin_role");
    const cid = localStorage.getItem("admin_counselor_id") ?? "";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsCounselor(role === "counselor" && !!cid);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMyCounselorId(cid);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
  }, []);

  function openEdit(m: TeamMember) {
    setFormErrors({});
    setForm({
      last_name: m.last_name,
      first_name: m.first_name,
      role: m.role,
      expertise: parseList(m.expertise),
      education: parseList(m.education),
      experience: parseList(m.experience),
      additional_experience: parseList(m.additional_experience),
      bio: m.bio ?? "",
      phone: m.phone ?? "",
      address: m.address ?? "",
      bank_name: m.bank_name ?? "",
      bank_account: m.bank_account ?? "",
      image_url: m.image_url ?? "",
      email: m.email ?? "",
      online_price: m.online_price ?? 50000,
      offline_price: m.offline_price ?? 80000,
      online_duration: m.online_duration ?? 60,
      offline_duration: m.offline_duration ?? 60,
      online_enabled: m.online_enabled ?? true,
      offline_enabled: m.offline_enabled ?? true,
    });
    setEditId(m.id);
    setShowForm(true);
  }

  async function save() {
    if (!form.first_name.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const payload = {
      last_name: form.last_name,
      first_name: form.first_name,
      role: form.role,
      expertise: form.expertise.length ? JSON.stringify(form.expertise) : null,
      education: form.education.length ? JSON.stringify(form.education) : null,
      experience: form.experience.length ? JSON.stringify(form.experience) : null,
      additional_experience: form.additional_experience.length ? JSON.stringify(form.additional_experience) : null,
      bio: form.bio || null,
      phone: form.phone || null,
      address: form.address || null,
      bank_name: form.bank_name || null,
      bank_account: form.bank_account || null,
      image_url: form.image_url || null,
      email: form.email || null,
      online_price: Number(form.online_price) || 50000,
      offline_price: Number(form.offline_price) || 80000,
      online_duration: Number(form.online_duration) || 60,
      offline_duration: Number(form.offline_duration) || 60,
      online_enabled: form.online_enabled,
      offline_enabled: form.offline_enabled,
    };

    if (editId) {
      const { data, error } = await supabase
        .from("team_members")
        .update(payload)
        .eq("id", editId)
        .select()
        .single();
      if (error) {
        alert(`Алдаа: ${error.message}`);
        setSaving(false);
        return;
      }
      if (data) {
        setMembers((prev) =>
          prev.map((m) => (m.id === editId ? { ...m, ...data } : m)),
        );
        if (viewMember?.id === editId)
          setViewMember((prev) => (prev ? { ...prev, ...data } : null));
      }
    } else {
      const { data, error } = await supabase
        .from("team_members")
        .insert(payload)
        .select()
        .single();
      if (error) {
        alert(`Алдаа: ${error.message}`);
        setSaving(false);
        return;
      }
      if (data) {
        setMembers((prev) => [{ ...data, tasks: [], consultations: [] }, ...prev]);
      }
    }
    setSaving(false);
    setShowForm(false);
    if (activeTab === "register") setActiveTab("list");
  }

  async function remove(id: string) {
    const { data, error } = await createClient()
      .from("team_members")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) {
      alert(`Алдаа: ${error.message}`);
      return;
    }
    if (!data?.length) {
      alert("Устгах боломжгүй. Supabase RLS эрхийг шалгана уу.");
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== id));
    if (viewMember?.id === id) setViewMember(null);
  }

  async function toggleTask(memberId: string, taskId: string) {
    const supabase = createClient();
    const member = members.find((m) => m.id === memberId);
    const task = member?.tasks.find((t) => t.id === taskId);
    if (!task) return;
    const newDone = !task.done;
    const { error } = await supabase
      .from("work_tasks")
      .update({ done: newDone })
      .eq("id", taskId);
    if (error) {
      alert(`Алдаа: ${error.message}`);
      return;
    }
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? {
              ...m,
              tasks: m.tasks.map((t) =>
                t.id === taskId ? { ...t, done: newDone } : t,
              ),
            }
          : m,
      ),
    );
    if (viewMember?.id === memberId) {
      setViewMember((prev) =>
        prev
          ? {
              ...prev,
              tasks: prev.tasks.map((t) =>
                t.id === taskId ? { ...t, done: newDone } : t,
              ),
            }
          : null,
      );
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const url = await uploadImage(file);
      setForm({ ...form, image_url: url });
    } catch (err) {
      alert(`Зураг upload хийхэд алдаа: ${err instanceof Error ? err.message : "тодорхойгүй"}`);
    }
  }

  function getMonthTasks(m: TeamMember) {
    const prefix = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
    return m.tasks.filter((t) => t.date.startsWith(prefix));
  }

  function getMonthConsultations(m: TeamMember) {
    const prefix = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
    return m.consultations.filter(
      (c) => c.date?.startsWith(prefix) && c.status !== "cancelled",
    );
  }

  function getMonthIncome(m: TeamMember) {
    const tasks = getMonthTasks(m);
    const done = tasks.filter((t) => t.done).reduce((s, t) => s + t.income, 0);
    const consultIncome = getMonthConsultations(m)
      .filter((c) => c.paid_at)
      .reduce((s, c) => s + c.price, 0);
    const total =
      tasks.reduce((s, t) => s + t.income, 0) +
      getMonthConsultations(m).reduce((s, c) => s + c.price, 0);
    return { done: done + consultIncome, total };
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  const inputCls = dark
    ? "bg-white/10 text-white placeholder:text-white/30 focus:bg-white/15"
    : "border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-purple-500";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1
          className={`text-2xl font-bold ${dark ? "text-white" : "text-gray-900"}`}
        >
          Сэтгэл зүйчид
        </h1>
        {!isCounselor && (
          <div
            className={`flex rounded-xl p-1 ${dark ? "bg-white/10" : "bg-gray-100"}`}
          >
            <button
              onClick={() => setActiveTab("list")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "list"
                  ? "bg-purple-600 text-white"
                  : dark
                    ? "text-white/50 hover:text-white"
                    : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Жагсаалт
            </button>
            <button
              onClick={() => {
                setActiveTab("register");
                setForm({ ...emptyForm });
                setFormErrors({});
                setEditId(null);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "register"
                  ? "bg-purple-600 text-white"
                  : dark
                    ? "text-white/50 hover:text-white"
                    : "text-gray-500 hover:text-gray-900"
              }`}
            >
              + Бүртгүүлэх
            </button>
          </div>
        )}
      </div>

      {/* ===== INLINE REGISTER FORM ===== */}
      {activeTab === "register" && (
        <div
          className={`mb-8 rounded-2xl p-8 ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}
        >
          <h2
            className={`mb-6 text-lg font-bold ${dark ? "text-white" : "text-gray-900"}`}
          >
            Шинэ сэтгэл зүйч бүртгэх
          </h2>
          <div className="flex flex-col gap-5">
            {/* Image */}
            <div>
              <label
                className={`mb-2 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}
              >
                Зураг
              </label>
              <div className="flex items-center gap-4">
                <div
                  className={`h-24 w-24 overflow-hidden rounded-2xl ${dark ? "bg-white/10" : "bg-gray-100"}`}
                >
                  {form.image_url ? (
                    <img
                      src={form.image_url}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className={`h-8 w-8 ${dark ? "text-white/20" : "text-gray-300"}`}
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                  )}
                </div>
                <label className="cursor-pointer rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700">
                  Зураг оруулах
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label
                  className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}
                >
                  Овог *
                </label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) => setField("last_name", e.target.value)}
                  placeholder="Овог"
                  className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${formErrors.last_name ? "border border-red-500" : inputCls}`}
                />
                {formErrors.last_name && (
                  <p className="mt-1 text-[11px] text-red-500">
                    {formErrors.last_name}
                  </p>
                )}
              </div>
              <div>
                <label
                  className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}
                >
                  Нэр *
                </label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) => setField("first_name", e.target.value)}
                  placeholder="Нэр"
                  className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${formErrors.first_name ? "border border-red-500" : inputCls}`}
                />
                {formErrors.first_name && (
                  <p className="mt-1 text-[11px] text-red-500">
                    {formErrors.first_name}
                  </p>
                )}
              </div>
              <div>
                <label
                  className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}
                >
                  Албан тушаал
                </label>
                <input
                  type="text"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="Жишээ: Сэтгэл зүйч"
                  className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`}
                />
              </div>
              <div>
                <label
                  className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}
                >
                  Утас
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  placeholder="9911-2233"
                  className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${formErrors.phone ? "border border-red-500" : inputCls}`}
                />
                {formErrors.phone && (
                  <p className="mt-1 text-[11px] text-red-500">
                    {formErrors.phone}
                  </p>
                )}
              </div>
              <div>
                <label
                  className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}
                >
                  И-мэйл
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  placeholder="email@example.com"
                  className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`}
                />
              </div>
              <div>
                <label
                  className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}
                >
                  Банк
                </label>
                <input
                  type="text"
                  value={form.bank_name}
                  onChange={(e) =>
                    setForm({ ...form, bank_name: e.target.value })
                  }
                  placeholder="Хаан банк"
                  className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`}
                />
              </div>
              <div>
                <label
                  className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}
                >
                  Дансны дугаар
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={form.bank_account}
                  onChange={(e) => setField("bank_account", e.target.value)}
                  placeholder="5000-1234-5678"
                  className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${formErrors.bank_account ? "border border-red-500" : inputCls}`}
                />
                {formErrors.bank_account && (
                  <p className="mt-1 text-[11px] text-red-500">
                    {formErrors.bank_account}
                  </p>
                )}
              </div>
              <div>
                <label
                  className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}
                >
                  Хаяг
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder="Хаяг"
                  className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>
                  Мэргэшиж буй салбарууд
                </label>
                <ListInput items={form.expertise} onChange={(v) => setForm({ ...form, expertise: v })} placeholder="Мэргэшил нэмэх..." inputCls={inputCls} dark={dark} />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>
                  Боловсролын туршлага
                </label>
                <ListInput items={form.education} onChange={(v) => setForm({ ...form, education: v })} placeholder="Боловсрол нэмэх..." inputCls={inputCls} dark={dark} />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>
                  Ажлын туршлага
                </label>
                <ListInput items={form.experience} onChange={(v) => setForm({ ...form, experience: v })} placeholder="Туршлага нэмэх..." inputCls={inputCls} dark={dark} />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>
                  Нэмэлт туршлага
                </label>
                <ListInput items={form.additional_experience} onChange={(v) => setForm({ ...form, additional_experience: v })} placeholder="Нэмэлт туршлага нэмэх..." inputCls={inputCls} dark={dark} />
              </div>
            </div>

            {/* Pricing & Duration */}
            <div
              className={`rounded-xl p-4 ${dark ? "bg-white/5" : "bg-purple-50"}`}
            >
              <p
                className={`mb-3 text-xs font-semibold ${dark ? "text-white/50" : "text-purple-600"}`}
              >
                Зөвлөгөөний тохиргоо
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}
                  >
                    Онлайн үнэ (₮)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.online_price}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        online_price: Number(e.target.value.replace(/\D/g, "")),
                      })
                    }
                    placeholder="50000"
                    className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`}
                  />
                </div>
                <div>
                  <label
                    className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}
                  >
                    Биечлэн үнэ (₮)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.offline_price}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        offline_price: Number(
                          e.target.value.replace(/\D/g, ""),
                        ),
                      })
                    }
                    placeholder="80000"
                    className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`}
                  />
                </div>
                <div>
                  <label
                    className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}
                  >
                    Онлайн хугацаа (мин)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.online_duration}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        online_duration: Number(
                          e.target.value.replace(/\D/g, ""),
                        ),
                      })
                    }
                    placeholder="60"
                    className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`}
                  />
                </div>
                <div>
                  <label
                    className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}
                  >
                    Биечлэн хугацаа (мин)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.offline_duration}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        offline_duration: Number(
                          e.target.value.replace(/\D/g, ""),
                        ),
                      })
                    }
                    placeholder="60"
                    className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`}
                  />
                </div>
              </div>

              {/* Online / Offline toggle */}
              <div className="mt-4 flex gap-6">
                <label className="flex cursor-pointer items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, online_enabled: !form.online_enabled })}
                    className={`relative h-6 w-11 rounded-full transition-colors ${form.online_enabled ? "bg-green-500" : dark ? "bg-white/20" : "bg-gray-300"}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${form.online_enabled ? "left-5.5" : "left-0.5"}`} />
                  </button>
                  <span className={`text-sm font-medium ${dark ? "text-white" : "text-gray-700"}`}>
                    Онлайн {form.online_enabled ? "идэвхтэй" : "идэвхгүй"}
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, offline_enabled: !form.offline_enabled })}
                    className={`relative h-6 w-11 rounded-full transition-colors ${form.offline_enabled ? "bg-green-500" : dark ? "bg-white/20" : "bg-gray-300"}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${form.offline_enabled ? "left-5.5" : "left-0.5"}`} />
                  </button>
                  <span className={`text-sm font-medium ${dark ? "text-white" : "text-gray-700"}`}>
                    Биечлэн {form.offline_enabled ? "идэвхтэй" : "идэвхгүй"}
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label
                className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}
              >
                Намтар / Миний тухай
              </label>
              <RichTextEditor content={form.bio} onChange={(html) => setForm({ ...form, bio: html })} dark={dark} minHeight="150px" />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setForm({ ...emptyForm });
                  setFormErrors({});
                }}
                className={`rounded-xl px-5 py-2.5 text-sm font-medium ${dark ? "text-white/50 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"}`}
              >
                Цэвэрлэх
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {saving ? "Хадгалж байна..." : "Бүртгэх"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DETAIL VIEW MODAL ===== */}
      {viewMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className={`w-full max-w-3xl overflow-hidden rounded-2xl ${dark ? "bg-[#1e1e36]" : "bg-white"} max-h-[90vh] overflow-y-auto`}
          >
            {/* Header */}
            <div className="relative h-44 bg-linear-to-br from-purple-600 to-indigo-700">
              <div className="absolute -bottom-12 left-8">
                <div
                  className={`h-24 w-24 overflow-hidden rounded-2xl border-4 ${dark ? "border-[#1e1e36]" : "border-white"} bg-gray-200`}
                >
                  {viewMember.image_url ? (
                    <img
                      src={viewMember.image_url}
                      alt={viewMember.first_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-purple-100 text-3xl font-bold text-purple-600">
                      {viewMember.first_name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setViewMember(null)}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="px-8 pb-8 pt-16">
              <h2
                className={`text-2xl font-bold ${dark ? "text-white" : "text-gray-900"}`}
              >
                {viewMember.last_name} {viewMember.first_name}
              </h2>
              <p className="mt-1 text-sm font-medium text-purple-500">
                {roleLabel(viewMember.role)}
              </p>

              {/* List fields */}
              {[
                { label: "Боловсролын туршлага", val: viewMember.education },
                { label: "Ажлын туршлага", val: viewMember.experience },
                { label: "Нэмэлт туршлага", val: viewMember.additional_experience },
                { label: "Мэргэшиж буй салбарууд", val: viewMember.expertise },
              ].map((item) => {
                const list = parseList(item.val);
                if (list.length === 0) return null;
                return (
                  <div key={item.label} className={`mt-4 rounded-xl p-4 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                    <p className={`mb-2 text-xs font-medium ${dark ? "text-white/40" : "text-gray-400"}`}>
                      {item.label}
                    </p>
                    <ul className="flex flex-col gap-1.5">
                      {list.map((entry, i) => (
                        <li key={i} className={`flex items-start gap-2 text-sm ${dark ? "text-white" : "text-gray-900"}`}>
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500" />
                          {entry}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}

              {/* Info grid */}
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Утас", val: viewMember.phone },
                  { label: "И-мэйл", val: viewMember.email },
                  { label: "Хаяг", val: viewMember.address },
                  { label: "Банк", val: viewMember.bank_name },
                  { label: "Дансны дугаар", val: viewMember.bank_account },
                  {
                    label: "Онлайн үнэ",
                    val: viewMember.online_price
                      ? `${viewMember.online_price.toLocaleString()}₮`
                      : null,
                  },
                  {
                    label: "Биечлэн үнэ",
                    val: viewMember.offline_price
                      ? `${viewMember.offline_price.toLocaleString()}₮`
                      : null,
                  },
                  {
                    label: "Онлайн хугацаа",
                    val: viewMember.online_duration
                      ? `${viewMember.online_duration} мин`
                      : null,
                  },
                  {
                    label: "Биечлэн хугацаа",
                    val: viewMember.offline_duration
                      ? `${viewMember.offline_duration} мин`
                      : null,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-xl p-4 ${dark ? "bg-white/5" : "bg-gray-50"}`}
                  >
                    <p
                      className={`text-xs font-medium ${dark ? "text-white/40" : "text-gray-400"}`}
                    >
                      {item.label}
                    </p>
                    <p
                      className={`mt-1 text-sm font-medium ${dark ? "text-white" : "text-gray-900"}`}
                    >
                      {item.val || "—"}
                    </p>
                  </div>
                ))}
              </div>

              {/* Online / Offline toggle — detail view */}
              <div className={`mt-4 rounded-xl p-4 ${dark ? "bg-white/5" : "bg-purple-50"}`}>
                <p className={`mb-3 text-xs font-semibold ${dark ? "text-white/50" : "text-purple-600"}`}>Зөвлөгөөний тохиргоо</p>
                <div className="flex gap-6">
                  <label className="flex cursor-pointer items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const newVal = !viewMember.online_enabled;
                        await createClient().from("team_members").update({ online_enabled: newVal }).eq("id", viewMember.id);
                        setViewMember({ ...viewMember, online_enabled: newVal });
                        setMembers((prev) => prev.map((m) => m.id === viewMember.id ? { ...m, online_enabled: newVal } : m));
                      }}
                      className={`relative h-6 w-11 rounded-full transition-colors ${viewMember.online_enabled ? "bg-green-500" : dark ? "bg-white/20" : "bg-gray-300"}`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${viewMember.online_enabled ? "left-5.5" : "left-0.5"}`} />
                    </button>
                    <span className={`text-sm font-medium ${dark ? "text-white" : "text-gray-700"}`}>
                      Онлайн {viewMember.online_enabled ? "идэвхтэй" : "идэвхгүй"}
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const newVal = !viewMember.offline_enabled;
                        await createClient().from("team_members").update({ offline_enabled: newVal }).eq("id", viewMember.id);
                        setViewMember({ ...viewMember, offline_enabled: newVal });
                        setMembers((prev) => prev.map((m) => m.id === viewMember.id ? { ...m, offline_enabled: newVal } : m));
                      }}
                      className={`relative h-6 w-11 rounded-full transition-colors ${viewMember.offline_enabled ? "bg-green-500" : dark ? "bg-white/20" : "bg-gray-300"}`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${viewMember.offline_enabled ? "left-5.5" : "left-0.5"}`} />
                    </button>
                    <span className={`text-sm font-medium ${dark ? "text-white" : "text-gray-700"}`}>
                      Биечлэн {viewMember.offline_enabled ? "идэвхтэй" : "идэвхгүй"}
                    </span>
                  </label>
                </div>
              </div>

              {/* Bio */}
              {viewMember.bio && (
                <div className="mt-6">
                  <h3
                    className={`mb-2 text-sm font-semibold ${dark ? "text-white" : "text-gray-900"}`}
                  >
                    Миний тухай
                  </h3>
                  <div
                    className={`prose prose-sm max-w-none text-sm leading-relaxed text-justify ${dark ? "text-white/60" : "text-gray-600"} [&_p]:mb-2 [&_p:last-child]:mb-0`}
                    dangerouslySetInnerHTML={{ __html: viewMember.bio }}
                  />
                </div>
              )}

              {/* ===== CALENDAR & SCHEDULE — own or admin only ===== */}
              {(!isCounselor || viewMember.id === myCounselorId) && (
                <div className="mt-8">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`text-sm font-semibold ${dark ? "text-white" : "text-gray-900"}`}
                    >
                      Ажлын хуваарь
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (calMonth === 0) {
                            setCalMonth(11);
                            setCalYear(calYear - 1);
                          } else setCalMonth(calMonth - 1);
                        }}
                        className={`flex h-7 w-7 items-center justify-center rounded-lg ${dark ? "hover:bg-white/10 text-white/50" : "hover:bg-gray-100 text-gray-500"}`}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="h-4 w-4"
                        >
                          <path d="M15 18l-6-6 6-6" />
                        </svg>
                      </button>
                      <span
                        className={`min-w-30 text-center text-sm font-medium ${dark ? "text-white" : "text-gray-900"}`}
                      >
                        {calYear} {MONTH_NAMES[calMonth]}
                      </span>
                      <button
                        onClick={() => {
                          if (calMonth === 11) {
                            setCalMonth(0);
                            setCalYear(calYear + 1);
                          } else setCalMonth(calMonth + 1);
                        }}
                        className={`flex h-7 w-7 items-center justify-center rounded-lg ${dark ? "hover:bg-white/10 text-white/50" : "hover:bg-gray-100 text-gray-500"}`}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="h-4 w-4"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Mini calendar */}
                  <div
                    className={`mt-4 rounded-xl p-4 ${dark ? "bg-white/5" : "bg-gray-50"}`}
                  >
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"].map((d) => (
                        <div
                          key={d}
                          className={`pb-2 text-xs font-medium ${dark ? "text-white/30" : "text-gray-400"}`}
                        >
                          {d}
                        </div>
                      ))}
                      {Array.from({
                        length: getFirstDayOfMonth(calYear, calMonth),
                      }).map((_, i) => (
                        <div key={`empty-${i}`} />
                      ))}
                      {Array.from({
                        length: getDaysInMonth(calYear, calMonth),
                      }).map((_, i) => {
                        const day = i + 1;
                        const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                        const dayTasks = viewMember.tasks.filter(
                          (t) => t.date === dateStr,
                        );
                        const dayConsults = viewMember.consultations.filter(
                          (c) => c.date === dateStr && c.status !== "cancelled",
                        );
                        const hasOnline =
                          dayTasks.some((t) => t.type === "online") ||
                          dayConsults.some((c) => c.type === "online");
                        const hasOffline =
                          dayTasks.some((t) => t.type === "offline") ||
                          dayConsults.some((c) => c.type === "offline");
                        const isToday = dateStr === todayStr;
                        return (
                          <div
                            key={day}
                            className={`relative flex h-10 flex-col items-center justify-center rounded-lg text-xs font-medium ${
                              isToday
                                ? "bg-purple-600 text-white"
                                : dayTasks.length > 0 || dayConsults.length > 0
                                  ? dark
                                    ? "bg-white/10 text-white"
                                    : "bg-purple-50 text-purple-700"
                                  : dark
                                    ? "text-white/50"
                                    : "text-gray-600"
                            }`}
                          >
                            {day}
                            {(dayTasks.length > 0 ||
                              dayConsults.length > 0) && (
                              <span className="absolute bottom-0.5 flex gap-0.5">
                                {hasOnline && (
                                  <span
                                    className={`text-[6px] font-bold ${isToday ? "text-white" : "text-green-500"}`}
                                  >
                                    О
                                  </span>
                                )}
                                {hasOffline && (
                                  <span
                                    className={`text-[6px] font-bold ${isToday ? "text-white" : "text-purple-500"}`}
                                  >
                                    Б
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {/* Legend */}
                    <div
                      className={`mt-3 flex items-center justify-center gap-4 text-[10px] font-medium ${dark ? "text-white/40" : "text-gray-400"}`}
                    >
                      <span className="flex items-center gap-1">
                        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-green-500/15 text-[7px] font-bold text-green-500">
                          О
                        </span>
                        Онлайн
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-purple-500/15 text-[7px] font-bold text-purple-500">
                          Б
                        </span>
                        Биечлэн
                      </span>
                    </div>
                  </div>

                  {/* Consultation bookings for this month */}
                  {getMonthConsultations(viewMember).length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p
                        className={`text-xs font-semibold uppercase tracking-wider ${dark ? "text-white/30" : "text-gray-400"}`}
                      >
                        Захиалгууд
                      </p>
                      {getMonthConsultations(viewMember).map((c) => {
                        const STATUS: Record<
                          string,
                          { label: string; cls: string }
                        > = {
                          normal: {
                            label: "Хүлээгдэж буй",
                            cls: "text-amber-500",
                          },
                          completed: {
                            label: "Дууссан",
                            cls: "text-emerald-500",
                          },
                          cancelled: {
                            label: "Цуцлагдсан",
                            cls: "text-red-400",
                          },
                        };
                        const end = new Date(`${c.date}T${c.time}`);
                        end.setMinutes(end.getMinutes() + (c.duration_minutes ?? 60));
                        const isOver = end <= new Date();
                        const effectiveStatus = c.status === "cancelled" ? "cancelled" : isOver ? "completed" : "normal";
                        const st = STATUS[effectiveStatus] ?? STATUS.normal;
                        return (
                          <div
                            key={c.id}
                            className={`flex items-center justify-between rounded-xl px-4 py-3 ${dark ? "bg-white/5" : "bg-gray-50"}`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${c.type === "online" ? "bg-green-500/15" : "bg-purple-500/15"}`}
                              >
                                <span className="text-sm">
                                  {c.type === "online" ? "🎥" : "🏢"}
                                </span>
                              </div>
                              <div>
                                <p
                                  className={`text-sm font-medium ${dark ? "text-white" : "text-gray-900"}`}
                                >
                                  {c.client_name || "Зочин"}
                                </p>
                                <p
                                  className={`text-xs ${dark ? "text-white/30" : "text-gray-400"}`}
                                >
                                  {c.date} · {c.time?.slice(0, 5)} ·{" "}
                                  {c.duration_minutes}мин
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p
                                className={`text-sm font-semibold ${dark ? "text-white/80" : "text-gray-700"}`}
                              >
                                {c.price.toLocaleString()}₮
                              </p>
                              <p className={`text-xs ${st.cls}`}>{st.label}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Task list for this month */}
                  <div className="mt-4 space-y-2">
                    {getMonthTasks(viewMember).length === 0 &&
                    getMonthConsultations(viewMember).length === 0 ? (
                      <p
                        className={`text-center text-sm py-4 ${dark ? "text-white/30" : "text-gray-400"}`}
                      >
                        Энэ сард ажил байхгүй
                      </p>
                    ) : getMonthTasks(viewMember).length === 0 ? null : (
                      getMonthTasks(viewMember).map((t) => (
                        <div
                          key={t.id}
                          className={`flex items-center justify-between rounded-xl px-4 py-3 ${dark ? "bg-white/5" : "bg-gray-50"}`}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleTask(viewMember.id, t.id)}
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                                t.done
                                  ? "border-emerald-500 bg-emerald-500"
                                  : dark
                                    ? "border-white/20"
                                    : "border-gray-300"
                              }`}
                            >
                              {t.done && (
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="white"
                                  strokeWidth="3"
                                  className="h-3 w-3"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </button>
                            <div>
                              <div className="flex items-center gap-2">
                                <p
                                  className={`text-sm font-medium ${t.done ? (dark ? "text-white/40 line-through" : "text-gray-400 line-through") : dark ? "text-white" : "text-gray-900"}`}
                                >
                                  {t.client_name ?? "—"}
                                </p>
                                {t.type === "online" ? (
                                  <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-medium text-green-500">
                                    Онлайн
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-medium text-purple-500">
                                    Биечлэн
                                  </span>
                                )}
                              </div>
                              <p
                                className={`text-xs ${dark ? "text-white/30" : "text-gray-400"}`}
                              >
                                {t.date} · {t.time} · {t.duration_minutes}мин
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-sm font-semibold ${t.done ? "text-emerald-500" : dark ? "text-white/60" : "text-gray-500"}`}
                            >
                              {t.income.toLocaleString()}₮
                            </p>
                            <p
                              className={`text-xs ${t.done ? "text-emerald-400/70" : dark ? "text-amber-400/70" : "text-amber-500"}`}
                            >
                              {t.done ? "Гүйцэтгэсэн" : "Хүлээгдэж буй"}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Monthly income summary */}
                  {(() => {
                    const { done, total } = getMonthIncome(viewMember);
                    return (
                      <div
                        className={`mt-4 flex items-center justify-between rounded-xl p-4 ${dark ? "bg-linear-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20" : "bg-purple-50 border border-purple-100"}`}
                      >
                        <div>
                          <p
                            className={`text-xs font-medium ${dark ? "text-white/40" : "text-gray-500"}`}
                          >
                            {calYear} {MONTH_NAMES[calMonth]} орлого
                          </p>
                          <p
                            className={`mt-1 text-2xl font-bold ${dark ? "text-white" : "text-gray-900"}`}
                          >
                            {done.toLocaleString()}₮
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-xs font-medium ${dark ? "text-white/40" : "text-gray-500"}`}
                          >
                            Нийт төлөвлөсөн
                          </p>
                          <p
                            className={`mt-1 text-lg font-semibold ${dark ? "text-white/50" : "text-gray-400"}`}
                          >
                            {total.toLocaleString()}₮
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="mt-6 flex gap-2">
                {(!isCounselor || viewMember.id === myCounselorId) && (
                  <button
                    onClick={() => {
                      setViewMember(null);
                      openEdit(viewMember);
                    }}
                    className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700"
                  >
                    Засах
                  </button>
                )}
                <button
                  onClick={() => setViewMember(null)}
                  className={`rounded-xl px-5 py-2.5 text-sm font-medium ${dark ? "text-white/50 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"}`}
                >
                  Хаах
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== EDIT/CREATE FORM MODAL ===== */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className={`w-full max-w-lg rounded-2xl ${dark ? "bg-[#1e1e36]" : "bg-white"} max-h-[90vh] overflow-y-auto p-6`}
          >
            <h2
              className={`mb-6 text-lg font-bold ${dark ? "text-white" : "text-gray-900"}`}
            >
              {editId ? "Гишүүн засах" : "Шинэ гишүүн"}
            </h2>
            <div className="flex flex-col gap-4">
              {/* Image */}
              <div>
                <label
                  className={`mb-2 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}
                >
                  Зураг
                </label>
                <div className="flex items-center gap-4">
                  <div
                    className={`h-20 w-20 overflow-hidden rounded-xl ${dark ? "bg-white/10" : "bg-gray-100"}`}
                  >
                    {form.image_url ? (
                      <img
                        src={form.image_url}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className={`h-8 w-8 ${dark ? "text-white/20" : "text-gray-300"}`}
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer rounded-lg bg-purple-600 px-4 py-2 text-xs font-medium text-white hover:bg-purple-700">
                    Зураг оруулах
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}
                  >
                    Овог
                  </label>
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={(e) => setField("last_name", e.target.value)}
                    placeholder="Овог"
                    className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${formErrors.last_name ? "border border-red-500" : inputCls}`}
                  />
                  {formErrors.last_name && (
                    <p className="mt-1 text-[11px] text-red-500">
                      {formErrors.last_name}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}
                  >
                    Нэр
                  </label>
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={(e) => setField("first_name", e.target.value)}
                    placeholder="Нэр"
                    className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${formErrors.first_name ? "border border-red-500" : inputCls}`}
                  />
                  {formErrors.first_name && (
                    <p className="mt-1 text-[11px] text-red-500">
                      {formErrors.first_name}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}
                  >
                    Албан тушаал
                  </label>
                  <input
                    type="text"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    placeholder="Жишээ: Сэтгэл зүйч"
                    className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`}
                  />
                </div>
                <div>
                  <label
                    className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}
                  >
                    Банк
                  </label>
                  <input
                    type="text"
                    value={form.bank_name}
                    onChange={(e) =>
                      setForm({ ...form, bank_name: e.target.value })
                    }
                    placeholder="Хаан банк"
                    className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`}
                  />
                </div>
                <div>
                  <label
                    className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}
                  >
                    Дансны дугаар
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={form.bank_account}
                    onChange={(e) => setField("bank_account", e.target.value)}
                    placeholder="5000-1234-5678"
                    className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${formErrors.bank_account ? "border border-red-500" : inputCls}`}
                  />
                  {formErrors.bank_account && (
                    <p className="mt-1 text-[11px] text-red-500">
                      {formErrors.bank_account}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>
                  Мэргэшиж буй салбарууд
                </label>
                <ListInput items={form.expertise} onChange={(v) => setForm({ ...form, expertise: v })} placeholder="Мэргэшил нэмэх..." inputCls={inputCls} dark={dark} />
              </div>
              <div>
                <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>
                  Боловсролын туршлага
                </label>
                <ListInput items={form.education} onChange={(v) => setForm({ ...form, education: v })} placeholder="Боловсрол нэмэх..." inputCls={inputCls} dark={dark} />
              </div>
              <div>
                <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>
                  Ажлын туршлага
                </label>
                <ListInput items={form.experience} onChange={(v) => setForm({ ...form, experience: v })} placeholder="Туршлага нэмэх..." inputCls={inputCls} dark={dark} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}
                  >
                    Утас
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    placeholder="9911-2233"
                    className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${formErrors.phone ? "border border-red-500" : inputCls}`}
                  />
                  {formErrors.phone && (
                    <p className="mt-1 text-[11px] text-red-500">
                      {formErrors.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}
                  >
                    И-мэйл
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="email@example.com"
                    className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`}
                  />
                </div>
                <div>
                  <label
                    className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}
                  >
                    Хаяг
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    placeholder="Хаяг"
                    className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`}
                  />
                </div>
              </div>

              {/* Pricing & Duration */}
              <div
                className={`rounded-xl p-4 ${dark ? "bg-white/5" : "bg-purple-50"}`}
              >
                <p
                  className={`mb-3 text-xs font-semibold ${dark ? "text-white/50" : "text-purple-600"}`}
                >
                  Зөвлөгөөний тохиргоо
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}
                    >
                      Онлайн үнэ (₮)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.online_price}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          online_price: Number(
                            e.target.value.replace(/\D/g, ""),
                          ),
                        })
                      }
                      placeholder="50000"
                      className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`}
                    />
                  </div>
                  <div>
                    <label
                      className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}
                    >
                      Биечлэн үнэ (₮)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.offline_price}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          offline_price: Number(
                            e.target.value.replace(/\D/g, ""),
                          ),
                        })
                      }
                      placeholder="80000"
                      className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`}
                    />
                  </div>
                  <div>
                    <label
                      className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}
                    >
                      Онлайн хугацаа (мин)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.online_duration}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          online_duration: Number(
                            e.target.value.replace(/\D/g, ""),
                          ),
                        })
                      }
                      placeholder="60"
                      className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`}
                    />
                  </div>
                  <div>
                    <label
                      className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}
                    >
                      Биечлэн хугацаа (мин)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.offline_duration}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          offline_duration: Number(
                            e.target.value.replace(/\D/g, ""),
                          ),
                        })
                      }
                      placeholder="60"
                      className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}
                >
                  Намтар / Миний тухай
                </label>
                <RichTextEditor content={form.bio} onChange={(html: string) => setForm({ ...form, bio: html })} dark={dark} minHeight="150px" />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className={`rounded-xl px-5 py-2.5 text-sm font-medium ${dark ? "text-white/50 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"}`}
              >
                Цуцлах
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {saving ? "Хадгалж байна..." : "Хадгалах"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CARDS ===== */}
      {activeTab === "register" ? null : loading ? (
        <div className="py-20 text-center">
          <p className={`text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>
            Уншиж байна...
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => {
            const currentNow = new Date();
            const currentMonthPrefix = `${currentNow.getFullYear()}-${String(currentNow.getMonth() + 1).padStart(2, "0")}`;
            const mTasks = m.tasks.filter((t) =>
              t.date.startsWith(currentMonthPrefix),
            );
            const doneCount = mTasks.filter((t) => t.done).length;
            const taskIncome = mTasks
              .filter((t) => t.done)
              .reduce((s, t) => s + t.income, 0);
            const consultIncome = m.consultations
              .filter((c) => c.date.startsWith(currentMonthPrefix) && c.status !== "cancelled")
              .reduce((s, c) => s + c.price, 0);
            const monthIncome = taskIncome + consultIncome;
            const todayTasks = m.tasks.filter((t) => t.date === todayStr);

            return (
              <div
                key={m.id}
                className={`overflow-hidden rounded-2xl ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}
              >
                {/* Header */}
                <div className="relative h-28 bg-linear-to-br from-purple-500 to-indigo-600">
                  {todayTasks.length > 0 && (
                    <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 backdrop-blur-sm">
                      <span
                        className={`text-[10px] font-semibold ${todayTasks[0].type === "online" ? "text-green-400" : "text-purple-400"}`}
                      >
                        {todayTasks[0].type === "online" ? "Онлайн" : "Биечлэн"}
                      </span>
                      <span className="text-[10px] font-semibold text-white">
                        Өнөөдөр уулзалт
                      </span>
                    </div>
                  )}
                  <div
                    className={`absolute -bottom-8 left-5 h-16 w-16 overflow-hidden rounded-xl border-4 ${dark ? "border-[#1a1a2e]" : "border-gray-100"}`}
                  >
                    {m.image_url ? (
                      <img
                        src={m.image_url}
                        alt={m.first_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-purple-100 text-xl font-bold text-purple-600">
                        {m.first_name.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-5 pb-5 pt-12">
                  <h3
                    className={`text-base font-bold ${dark ? "text-white" : "text-gray-900"}`}
                  >
                    {m.last_name} {m.first_name}
                  </h3>
                  <p className="text-sm text-purple-500">
                    {roleLabel(m.role)}
                  </p>

                  <div className="mt-3 space-y-1">
                    <p
                      className={`text-xs ${dark ? "text-white/40" : "text-gray-500"}`}
                    >
                      <span
                        className={`font-medium ${dark ? "text-white/60" : "text-gray-700"}`}
                      >
                        Банк:
                      </span>{" "}
                      {m.bank_name ?? "—"} · {m.bank_account ?? "—"}
                    </p>
                    <p
                      className={`text-xs ${dark ? "text-white/40" : "text-gray-500"}`}
                    >
                      <span
                        className={`font-medium ${dark ? "text-white/60" : "text-gray-700"}`}
                      >
                        Утас:
                      </span>{" "}
                      {m.phone ?? "—"}
                    </p>
                  </div>

                  {/* Mini stats */}
                  <div
                    className={`mt-3 flex gap-3 rounded-xl p-3 ${dark ? "bg-white/5" : "bg-gray-50"}`}
                  >
                    <div className="flex-1 text-center">
                      <p
                        className={`text-lg font-bold ${dark ? "text-white" : "text-gray-900"}`}
                      >
                        {m.consultations.filter((c) => c.date.startsWith(currentMonthPrefix) && (c.status === "completed" || (c.status !== "cancelled" && c.paid_at))).length}/{m.consultations.filter((c) => c.date.startsWith(currentMonthPrefix) && c.status !== "cancelled").length}
                      </p>
                      <p
                        className={`text-[10px] ${dark ? "text-white/30" : "text-gray-400"}`}
                      >
                        Захиалга
                      </p>
                    </div>
                    <div
                      className={`w-px ${dark ? "bg-white/10" : "bg-gray-200"}`}
                    />
                    <div className="flex-1 text-center">
                      <p className="text-lg font-bold text-emerald-500">
                        {monthIncome >= 1000
                          ? (monthIncome / 1000).toFixed(0) + "K"
                          : monthIncome.toLocaleString()}₮
                      </p>
                      <p
                        className={`text-[10px] ${dark ? "text-white/30" : "text-gray-400"}`}
                      >
                        Орлого
                      </p>
                    </div>
                  </div>

                  <div
                    className={`mt-4 flex gap-2 border-t pt-4 ${dark ? "border-white/5" : "border-gray-100"}`}
                  >
                    <Link
                      href={`/admin/team/${m.id}`}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium ${dark ? "text-purple-400 hover:bg-white/10" : "text-purple-600 hover:bg-purple-50"}`}
                    >
                      Дэлгэрэнгүй
                    </Link>
                    {(!isCounselor || m.id === myCounselorId) && (
                      <Link
                        href={`/admin/team/${m.id}?edit=true`}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium ${dark ? "text-white/50 hover:bg-white/10" : "text-gray-500 hover:bg-gray-50"}`}
                      >
                        Засах
                      </Link>
                    )}
                    {!isCounselor && (
                      <button
                        onClick={() => remove(m.id)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium ${dark ? "text-red-400 hover:bg-red-500/10" : "text-red-500 hover:bg-red-50"}`}
                      >
                        Устгах
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
