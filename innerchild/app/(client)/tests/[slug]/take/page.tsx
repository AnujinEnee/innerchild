"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { getTestMeta } from "@/lib/test-logics/registry";
import { notFound } from "next/navigation";
import TestProgress from "@/components/test/TestProgress";
import MultiChoiceTestCard from "@/components/test/MultiChoiceTestCard";
import type { TestSlug } from "@/lib/test-logics/types";

// Lazy-loaded question data
import { GutralQuestions } from "@/lib/test-logics/setgel-gutral/setgel-gutral-tests";
import { AnxietyQuestions } from "@/lib/test-logics/anxiety/anxiety-tests";
import { StressQuestions } from "@/lib/test-logics/stress/stress-tests";
import { OCDQuestions } from "@/lib/test-logics/ocd/ocd-tests";
import { BrainQuestions } from "@/lib/test-logics/brain/brain-tests";
import { AddictionQuestions } from "@/lib/test-logics/dontolt/dontolt-tests";
import { ZanQuestions } from "@/lib/test-logics/zan-tuluv/zan-tuluv-tests";

interface GenericQuestion {
  id: number;
  text: string;
  options: { key: string; value: string }[];
}

function getQuestions(slug: TestSlug): GenericQuestion[] {
  switch (slug) {
    case "setgel-gutral":
      return GutralQuestions.map((q) => ({ id: q.id, text: q.title, options: q.options }));
    case "anxiety":
      return AnxietyQuestions.map((q) => ({ id: q.id, text: q.question, options: q.options }));
    case "stress":
      return StressQuestions.map((q) => ({ id: q.id, text: q.question, options: q.options }));
    case "ocd":
      return OCDQuestions.map((q) => ({ id: q.id, text: q.title, options: q.options }));
    case "brain":
      return BrainQuestions.map((q) => ({
        id: q.id,
        text: q.question,
        options: [
          { key: "A", value: q.options.A },
          { key: "B", value: q.options.B },
          { key: "C", value: q.options.C },
        ],
      }));
    case "dontolt":
      return AddictionQuestions.map((q) => ({ id: q.id, text: q.question, options: q.options }));
    case "zan-tuluv":
      return ZanQuestions.map((q) => ({
        id: q.id,
        text: q.question,
        options: [
          { key: "A", value: "Тийм" },
          { key: "C", value: "Үгүй" },
        ],
      }));
    case "luscher":
      return [];
  }
}

// Luscher color data
const LUSCHER_COLORS = [
  { id: 0, name: "Саарал", hex: "#808080" },
  { id: 1, name: "Хөх", hex: "#0047AB" },
  { id: 2, name: "Ногоон", hex: "#228B22" },
  { id: 3, name: "Улаан", hex: "#DC143C" },
  { id: 4, name: "Шар", hex: "#FFD700" },
  { id: 5, name: "Нил ягаан", hex: "#7B2D8B" },
  { id: 6, name: "Хүрэн", hex: "#8B4513" },
  { id: 7, name: "Хар", hex: "#1a1a1a" },
];

const LUSCHER_BREAK_SECONDS = 60;

function LuscherTest({ onComplete }: { onComplete: (first: number[], second: number[]) => void }) {
  const [stage, setStage] = useState<"round1" | "break" | "round2">("round1");
  const [firstSelection, setFirstSelection] = useState<number[]>([]);
  const [secondSelection, setSecondSelection] = useState<number[]>([]);
  const [breakSecondsLeft, setBreakSecondsLeft] = useState(LUSCHER_BREAK_SECONDS);

  // Break timer between round 1 and round 2.
  useEffect(() => {
    if (stage !== "break") return;
    if (breakSecondsLeft <= 0) {
      setStage("round2");
      return;
    }
    const t = setTimeout(() => setBreakSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, breakSecondsLeft]);

  if (stage === "break") {
    const pct = ((LUSCHER_BREAK_SECONDS - breakSecondsLeft) / LUSCHER_BREAK_SECONDS) * 100;
    return (
      <div className="relative flex flex-col items-center gap-8 px-6 py-12 sm:py-16">

        {/* Lotus / breathe icon */}
        <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/70 shadow-sm backdrop-blur sm:h-14 sm:w-14">
          <svg viewBox="0 0 24 24" fill="none" stroke="url(#breath-grad)" strokeWidth="1.5" className="h-6 w-6 sm:h-7 sm:w-7">
            <defs>
              <linearGradient id="breath-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            <path d="M12 2c-2 4-4 6-4 9a4 4 0 0 0 8 0c0-3-2-5-4-9z" />
            <path d="M5 14c-2 1-3 3-3 5a3 3 0 0 0 6 0" />
            <path d="M19 14c2 1 3 3 3 5a3 3 0 0 1-6 0" />
          </svg>
        </div>

        <h3 className="relative z-10 bg-linear-to-r from-pink-500 via-fuchsia-500 to-purple-500 bg-clip-text text-center text-2xl font-bold text-transparent sm:text-3xl md:text-4xl">
          Богино завсарлага
        </h3>

        <p className="relative z-10 max-w-md text-center text-sm font-light leading-relaxed text-zinc-500 sm:text-base">
          Гүн амьсгал аваад сэтгэлээ тайвшруулна уу.
          <br className="hidden sm:block" />
          1 минутын дараа дахин сонгох боломжтой.
        </p>

        {/* Timer circle */}
        <div className="relative z-10 flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" stroke="rgba(168,85,247,0.12)" strokeWidth="3" fill="none" />
            <circle
              cx="50"
              cy="50"
              r="46"
              stroke="url(#luscher-grad)"
              strokeWidth="3"
              fill="none"
              strokeDasharray={`${(pct / 100) * 289} 289`}
              strokeLinecap="round"
              className="transition-[stroke-dasharray] duration-1000 filter-[drop-shadow(0_0_6px_rgba(236,72,153,0.4))]"
            />
            <defs>
              <linearGradient id="luscher-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>
          <div className="text-center">
            <p className="bg-linear-to-br from-[#2d1b69] to-purple-600 bg-clip-text text-7xl font-bold tabular-nums leading-none text-transparent sm:text-8xl">
              {String(breakSecondsLeft).padStart(2, "0")}
            </p>
            <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.3em] text-purple-400 sm:text-xs">
              секунд
            </p>
          </div>
        </div>

        <p className="relative z-10 max-w-sm text-center text-[11px] italic text-zinc-400 sm:text-xs">
          &ldquo;Дараагийн сонголтыг шинэ сэтгэлээр хийхэд завсарлага туслана.&rdquo;
        </p>
      </div>
    );
  }

  const currentSelection = stage === "round1" ? firstSelection : secondSelection;
  const remaining = LUSCHER_COLORS.filter((c) => !currentSelection.includes(c.id));

  function selectColor(id: number) {
    if (stage === "round1") {
      const next = [...firstSelection, id];
      setFirstSelection(next);
      if (next.length === 8) setStage("break");
    } else {
      const next = [...secondSelection, id];
      setSecondSelection(next);
      if (next.length === 8) onComplete(firstSelection, next);
    }
  }

  return (
    <div>
      <p className="mb-2 text-center text-sm text-zinc-600">
        {stage === "round1" ? "1-р сонголт" : "2-р сонголт"} — Дуртай өнгөнөөсөө эхэлж сонгоно уу
      </p>
      <p className="mb-6 text-center text-xs text-zinc-400">
        Сонгосон: {currentSelection.length}/8
      </p>
      <div className="mx-auto grid max-w-md grid-cols-4 gap-4">
        {remaining.map((c) => (
          <button
            key={c.id}
            onClick={() => selectColor(c.id)}
            className="mx-auto h-16 w-16 rounded-full border-2 border-zinc-200 transition-all hover:scale-110 hover:border-zinc-400 sm:h-20 sm:w-20"
            style={{ backgroundColor: c.hex }}
            title={c.name}
          />
        ))}
      </div>
      {currentSelection.length > 0 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="text-xs text-zinc-400">Дараалал:</span>
          {currentSelection.map((id, i) => (
            <div
              key={i}
              className="h-6 w-6 rounded-full border border-zinc-200"
              style={{ backgroundColor: LUSCHER_COLORS[id].hex }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TestTakePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const test = getTestMeta(slug);

  const questions = test ? getQuestions(test.slug) : [];
  const storageKey = `test_answers_${slug}`;

  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = localStorage.getItem(`test_answers_${slug}`);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [startTime] = useState(() => Date.now());

  // Scroll to top when page changes
  useEffect(() => {
    if (currentPage > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage]);

  // Save answers to localStorage on change
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(answers));
    }
  }, [answers, storageKey]);

  const handleAnswer = useCallback((questionId: number, optionKey: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionKey }));
    // Auto-scroll to next question after a short delay
    setTimeout(() => {
      const nextEl = document.querySelector(`[data-question-id="${questionId + 1}"]`);
      if (nextEl) {
        nextEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 300);
  }, []);

  const handleSubmit = useCallback(() => {
    const duration = Math.round((Date.now() - startTime) / 1000);
    sessionStorage.setItem(
      `test_result_${slug}`,
      JSON.stringify({ answers, duration })
    );
    localStorage.removeItem(storageKey);
    router.push(`/tests/${slug}/result`);
  }, [answers, slug, startTime, storageKey, router]);

  const handleLuscherComplete = useCallback((first: number[], second: number[]) => {
    const duration = Math.round((Date.now() - startTime) / 1000);
    sessionStorage.setItem(
      `test_result_${slug}`,
      JSON.stringify({ answers: { firstSelection: first, secondSelection: second }, duration })
    );
    router.push(`/tests/${slug}/result`);
  }, [slug, startTime, router]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?from=test`);
    }
  }, [authLoading, user, router]);

  if (!test) notFound();

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600" />
      </main>
    );
  }

  if (!user) return null;

  // Luscher has its own UI
  if (test.uiType === "color-ranking") {
    return (
      <main className="min-h-screen bg-white">
        <Header />
        <div className="bg-[#2d1b69] px-6 pt-28 pb-10 sm:px-9 sm:pt-36 sm:pb-14 md:px-16 lg:px-28">
          <Link href={`/tests/${slug}`} className="mb-4 inline-flex items-center gap-2 text-sm text-purple-300 transition-colors hover:text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Буцах
          </Link>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">{test.name}</h1>
        </div>
        <div className="px-6 py-8 sm:px-9 sm:py-12 md:px-16 lg:px-28">
          <div className="mx-auto max-w-2xl">
            <LuscherTest onComplete={handleLuscherComplete} />
          </div>
        </div>
      </main>
    );
  }

  // Paginated question-based tests
  const perPage = test.questionsPerPage;
  const totalPages = Math.ceil(questions.length / perPage);
  const pageQuestions = questions.slice(currentPage * perPage, (currentPage + 1) * perPage);
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount >= questions.length;
  const isLastPage = currentPage === totalPages - 1;

  return (
    <main className="min-h-screen bg-white">
      <Header />
      {/* Hero */}
      <div className="bg-[#2d1b69] px-6 pt-28 pb-10 sm:px-9 sm:pt-36 sm:pb-14 md:px-16 lg:px-28">
        <Link href={`/tests/${slug}`} className="mb-4 inline-flex items-center gap-2 text-sm text-purple-300 transition-colors hover:text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Буцах
        </Link>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">{test.name}</h1>
      </div>

      {/* Content */}
      <div className="px-6 py-8 sm:px-9 sm:py-12 md:px-16 lg:px-28">
        <div className="mx-auto max-w-2xl">
          <TestProgress answered={answeredCount} total={questions.length} />

          <div className="flex flex-col gap-4">
            {pageQuestions.map((q, i) => (
              <div key={q.id} data-question-id={q.id}>
                <MultiChoiceTestCard
                  questionNumber={currentPage * perPage + i + 1}
                  question={q.text}
                  options={q.options}
                  selectedAnswer={answers[q.id]}
                  onAnswerSelect={(key) => handleAnswer(q.id, key)}
                />
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => { setCurrentPage((p) => Math.max(0, p - 1)); window.scrollTo(0, 0); }}
              disabled={currentPage === 0}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-30"
            >
              Өмнөх
            </button>

            {isLastPage ? (
              <button
                onClick={handleSubmit}
                disabled={!allAnswered}
                className="w-full rounded-full bg-linear-to-r from-pink-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                Дуусгах
              </button>
            ) : (
              <button
                onClick={() => { setCurrentPage((p) => Math.min(totalPages - 1, p + 1)); window.scrollTo(0, 0); }}
                className="rounded-xl border border-purple-400 px-5 py-2.5 text-sm text-purple-600 transition-colors hover:bg-purple-50"
              >
                Дараах
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
