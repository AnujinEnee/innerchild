"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";

interface TeamMember {
  id: string;
  last_name: string;
  first_name: string;
  role: string;
  expertise: string | null;
  education: string | null;
  experience: string | null;
  bio: string | null;
  image_url: string | null;
  online_price: number | null;
  offline_price: number | null;
  online_duration: number | null;
  offline_duration: number | null;
  online_enabled: boolean;
  offline_enabled: boolean;
}

const DAY_NAMES = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];

function getWeekDays(startDate: Date) {
  const days: Date[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push(d);
  }
  return days;
}

const TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
const DRINKS = ["Ус", "Ногоон цай", "Хар цай", "Кофе", "Хэрэггүй"];
const DRINK_TO_ENUM: Record<string, string> = { "Ус": "water", "Ногоон цай": "green_tea", "Хар цай": "black_tea", "Кофе": "coffee" };
const DRINK_ICONS: Record<string, string> = { "Ус": "💧", "Ногоон цай": "🍵", "Хар цай": "☕", "Кофе": "☕", "Хэрэггүй": "✕" };
const ROLE_LABEL: Record<string, string> = { psychologist: "Сэтгэл зүйч", therapist: "Сэтгэл засалч" };

export default function ConsultationPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-[#2d1b69] via-[#1e1145] to-[#0f0a2e] text-purple-300">
        Уншиж байна...
      </div>
    }>
      <ConsultationContent />
    </Suspense>
  );
}

function ConsultationContent() {
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();

  // ── View state ──
  type View = "list" | "detail" | "booking";
  const [view, setView] = useState<View>("list");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [detailMember, setDetailMember] = useState<TeamMember | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // ── Booking state ──
  const [step, setStep] = useState(1);
  const [meetingType, setMeetingType] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDrink, setSelectedDrink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paymentQR, setPaymentQR] = useState<{ qrImage: string; links: { name: string; link: string; logo?: string }[]; consultationId: string } | null>(null);
  const [paymentChecking, setPaymentChecking] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<{ date: string; time: string }[]>([]);
  const [bookedSlots, setBookedSlots] = useState<{ date: string; time: string }[]>([]);

  async function fetchSlots(memberId: string) {
    const supabase = createClient();
    const today = new Date().toISOString().slice(0, 10);
    const [{ data: slotsData }, { data: bookingsData }] = await Promise.all([
      supabase.from("available_slots").select("date, time").eq("team_member_id", memberId).gte("date", today),
      supabase.from("consultations").select("date, time").eq("counselor_id", memberId).neq("status", "cancelled").gte("date", today),
    ]);
    setAvailableSlots((slotsData ?? []) as { date: string; time: string }[]);
    setBookedSlots((bookingsData ?? []) as { date: string; time: string }[]);
  }

  function selectMemberForBooking(m: TeamMember) {
    setSelectedMember(m);
    setView("booking");
    setStep(1);
    setSelectedDate(null);
    setSelectedTime("");
    fetchSlots(m.id);
  }
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? 1 : day === 6 ? 2 : 0;
    const start = new Date(today);
    start.setDate(today.getDate() + diff);
    return start;
  });

  useEffect(() => {
    const supabase = createClient();
    const counselorId = searchParams.get("counselor");

    supabase
      .from("team_members")
      .select("id, last_name, first_name, role, expertise, education, experience, bio, image_url, online_price, offline_price, online_duration, offline_duration, online_enabled, offline_enabled")
      .or("online_enabled.eq.true,offline_enabled.eq.true")
      .then(({ data }: { data: TeamMember[] | null }) => {
        const list = data ?? [];
        setMembers(list);
        setLoadingMembers(false);
        if (counselorId) {
          const found = list.find((m: TeamMember) => m.id === counselorId);
          if (found) { selectMemberForBooking(found); }
        }
      });

    const stepParam = searchParams.get("step");
    if (stepParam === "payment") {
      queueMicrotask(() => {
        setStep(4);
        setView("booking");
      });
    }
  }, [searchParams]);

  const weekDays = getWeekDays(weekStart);
  const monthNames = ["1","2","3","4","5","6","7","8","9","10","11","12"];
  const currentMonth = weekDays[0].getMonth();
  const lastMonth = weekDays[weekDays.length - 1].getMonth();
  const year = weekDays[0].getFullYear();
  const monthLabel = currentMonth === lastMonth
    ? `${year} оны ${monthNames[currentMonth]}-р сар`
    : `${year} оны ${monthNames[currentMonth]}–${monthNames[lastMonth]} сар`;

  const needsDrink = meetingType === "Биечлэн уулзах";
  const totalSteps = needsDrink ? 5 : 4;
  const isOffline = meetingType === "Биечлэн уулзах";
  const priceNum = isOffline
    ? (selectedMember?.offline_price ?? 80000)
    : (selectedMember?.online_price ?? 50000);
  const price = `${priceNum.toLocaleString()}₮`;
  const durationMin = isOffline
    ? (selectedMember?.offline_duration ?? 60)
    : (selectedMember?.online_duration ?? 60);

  const formattedDate = selectedDate
    ? `${selectedDate.getFullYear()}.${String(selectedDate.getMonth() + 1).padStart(2, "0")}.${String(selectedDate.getDate()).padStart(2, "0")}`
    : null;

  function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function prevWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 5);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (d >= today) setWeekStart(d);
  }
  function nextWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 5);
    setWeekStart(d);
  }

  function handleNext() {
    if ((step === 2 && !needsDrink) || (step === 3 && needsDrink)) {
      if (!user) { setStep(5); } else { setStep(4); }
    } else {
      setStep((s) => s + 1);
    }
  }

  async function handlePayment() {
    if (submitting) return;
    setSubmitting(true);

    // 1. Get QR code (no DB insert yet)
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: priceNum,
          counselorName: selectedMember ? memberFullName(selectedMember) : "",
          clientName: user?.email ?? "",
        }),
      });
      const data = await res.json();

      if (data.qrImage || data.links?.length) {
        setPaymentQR({ qrImage: data.qrImage, links: data.links ?? [], consultationId: data.transactionId });
        setStep(5);
        setSubmitting(false);
        // Poll for payment, then create consultation
        pollPaymentAndCreate(data.transactionId);
        return;
      } else {
        console.error("No QR data:", data);
      }
    } catch (err) {
      console.error("Payment error:", err);
    }

    setSubmitting(false);
  }

  async function pollPaymentAndCreate(transactionId: string) {
    setPaymentChecking(true);
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      try {
        const res = await fetch(`/api/payment/check?transactionId=${transactionId}`);
        const data = await res.json();
        if (data.paid) {
          // Payment confirmed — now create consultation
          await createConsultationAfterPayment();
          setPaymentChecking(false);
          setStep(6);
          return;
        }
      } catch {}
    }
    setPaymentChecking(false);
  }

  async function createConsultationAfterPayment() {
    const supabase = createClient();

    let clientId: string | null = null;
    if (user) {
      const { data: u1 } = await supabase.from("users").select("id").eq("auth_id", user.id).maybeSingle();
      if (u1) {
        clientId = u1.id;
      } else {
        const { data: u2 } = await supabase.from("users").select("id").eq("email", user.email).maybeSingle();
        if (u2) {
          clientId = u2.id;
          await supabase.from("users").update({ auth_id: user.id }).eq("id", u2.id);
        }
      }
    }
    if (!clientId) return;

    const dateStr = selectedDate
      ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
      : null;

    const { data: insertData } = await supabase.from("consultations").insert({
      client_id: clientId,
      counselor_id: selectedMember?.id ?? null,
      type: meetingType === "Биечлэн уулзах" ? "offline" : "online",
      date: dateStr,
      time: selectedTime,
      duration_minutes: durationMin,
      status: "normal",
      price: priceNum,
      beverage_preference: DRINK_TO_ENUM[selectedDrink] ?? null,
      paid_at: new Date().toISOString(),
    }).select("id");

    // Create meeting link for online
    if (meetingType !== "Биечлэн уулзах" && insertData?.[0]?.id) {
      try {
        await fetch("/api/create-meeting", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            consultationId: insertData[0].id,
            counselorName: selectedMember ? memberFullName(selectedMember) : "",
            clientName: user?.email ?? "",
            date: dateStr,
            time: selectedTime,
            durationMinutes: durationMin,
          }),
        });
      } catch {}
    }
  }

  const memberFullName = (m: TeamMember) => `${m.last_name} ${m.first_name}`.trim();

  // ─────────────────────────────────────────────
  // LAYOUT SHELL
  // ─────────────────────────────────────────────
  return (
    <div className="relative flex min-h-screen flex-col" style={{ background: "linear-gradient(135deg, #0f0720 0%, #1e1145 30%, #2d1b69 60%, #6d28d9 85%, #ec4899 100%)" }}>
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-pink-500/20 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-indigo-600/10 blur-[150px]" />
      </div>
      {/* Header */}
      <div className="relative z-10 px-6 py-4 md:px-10 lg:px-16">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-6 py-3 backdrop-blur-md">
          <nav className="hidden items-center gap-8 md:flex">
            <Link href="/niitlel" className="text-sm font-medium text-white/60 transition-colors hover:text-white">Нийтлэл</Link>
            <Link href="/tests" className="text-sm font-medium text-white/60 transition-colors hover:text-white">Тестүүд</Link>
            <Link href="/team" className="text-sm font-medium text-white/60 transition-colors hover:text-white">Манай хамт олон</Link>
          </nav>
          <Link href="/"><img src="/1.png" alt="Inner Child" className="h-8 brightness-0 invert" /></Link>
          <div className="flex items-center gap-3">
            <Link href="/content" className="text-sm font-medium text-white/60 transition-colors hover:text-white">Контент</Link>
            {user ? (
              <Link href="/dashboard" className="rounded-full border border-white/20 px-5 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10">Миний хуудас</Link>
            ) : (
              <Link href="/login" className="rounded-full border border-white/20 px-5 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10">Нэвтрэх</Link>
            )}
          </div>
        </div>
      </div>

      {/* ── COUNSELOR LIST ── */}
      {view === "list" && (
        <div className="relative z-10 flex-1 px-6 py-8 lg:px-16">
          <div className="mb-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-pink-400">Зөвлөгөө авах</p>
            <h1 className="text-3xl font-bold text-white md:text-4xl">Сэтгэл зүйчээ сонгоно уу</h1>
            <p className="mt-2 text-sm text-white/50">Мэргэжилтэнтэй танилцаж, өөртөө тохирохыг нь сонгоорой.</p>
          </div>

          {loadingMembers ? (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-pink-400/30 border-t-pink-400" />
            </div>
          ) : members.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 py-20 text-center">
              <p className="text-white/40">Одоогоор бүртгэлтэй сэтгэл зүйч байхгүй байна.</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((m) => (
                <div key={m.id} className="group flex flex-col rounded-3xl border border-white/15 bg-white p-6 shadow-lg transition-all hover:border-purple-500/30 hover:shadow-xl">
                  {/* Avatar */}
                  <div className="mb-4 flex items-center gap-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
                      {m.image_url ? (
                        <img src={m.image_url} alt={memberFullName(m)} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-purple-500 to-pink-600 text-xl font-bold text-white">
                          {m.first_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{memberFullName(m)}</h3>
                      <p className="text-xs font-medium text-purple-600">{ROLE_LABEL[m.role] ?? m.role}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto flex gap-2">
                    <Link
                      href={`/team/${m.id}`}
                      className="flex flex-1 items-center justify-center rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-600 transition-colors hover:border-purple-400 hover:text-purple-600"
                    >
                      Дэлгэрэнгүй
                    </Link>
                    <button
                      onClick={() => selectMemberForBooking(m)}
                      className="flex-1 rounded-xl bg-linear-to-r from-pink-500 to-purple-500 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      Сонгох →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── COUNSELOR DETAIL ── */}
      {view === "detail" && detailMember && (
        <div className="relative z-10 flex-1 px-6 py-8 lg:px-16">
          <button
            onClick={() => setView("list")}
            className="mb-6 inline-flex items-center gap-2 text-sm text-pink-300 transition-colors hover:text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Буцах
          </button>

          <div className="mx-auto max-w-2xl">
            <div className="rounded-3xl border border-white/15 bg-white p-8 shadow-lg">
              {/* Top */}
              <div className="mb-8 flex items-start gap-6">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl">
                  {detailMember.image_url ? (
                    <img src={detailMember.image_url} alt={memberFullName(detailMember)} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-purple-500 to-pink-600 text-3xl font-bold text-white">
                      {detailMember.first_name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{memberFullName(detailMember)}</h1>
                  <p className="mt-1 text-sm font-medium text-purple-600">{ROLE_LABEL[detailMember.role] ?? detailMember.role}</p>
                  {detailMember.expertise && (
                    <p className="mt-2 text-sm text-gray-500">{detailMember.expertise}</p>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-5">
                {detailMember.bio && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Тухай</p>
                    <p className="text-sm leading-relaxed text-gray-600">{detailMember.bio}</p>
                  </div>
                )}
                {detailMember.education && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Боловсрол</p>
                    <p className="text-sm leading-relaxed text-gray-600">{detailMember.education}</p>
                  </div>
                )}
                {detailMember.experience && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Туршлага</p>
                    <p className="text-sm leading-relaxed text-gray-600">{detailMember.experience}</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => selectMemberForBooking(detailMember)}
                className="mt-8 w-full rounded-2xl bg-linear-to-r from-pink-500 to-purple-500 py-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Энэ сэтгэл зүйчтэй цаг захиалах →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BOOKING FLOW ── */}
      {view === "booking" && (
        <div className="relative z-10 flex flex-1 items-start justify-center gap-8 px-6 py-8 lg:px-16">
          {/* Form card */}
          <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-white p-8 shadow-2xl">
            {/* Progress */}
            {step <= totalSteps && (
              <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-linear-to-r from-pink-400 to-purple-400 transition-all duration-500"
                  style={{ width: `${(step / totalSteps) * 100}%` }}
                />
              </div>
            )}
            <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-purple-500">
              {step <= totalSteps ? `Алхам ${step} / ${totalSteps}` : ""}
            </p>

            {/* Selected counselor chip */}
            {selectedMember && step <= totalSteps && (
              <div className="mb-5 flex items-center gap-3 rounded-2xl border border-purple-500/20 bg-purple-500/10 px-4 py-3">
                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full">
                  {selectedMember.image_url ? (
                    <img src={selectedMember.image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-purple-500 to-pink-600 text-xs font-bold text-white">
                      {selectedMember.first_name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-purple-500">Сонгосон зөвлөгч</p>
                  <p className="text-sm font-semibold text-gray-900">{memberFullName(selectedMember)}</p>
                </div>
                <button
                  onClick={() => { setSelectedMember(null); setView("list"); }}
                  className="ml-auto text-xs text-gray-400 transition-colors hover:text-purple-600"
                >
                  Өөрчлөх
                </button>
              </div>
            )}

            {/* Step 1: Meeting type */}
            {step === 1 && (
              <>
                <h1 className="mb-2 text-2xl font-bold text-gray-900">Уулзалтын төрөл</h1>
                <p className="mb-8 text-sm text-gray-500">Танд тохирох хэлбэрийг сонгоно уу.</p>
                <div className="flex flex-col gap-3">
                  {[
                    { label: "Онлайн уулзалт", desc: `Видео дуудлагаар, ${(selectedMember?.online_price ?? 50000).toLocaleString()}₮`, icon: "🎥", enabled: selectedMember?.online_enabled ?? true },
                    { label: "Биечлэн уулзах", desc: `Оффис дээр, ${(selectedMember?.offline_price ?? 80000).toLocaleString()}₮`, icon: "🏢", enabled: selectedMember?.offline_enabled ?? true },
                  ].map(({ label, desc, icon, enabled }) => (
                    <button
                      key={label}
                      onClick={() => enabled && setMeetingType(label)}
                      disabled={!enabled}
                      className={`flex items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-all ${
                        !enabled
                          ? "cursor-not-allowed border-gray-100 bg-gray-50 opacity-50"
                          : meetingType === label
                            ? "border-purple-500 bg-purple-50 text-gray-900"
                            : "border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50/50"
                      }`}
                    >
                      <span className="text-2xl flex items-center justify-center">{icon}</span>
                      <div className="flex-1">
                        <div className="font-semibold">{label}</div>
                        <div className="text-xs text-gray-400">{enabled ? desc : "Энэ зөвлөгч одоогоор энэ төрлийн зөвлөгөө өгөхгүй байна"}</div>
                      </div>
                      {enabled ? (
                        <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${meetingType === label ? "border-purple-500 bg-purple-500" : "border-gray-300"}`}>
                          {meetingType === label && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="h-3 w-3"><path d="M5 13l4 4L19 7" /></svg>}
                        </div>
                      ) : (
                        <span className="text-[10px] font-medium text-red-400">Идэвхгүй</span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-8 flex gap-3">
                  <button onClick={() => setView("list")} className="rounded-2xl border border-gray-200 px-6 py-4 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-50">←</button>
                  <button onClick={() => setStep(2)} disabled={!meetingType} className="flex-1 rounded-2xl bg-linear-to-r from-pink-500 to-purple-500 py-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-30">
                    Үргэлжлүүлэх →
                  </button>
                </div>
              </>
            )}

            {/* Step 2: Date & time */}
            {step === 2 && (
              <>
                <h1 className="mb-2 text-2xl font-bold text-gray-900">Өдөр, цаг сонгох</h1>
                <p className="mb-6 text-sm text-gray-500">Танд тохирох цагийг сонгоно уу.</p>
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">{monthLabel}</span>
                  <div className="flex gap-1">
                    <button onClick={prevWeek} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button onClick={nextWeek} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                </div>
                <div className="mb-5 flex justify-between gap-2">
                  {weekDays.map((day) => {
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    return (
                      <button key={day.toISOString()} onClick={() => { setSelectedDate(day); setSelectedTime(""); }}
                        className={`flex flex-1 flex-col items-center gap-1.5 rounded-2xl py-3 transition-all ${isSelected ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30" : "border border-gray-200 text-gray-600 hover:border-purple-400 hover:text-purple-600"}`}
                      >
                        <span className="text-xs font-medium">{DAY_NAMES[day.getDay()]}</span>
                        <span className="text-lg font-bold">{day.getDate()}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="mb-6">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Боломжит цагууд</p>
                  {!selectedDate ? (
                    <div className="rounded-2xl border border-gray-200 py-6 text-center text-sm text-gray-400">Өдрөө сонгоно уу</div>
                  ) : (() => {
                    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
                    const dayAvailable = availableSlots
                      .filter((s) => s.date === dateStr)
                      .map((s) => s.time.slice(0, 5));
                    return (
                      <div className="grid grid-cols-4 gap-2">
                        {TIME_SLOTS.map((time) => {
                          const isDisabledByTeam = dayAvailable.includes(time);
                          const isBooked = bookedSlots.some((b) => b.date === dateStr && b.time.slice(0, 5) === time);
                          const now = new Date();
                          const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
                          const isPast = dateStr === todayStr && time <= `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
                          const isDisabled = isDisabledByTeam || isBooked || isPast;
                          return (
                            <button key={time} onClick={() => !isDisabled && setSelectedTime(time)}
                              disabled={isDisabled}
                              className={`rounded-xl py-2.5 text-sm font-medium transition-all ${
                                isDisabled
                                  ? "border border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through"
                                  : selectedTime === time
                                    ? "bg-purple-500 text-white shadow-md shadow-purple-500/30"
                                    : "border border-gray-200 text-gray-600 hover:border-purple-400 hover:text-purple-600"
                              }`}
                            >
                              {time}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="rounded-2xl border border-gray-200 px-6 py-4 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-50">←</button>
                  <button onClick={handleNext} disabled={!selectedDate || !selectedTime} className="flex-1 rounded-2xl bg-linear-to-r from-pink-500 to-purple-500 py-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-30">
                    Үргэлжлүүлэх →
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Drink (offline only) */}
            {step === 3 && needsDrink && (
              <>
                <h1 className="mb-2 text-2xl font-bold text-gray-900">Уух зүйл</h1>
                <p className="mb-8 text-sm text-gray-500">Уулзалтын үеэр танд юу бэлдэх вэ?</p>
                <div className="flex flex-col gap-2">
                  {DRINKS.map((drink) => (
                    <button key={drink} onClick={() => setSelectedDrink(drink)}
                      className={`flex items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-all ${selectedDrink === drink ? "border-purple-500 bg-purple-50 text-gray-900" : "border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50/50"}`}
                    >
                      <span className="text-xl flex items-center">{DRINK_ICONS[drink]}</span>
                      <span className="flex-1 font-medium">{drink}</span>
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${selectedDrink === drink ? "border-purple-500 bg-purple-500" : "border-gray-300"}`}>
                        {selectedDrink === drink && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="h-3 w-3"><path d="M5 13l4 4L19 7" /></svg>}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-8 flex gap-3">
                  <button onClick={() => setStep(2)} className="rounded-2xl border border-gray-200 px-6 py-4 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-50">←</button>
                  <button onClick={handleNext} disabled={!selectedDrink} className="flex-1 rounded-2xl bg-linear-to-r from-pink-500 to-purple-500 py-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-30">
                    Үргэлжлүүлэх →
                  </button>
                </div>
              </>
            )}

            {/* Step 5: Auth choice */}
            {step === 5 && !user && (
              <>
                <h1 className="mb-2 text-2xl font-bold text-gray-900">Захиалга баталгаажуулах</h1>
                <p className="mb-8 text-sm text-gray-500">Үргэлжлүүлэхийн тулд бүртгүүлэх эсвэл нэвтэрнэ үү.</p>
                <div className="flex flex-col gap-3">
                  <button onClick={() => router.push("/register?from=consultation")} className="w-full rounded-2xl bg-linear-to-r from-pink-500 to-purple-500 py-4 text-sm font-semibold text-white transition-opacity hover:opacity-90">
                    Бүртгүүлэх
                  </button>
                  <button onClick={() => router.push("/login?from=consultation")} className="w-full rounded-2xl border border-gray-200 py-4 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50">
                    Нэвтрэх
                  </button>
                </div>
                <button onClick={() => setStep(needsDrink ? 3 : 2)} className="mt-4 w-full text-center text-xs text-gray-400 hover:text-purple-600">← Буцах</button>
              </>
            )}

            {/* Step 4: Payment */}
            {step === 4 && (
              <>
                <h1 className="mb-2 text-2xl font-bold text-gray-900">Төлбөр төлөх</h1>
                <p className="mb-6 text-sm text-gray-500">Захиалгаа баталгаажуулан төлбөрөө төлнө үү.</p>
                <div className="mb-5 space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Захиалгын мэдээлэл</p>
                  {[
                    ...(selectedMember ? [{ label: "Зөвлөгч", value: memberFullName(selectedMember) }] : []),
                    { label: "Уулзалтын төрөл", value: meetingType },
                    { label: "Огноо", value: formattedDate },
                    { label: "Цаг", value: selectedTime },
                    ...(needsDrink && selectedDrink ? [{ label: "Уух зүйл", value: selectedDrink }] : []),
                  ].map(({ label, value }) => value ? (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{label}</span>
                      <span className="text-sm font-semibold text-gray-900">{value}</span>
                    </div>
                  ) : null)}
                </div>
                <div className="mb-5 flex items-center justify-between rounded-2xl border border-purple-200 bg-purple-50 px-5 py-4">
                  <span className="text-sm text-gray-600">Нийт төлбөр</span>
                  <span className="text-2xl font-bold text-purple-600">{price}</span>
                </div>
                <div className="mb-6 rounded-2xl border border-purple-100 bg-purple-50/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 text-purple-600">
                        <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Онлайн төлбөр</p>
                      <p className="text-xs text-gray-500">QPay, SocialPay, банкны карт</p>
                    </div>
                  </div>
                </div>
                <button onClick={handlePayment} disabled={submitting} className="w-full rounded-2xl bg-linear-to-r from-pink-500 to-purple-500 py-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50">
                  {submitting ? "Илгээж байна..." : "Төлбөр төлөх"}
                </button>
              </>
            )}

            {/* Step 5: QR Payment */}
            {step === 5 && paymentQR && (
              <>
                <h1 className="mb-2 text-2xl font-bold text-gray-900">Төлбөр төлөх</h1>
                <p className="mb-6 text-sm text-gray-500">QR кодыг уншуулах эсвэл банкны апп-аар төлнө үү.</p>

                <div className="mb-5 flex items-center justify-between rounded-2xl border border-purple-200 bg-purple-50 px-5 py-4">
                  <span className="text-sm text-gray-600">Нийт төлбөр</span>
                  <span className="text-2xl font-bold text-purple-600">{price}</span>
                </div>

                {/* QR Code */}
                {paymentQR.qrImage && (
                  <div className="mb-6 flex justify-center">
                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                      <img
                        src={`data:image/png;base64,${paymentQR.qrImage}`}
                        alt="QR код"
                        className="h-56 w-56"
                      />
                    </div>
                  </div>
                )}

                {/* Bank deeplinks */}
                {paymentQR.links.length > 0 && (
                  <div className="mb-6">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Банкны апп-аар төлөх</p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {paymentQR.links.map((bank) => (
                        <a
                          key={bank.name}
                          href={bank.link}
                          className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-100 p-3 text-center transition-colors hover:border-purple-300 hover:bg-purple-50"
                        >
                          {bank.logo ? (
                            <img src={bank.logo} alt={bank.name} className="h-8 w-8 rounded-lg object-contain" />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-xs font-bold text-purple-600">
                              {bank.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-[10px] font-medium text-gray-600 line-clamp-1">{bank.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status */}
                <div className="flex items-center justify-center gap-2 rounded-2xl bg-amber-50 px-5 py-4">
                  {paymentChecking ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-300 border-t-amber-600" />
                      <span className="text-sm text-amber-700">Төлбөр хүлээж байна...</span>
                    </>
                  ) : (
                    <span className="text-sm text-amber-700">Төлбөрийн хугацаа дууссан. Дахин оролдоно уу.</span>
                  )}
                </div>

                <button onClick={() => { setPaymentQR(null); setPaymentChecking(false); window.location.assign("/"); }} className="mt-4 w-full text-center text-xs text-red-400 hover:text-red-600">Захиалга цуцлах</button>
              </>
            )}

            {/* Step 6: Success */}
            {step === 6 && (
              <div className="py-8 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-10 w-10 text-purple-600">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="mb-2 text-2xl font-bold text-gray-900">Захиалга амжилттай!</h1>
                <p className="mb-8 text-sm text-gray-500">Таны цаг захиалга хүлээн авлаа. Удахгүй холбогдох болно.</p>
                <div className={`mb-6 rounded-2xl p-5 ${false ? "" : "bg-purple-50 border border-purple-100"}`}>
                  <p className="mb-2 text-sm font-semibold text-[#2d1b69]">Та сэтгэл зүйн тест өгч, сэтгэл зүйн байдлаа үнэлнэ үү</p>
                  <p className="mb-4 text-xs text-gray-500">Тест нь зөвлөгөөнд бэлтгэхэд тусална.</p>
                  <Link href="/tests" className="inline-block rounded-full bg-[#2d1b69] px-6 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90">
                    Тест өгөх →
                  </Link>
                </div>
                <div className="flex flex-col gap-3">
                  <Link href="/dashboard" className="w-full rounded-2xl bg-linear-to-r from-pink-500 to-purple-500 py-4 text-sm font-semibold text-white text-center transition-opacity hover:opacity-90">
                    Миний захиалгууд харах
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right panel */}
          {view === "booking" && step <= totalSteps && (
            <div className="hidden w-80 shrink-0 lg:block">
              <div className="sticky top-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-lg">
                <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-purple-500">Таны захиалга</p>
                <div className="space-y-3">
                  {selectedMember && (
                    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full">
                        {selectedMember.image_url ? (
                          <img src={selectedMember.image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-purple-500 to-pink-600 text-xs font-bold text-white">
                            {selectedMember.first_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Зөвлөгч</p>
                        <p className="text-sm font-semibold text-gray-900">{memberFullName(selectedMember)}</p>
                      </div>
                    </div>
                  )}
                  {meetingType && (
                    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <span className="text-xl">{meetingType === "Онлайн уулзалт" ? "🎥" : "🏢"}</span>
                      <div>
                        <p className="text-xs text-gray-400">Уулзалтын төрөл</p>
                        <p className="text-sm font-semibold text-gray-900">{meetingType}</p>
                      </div>
                    </div>
                  )}
                  {formattedDate && (
                    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <span className="text-xl">📅</span>
                      <div>
                        <p className="text-xs text-gray-400">Огноо, цаг</p>
                        <p className="text-sm font-semibold text-gray-900">{formattedDate}{selectedTime ? ` · ${selectedTime}` : ""}</p>
                      </div>
                    </div>
                  )}
                  {selectedDrink && (
                    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <span className="text-xl">{DRINK_ICONS[selectedDrink]}</span>
                      <div>
                        <p className="text-xs text-gray-400">Уух зүйл</p>
                        <p className="text-sm font-semibold text-gray-900">{selectedDrink}</p>
                      </div>
                    </div>
                  )}
                  {meetingType && (
                    <div className="mt-2 rounded-2xl border border-purple-200 bg-purple-50 px-4 py-3">
                      <p className="text-xs text-purple-500">Үнэ</p>
                      <p className="text-2xl font-bold text-purple-600">{price}</p>
                    </div>
                  )}
                </div>
                <div className="mt-6 space-y-2.5">
                  {["24 цагийн дотор цуцлах боломжтой", "Мэргэжлийн сэтгэл зүйч", "Нууцлал бүрэн хамгаалагдсан"].map((text) => (
                    <div key={text} className="flex items-center gap-2">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5 shrink-0 text-purple-500"><path d="M5 13l4 4L19 7" /></svg>
                      <span className="text-xs text-gray-500">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
