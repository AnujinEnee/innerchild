"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "../../ThemeContext";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import RichTextEditor from "@/components/RichTextEditor";
import { uploadImage } from "@/lib/upload-image";

type TeamRole = string;

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

interface WorkTask {
  id: string;
  team_member_id: string;
  date: string;
  time: string;
  duration_minutes: number;
  client_name: string | null;
  type: "online" | "offline";
  done: boolean;
  income: number;
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
}

const ROLE_LABELS: Record<string, string> = {
  psychologist: "Сэтгэл зүйч",
  therapist: "Сэтгэл засалч",
};
const roleLabel = (role: string) => ROLE_LABELS[role] ?? role;

const MONTH_NAMES = [
  "1-р сар", "2-р сар", "3-р сар", "4-р сар", "5-р сар", "6-р сар",
  "7-р сар", "8-р сар", "9-р сар", "10-р сар", "11-р сар", "12-р сар",
];

function parseList(val: string | null): string[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return val.split(",").map((s) => s.trim()).filter(Boolean);
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function ListInput({
  items, onChange, placeholder, inputCls, dark,
}: {
  items: string[]; onChange: (items: string[]) => void; placeholder: string; inputCls: string; dark: boolean;
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
        <input type="text" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} placeholder={placeholder} className={inputCls} />
        <button type="button" onClick={add} className="shrink-0 rounded-xl bg-purple-600 px-3 py-2 text-xs font-medium text-white hover:bg-purple-700">+</button>
      </div>
      {items.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <span key={i} className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs ${dark ? "bg-white/10 text-white/70" : "bg-purple-100 text-purple-700"}`}>
              {item}
              <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className={`ml-0.5 ${dark ? "text-white/40 hover:text-white" : "text-purple-400 hover:text-purple-700"}`}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const dark = theme === "dark";

  const searchParams = useSearchParams();
  const [member, setMember] = useState<TeamMember | null>(null);
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [consultations, setConsultations] = useState<ConsultationRecord[]>([]);
  const [slots, setSlots] = useState<{ id: string; date: string; time: string }[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    last_name: "", first_name: "", role: "psychologist" as TeamRole,
    expertise: [] as string[], education: [] as string[],
    experience: [] as string[], additional_experience: [] as string[],
    bio: "", phone: "", address: "", bank_name: "", bank_account: "",
    image_url: "", email: "",
    online_price: 50000, offline_price: 80000, online_duration: 60, offline_duration: 60,
  });

  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());
  const todayStr = now.toISOString().slice(0, 10);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: mData }, { data: tData }, { data: cData }, { data: sData }] = await Promise.all([
        supabase.from("team_members").select("*").eq("id", id).single(),
        supabase.from("work_tasks").select("*").eq("team_member_id", id).order("date"),
        supabase.from("consultations")
          .select("id, date, time, duration_minutes, type, status, price, paid_at, counselor_id, users(first_name, last_name)")
          .eq("counselor_id", id)
          .order("date"),
        supabase.from("available_slots").select("id, date, time").eq("team_member_id", id).order("date"),
      ]);
      if (mData) setMember(mData as unknown as TeamMember);
      setTasks((tData ?? []) as unknown as WorkTask[]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setConsultations((cData ?? []).map((c: any) => ({
        id: c.id,
        date: c.date,
        time: c.time,
        duration_minutes: c.duration_minutes ?? 60,
        type: c.type,
        status: c.status,
        price: c.price,
        paid_at: c.paid_at,
        client_name: c.users ? `${c.users.last_name ?? ""} ${c.users.first_name ?? ""}`.trim() : null,
      })));
      setSlots((sData ?? []) as { id: string; date: string; time: string }[]);
      setLoading(false);
      // Auto-open edit if ?edit=true
      if (searchParams.get("edit") === "true" && mData) {
        const m = mData as unknown as TeamMember;
        setForm({
          last_name: m.last_name, first_name: m.first_name, role: m.role,
          expertise: parseList(m.expertise), education: parseList(m.education),
          experience: parseList(m.experience), additional_experience: parseList(m.additional_experience),
          bio: m.bio ?? "", phone: m.phone ?? "", address: m.address ?? "",
          bank_name: m.bank_name ?? "", bank_account: m.bank_account ?? "",
          image_url: m.image_url ?? "", email: m.email ?? "",
          online_price: m.online_price ?? 50000, offline_price: m.offline_price ?? 80000,
          online_duration: m.online_duration ?? 60, offline_duration: m.offline_duration ?? 60,
        });
        setEditing(true);
      }
    }
    load();
  }, [id, searchParams]);

  function startEdit() {
    if (!member) return;
    setForm({
      last_name: member.last_name, first_name: member.first_name, role: member.role,
      expertise: parseList(member.expertise), education: parseList(member.education),
      experience: parseList(member.experience), additional_experience: parseList(member.additional_experience),
      bio: member.bio ?? "", phone: member.phone ?? "", address: member.address ?? "",
      bank_name: member.bank_name ?? "", bank_account: member.bank_account ?? "",
      image_url: member.image_url ?? "", email: member.email ?? "",
      online_price: member.online_price ?? 50000, offline_price: member.offline_price ?? 80000,
      online_duration: member.online_duration ?? 60, offline_duration: member.offline_duration ?? 60,
    });
    setEditing(true);
  }

  async function saveEdit() {
    if (!member) return;
    setSaving(true);
    const payload = {
      last_name: form.last_name, first_name: form.first_name, role: form.role,
      expertise: form.expertise.length ? JSON.stringify(form.expertise) : null,
      education: form.education.length ? JSON.stringify(form.education) : null,
      experience: form.experience.length ? JSON.stringify(form.experience) : null,
      additional_experience: form.additional_experience.length ? JSON.stringify(form.additional_experience) : null,
      bio: form.bio || null, phone: form.phone || null, address: form.address || null,
      bank_name: form.bank_name || null, bank_account: form.bank_account || null,
      image_url: form.image_url || null, email: form.email || null,
      online_price: Number(form.online_price) || 50000, offline_price: Number(form.offline_price) || 80000,
      online_duration: Number(form.online_duration) || 60, offline_duration: Number(form.offline_duration) || 60,
    };
    const { error } = await createClient().from("team_members").update(payload).eq("id", member.id);
    if (error) { alert(`Алдаа: ${error.message}`); setSaving(false); return; }
    setMember({ ...member, ...payload });
    setEditing(false);
    setSaving(false);
  }

  const inputCls = dark
    ? "bg-white/10 text-white placeholder:text-white/30 focus:bg-white/15"
    : "border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-purple-500";

  const monthPrefix = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
  const monthTasks = tasks.filter((t) => t.date.startsWith(monthPrefix));
  const monthConsults = consultations.filter((c) => c.date?.startsWith(monthPrefix) && c.status !== "cancelled");
  const doneIncome = monthTasks.filter((t) => t.done).reduce((s, t) => s + t.income, 0)
    + monthConsults.filter((c) => c.paid_at).reduce((s, c) => s + c.price, 0);
  const totalIncome = monthTasks.reduce((s, t) => s + t.income, 0)
    + monthConsults.reduce((s, c) => s + c.price, 0);

  async function toggleTask(taskId: string) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const newDone = !task.done;
    const { error } = await createClient().from("work_tasks").update({ done: newDone }).eq("id", taskId);
    if (error) { alert(`Алдаа: ${error.message}`); return; }
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, done: newDone } : t));
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className={dark ? "text-white/50" : "text-gray-500"}>Мэдээлэл олдсонгүй</p>
        <Link href="/admin/team" className="text-sm text-purple-600 hover:underline">← Буцах</Link>
      </div>
    );
  }

  const STATUS: Record<string, { label: string; cls: string }> = {
    normal: { label: "Хүлээгдэж буй", cls: "text-amber-500" },
    completed: { label: "Дууссан", cls: "text-emerald-500" },
    cancelled: { label: "Цуцлагдсан", cls: "text-red-400" },
  };

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => router.push("/admin/team")}
        className={`mb-6 flex items-center gap-2 text-sm font-medium ${dark ? "text-white/50 hover:text-white" : "text-gray-500 hover:text-gray-900"}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Буцах
      </button>

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-purple-600 to-indigo-700">
        <div className="px-8 pb-8 pt-10">
          <div className="flex items-end gap-6">
            <div className={`h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 ${dark ? "border-[#1e1e36]" : "border-white"} bg-gray-200`}>
              {member.image_url ? (
                <img src={member.image_url} alt={member.first_name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-purple-100 text-3xl font-bold text-purple-600">
                  {member.first_name.charAt(0)}
                </div>
              )}
            </div>
            <div className="pb-1">
              <h1 className="text-2xl font-bold text-white">
                {member.last_name} {member.first_name}
              </h1>
              <p className="mt-1 text-sm font-medium text-purple-200">
                {roleLabel(member.role)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit / View toggle button */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => editing ? setEditing(false) : startEdit()}
          className={`rounded-xl px-5 py-2.5 text-sm font-medium ${editing ? (dark ? "text-white/50 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100") : "bg-purple-600 text-white hover:bg-purple-700"}`}
        >
          {editing ? "Болих" : "Засах"}
        </button>
      </div>

      {editing ? (
        /* ===== EDIT FORM ===== */
        <div className="mt-6 flex flex-col gap-5">
          {/* Image upload */}
          <div>
            <label className={`mb-2 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Зураг</label>
            <div className="flex items-center gap-4">
              <div className={`h-24 w-24 overflow-hidden rounded-2xl ${dark ? "bg-white/10" : "bg-gray-100"}`}>
                {form.image_url ? (
                  <img src={form.image_url} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`h-8 w-8 ${dark ? "text-white/20" : "text-gray-300"}`}>
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                  </div>
                )}
              </div>
              <label className="cursor-pointer rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700">
                Зураг оруулах
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  try {
                    const url = await uploadImage(file);
                    setForm({ ...form, image_url: url });
                  } catch (err) {
                    alert(`Зураг upload хийхэд алдаа: ${err instanceof Error ? err.message : "тодорхойгүй"}`);
                  }
                }} />
              </label>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Овог</label>
              <input type="text" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Овог" className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`} />
            </div>
            <div>
              <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Нэр</label>
              <input type="text" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="Нэр" className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`} />
            </div>
            <div>
              <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Албан тушаал</label>
              <input type="text" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Жишээ: Сэтгэл зүйч" className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`} />
            </div>
            <div>
              <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Утас</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="9911-2233" className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`} />
            </div>
            <div>
              <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>И-мэйл</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`} />
            </div>
            <div>
              <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Хаяг</label>
              <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Хаяг" className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`} />
            </div>
            <div>
              <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Банк</label>
              <input type="text" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} placeholder="Хаан банк" className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`} />
            </div>
            <div>
              <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Дансны дугаар</label>
              <input type="text" value={form.bank_account} onChange={(e) => setForm({ ...form, bank_account: e.target.value })} placeholder="5000-1234-5678" className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`} />
            </div>
          </div>

          {/* List inputs */}
          {([
            { label: "Боловсролын туршлага", key: "education" as const, ph: "Боловсрол нэмэх..." },
            { label: "Ажлын туршлага", key: "experience" as const, ph: "Туршлага нэмэх..." },
            { label: "Нэмэлт туршлага", key: "additional_experience" as const, ph: "Нэмэлт туршлага нэмэх..." },
            { label: "Мэргэшиж буй салбарууд", key: "expertise" as const, ph: "Мэргэшил нэмэх..." },
          ] as const).map(({ label, key, ph }) => (
            <div key={key}>
              <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>{label}</label>
              <ListInput items={form[key]} onChange={(v) => setForm({ ...form, [key]: v })} placeholder={ph} inputCls={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`} dark={dark} />
            </div>
          ))}

          {/* Pricing */}
          <div className={`rounded-xl p-4 ${dark ? "bg-white/5" : "bg-purple-50"}`}>
            <p className={`mb-3 text-xs font-semibold ${dark ? "text-white/50" : "text-purple-600"}`}>Зөвлөгөөний тохиргоо</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Онлайн үнэ (₮)</label>
                <input type="text" inputMode="numeric" value={form.online_price} onChange={(e) => setForm({ ...form, online_price: Number(e.target.value.replace(/\D/g, "")) })} className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`} />
              </div>
              <div>
                <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Биечлэн үнэ (₮)</label>
                <input type="text" inputMode="numeric" value={form.offline_price} onChange={(e) => setForm({ ...form, offline_price: Number(e.target.value.replace(/\D/g, "")) })} className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`} />
              </div>
              <div>
                <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Онлайн хугацаа (мин)</label>
                <input type="text" inputMode="numeric" value={form.online_duration} onChange={(e) => setForm({ ...form, online_duration: Number(e.target.value.replace(/\D/g, "")) })} className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`} />
              </div>
              <div>
                <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Биечлэн хугацаа (мин)</label>
                <input type="text" inputMode="numeric" value={form.offline_duration} onChange={(e) => setForm({ ...form, offline_duration: Number(e.target.value.replace(/\D/g, "")) })} className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`} />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Намтар / Миний тухай</label>
            <RichTextEditor content={form.bio} onChange={(html) => setForm({ ...form, bio: html })} dark={dark} minHeight="150px" />
          </div>

          <div className="flex gap-3">
            <button onClick={saveEdit} disabled={saving} className="rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50">
              {saving ? "Хадгалж байна..." : "Хадгалах"}
            </button>
            <button onClick={() => setEditing(false)} className={`rounded-xl px-5 py-2.5 text-sm font-medium ${dark ? "text-white/50 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"}`}>
              Болих
            </button>
          </div>
        </div>
      ) : (
      /* ===== VIEW MODE ===== */
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left column */}
        <div className="flex flex-col gap-6">
          {/* List fields */}
          {[
            { label: "Боловсролын туршлага", val: member.education },
            { label: "Ажлын туршлага", val: member.experience },
            { label: "Нэмэлт туршлага", val: member.additional_experience },
            { label: "Мэргэшиж буй салбарууд", val: member.expertise },
          ].map((item) => {
            const list = parseList(item.val);
            if (list.length === 0) return null;
            return (
              <div key={item.label} className={`rounded-xl p-5 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                <p className={`mb-3 text-xs font-semibold uppercase tracking-wider ${dark ? "text-white/40" : "text-gray-400"}`}>
                  {item.label}
                </p>
                <ul className="flex flex-col gap-2">
                  {list.map((entry, i) => (
                    <li key={i} className={`flex items-start gap-2.5 text-sm ${dark ? "text-white" : "text-gray-900"}`}>
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500" />
                      {entry}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {/* Bio */}
          {member.bio && (
            <div className={`rounded-xl p-5 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
              <p className={`mb-3 text-xs font-semibold uppercase tracking-wider ${dark ? "text-white/40" : "text-gray-400"}`}>
                Намтар
              </p>
              <div
                className={`prose prose-sm max-w-none text-sm leading-relaxed text-justify ${dark ? "text-white/70" : "text-gray-600"} [&_p]:mb-2 [&_p:last-child]:mb-0`}
                dangerouslySetInnerHTML={{ __html: member.bio }}
              />
            </div>
          )}

          {/* Consultation pricing table */}
          <div className={`overflow-hidden rounded-xl ${dark ? "bg-white/5" : "bg-gray-50"}`}>
            <p className={`px-5 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider ${dark ? "text-white/40" : "text-gray-400"}`}>
              Зөвлөгөөний тохиргоо
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className={dark ? "text-white/40" : "text-gray-400"}>
                  <th className="px-5 py-2 text-left text-xs font-medium"></th>
                  <th className="px-5 py-2 text-right text-xs font-medium">Үнэ</th>
                  <th className="px-5 py-2 text-right text-xs font-medium">Хугацаа</th>
                  <th className="px-5 py-2 text-right text-xs font-medium">Төлөв</th>
                </tr>
              </thead>
              <tbody>
                <tr className={`border-t ${dark ? "border-white/5" : "border-gray-200"}`}>
                  <td className={`px-5 py-3 font-medium ${dark ? "text-white" : "text-gray-900"}`}>
                    <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-500" />
                    Онлайн
                  </td>
                  <td className={`px-5 py-3 text-right font-semibold ${dark ? "text-white" : "text-gray-900"}`}>
                    {member.online_price ? `${member.online_price.toLocaleString()}₮` : "—"}
                  </td>
                  <td className={`px-5 py-3 text-right ${dark ? "text-white/70" : "text-gray-600"}`}>
                    {member.online_duration ? `${member.online_duration} мин` : "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={async () => {
                        const newVal = !member.online_enabled;
                        await createClient().from("team_members").update({ online_enabled: newVal }).eq("id", member.id);
                        setMember({ ...member, online_enabled: newVal });
                      }}
                      className={`relative inline-block h-6 w-11 rounded-full transition-colors ${member.online_enabled ? "bg-emerald-500" : dark ? "bg-white/20" : "bg-gray-300"}`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${member.online_enabled ? "left-5.5" : "left-0.5"}`} />
                    </button>
                  </td>
                </tr>
                <tr className={`border-t ${dark ? "border-white/5" : "border-gray-200"}`}>
                  <td className={`px-5 py-3 font-medium ${dark ? "text-white" : "text-gray-900"}`}>
                    <span className="mr-2 inline-block h-2 w-2 rounded-full bg-purple-500" />
                    Биечлэн
                  </td>
                  <td className={`px-5 py-3 text-right font-semibold ${dark ? "text-white" : "text-gray-900"}`}>
                    {member.offline_price ? `${member.offline_price.toLocaleString()}₮` : "—"}
                  </td>
                  <td className={`px-5 py-3 text-right ${dark ? "text-white/70" : "text-gray-600"}`}>
                    {member.offline_duration ? `${member.offline_duration} мин` : "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={async () => {
                        const newVal = !member.offline_enabled;
                        await createClient().from("team_members").update({ offline_enabled: newVal }).eq("id", member.id);
                        setMember({ ...member, offline_enabled: newVal });
                      }}
                      className={`relative inline-block h-6 w-11 rounded-full transition-colors ${member.offline_enabled ? "bg-emerald-500" : dark ? "bg-white/20" : "bg-gray-300"}`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${member.offline_enabled ? "left-5.5" : "left-0.5"}`} />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Info grid */}
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Утас", val: member.phone },
              { label: "И-мэйл", val: member.email },
              { label: "Хаяг", val: member.address },
              { label: "Банк", val: member.bank_name },
              { label: "Дансны дугаар", val: member.bank_account },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl p-4 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                <p className={`text-xs font-medium ${dark ? "text-white/40" : "text-gray-400"}`}>{item.label}</p>
                <p className={`mt-1 text-sm font-medium ${dark ? "text-white" : "text-gray-900"}`}>{item.val || "—"}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right column — calendar & tasks */}
        <div className="flex flex-col gap-4">
          {/* Month nav */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }}
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${dark ? "hover:bg-white/10 text-white/50" : "hover:bg-gray-100 text-gray-500"}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <span className={`text-sm font-medium ${dark ? "text-white" : "text-gray-900"}`}>
              {calYear} {MONTH_NAMES[calMonth]}
            </span>
            <button
              onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }}
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${dark ? "hover:bg-white/10 text-white/50" : "hover:bg-gray-100 text-gray-500"}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>

          {/* Mini calendar */}
          <div className={`rounded-xl p-4 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
            <div className="grid grid-cols-7 gap-1 text-center">
              {["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"].map((d) => (
                <div key={d} className={`pb-2 text-xs font-medium ${dark ? "text-white/30" : "text-gray-400"}`}>{d}</div>
              ))}
              {Array.from({ length: getFirstDayOfMonth(calYear, calMonth) }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: getDaysInMonth(calYear, calMonth) }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayTasks = tasks.filter((t) => t.date === dateStr);
                const dayConsults = consultations.filter((c) => c.date === dateStr && c.status !== "cancelled");
                const daySlots = slots.filter((s) => s.date === dateStr);
                const hasOnline = dayTasks.some((t) => t.type === "online") || dayConsults.some((c) => c.type === "online");
                const hasOffline = dayTasks.some((t) => t.type === "offline") || dayConsults.some((c) => c.type === "offline");
                const hasSlots = daySlots.length > 0;
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                return (
                  <div key={day} onClick={() => setSelectedDate(isSelected ? null : dateStr)} className={`relative flex h-10 cursor-pointer flex-col items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                    isSelected ? "bg-purple-600 text-white ring-2 ring-purple-400"
                      : isToday ? "bg-pink-600 text-white"
                      : hasSlots || dayTasks.length > 0 || dayConsults.length > 0
                        ? dark ? "bg-white/10 text-white" : "bg-purple-50 text-purple-700"
                        : dark ? "text-white/50 hover:bg-white/5" : "text-gray-600 hover:bg-gray-100"
                  }`}>
                    {day}
                    {(hasSlots || dayTasks.length > 0 || dayConsults.length > 0) && (
                      <span className="absolute bottom-0.5 flex gap-0.5">
                        {hasSlots && <span className={`text-[6px] font-bold ${isToday || isSelected ? "text-white" : "text-pink-500"}`}>●</span>}
                        {hasOnline && <span className={`text-[6px] font-bold ${isToday || isSelected ? "text-white" : "text-green-500"}`}>О</span>}
                        {hasOffline && <span className={`text-[6px] font-bold ${isToday || isSelected ? "text-white" : "text-purple-500"}`}>Б</span>}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className={`mt-3 flex items-center justify-center gap-4 text-[10px] font-medium ${dark ? "text-white/40" : "text-gray-400"}`}>
              <span className="flex items-center gap-1">
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-green-500/15 text-[7px] font-bold text-green-500">О</span>
                Онлайн
              </span>
              <span className="flex items-center gap-1">
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-purple-500/15 text-[7px] font-bold text-purple-500">Б</span>
                Биечлэн
              </span>
            </div>
          </div>

          {/* Schedule — when a day is selected */}
          {selectedDate && (() => {
            const dayAvailable = slots.filter((s) => s.date === selectedDate).map((s) => s.time.slice(0, 5));
            const dayConsults = consultations.filter((c) => c.date === selectedDate && c.status !== "cancelled");
            const FIXED_SLOTS = ["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00"];

            async function toggleSlot(time: string) {
              if (!member || scheduleSaving) return;
              setScheduleSaving(true);
              const existing = slots.find((s) => s.date === selectedDate && s.time.slice(0, 5) === time);
              if (existing) {
                const { error } = await createClient().from("available_slots").delete().eq("id", existing.id);
                if (error) { alert(`Алдаа: ${error.message}`); setScheduleSaving(false); return; }
                setSlots((prev) => prev.filter((s) => s.id !== existing.id));
              } else {
                const { data, error } = await createClient().from("available_slots").insert({
                  team_member_id: member.id, date: selectedDate, time: time,
                }).select().single();
                if (error) { alert(`Алдаа: ${error.message}`); setScheduleSaving(false); return; }
                if (data) setSlots((prev) => [...prev, data as { id: string; date: string; time: string }]);
              }
              setScheduleSaving(false);
            }

            return (
              <div className={`rounded-xl p-4 ${dark ? "bg-white/5 border border-white/10" : "bg-purple-50 border border-purple-100"}`}>
                <div className="mb-3 flex items-center justify-between">
                  <p className={`text-sm font-semibold ${dark ? "text-white" : "text-gray-900"}`}>{selectedDate}</p>
                  <button onClick={() => setSelectedDate(null)} className={`text-xs ${dark ? "text-white/40 hover:text-white" : "text-gray-400 hover:text-gray-600"}`}>✕</button>
                </div>
                <p className={`mb-3 text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>Бүх цаг идэвхтэй. Шаардлагатай бол дарж идэвхгүй болгоно.</p>

                <div className="grid grid-cols-4 gap-1.5">
                  {FIXED_SLOTS.map((time) => {
                    const isDisabled = dayAvailable.includes(time);
                    const consult = dayConsults.find((c) => c.time.slice(0, 5) === time);
                    const hasConsult = !!consult;
                    return (
                      <button
                        key={time}
                        disabled={scheduleSaving || hasConsult}
                        onClick={() => toggleSlot(time)}
                        className={`flex items-center justify-center gap-1 rounded-lg py-2.5 text-xs font-medium transition-colors ${
                          hasConsult
                            ? dark ? "bg-green-500/20 text-green-400 cursor-not-allowed" : "bg-green-100 text-green-700 cursor-not-allowed"
                            : isDisabled
                              ? dark ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-600"
                              : dark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {time}
                        {hasConsult && <span className="text-[8px]">захиалга</span>}
                      </button>
                    );
                  })}
                </div>
                <div className={`mt-3 flex items-center gap-3 text-[10px] ${dark ? "text-white/30" : "text-gray-400"}`}>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Идэвхтэй</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Идэвхгүй</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Захиалгатай</span>
                </div>
              </div>
            );
          })()}

          {/* Consultations */}
          {monthConsults.length > 0 && (
            <div className="space-y-2">
              <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? "text-white/30" : "text-gray-400"}`}>Захиалгууд</p>
              {monthConsults.map((c) => {
                const end = new Date(`${c.date}T${c.time}`);
                end.setMinutes(end.getMinutes() + (c.duration_minutes ?? 60));
                const isOver = end <= new Date();
                const effectiveStatus = c.status === "cancelled" ? "cancelled" : isOver ? "completed" : "normal";
                const st = STATUS[effectiveStatus] ?? STATUS.normal;
                return (
                  <div key={c.id} className={`flex items-center justify-between rounded-xl px-4 py-3 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${c.type === "online" ? "bg-green-500/15" : "bg-purple-500/15"}`}>
                        <span className="text-sm">{c.type === "online" ? "🎥" : "🏢"}</span>
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${dark ? "text-white" : "text-gray-900"}`}>{c.client_name || "Зочин"}</p>
                        <p className={`text-xs ${dark ? "text-white/30" : "text-gray-400"}`}>{c.date} · {c.time?.slice(0, 5)} · {c.duration_minutes}мин</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${dark ? "text-white/80" : "text-gray-700"}`}>{c.price.toLocaleString()}₮</p>
                      <p className={`text-xs ${st.cls}`}>{st.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tasks */}
          <div className="space-y-2">
            {monthTasks.length === 0 && monthConsults.length === 0 ? (
              <p className={`py-4 text-center text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>Энэ сард ажил байхгүй</p>
            ) : monthTasks.length > 0 && (
              monthTasks.map((t) => (
                <div key={t.id} className={`flex items-center justify-between rounded-xl px-4 py-3 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleTask(t.id)}
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                        t.done ? "border-emerald-500 bg-emerald-500" : dark ? "border-white/20" : "border-gray-300"
                      }`}
                    >
                      {t.done && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="h-3 w-3"><polyline points="20 6 9 17 4 12" /></svg>
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${t.done ? (dark ? "text-white/40 line-through" : "text-gray-400 line-through") : dark ? "text-white" : "text-gray-900"}`}>
                          {t.client_name ?? "—"}
                        </p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${t.type === "online" ? "bg-green-500/15 text-green-500" : "bg-purple-500/15 text-purple-500"}`}>
                          {t.type === "online" ? "Онлайн" : "Биечлэн"}
                        </span>
                      </div>
                      <p className={`text-xs ${dark ? "text-white/30" : "text-gray-400"}`}>{t.date} · {t.time} · {t.duration_minutes}мин</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${t.done ? "text-emerald-500" : dark ? "text-white/60" : "text-gray-500"}`}>{t.income.toLocaleString()}₮</p>
                    <p className={`text-xs ${t.done ? "text-emerald-400/70" : dark ? "text-amber-400/70" : "text-amber-500"}`}>{t.done ? "Гүйцэтгэсэн" : "Хүлээгдэж буй"}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Monthly income */}
          <div className={`flex items-center justify-between rounded-xl p-4 ${dark ? "bg-linear-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20" : "bg-purple-50 border border-purple-100"}`}>
            <div>
              <p className={`text-xs font-medium ${dark ? "text-white/40" : "text-gray-500"}`}>{calYear} {MONTH_NAMES[calMonth]} орлого</p>
              <p className={`mt-1 text-2xl font-bold ${dark ? "text-white" : "text-gray-900"}`}>{doneIncome.toLocaleString()}₮</p>
            </div>
            <div className="text-right">
              <p className={`text-xs font-medium ${dark ? "text-white/40" : "text-gray-500"}`}>Нийт төлөвлөсөн</p>
              <p className={`mt-1 text-lg font-semibold ${dark ? "text-white/50" : "text-gray-400"}`}>{totalIncome.toLocaleString()}₮</p>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
