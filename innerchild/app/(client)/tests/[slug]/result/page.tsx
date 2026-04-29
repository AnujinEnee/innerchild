"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getTestMeta } from "@/lib/test-logics/registry";
import { notFound } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import type { TestSlug } from "@/lib/test-logics/types";

// Scoring functions
import { calculateGutralScore } from "@/lib/test-logics/setgel-gutral/setgel-gutral-tests";
import { getGutralLevel } from "@/lib/test-logics/setgel-gutral/setgel-gutral-results";
import { calculateAnxietyScores } from "@/lib/test-logics/anxiety/anxiety-tests";
import { interpretMean, type AnxietyBand } from "@/lib/test-logics/anxiety/anxiety-results";
import { calculateStressScore } from "@/lib/test-logics/stress/stress-tests";
import { getStressResult } from "@/lib/test-logics/stress/stress-results";
import { calculateOCDScore } from "@/lib/test-logics/ocd/ocd-tests";
import { interpretOCDTotal, type OCDBand } from "@/lib/test-logics/ocd/ocd-results";
import { calculateBrainResult, BrainResults, type BrainResultKey } from "@/lib/test-logics/brain/brain-tests";
import { calculateAddictionScore } from "@/lib/test-logics/dontolt/dontolt-tests";
import { getAddictionResult } from "@/lib/test-logics/dontolt/dontolt-results";
import { scoreZan, ZAN_LEVELS, type ZanScores, type ZanTypeKey } from "@/lib/test-logics/zan-tuluv/zan-tuluv-tests";
import { ZAN_RESULTS } from "@/lib/test-logics/zan-tuluv/zan-tuluv-results";
import { generateLuscherAnalysis, type LuscherTestResult } from "@/lib/test-logics/luscher/luscher-results";
import { getLuscherFiveSectionResult, LuscherColors } from "@/lib/test-logics/luscher/luscher-interpretation-extended";

// ─── Result display components ──────────────────────────────

function SimpleBandResult({ label, icon, color, descriptions, recommendations }: {
  label: string; icon: string; color: string; descriptions: string[]; recommendations?: string[]; score?: number; maxScore?: number;
}) {
  return (
    <div>
      <div className="text-center">
        <div className="mb-3 text-5xl">{icon}</div>
        <h2 className={`mb-4 text-2xl font-bold ${color}`}>{label}</h2>
      </div>
      <div className="space-y-3 text-left">
        {descriptions.map((d, i) => (
          <p key={i} className="text-sm leading-relaxed text-zinc-600">{d}</p>
        ))}
      </div>
      {recommendations && recommendations.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-zinc-900">
            <span className="text-red-500">♡</span> Зөвлөмж
          </h3>
          <div className="space-y-2">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-blue-50 px-4 py-3">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm leading-relaxed text-zinc-700">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AnxietyCard({ title, band, mean }: { title: string; band: AnxietyBand; mean: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
      <h3 className="mb-3 text-lg font-bold text-zinc-900">{title}</h3>
      <div className="mb-3 text-4xl">{band.icon}</div>
      <p className={`mb-2 font-semibold ${band.color}`}>{band.label}</p>
      <div className="mb-3 inline-block rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600">
        Дундаж: {mean.toFixed(2)}
      </div>
      {band.description.map((d, i) => (
        <p key={i} className="mb-2 text-sm leading-relaxed text-zinc-600 last:mb-0">{d}</p>
      ))}
    </div>
  );
}

function AnxietyResult({ stateBand, traitBand, stateMean, traitMean }: {
  stateBand: AnxietyBand; traitBand: AnxietyBand; stateMean: number; traitMean: number;
}) {
  return (
    <div className="space-y-4">
      <p className="text-center text-xs text-zinc-400">Оноо 0–4 (дунджаар)</p>
      <div className="grid gap-4 md:grid-cols-2">
        <AnxietyCard title="Нөхцөл байдлын түгшилт" band={stateBand} mean={stateMean} />
        <AnxietyCard title="Бие хүний түгшилт" band={traitBand} mean={traitMean} />
      </div>
    </div>
  );
}

function OCDResult({ band }: { band: OCDBand }) {
  return (
    <div>
      <div className="text-center">
        <div className="mb-3 text-5xl">{band.icon}</div>
        <h2 className={`mb-4 text-2xl font-bold ${band.color}`}>{band.label}</h2>
      </div>
      <div className="space-y-2">
        {band.description.map((d, i) => <p key={i} className="text-sm leading-relaxed text-zinc-600">{d}</p>)}
      </div>
    </div>
  );
}

function BrainResultDisplay({ resultKey }: { resultKey: BrainResultKey }) {
  const r = BrainResults[resultKey];
  return (
    <div>
      <div className="text-center">
        <div className="mb-3 text-5xl">{r.icon}</div>
        <h2 className="mb-3 text-2xl font-bold text-purple-600">{r.title}</h2>
        <p className="mb-6 text-sm leading-relaxed text-zinc-600">{r.description}</p>
      </div>
      <div className="mb-5 text-left">
        <h3 className="mb-2 text-sm font-semibold text-zinc-700">Онцлог шинж:</h3>
        <ul className="space-y-1">
          {r.characteristics.map((c, i) => <li key={i} className="text-sm text-zinc-500">• {c}</li>)}
        </ul>
      </div>
      <div className="mb-5 text-left">
        <h3 className="mb-2 text-sm font-semibold text-zinc-700">Давуу тал:</h3>
        <ul className="space-y-1">
          {r.strengths.map((s, i) => <li key={i} className="text-sm leading-relaxed text-zinc-500">• {s}</li>)}
        </ul>
      </div>
      {r.weaknesses && r.weaknesses.length > 0 && (
        <div className="text-left">
          <h3 className="mb-2 text-sm font-semibold text-zinc-700">Анхаарах зүйл:</h3>
          <ul className="space-y-1">
            {r.weaknesses.map((w, i) => <li key={i} className="text-sm leading-relaxed text-zinc-500">• {w}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

const ZAN_TYPE_LABELS: Record<string, string> = {
  hyperthymic: "Эрч хүчтэй",
  dysthymic: "Гутрамтгай",
  cyclothymic: "Солигдомтгой",
  emotive: "Мэдрэмтгий",
  demonstrative: "Сурталчламтгай",
  stuck: "Гацамтгай хөшүүн",
  pedantic: "Нягтламтгай",
  anxious: "Түгшимтгий",
  excitable: "Хөөрөмтгий",
  irritable: "Цочромтгой",
};

function BulletList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-zinc-900">{title}:</p>
      <ul className="list-disc space-y-1 pl-5">
        {items.map((s, i) => (
          <li key={i} className="text-sm leading-relaxed text-zinc-600">{s}</li>
        ))}
      </ul>
    </div>
  );
}

function ZanTuluvResult({ scores }: { scores: ZanScores }) {
  const dimensions = (Object.keys(scores) as (ZanTypeKey)[])
    .filter((k) => k !== "validity")
    .map((k) => ({ key: k, label: ZAN_TYPE_LABELS[k] || k, value: scores[k] }))
    .sort((a, b) => b.value - a.value);

  const maxVal = 24;
  const top = dimensions[0];
  const topMeta = top ? ZAN_RESULTS[top.key as Exclude<ZanTypeKey, "validity">] : undefined;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-4 text-center text-xl font-bold text-purple-600">Зан төлвийн профайл</h2>
        <p className="mb-6 text-center text-xs text-zinc-400">Баталгаат чанар: {scores.validity}</p>
        <div className="space-y-3">
          {dimensions.map((d) => {
            const pct = Math.round((d.value / maxVal) * 100);
            const level = ZAN_LEVELS.find((l) => d.value <= l.max) || ZAN_LEVELS[ZAN_LEVELS.length - 1];
            return (
              <div key={d.key}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-zinc-700">{d.label}</span>
                  <span className="text-xs text-zinc-400">{d.value} — {level.label}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-zinc-200">
                  <div
                    className={`h-full rounded-full transition-all ${d.value > 18 ? "bg-red-500" : d.value > 12 ? "bg-yellow-500" : "bg-purple-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {top && topMeta && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
          <div className="mb-4 border-b border-zinc-200 pb-3">
            <p className="text-xs text-zinc-400">Давамгайлсан зан төлөв</p>
            <h3 className="text-lg font-bold text-zinc-900">{topMeta.title || top.label}</h3>
          </div>

          {topMeta.description.length > 0 && (
            <div className="mb-5 space-y-3">
              {topMeta.description.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-zinc-600">{p}</p>
              ))}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            {topMeta.character && topMeta.character.length > 0 && <BulletList title="Хэв шинж" items={topMeta.character} />}
            {topMeta.general_character && topMeta.general_character.length > 0 && <BulletList title="Ерөнхий шинж" items={topMeta.general_character} />}
            {topMeta.socia_traits?.adaptive_traits && <BulletList title="Нийгэмд дасан зохицох шинж" items={topMeta.socia_traits.adaptive_traits} />}
            {topMeta.socia_traits?.maladaptive_traits && <BulletList title="Нийгэмд үл дасан зохицох шинж" items={topMeta.socia_traits.maladaptive_traits} />}
            {topMeta.stressors?.triggers && <BulletList title="Стресс үүсгэдэг хүчин зүйл" items={topMeta.stressors.triggers} />}
            {topMeta.stressors?.coping && <BulletList title="Стрессээ даван туулах арга" items={topMeta.stressors.coping} />}
            {topMeta.job_traits && topMeta.job_traits.length > 0 && <BulletList title="Зохих ажил/орчин" items={topMeta.job_traits} />}
            {topMeta.productivity_enhancers && topMeta.productivity_enhancers.length > 0 && <BulletList title="Бүтээмжийг дэмжих зүйлс" items={topMeta.productivity_enhancers} />}
          </div>
        </div>
      )}
    </div>
  );
}

function LuscherColorRow({ selection }: { selection: number[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {selection.map((colorId, idx) => {
        const c = LuscherColors.find((lc) => lc.id === colorId);
        return (
          <div
            key={`${idx}-${colorId}`}
            className="h-12 w-12 rounded-lg shadow-sm"
            style={{ backgroundColor: c?.color ?? "#888" }}
            title={c?.name}
          />
        );
      })}
    </div>
  );
}

function LuscherResult({ result }: { result: LuscherTestResult }) {
  const five = getLuscherFiveSectionResult(result.firstSelection, result.secondSelection);
  const section3Dup = five.section3_currentSituation.firstSelectionInterpretation === five.section3_currentSituation.secondSelectionInterpretation;
  const section4Dup = five.section4_limitedCharacteristics.firstSelectionInterpretation === five.section4_limitedCharacteristics.secondSelectionInterpretation;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-linear-to-r from-purple-50 to-blue-50 p-5 text-center">
        <h2 className="mb-1 text-xl font-bold text-zinc-900">Люшерийн өнгөний тест</h2>
        <p className="text-sm text-zinc-600">8 өнгөний дараалал дээр үндэслэн таны сэтгэл зүйн байдлын дэлгэрэнгүй анализ</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="mb-1 text-sm font-semibold text-zinc-900">1-р сонголт</p>
          <p className="mb-3 text-xs text-zinc-400">Таны анхдагч сонголт</p>
          <LuscherColorRow selection={result.firstSelection} />
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="mb-1 text-sm font-semibold text-zinc-900">2-р сонголт</p>
          <p className="mb-3 text-xs text-zinc-400">Давтан сонголт</p>
          <LuscherColorRow selection={result.secondSelection} />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200">
        <div className="rounded-t-xl bg-linear-to-r from-purple-50 to-blue-50 p-4">
          <h3 className="text-lg font-bold text-zinc-900">Дэлгэрэнгүй анализ</h3>
          <p className="text-xs text-zinc-500">Таны өнгөний сонголт дээр үндэслэн гарсан сэтгэл зүйн дүн шинжилгээ</p>
        </div>
        <div className="space-y-6 p-4 sm:p-6">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xl">🎯</span>
              <h4 className="text-base font-semibold text-zinc-800">Хүсэж буй зорилго, эсвэл зорилгод чиглэсэн зан үйл</h4>
            </div>
            <div className="space-y-3 pl-7">
              {five.section1_desiredGoalsSingle.interpretation && (
                <div className="rounded-r-lg border-l-4 border-green-500 bg-green-50 p-4">
                  <p className="text-sm leading-relaxed text-zinc-700">{five.section1_desiredGoalsSingle.interpretation}</p>
                </div>
              )}
              {five.section2_desiredGoalsCombo.interpretation && (
                <div className="rounded-r-lg border-l-4 border-green-500 bg-green-50 p-4">
                  <p className="text-sm leading-relaxed text-zinc-700">{five.section2_desiredGoalsCombo.interpretation}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xl">🔄</span>
              <h4 className="text-base font-semibold text-zinc-800">Одоогийн нөхцөл байдал, эсвэл тухайн нөхцөл байдалд тохирсон зан үйл</h4>
            </div>
            <div className="space-y-3 pl-7">
              {five.section3_currentSituation.firstSelectionInterpretation && (
                <div className="rounded-r-lg border-l-4 border-blue-500 bg-blue-50 p-4">
                  <p className="text-sm leading-relaxed text-zinc-700">{five.section3_currentSituation.firstSelectionInterpretation}</p>
                </div>
              )}
              {five.section3_currentSituation.secondSelectionInterpretation && !section3Dup && (
                <div className="rounded-r-lg border-l-4 border-blue-500 bg-blue-50 p-4">
                  <p className="text-sm leading-relaxed text-zinc-700">{five.section3_currentSituation.secondSelectionInterpretation}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <h4 className="text-base font-semibold text-zinc-800">Хязгаарлагдсан шинж чанарууд, эсвэл тухайн нөхцөл байдалд тохироогүй зан үйл</h4>
            </div>
            <div className="space-y-3 pl-7">
              {five.section4_limitedCharacteristics.firstSelectionInterpretation && (
                <div className="rounded-r-lg border-l-4 border-yellow-500 bg-yellow-50 p-4">
                  <p className="text-sm leading-relaxed text-zinc-700">{five.section4_limitedCharacteristics.firstSelectionInterpretation}</p>
                </div>
              )}
              {five.section4_limitedCharacteristics.secondSelectionInterpretation && !section4Dup && (
                <div className="rounded-r-lg border-l-4 border-yellow-500 bg-yellow-50 p-4">
                  <p className="text-sm leading-relaxed text-zinc-700">{five.section4_limitedCharacteristics.secondSelectionInterpretation}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xl">🛑</span>
              <h4 className="text-base font-semibold text-zinc-800">Хязгаарлагдаж буй эсвэл хангагдаагүй хэрэгцээ</h4>
            </div>
            <div className="space-y-3 pl-7">
              {five.section5_suppressedNeeds.physicalExplanation && (
                <div className="rounded-r-lg border-l-4 border-red-500 bg-red-50 p-4">
                  <p className="mb-1 text-xs font-semibold text-red-700">Биеийн тайлбар:</p>
                  <p className="text-sm leading-relaxed text-zinc-700">{five.section5_suppressedNeeds.physicalExplanation}</p>
                </div>
              )}
              {five.section5_suppressedNeeds.psychologicalExplanation && (
                <div className="rounded-r-lg border-l-4 border-red-500 bg-red-50 p-4">
                  <p className="mb-1 text-xs font-semibold text-red-700">Сэтгэл зүйн тайлбар:</p>
                  <p className="text-sm leading-relaxed text-zinc-700">{five.section5_suppressedNeeds.psychologicalExplanation}</p>
                </div>
              )}
              {five.section5_suppressedNeeds.inShort && (
                <div className="rounded-r-lg border-l-4 border-red-600 bg-red-100 p-4">
                  <p className="mb-1 text-xs font-semibold text-red-700">Товчоор:</p>
                  <p className="text-sm leading-relaxed font-medium text-zinc-800">{five.section5_suppressedNeeds.inShort}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Scoring logic ──────────────────────────────────────────

interface ComputedResult {
  slug: TestSlug;
  score: number;
  maxScore: number;
  level: string;
  conclusion: string;
  node: React.ReactNode;
  needsHelp: boolean;
}

function computeResult(slug: TestSlug, rawAnswers: Record<string, unknown>): ComputedResult | null {
  const answers = rawAnswers as Record<number, string>;

  switch (slug) {
    case "setgel-gutral": {
      const s = calculateGutralScore(answers);
      const lvl = getGutralLevel(s.totalScore);
      return {
        slug, score: s.totalScore, maxScore: 60, level: lvl.level,
        conclusion: lvl.description.join(" "),
        node: <SimpleBandResult label={lvl.level} icon={lvl.icon} color={lvl.color} descriptions={lvl.description} score={s.totalScore} maxScore={60} />,
        needsHelp: s.totalScore >= 18,
      };
    }
    case "anxiety": {
      const s = calculateAnxietyScores(answers);
      const stateBand = interpretMean(s.stateMean);
      const traitBand = interpretMean(s.traitMean);
      return {
        slug, score: s.stateTotal, maxScore: 80, level: stateBand.label,
        conclusion: JSON.stringify({ stateTotal: s.stateTotal, stateMean: s.stateMean, traitTotal: s.traitTotal, traitMean: s.traitMean, stateBand: stateBand.label, traitBand: traitBand.label }),
        node: <AnxietyResult stateBand={stateBand} traitBand={traitBand} stateMean={s.stateMean} traitMean={s.traitMean} />,
        needsHelp: s.stateMean >= 2.0 || s.traitMean >= 2.0,
      };
    }
    case "stress": {
      const s = calculateStressScore(answers);
      const r = getStressResult(s.totalScore);
      return {
        slug, score: s.totalScore, maxScore: 56, level: r.level,
        conclusion: r.description,
        node: <SimpleBandResult label={r.level} icon={r.icon} color={r.color} descriptions={[r.description]} recommendations={r.recommendations} score={s.totalScore} maxScore={56} />,
        needsHelp: s.totalScore >= 21,
      };
    }
    case "ocd": {
      const s = calculateOCDScore(answers);
      const band = interpretOCDTotal(s.total);
      return {
        slug, score: s.total, maxScore: 40, level: band.label,
        conclusion: JSON.stringify({ obsessionTotal: s.obsessionTotal, compulsionTotal: s.compulsionTotal }),
        node: <OCDResult band={band} />,
        needsHelp: s.total >= 16,
      };
    }
    case "brain": {
      const resultKey = calculateBrainResult(answers);
      const r = BrainResults[resultKey];
      return {
        slug, score: 0, maxScore: 27, level: r.title,
        conclusion: r.description,
        node: <BrainResultDisplay resultKey={resultKey} />,
        needsHelp: false,
      };
    }
    case "dontolt": {
      const s = calculateAddictionScore(answers);
      const r = getAddictionResult(s.totalScore);
      return {
        slug, score: s.totalScore, maxScore: 28, level: r.level,
        conclusion: r.description,
        node: <SimpleBandResult label={r.level} icon={r.icon} color={r.color} descriptions={[r.description]} recommendations={r.recommendations} score={s.totalScore} maxScore={28} />,
        needsHelp: s.totalScore >= 6,
      };
    }
    case "zan-tuluv": {
      const s = scoreZan(answers as Record<number, "A" | "C">);
      const entries = (Object.keys(s) as ZanTypeKey[]).filter((k) => k !== "validity");
      const dominant = entries.reduce((a, b) => (s[a] > s[b] ? a : b));
      return {
        slug, score: s[dominant], maxScore: 24, level: ZAN_TYPE_LABELS[dominant] || dominant,
        conclusion: JSON.stringify(s),
        node: <ZanTuluvResult scores={s} />,
        needsHelp: false,
      };
    }
    case "luscher": {
      const first = (rawAnswers as { firstSelection: number[]; secondSelection: number[] }).firstSelection;
      const second = (rawAnswers as { firstSelection: number[]; secondSelection: number[] }).secondSelection;
      // Build groups from second selection (simplified: first 2 = +, next 2 = X, next 2 = =, last 2 = -)
      const symbols = ["+", "+", "X", "X", "=", "=", "-", "-"];
      const groupMap: Record<string, number[]> = {};
      second.forEach((colorId, i) => {
        const sym = symbols[i];
        if (!groupMap[sym]) groupMap[sym] = [];
        groupMap[sym].push(colorId);
      });
      const groups = Object.entries(groupMap).map(([symbol, colors]) => ({
        symbol,
        colors,
        interpretations: [] as string[],
      }));
      const analysis = generateLuscherAnalysis(first, second, groups);
      const result: LuscherTestResult = { firstSelection: first, secondSelection: second, groups, isIdentical: JSON.stringify(first) === JSON.stringify(second), analysis };
      return {
        slug, score: 0, maxScore: 0, level: analysis.stressLevel === "low" ? "Бага стресс" : analysis.stressLevel === "medium" ? "Дунд стресс" : "Өндөр стресс",
        conclusion: JSON.stringify(analysis),
        node: <LuscherResult result={result} />,
        needsHelp: analysis.stressLevel === "high",
      };
    }
  }
}

// ─── Main page ──────────────────────────────────────────────

export default function TestResultPage({
  params,
  searchParams: searchParamsPromise,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { slug } = use(params);
  const { from } = use(searchParamsPromise);
  const test = getTestMeta(slug);
  if (!test) notFound();

  const router = useRouter();
  const fromDashboard = from === "dashboard";
  const { user } = useAuth();
  const [saved, setSaved] = useState(fromDashboard);
  const savingRef = useRef(fromDashboard);

  const [result, setResult] = useState<ComputedResult | null>(null);

  // Payment gate for paid tests
  const [resultUnlocked, setResultUnlocked] = useState(!test.price || fromDashboard);
  const [paymentQR, setPaymentQR] = useState<{ qrImage: string; links: { name: string; link: string; logo?: string }[]; transactionId: string } | null>(null);
  const [payChecking, setPayChecking] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // Per-session paid flag: tied to the current test attempt only.
  // Stored in sessionStorage alongside the answers, so each new test attempt
  // starts fresh and the user must pay again.
  useEffect(() => {
    if (!test.price) return;
    try {
      const raw = sessionStorage.getItem(`test_result_${slug}`);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (parsed?.paid === true) setResultUnlocked(true);
    } catch { /* ignore */ }
  }, [test.price, slug]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`test_result_${slug}`);
      if (!raw) return;
      const { answers } = JSON.parse(raw);
      const computed = computeResult(test.slug, answers);
      queueMicrotask(() => setResult(computed));
    } catch { /* ignore */ }
  }, [slug, test.slug]);

  // Save to DB (once per test attempt — guarded by sessionStorage so a page
  // refresh does NOT create a duplicate row in test_results).
  useEffect(() => {
    if (!result || !user || saved || savingRef.current) return;

    // Already saved during this attempt? Then skip (refresh-safe).
    try {
      const raw = sessionStorage.getItem(`test_result_${slug}`);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed?.saved === true) {
        savingRef.current = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSaved(true);
        return;
      }
    } catch { /* ignore */ }

    savingRef.current = true;
    const save = async () => {
      const supabase = createClient();
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .single();
      if (!userData) { savingRef.current = false; return; }

      const raw = sessionStorage.getItem(`test_result_${slug}`);
      const { answers, duration } = raw ? JSON.parse(raw) : { answers: {}, duration: 0 };

      const { error } = await supabase.from("test_results").insert({
        client_id: userData.id,
        test_id: test.dbTestId,
        score: result.score,
        max_score: result.maxScore,
        level: result.level,
        duration_secs: duration,
        conclusion: result.conclusion,
        raw_answers: answers,
      });
      if (!error) {
        setSaved(true);
        // Persist saved flag in sessionStorage so refresh doesn't re-insert.
        try {
          if (raw) {
            const parsed = JSON.parse(raw);
            sessionStorage.setItem(`test_result_${slug}`, JSON.stringify({ ...parsed, saved: true }));
          }
        } catch { /* ignore */ }
      } else {
        console.error("Test result save error:", JSON.stringify(error));
        savingRef.current = false;
      }
    };
    save();
  }, [result, user, saved, slug, test.dbTestId]);

  if (!result) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#1e1145]">
        <div className="rounded-3xl bg-white p-8 text-center">
          <p className="mb-4 text-zinc-500">Үр дүн олдсонгүй</p>
          <Link href={`/tests/${slug}`} className="text-sm text-purple-600 hover:underline">Тест рүү буцах</Link>
        </div>
      </main>
    );
  }

  async function handlePayForResult() {
    if (!test?.price) return;
    setPayError(null);
    setPayLoading(true);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: test.price }),
      });
      const data = await res.json();
      if (data.qrImage || data.links?.length) {
        setPaymentQR({ qrImage: data.qrImage, links: data.links ?? [], transactionId: data.transactionId });
        // Poll
        setPayChecking(true);
        for (let i = 0; i < 60; i++) {
          await new Promise((r) => setTimeout(r, 5000));
          try {
            const chk = await fetch(`/api/payment/check?transactionId=${data.transactionId}`);
            const chkData = await chk.json();
            if (chkData.paid) {
              setResultUnlocked(true);
              setPaymentQR(null);
              setPayChecking(false);
              // Mark this specific attempt as paid so a page refresh keeps access.
              try {
                const raw = sessionStorage.getItem(`test_result_${slug}`);
                if (raw) {
                  const parsed = JSON.parse(raw);
                  sessionStorage.setItem(`test_result_${slug}`, JSON.stringify({ ...parsed, paid: true }));
                }
              } catch { /* ignore */ }
              if (user) {
                // Save test payment to DB
                const supabase = createClient();
                const { data: userData } = await supabase.from("users").select("id").eq("auth_id", user.id).maybeSingle();
                if (userData) {
                  await supabase.from("test_payments").insert({
                    client_id: userData.id,
                    test_slug: test.slug,
                    amount: test.price,
                    transaction_id: data.transactionId,
                  });
                }
              }
              return;
            }
          } catch {}
        }
        setPayChecking(false);
      } else {
        setPayError("Төлбөрийн систем хариу өгсөнгүй. Дахин оролдоно уу.");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setPayError("Төлбөр үүсгэхэд алдаа гарлаа. Сүлжээгээ шалгаад дахин оролдоно уу.");
    }
    setPayLoading(false);
  }

  // Payment gate — show payment UI before results
  if (!resultUnlocked && result && test.price) {
    return (
      <main className="min-h-screen bg-[#1e1145] px-3 pt-6 pb-10 sm:px-4 sm:pt-16 sm:pb-20">
        <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-5 sm:rounded-3xl sm:p-8">
          <h1 className="mb-2 text-center text-base font-bold text-zinc-900 sm:text-lg">{test.name}</h1>
          <p className="mb-5 text-center text-sm text-zinc-500">Тест амжилттай бөглөгдлөө! Үр дүнгээ харахын тулд төлбөрөө төлнө үү.</p>

          <div className="mb-5 text-center text-2xl font-bold text-purple-600 sm:text-3xl">{test.price.toLocaleString()}₮</div>

          {paymentQR ? (
            <div className="space-y-4">
              {paymentQR.qrImage && (
                <div className="flex justify-center">
                  <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4">
                    <img
                      src={`data:image/png;base64,${paymentQR.qrImage}`}
                      alt="QR"
                      className="h-56 w-56 sm:h-64 sm:w-64"
                    />
                  </div>
                </div>
              )}
              {paymentQR.links.length > 0 && (
                <div>
                  <p className="mb-2 text-center text-xs text-gray-400">Банкны апп-аар төлөх</p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {paymentQR.links.map((bank) => (
                      <a
                        key={bank.name}
                        href={bank.link}
                        className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-100 p-2.5 transition-colors active:bg-purple-50 hover:border-purple-300"
                      >
                        {bank.logo ? (
                          <img src={bank.logo} alt={bank.name} className="h-9 w-9 rounded-lg object-contain" />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-xs font-bold text-purple-600">{bank.name.charAt(0)}</div>
                        )}
                        <span className="line-clamp-1 text-[10px] text-gray-600">{bank.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {payChecking && (
                <div className="flex items-center justify-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-300 border-t-amber-600" />
                  Төлбөр хүлээж байна...
                </div>
              )}
              <button
                onClick={() => { setPaymentQR(null); setPayChecking(false); }}
                className="w-full rounded-lg py-2 text-center text-xs text-gray-400 hover:text-red-500"
              >
                Цуцлах
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {payError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-xs text-red-700">
                  {payError}
                </div>
              )}
              <button
                onClick={handlePayForResult}
                disabled={payLoading}
                className="w-full rounded-full bg-linear-to-r from-pink-500 to-purple-500 px-6 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {payLoading ? "Уншиж байна..." : "Төлбөр төлж үр дүн харах"}
              </button>
              <Link
                href="/tests"
                className="block w-full rounded-full border border-zinc-300 px-6 py-3 text-center text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
              >
                Буцах
              </Link>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#1e1145] px-4 pt-24 pb-20">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-6 sm:p-8">
        <h1 className="mb-6 text-center text-lg font-bold text-zinc-900">{test.name} — Үр дүн</h1>
        {result.node}

        <div className="mt-8 rounded-2xl border border-pink-200 bg-linear-to-br from-pink-50 to-purple-50 p-5 text-center">
          {result.needsHelp ? (
            <>
              <div className="mb-3 text-3xl">🫂</div>
              <h3 className="mb-2 text-base font-bold text-zinc-900">Мэргэжлийн тусламж</h3>
              <p className="mb-4 text-sm leading-relaxed text-zinc-600">
                Энэ түвшинд мэргэжлийн сэтгэл зүйчид хандаж, зөвлөгөө авахыг зөвлөж байна.
              </p>
            </>
          ) : (
            <>
              <div className="mb-3 text-3xl">💗</div>
              <h3 className="mb-2 text-base font-bold text-zinc-900">Та дотоод хүүхэддээ цаг гаргахдаа бэлэн үү?</h3>
              <p className="mb-4 text-sm leading-relaxed text-zinc-600">
                Өөртэйгөө холбогдож, дотоод хүүхдээ сонсох нь сэтгэлийн тэнцвэрийг сайжруулах эхний алхам юм.
              </p>
            </>
          )}
          <Link
            href="/consultation"
            className="inline-block rounded-full bg-linear-to-r from-pink-500 to-purple-500 px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Зөвлөгөө авах
          </Link>
        </div>

        {!user && (
          <p className="mt-6 text-center text-xs text-zinc-400">
            Үр дүнгээ хадгалахын тулд{" "}
            <Link href="/login" className="text-purple-600 hover:underline">нэвтэрнэ үү</Link>.
          </p>
        )}
        {saved && <p className="mt-4 text-center text-xs text-green-600">Үр дүн хадгалагдлаа!</p>}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
          {fromDashboard ? (
            <button
              onClick={() => router.back()}
              className="w-full rounded-full bg-linear-to-r from-pink-500 to-purple-500 px-5 py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Хаах
            </button>
          ) : (
            <>
              <Link href="/tests" className="rounded-full border border-zinc-300 px-5 py-2.5 text-center text-sm text-zinc-600 hover:bg-zinc-50">
                Бүх тестүүд
              </Link>
              <Link href={`/tests/${slug}/take`} className="rounded-full border border-purple-400 px-5 py-2.5 text-center text-sm text-purple-600 hover:bg-purple-50">
                Дахин өгөх
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
