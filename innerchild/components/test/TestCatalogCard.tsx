"use client";

import Link from "next/link";
import { TestMeta } from "@/lib/test-logics/types";

export default function TestCatalogCard({ test }: { test: TestMeta }) {
  return (
    <Link
      href={`/tests/${test.slug}`}
      className="group block rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-purple-300 hover:shadow-lg"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-base font-bold text-[#2d1b69] group-hover:text-purple-600">
          {test.name}
        </h3>
        {test.price ? (
          <span className="shrink-0 rounded-full bg-purple-600 px-3 py-1 text-xs font-bold text-white">{test.price.toLocaleString()}₮</span>
        ) : (
          <span className="shrink-0 rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white">Үнэгүй</span>
        )}
      </div>
      <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-gray-500">
        {test.description}
      </p>
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span>{test.questionCount} асуулт</span>
        <span>~{test.estimatedMinutes} мин</span>
        <span className="rounded-full border border-[#f97316]/30 bg-orange-50 px-2 py-0.5 text-[#f97316]">
          {test.category}
        </span>
      </div>
    </Link>
  );
}
