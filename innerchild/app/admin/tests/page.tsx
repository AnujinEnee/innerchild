"use client";

import { useEffect, useState } from "react";
import { useTheme } from "../ThemeContext";
import { createClient } from "@/lib/supabase/client";
import { ALL_TESTS, getSlugByDbTestId } from "@/lib/test-logics/registry";
import type { TestSlug } from "@/lib/test-logics/types";

interface QuestionOption {
  id: string;
  label: string;
  score: number;
  order_index: number;
}

interface Question {
  id: string;
  question: string;
  order_index: number;
  options: QuestionOption[];
}

interface Test {
  id: string;
  title: string;
  description: string | null;
  category: string;
  duration_minutes: number;
  active: boolean;
  created_at: string;
  questions: Question[];
}

// Local-only IDs for form state (before saving to DB)
let _localId = 0;
function localId(): string { return `local_${++_localId}`; }

const emptyQuestion = (): { id: string; question: string; options: string[] } => ({
  id: localId(),
  question: "",
  options: ["", ""],
});

export default function TestsPage() {
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewTest, setViewTest] = useState<Test | null>(null);
  const [saving, setSaving] = useState(false);
  const [testPayments, setTestPayments] = useState<{ test_slug: string; amount: number; paid_at: string }[]>([]);
  const [testTakenCounts, setTestTakenCounts] = useState<Record<string, number>>({});
  const [testAttempts, setTestAttempts] = useState<
    {
      id: string;
      taken_at: string;
      test_title: string;
      test_category: string | null;
      test_id: string;
      slug: TestSlug | undefined;
      user_name: string;
      user_email: string | null;
    }[]
  >([]);
  const [testPrices, setTestPrices] = useState<Record<string, number>>({});
  const [priceEditing, setPriceEditing] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState("");
  const [priceSaving, setPriceSaving] = useState(false);
  const [activeView, setActiveView] = useState<"pricing" | "attempts">("pricing");

  const [form, setForm] = useState({
    title: "", description: "", category: "", duration_minutes: 10, active: true,
    questions: [emptyQuestion()],
  });

  async function fetchTests() {
    const supabase = createClient();
    const { data } = await supabase
      .from("tests")
      .select("*, test_questions(*, test_question_options(*))")
      .order("created_at", { ascending: false });

    setTests(
      (data ?? []).map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        category: t.category,
        duration_minutes: t.duration_minutes,
        active: t.active,
        created_at: t.created_at,
        questions: ((t.test_questions ?? []) as Question[])
          .sort((a, b) => a.order_index - b.order_index)
          .map((q) => ({
            ...q,
            options: ((q.options ?? (q as unknown as { test_question_options: QuestionOption[] }).test_question_options ?? []) as QuestionOption[])
              .sort((a, b) => a.order_index - b.order_index),
          })),
      }))
    );
    setLoading(false);
  }

  async function fetchTestPayments() {
    const supabase = createClient();
    const { data } = await supabase
      .from("test_payments")
      .select("test_slug, amount, paid_at")
      .order("paid_at", { ascending: false });
    setTestPayments((data ?? []) as typeof testPayments);
  }

  async function fetchTestTakenCounts() {
    const supabase = createClient();
    const { data } = await supabase.from("test_results").select("test_id");
    const counts: Record<string, number> = {};
    for (const row of (data ?? []) as { test_id: string }[]) {
      const slug = getSlugByDbTestId(row.test_id);
      if (!slug) continue;
      counts[slug] = (counts[slug] ?? 0) + 1;
    }
    setTestTakenCounts(counts);
  }

  async function fetchTestAttempts() {
    const supabase = createClient();
    const { data } = await supabase
      .from("test_results")
      .select("id, taken_at, test_id, users!client_id(last_name, first_name, email), tests!test_id(title, category)")
      .order("taken_at", { ascending: false });
    type Row = {
      id: string;
      taken_at: string;
      test_id: string;
      users: { last_name: string; first_name: string; email: string | null } | null;
      tests: { title: string; category: string | null } | null;
    };
    const rows = ((data ?? []) as unknown as Row[]).map((r) => {
      const slug = getSlugByDbTestId(r.test_id);
      const userName = r.users
        ? `${r.users.last_name} ${r.users.first_name}`.trim()
        : "—";
      return {
        id: r.id,
        taken_at: r.taken_at,
        test_title: r.tests?.title ?? "—",
        test_category: r.tests?.category ?? null,
        test_id: r.test_id,
        slug,
        user_name: userName,
        user_email: r.users?.email ?? null,
      };
    });
    setTestAttempts(rows);
  }

  async function fetchTestPrices() {
    try {
      const res = await fetch("/api/test-prices");
      const data = await res.json();
      const map: Record<string, number> = {};
      for (const item of data) {
        if (item.slug) map[item.slug] = item.price ?? 0;
      }
      setTestPrices(map);
    } catch { /* ignore */ }
  }

  async function saveTestPrice(slug: string, price: number) {
    setPriceSaving(true);
    await fetch("/api/test-prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, price }),
    });
    setTestPrices((prev) => ({ ...prev, [slug]: price }));
    setPriceEditing(null);
    setPriceSaving(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTests();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTestPayments();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTestPrices();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTestTakenCounts();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTestAttempts();
  }, []);

  function openNew() {
    setForm({ title: "", description: "", category: "", duration_minutes: 10, active: true, questions: [emptyQuestion()] });
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(t: Test) {
    setForm({
      title: t.title,
      description: t.description ?? "",
      category: t.category,
      duration_minutes: t.duration_minutes,
      active: t.active,
      questions: t.questions.length > 0
        ? t.questions.map((q) => ({ id: q.id, question: q.question, options: q.options.map((o) => o.label) }))
        : [emptyQuestion()],
    });
    setEditId(t.id);
    setShowForm(true);
  }

  async function save() {
    if (!form.title.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const cleanQs = form.questions.filter((q) => q.question.trim());

    if (editId) {
      // Update test metadata
      const { error: updateErr } = await supabase.from("tests").update({
        title: form.title,
        description: form.description || null,
        category: form.category,
        duration_minutes: form.duration_minutes,
        active: form.active,
      }).eq("id", editId);
      if (updateErr) { alert(`Алдаа: ${updateErr.message}`); setSaving(false); return; }

      // Delete existing questions (cascade deletes options)
      await supabase.from("test_questions").delete().eq("test_id", editId);

      // Re-insert questions and options
      for (let qi = 0; qi < cleanQs.length; qi++) {
        const q = cleanQs[qi];
        const { data: qData } = await supabase
          .from("test_questions")
          .insert({ test_id: editId, question: q.question, order_index: qi })
          .select()
          .single();
        if (qData) {
          const opts = q.options.filter((o) => o.trim());
          for (let oi = 0; oi < opts.length; oi++) {
            await supabase.from("test_question_options").insert({
              question_id: qData.id, label: opts[oi], score: oi, order_index: oi,
            });
          }
        }
      }
    } else {
      const { data: tData } = await supabase
        .from("tests")
        .insert({
          title: form.title,
          description: form.description || null,
          category: form.category,
          duration_minutes: form.duration_minutes,
          active: form.active,
        })
        .select()
        .single();

      if (tData) {
        for (let qi = 0; qi < cleanQs.length; qi++) {
          const q = cleanQs[qi];
          const { data: qData } = await supabase
            .from("test_questions")
            .insert({ test_id: tData.id, question: q.question, order_index: qi })
            .select()
            .single();
          if (qData) {
            const opts = q.options.filter((o) => o.trim());
            for (let oi = 0; oi < opts.length; oi++) {
              await supabase.from("test_question_options").insert({
                question_id: qData.id, label: opts[oi], score: oi, order_index: oi,
              });
            }
          }
        }
      }
    }

    setSaving(false);
    setShowForm(false);
    fetchTests();
  }

  async function remove(id: string) {
    const { error } = await createClient().from("tests").delete().eq("id", id);
    if (error) { alert(`Алдаа: ${error.message}`); return; }
    setTests((prev) => prev.filter((t) => t.id !== id));
    if (viewTest?.id === id) setViewTest(null);
  }

  async function toggleActive(id: string) {
    const t = tests.find((x) => x.id === id);
    if (!t) return;
    const { error } = await createClient().from("tests").update({ active: !t.active }).eq("id", id);
    if (error) { alert(`Алдаа: ${error.message}`); return; }
    setTests((prev) => prev.map((x) => x.id === id ? { ...x, active: !x.active } : x));
    if (viewTest?.id === id) setViewTest((prev) => prev ? { ...prev, active: !prev.active } : null);
  }

  function addQuestion() {
    setForm({ ...form, questions: [...form.questions, emptyQuestion()] });
  }

  function removeQuestion(qId: string) {
    setForm({ ...form, questions: form.questions.filter((q) => q.id !== qId) });
  }

  function updateQuestion(qId: string, text: string) {
    setForm({ ...form, questions: form.questions.map((q) => q.id === qId ? { ...q, question: text } : q) });
  }

  function updateOption(qId: string, optIdx: number, val: string) {
    setForm({
      ...form,
      questions: form.questions.map((q) =>
        q.id === qId ? { ...q, options: q.options.map((o, i) => (i === optIdx ? val : o)) } : q
      ),
    });
  }

  function addOption(qId: string) {
    setForm({ ...form, questions: form.questions.map((q) => q.id === qId ? { ...q, options: [...q.options, ""] } : q) });
  }

  function removeOption(qId: string, optIdx: number) {
    setForm({
      ...form,
      questions: form.questions.map((q) =>
        q.id === qId ? { ...q, options: q.options.filter((_, i) => i !== optIdx) } : q
      ),
    });
  }

  const inputCls = dark
    ? "bg-white/10 text-white placeholder:text-white/30 focus:bg-white/15"
    : "border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-purple-500";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className={`text-2xl font-bold ${dark ? "text-white" : "text-gray-900"}`}>Тестүүд</h1>
        <button onClick={openNew} className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700">
          + Шинэ тест
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Нийт тест", value: String(tests.length), color: "from-purple-500 to-indigo-600" },
          { label: "Идэвхтэй", value: String(tests.filter((t) => t.active).length), color: "from-emerald-500 to-teal-600" },
          { label: "Нийт орлого", value: `${testPayments.reduce((s, t) => s + t.amount, 0).toLocaleString()}₮`, color: "from-amber-500 to-orange-600" },
          { label: "Нийт тест өгсөн", value: `${Object.values(testTakenCounts).reduce((s, n) => s + n, 0).toLocaleString()} удаа`, color: "from-pink-500 to-rose-600" },
        ].map((s) => (
          <div key={s.label} className={`relative overflow-hidden rounded-2xl p-5 ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}>
            <div className={`absolute -right-3 -top-3 h-16 w-16 rounded-full bg-linear-to-br ${s.color} opacity-20 blur-xl`} />
            <p className={`text-xs font-medium ${dark ? "text-white/40" : "text-gray-500"}`}>{s.label}</p>
            <p className={`mt-2 text-2xl font-bold ${dark ? "text-white" : "text-gray-900"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* View Test Modal */}
      {viewTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`w-full max-w-2xl rounded-2xl ${dark ? "bg-[#1e1e36]" : "bg-white"} max-h-[90vh] overflow-y-auto`}>
            <div className="relative bg-linear-to-br from-purple-600 to-indigo-700 px-6 py-6">
              <button onClick={() => setViewTest(null)} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <span className={`mb-2 inline-block rounded-full px-3 py-1 text-[10px] font-semibold ${viewTest.active ? "bg-emerald-500/30 text-white" : "bg-white/20 text-white/60"}`}>
                {viewTest.active ? "Идэвхтэй" : "Идэвхгүй"}
              </span>
              <h2 className="text-xl font-bold text-white">{viewTest.title}</h2>
              <p className="mt-1 text-sm text-white/60">{viewTest.description}</p>
              <div className="mt-3 flex gap-3 text-xs text-white/50">
                <span>{viewTest.category}</span>
                <span>·</span>
                <span>{viewTest.duration_minutes} мин</span>
                <span>·</span>
                <span>{viewTest.questions.length} асуулт</span>
              </div>
            </div>

            <div className="px-6 pb-6 pt-5">
              <h3 className={`mb-4 text-sm font-semibold ${dark ? "text-white" : "text-gray-900"}`}>Асуултууд</h3>
              <div className="space-y-4">
                {viewTest.questions.map((q, qi) => (
                  <div key={q.id} className={`rounded-xl p-4 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                    <p className={`text-sm font-medium ${dark ? "text-white" : "text-gray-900"}`}>
                      <span className="text-purple-500">{qi + 1}.</span> {q.question}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {q.options.map((opt) => (
                        <span key={opt.id} className={`rounded-lg px-3 py-1.5 text-xs ${dark ? "bg-white/10 text-white/70" : "bg-white text-gray-600 shadow-sm"}`}>
                          {opt.label}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-2">
                <button onClick={() => { setViewTest(null); openEdit(viewTest); }} className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700">
                  Засах
                </button>
                <button onClick={() => setViewTest(null)} className={`rounded-xl px-5 py-2.5 text-sm font-medium ${dark ? "text-white/50 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"}`}>
                  Хаах
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`w-full max-w-2xl rounded-2xl ${dark ? "bg-[#1e1e36]" : "bg-white"} max-h-[90vh] overflow-y-auto p-6`}>
            <h2 className={`mb-6 text-lg font-bold ${dark ? "text-white" : "text-gray-900"}`}>
              {editId ? "Тест засах" : "Шинэ тест"}
            </h2>

            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Тестийн нэр</label>
                  <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Тестийн нэр" className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`} />
                </div>
                <div>
                  <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Ангилал</label>
                  <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Жишээ: Стресс" className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`} />
                </div>
              </div>

              <div>
                <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Тайлбар</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Тестийн тайлбар..." rows={2} className={`w-full resize-none rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Хугацаа (мин)</label>
                  <input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`} />
                </div>
                <div className="flex items-end">
                  <label className="flex cursor-pointer items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, active: !form.active })}
                      className={`relative h-7 w-12 rounded-full transition-colors ${form.active ? "bg-emerald-500" : dark ? "bg-white/20" : "bg-gray-300"}`}
                    >
                      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${form.active ? "left-5.5" : "left-0.5"}`} />
                    </button>
                    <span className={`text-sm font-medium ${dark ? "text-white" : "text-gray-700"}`}>
                      {form.active ? "Идэвхтэй" : "Идэвхгүй"}
                    </span>
                  </label>
                </div>
              </div>

              {/* Questions */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className={`text-xs font-semibold ${dark ? "text-white" : "text-gray-900"}`}>Асуултууд ({form.questions.length})</label>
                  <button onClick={addQuestion} className="rounded-lg bg-purple-600 px-3 py-1.5 text-[10px] font-medium text-white hover:bg-purple-700">
                    + Асуулт нэмэх
                  </button>
                </div>

                <div className="space-y-4">
                  {form.questions.map((q, qi) => (
                    <div key={q.id} className={`rounded-xl p-4 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <label className={`mb-1 block text-[10px] font-medium ${dark ? "text-white/40" : "text-gray-400"}`}>Асуулт {qi + 1}</label>
                          <input
                            type="text"
                            value={q.question}
                            onChange={(e) => updateQuestion(q.id, e.target.value)}
                            placeholder="Асуулт бичнэ..."
                            className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${inputCls}`}
                          />
                        </div>
                        {form.questions.length > 1 && (
                          <button onClick={() => removeQuestion(q.id)} className="mt-5 shrink-0 rounded-lg p-1.5 text-red-500 hover:bg-red-500/10">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                          </button>
                        )}
                      </div>

                      <label className={`mb-1.5 block text-[10px] font-medium ${dark ? "text-white/40" : "text-gray-400"}`}>Хариултын сонголтууд</label>
                      <div className="space-y-2">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${dark ? "bg-white/10 text-white/50" : "bg-gray-200 text-gray-500"}`}>
                              {String.fromCharCode(65 + oi)}
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => updateOption(q.id, oi, e.target.value)}
                              placeholder={`Сонголт ${String.fromCharCode(65 + oi)}`}
                              className={`flex-1 rounded-lg px-3 py-1.5 text-xs outline-none ${inputCls}`}
                            />
                            {q.options.length > 2 && (
                              <button onClick={() => removeOption(q.id, oi)} className={`shrink-0 rounded p-1 ${dark ? "text-white/20 hover:text-red-400" : "text-gray-300 hover:text-red-500"}`}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button onClick={() => addOption(q.id)} className={`mt-2 text-[10px] font-medium ${dark ? "text-purple-400 hover:text-purple-300" : "text-purple-600 hover:text-purple-700"}`}>
                        + Сонголт нэмэх
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className={`rounded-xl px-5 py-2.5 text-sm font-medium ${dark ? "text-white/50 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"}`}>
                Болих
              </button>
              <button onClick={save} disabled={saving} className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50">
                {saving ? "Хадгалж байна..." : "Хадгалах"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View toggle buttons */}
      <div className="mb-4 flex flex-wrap gap-2">
        {([
          { id: "pricing", label: "Тестийн үнэ тохируулах" },
          { id: "attempts", label: "Тест өгсөн түүх" },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-colors ${
              activeView === tab.id
                ? "bg-purple-600 text-white shadow-sm"
                : dark
                  ? "bg-white/5 text-white/60 hover:bg-white/10"
                  : "bg-white text-gray-600 shadow-sm hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Registry Test Pricing */}
      {activeView === "pricing" && (
      <div className="mb-6">
        <div className={`overflow-hidden rounded-2xl ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}>
          <table className="w-full text-sm">
            <thead>
              <tr className={dark ? "bg-white/5" : "bg-gray-50"}>
                <th className={`px-5 py-3 text-left text-xs font-semibold ${dark ? "text-white/40" : "text-gray-500"}`}>Тест</th>
                <th className={`px-5 py-3 text-left text-xs font-semibold ${dark ? "text-white/40" : "text-gray-500"}`}>Ангилал</th>
                <th className={`px-5 py-3 text-left text-xs font-semibold ${dark ? "text-white/40" : "text-gray-500"}`}>Төрөл</th>
                <th className={`px-5 py-3 text-right text-xs font-semibold ${dark ? "text-white/40" : "text-gray-500"}`}>Өгсөн</th>
                <th className={`px-5 py-3 text-right text-xs font-semibold ${dark ? "text-white/40" : "text-gray-500"}`}>Үнэ</th>
                <th className={`px-5 py-3 text-right text-xs font-semibold ${dark ? "text-white/40" : "text-gray-500"}`}></th>
              </tr>
            </thead>
            <tbody className={`divide-y ${dark ? "divide-white/5" : "divide-gray-100"}`}>
              {ALL_TESTS.map((t) => {
                const dbPrice = testPrices[t.slug];
                const currentPrice = dbPrice ?? t.price ?? 0;
                const isEditing = priceEditing === t.slug;
                return (
                  <tr key={t.slug} className={dark ? "hover:bg-white/5" : "hover:bg-gray-50"}>
                    <td className={`px-5 py-3 font-medium ${dark ? "text-white" : "text-gray-900"}`}>{t.name}</td>
                    <td className={`px-5 py-3 ${dark ? "text-white/50" : "text-gray-500"}`}>{t.category}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${currentPrice > 0 ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"}`}>
                        {currentPrice > 0 ? "Төлбөртэй" : "Үнэгүй"}
                      </span>
                    </td>
                    <td className={`px-5 py-3 text-right font-medium ${dark ? "text-white" : "text-gray-900"}`}>
                      {(testTakenCounts[t.slug] ?? 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          value={priceInput}
                          onChange={(e) => setPriceInput(e.target.value)}
                          className={`w-24 rounded-lg px-3 py-1.5 text-right text-sm outline-none ${dark ? "bg-white/10 text-white" : "border border-gray-200 text-gray-900"}`}
                          autoFocus
                        />
                      ) : (
                        <span className={`font-medium ${dark ? "text-white" : "text-gray-900"}`}>
                          {currentPrice > 0 ? `${currentPrice.toLocaleString()}₮` : "Үнэгүй"}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => saveTestPrice(t.slug, Number(priceInput) || 0)}
                            disabled={priceSaving}
                            className="rounded-lg bg-purple-600 px-3 py-1.5 text-[10px] font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                          >
                            {priceSaving ? "..." : "Хадгалах"}
                          </button>
                          <button
                            onClick={() => setPriceEditing(null)}
                            className={`rounded-lg px-3 py-1.5 text-[10px] font-medium ${dark ? "text-white/40 hover:bg-white/10" : "text-gray-400 hover:bg-gray-100"}`}
                          >
                            Болих
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setPriceEditing(t.slug); setPriceInput(String(currentPrice)); }}
                          className={`rounded-lg px-3 py-1.5 text-[10px] font-medium ${dark ? "text-purple-400 hover:bg-white/10" : "text-purple-600 hover:bg-purple-50"}`}
                        >
                          Засах
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Test Attempts Log — sorted by date desc */}
      {activeView === "attempts" && (
      <div className="mb-6">
        <div className={`overflow-hidden rounded-2xl ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}>
          {testAttempts.length === 0 ? (
            <p className={`px-5 py-8 text-center text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>Тест өгсөн бүртгэл алга</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={dark ? "bg-white/5" : "bg-gray-50"}>
                    <th className={`px-5 py-3 text-left text-xs font-semibold ${dark ? "text-white/40" : "text-gray-500"}`}>Огноо</th>
                    <th className={`px-5 py-3 text-left text-xs font-semibold ${dark ? "text-white/40" : "text-gray-500"}`}>Тест</th>
                    <th className={`px-5 py-3 text-left text-xs font-semibold ${dark ? "text-white/40" : "text-gray-500"}`}>Ангилал</th>
                    <th className={`px-5 py-3 text-left text-xs font-semibold ${dark ? "text-white/40" : "text-gray-500"}`}>Төрөл</th>
                    <th className={`px-5 py-3 text-left text-xs font-semibold ${dark ? "text-white/40" : "text-gray-500"}`}>Хэн</th>
                    <th className={`px-5 py-3 text-left text-xs font-semibold ${dark ? "text-white/40" : "text-gray-500"}`}>Имэйл</th>
                    <th className={`px-5 py-3 text-right text-xs font-semibold ${dark ? "text-white/40" : "text-gray-500"}`}>Үнэ</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${dark ? "divide-white/5" : "divide-gray-100"}`}>
                  {testAttempts.map((a) => {
                    const meta = a.slug ? ALL_TESTS.find((t) => t.slug === a.slug) : undefined;
                    const dbPrice = a.slug ? testPrices[a.slug] : undefined;
                    const price = dbPrice ?? meta?.price ?? 0;
                    return (
                      <tr key={a.id} className={dark ? "hover:bg-white/5" : "hover:bg-gray-50"}>
                        <td className={`whitespace-nowrap px-5 py-3 ${dark ? "text-white/50" : "text-gray-500"}`}>
                          {new Date(a.taken_at).toLocaleString("mn-MN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className={`px-5 py-3 font-medium ${dark ? "text-white" : "text-gray-900"}`}>{a.test_title}</td>
                        <td className={`px-5 py-3 ${dark ? "text-white/50" : "text-gray-500"}`}>{a.test_category ?? "—"}</td>
                        <td className="px-5 py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${price > 0 ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"}`}>
                            {price > 0 ? "Төлбөртэй" : "Үнэгүй"}
                          </span>
                        </td>
                        <td className={`px-5 py-3 ${dark ? "text-white/80" : "text-gray-700"}`}>{a.user_name}</td>
                        <td className={`px-5 py-3 ${dark ? "text-white/50" : "text-gray-500"}`}>{a.user_email ?? "—"}</td>
                        <td className={`px-5 py-3 text-right font-medium ${dark ? "text-white" : "text-gray-900"}`}>
                          {price > 0 ? `${price.toLocaleString()}₮` : "Үнэгүй"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Test Cards */}
      {loading ? (
        <div className="py-20 text-center">
          <p className={`text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>Уншиж байна...</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tests.map((t) => (
            <div key={t.id} className={`overflow-hidden rounded-2xl ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}>
              <div className="relative h-24 bg-linear-to-br from-purple-500 to-indigo-600 px-5 pt-4">
                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${t.active ? "bg-emerald-500/30 text-white" : "bg-white/20 text-white/60"}`}>
                    {t.active ? "Идэвхтэй" : "Идэвхгүй"}
                  </span>
                  <span className="text-[10px] text-white/40">
                    {new Date(t.created_at).toLocaleDateString("mn-MN")}
                  </span>
                </div>
                <p className="mt-2 line-clamp-1 text-sm font-bold text-white">{t.title}</p>
              </div>

              <div className="px-5 pb-5 pt-4">
                <p className={`line-clamp-2 text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>{t.description}</p>

                <div className={`mt-3 flex gap-3 rounded-xl p-3 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                  <div className="flex-1 text-center">
                    <p className={`text-base font-bold ${dark ? "text-white" : "text-gray-900"}`}>{t.questions.length}</p>
                    <p className={`text-[10px] ${dark ? "text-white/30" : "text-gray-400"}`}>Асуулт</p>
                  </div>
                  <div className={`w-px ${dark ? "bg-white/10" : "bg-gray-200"}`} />
                  <div className="flex-1 text-center">
                    <p className={`text-base font-bold ${dark ? "text-white" : "text-gray-900"}`}>{t.duration_minutes}</p>
                    <p className={`text-[10px] ${dark ? "text-white/30" : "text-gray-400"}`}>Минут</p>
                  </div>
                  <div className={`w-px ${dark ? "bg-white/10" : "bg-gray-200"}`} />
                  <div className="flex-1 text-center">
                    <p className="text-base font-bold text-purple-500">{t.category}</p>
                    <p className={`text-[10px] ${dark ? "text-white/30" : "text-gray-400"}`}>Ангилал</p>
                  </div>
                </div>

                <div className={`mt-4 flex gap-2 border-t pt-4 ${dark ? "border-white/5" : "border-gray-100"}`}>
                  <button onClick={() => setViewTest(t)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${dark ? "text-purple-400 hover:bg-white/10" : "text-purple-600 hover:bg-purple-50"}`}>
                    Харах
                  </button>
                  <button onClick={() => openEdit(t)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${dark ? "text-white/50 hover:bg-white/10" : "text-gray-500 hover:bg-gray-50"}`}>
                    Засах
                  </button>
                  <button onClick={() => toggleActive(t.id)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${t.active ? (dark ? "text-amber-400 hover:bg-amber-500/10" : "text-amber-600 hover:bg-amber-50") : (dark ? "text-emerald-400 hover:bg-emerald-500/10" : "text-emerald-600 hover:bg-emerald-50")}`}>
                    {t.active ? "Идэвхгүй болгох" : "Идэвхжүүлэх"}
                  </button>
                  <button onClick={() => remove(t.id)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${dark ? "text-red-400 hover:bg-red-500/10" : "text-red-500 hover:bg-red-50"}`}>
                    Устгах
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
