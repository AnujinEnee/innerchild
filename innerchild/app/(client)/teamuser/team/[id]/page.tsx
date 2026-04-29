"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "../../ThemeContext";
import { createClient } from "@/lib/supabase/client";
import RichTextEditor from "@/components/RichTextEditor";

interface TeamMember {
  id: string;
  last_name: string;
  first_name: string;
  role: string;
  expertise: string | null;
  education: string | null;
  experience: string | null;
  additional_experience: string | null;
  bio: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  bank_name: string | null;
  bank_account: string | null;
  image_url: string | null;
  online_price: number | null;
  offline_price: number | null;
  online_duration: number | null;
  offline_duration: number | null;
  online_enabled: boolean;
  offline_enabled: boolean;
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

const MONTH_NAMES = ["1-р сар","2-р сар","3-р сар","4-р сар","5-р сар","6-р сар","7-р сар","8-р сар","9-р сар","10-р сар","11-р сар","12-р сар"];
function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfMonth(y: number, m: number) { return new Date(y, m, 1).getDay(); }

const ROLE_LABELS: Record<string, string> = {
  psychologist: "Сэтгэл зүйч",
  therapist: "Сэтгэл засалч",
};

function parseList(val: string | null): string[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return val.split(",").map((s) => s.trim()).filter(Boolean);
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
        <button type="button" onClick={add} className="shrink-0 rounded-xl bg-pink-600 px-3 py-2 text-xs font-medium text-white hover:bg-pink-700">+</button>
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

export default function TeamUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [member, setMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [slots, setSlots] = useState<{ id: string; date: string; time: string }[]>([]);
  const [consultations, setConsultations] = useState<ConsultationRecord[]>([]);
  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());
  const todayStr = now.toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    last_name: "", first_name: "",
    expertise: [] as string[], education: [] as string[],
    experience: [] as string[], additional_experience: [] as string[],
    phone: "", address: "", bank_name: "", bank_account: "", bio: "",
  });

  useEffect(() => {
    const myTeamId = localStorage.getItem("team_user_id") ?? "";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMyId(myTeamId);
    async function load() {
      const supabase = createClient();
      const { data: mData } = await supabase.from("team_members").select("*").eq("id", id).single();
      if (mData) setMember(mData as unknown as TeamMember);
      // Fetch slots & consultations only for own profile
      if (myTeamId === id) {
        const [{ data: sData }, { data: cData }] = await Promise.all([
          supabase.from("available_slots").select("id, date, time").eq("team_member_id", id).order("date"),
          supabase.from("consultations")
            .select("id, date, time, duration_minutes, type, status, price, paid_at, counselor_id, users(first_name, last_name)")
            .eq("counselor_id", id).order("date"),
        ]);
        setSlots((sData ?? []) as { id: string; date: string; time: string }[]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setConsultations((cData ?? []).map((c: any) => ({
          id: c.id, date: c.date, time: c.time, duration_minutes: c.duration_minutes ?? 60,
          type: c.type, status: c.status, price: c.price, paid_at: c.paid_at,
          client_name: c.users ? `${c.users.last_name ?? ""} ${c.users.first_name ?? ""}`.trim() : null,
        })));
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const isMe = member?.id === myId;


  function startEdit() {
    if (!member) return;
    setEditForm({
      last_name: member.last_name ?? "",
      first_name: member.first_name ?? "",
      expertise: parseList(member.expertise),
      education: parseList(member.education),
      experience: parseList(member.experience),
      additional_experience: parseList(member.additional_experience),
      phone: member.phone ?? "",
      address: member.address ?? "",
      bank_name: member.bank_name ?? "",
      bank_account: member.bank_account ?? "",
      bio: member.bio ?? "",
    });
    setEditing(true);
  }

  async function saveEdit() {
    if (!member) return;
    setSaving(true);
    const payload = {
      last_name: editForm.last_name || null,
      first_name: editForm.first_name || null,
      expertise: editForm.expertise.length ? JSON.stringify(editForm.expertise) : null,
      education: editForm.education.length ? JSON.stringify(editForm.education) : null,
      experience: editForm.experience.length ? JSON.stringify(editForm.experience) : null,
      additional_experience: editForm.additional_experience.length ? JSON.stringify(editForm.additional_experience) : null,
      phone: editForm.phone || null,
      address: editForm.address || null,
      bank_name: editForm.bank_name || null,
      bank_account: editForm.bank_account || null,
      bio: editForm.bio || null,
    };
    const { error } = await createClient().from("team_members").update(payload).eq("id", member.id);
    if (error) { alert(`Алдаа: ${error.message}`); setSaving(false); return; }
    setMember({ ...member, ...payload, last_name: editForm.last_name, first_name: editForm.first_name });
    setEditing(false);
    setSaving(false);
  }

  const inputCls = `w-full rounded-xl px-4 py-2.5 text-sm outline-none ${
    dark ? "bg-white/10 text-white placeholder:text-white/30" : "border border-gray-200 text-gray-900 placeholder:text-gray-400"
  }`;

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
        <button onClick={() => router.push("/teamuser/team")} className="text-sm text-purple-600 hover:underline">← Буцах</button>
      </div>
    );
  }

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => router.push("/teamuser/team")}
        className={`mb-6 flex items-center gap-2 text-sm font-medium ${dark ? "text-white/50 hover:text-white" : "text-gray-500 hover:text-gray-900"}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        Буцах
      </button>

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-pink-600 to-purple-700">
        <div className="px-6 pb-6 pt-8 sm:px-8 sm:pb-8 sm:pt-10">
          <div className="flex items-end gap-5">
            <div className={`h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 sm:h-24 sm:w-24 ${dark ? "border-[#1e1e36]" : "border-white"} bg-gray-200`}>
              {member.image_url ? (
                <img src={member.image_url} alt={member.first_name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-purple-100 text-2xl font-bold text-purple-600 sm:text-3xl">
                  {member.first_name.charAt(0)}
                </div>
              )}
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white sm:text-2xl">{member.last_name} {member.first_name}</h1>
                {isMe && <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-medium text-white">Би</span>}
              </div>
              <p className="mt-1 text-sm font-medium text-pink-200">{ROLE_LABELS[member.role] ?? member.role}</p>
            </div>
          </div>
        </div>
      </div>

      {!editing ? (
        <div className="mt-6 flex flex-col gap-5">
          {/* Pricing table — only for own profile */}
          {isMe && (
            <div className={`overflow-hidden rounded-xl ${dark ? "bg-white/5" : "bg-gray-50"}`}>
              <p className={`px-5 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider ${dark ? "text-white/40" : "text-gray-400"}`}>Зөвлөгөөний тохиргоо</p>
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
                  <tr className={`border-t ${dark ? "border-white/5" : "border-gray-200"} ${!member.online_enabled ? "opacity-40" : ""}`}>
                    <td className={`px-5 py-3 font-medium ${dark ? "text-white" : "text-gray-900"}`}>
                      <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-500" />Онлайн
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
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${member.online_enabled ? "bg-green-500" : dark ? "bg-white/20" : "bg-gray-300"}`}
                      >
                        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${member.online_enabled ? "translate-x-5.5" : "translate-x-0.5"}`} />
                      </button>
                    </td>
                  </tr>
                  <tr className={`border-t ${dark ? "border-white/5" : "border-gray-200"} ${!member.offline_enabled ? "opacity-40" : ""}`}>
                    <td className={`px-5 py-3 font-medium ${dark ? "text-white" : "text-gray-900"}`}>
                      <span className="mr-2 inline-block h-2 w-2 rounded-full bg-purple-500" />Биечлэн
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
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${member.offline_enabled ? "bg-green-500" : dark ? "bg-white/20" : "bg-gray-300"}`}
                      >
                        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${member.offline_enabled ? "translate-x-5.5" : "translate-x-0.5"}`} />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

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
                <p className={`mb-3 text-xs font-semibold uppercase tracking-wider ${dark ? "text-white/40" : "text-gray-400"}`}>{item.label}</p>
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
              <p className={`mb-3 text-xs font-semibold uppercase tracking-wider ${dark ? "text-white/40" : "text-gray-400"}`}>Намтар</p>
              <div className={`prose prose-sm max-w-none text-sm leading-relaxed text-justify ${dark ? "text-white/70" : "text-gray-600"} [&_p]:mb-2 [&_p:last-child]:mb-0`} dangerouslySetInnerHTML={{ __html: member.bio }} />
            </div>
          )}

          {/* Info grid */}
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Утас", val: member.phone },
              { label: "И-мэйл", val: member.email },
              { label: "Хаяг", val: member.address },
              ...(isMe ? [
                { label: "Банк", val: member.bank_name },
                { label: "Дансны дугаар", val: member.bank_account },
              ] : []),
            ].map((item) => (
              <div key={item.label} className={`rounded-xl p-4 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                <p className={`text-xs font-medium ${dark ? "text-white/40" : "text-gray-400"}`}>{item.label}</p>
                <p className={`mt-1 text-sm font-medium ${dark ? "text-white" : "text-gray-900"}`}>{item.val || "—"}</p>
              </div>
            ))}
          </div>

          {/* Calendar & Tasks — own profile only */}
          {isMe && (() => {
            const monthPrefix = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
            const monthSlots = slots.filter((s) => s.date.startsWith(monthPrefix));
            const monthConsults = consultations.filter((c) => c.date?.startsWith(monthPrefix) && c.status !== "cancelled");
            const doneIncome = monthConsults.filter((c) => c.paid_at).reduce((s, c) => s + c.price, 0);
            const totalIncome = monthConsults.reduce((s, c) => s + c.price, 0);

            return (
              <div className="flex flex-col gap-4">
                {/* Month nav */}
                <div className="flex items-center justify-between">
                  <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${dark ? "hover:bg-white/10 text-white/50" : "hover:bg-gray-100 text-gray-500"}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M15 18l-6-6 6-6" /></svg>
                  </button>
                  <span className={`text-sm font-medium ${dark ? "text-white" : "text-gray-900"}`}>{calYear} {MONTH_NAMES[calMonth]}</span>
                  <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${dark ? "hover:bg-white/10 text-white/50" : "hover:bg-gray-100 text-gray-500"}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                </div>

                {/* Mini calendar */}
                <div className={`rounded-xl p-4 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {["Ня","Да","Мя","Лх","Пү","Ба","Бя"].map((d) => (
                      <div key={d} className={`pb-2 text-xs font-medium ${dark ? "text-white/30" : "text-gray-400"}`}>{d}</div>
                    ))}
                    {Array.from({ length: getFirstDayOfMonth(calYear, calMonth) }).map((_, i) => <div key={`e-${i}`} />)}
                    {Array.from({ length: getDaysInMonth(calYear, calMonth) }).map((_, i) => {
                      const day = i + 1;
                      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const daySlots = slots.filter((s) => s.date === dateStr);
                      const dayConsults = consultations.filter((c) => c.date === dateStr && c.status !== "cancelled");
                      const hasSlots = daySlots.length > 0;
                      const hasConsults = dayConsults.length > 0;
                      const isToday = dateStr === todayStr;
                      const isSelected = dateStr === selectedDate;
                      return (
                        <div key={day} onClick={() => setSelectedDate(isSelected ? null : dateStr)} className={`relative flex h-10 cursor-pointer flex-col items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                          isSelected ? "bg-purple-600 text-white ring-2 ring-purple-400"
                            : isToday ? "bg-pink-600 text-white"
                            : hasSlots || hasConsults ? dark ? "bg-white/10 text-white" : "bg-purple-50 text-purple-700"
                            : dark ? "text-white/50 hover:bg-white/5" : "text-gray-600 hover:bg-gray-100"
                        }`}>
                          {day}
                          {(hasSlots || hasConsults) && (
                            <span className="absolute bottom-0.5 flex gap-0.5">
                              {hasSlots && <span className={`text-[6px] font-bold ${isToday || isSelected ? "text-white" : "text-pink-500"}`}>●</span>}
                              {hasConsults && <span className={`text-[6px] font-bold ${isToday || isSelected ? "text-white" : "text-green-500"}`}>●</span>}
                            </span>
                          )}
                        </div>
                      );
                    })}
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
                                  ? "bg-green-500 text-white cursor-not-allowed"
                                  : isDisabled
                                    ? dark ? "bg-red-500/20 text-red-400 line-through hover:bg-red-500/30" : "bg-red-50 text-red-400 line-through hover:bg-red-100"
                                    : "bg-pink-600 text-white hover:bg-pink-700"
                              }`}
                            >
                              {time}
                              {hasConsult && <span className="text-[8px] font-bold">{consult.type === "online" ? "Онлайн" : "Танхим"}</span>}
                            </button>
                          );
                        })}
                      </div>

                      <div className={`mt-3 flex items-center gap-3 text-[10px] ${dark ? "text-white/30" : "text-gray-400"}`}>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-pink-600" /> Идэвхтэй</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Захиалгатай</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-400" /> Идэвхгүй</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Consultations */}
                {monthConsults.length > 0 && (
                  <div className="space-y-2">
                    <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? "text-white/30" : "text-gray-400"}`}>Захиалгууд</p>
                    {monthConsults.map((c) => {
                      const end = new Date(`${c.date}T${c.time}`); end.setMinutes(end.getMinutes() + (c.duration_minutes ?? 60));
                      const isOver = end <= new Date();
                      const st = c.status === "cancelled" ? { label: "Цуцлагдсан", cls: "text-red-400" } : isOver ? { label: "Дууссан", cls: "text-emerald-500" } : { label: "Хүлээгдэж буй", cls: "text-amber-500" };
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
            );
          })()}

          {/* Edit button — own profile only */}
          {isMe && (
            <button onClick={startEdit} className="w-full rounded-xl bg-pink-600 py-3 text-sm font-medium text-white hover:bg-pink-700 sm:w-auto sm:px-8">
              Мэдээлэл засах
            </button>
          )}
        </div>
      ) : (
        <div className="mt-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={`mb-1 block text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>Овог</label>
              <input value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} className={inputCls} placeholder="Овог" />
            </div>
            <div>
              <label className={`mb-1 block text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>Нэр</label>
              <input value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} className={inputCls} placeholder="Нэр" />
            </div>
            <div className="sm:col-span-2">
              <label className={`mb-1 block text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>Боловсролын туршлага</label>
              <ListInput items={editForm.education} onChange={(v) => setEditForm({ ...editForm, education: v })} placeholder="Боловсрол нэмэх..." inputCls={inputCls} dark={dark} />
            </div>
            <div className="sm:col-span-2">
              <label className={`mb-1 block text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>Ажлын туршлага</label>
              <ListInput items={editForm.experience} onChange={(v) => setEditForm({ ...editForm, experience: v })} placeholder="Туршлага нэмэх..." inputCls={inputCls} dark={dark} />
            </div>
            <div className="sm:col-span-2">
              <label className={`mb-1 block text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>Нэмэлт туршлага</label>
              <ListInput items={editForm.additional_experience} onChange={(v) => setEditForm({ ...editForm, additional_experience: v })} placeholder="Нэмэлт туршлага нэмэх..." inputCls={inputCls} dark={dark} />
            </div>
            <div className="sm:col-span-2">
              <label className={`mb-1 block text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>Мэргэшиж буй салбарууд</label>
              <ListInput items={editForm.expertise} onChange={(v) => setEditForm({ ...editForm, expertise: v })} placeholder="Мэргэшил нэмэх..." inputCls={inputCls} dark={dark} />
            </div>
            <div>
              <label className={`mb-1 block text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>Утас</label>
              <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className={inputCls} placeholder="Утасны дугаар" />
            </div>
            <div>
              <label className={`mb-1 block text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>Хаяг</label>
              <input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className={inputCls} placeholder="Гэрийн хаяг" />
            </div>
            <div>
              <label className={`mb-1 block text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>Банк</label>
              <input value={editForm.bank_name} onChange={(e) => setEditForm({ ...editForm, bank_name: e.target.value })} className={inputCls} placeholder="Банкны нэр" />
            </div>
            <div>
              <label className={`mb-1 block text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>Данс</label>
              <input value={editForm.bank_account} onChange={(e) => setEditForm({ ...editForm, bank_account: e.target.value })} className={inputCls} placeholder="Дансны дугаар" />
            </div>
            <div className="sm:col-span-2">
              <label className={`mb-1 block text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>Намтар</label>
              <RichTextEditor content={editForm.bio} onChange={(html) => setEditForm({ ...editForm, bio: html })} dark={dark} minHeight="120px" />
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <button onClick={saveEdit} disabled={saving} className="flex-1 rounded-xl bg-pink-600 py-2.5 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-50">
              {saving ? "Хадгалж байна..." : "Хадгалах"}
            </button>
            <button onClick={() => setEditing(false)} className={`flex-1 rounded-xl py-2.5 text-sm font-medium ${dark ? "text-white/50 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"}`}>
              Болих
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
