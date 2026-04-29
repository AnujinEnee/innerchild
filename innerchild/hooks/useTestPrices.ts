"use client";

import { useEffect, useState } from "react";
import { ALL_TESTS } from "@/lib/test-logics/registry";
import type { TestMeta } from "@/lib/test-logics/types";

export function useTestsWithPrices() {
  const [tests, setTests] = useState<TestMeta[]>(ALL_TESTS);

  useEffect(() => {
    fetch("/api/test-prices")
      .then((res) => res.json())
      .then((data: { slug: string; price: number }[]) => {
        const priceMap: Record<string, number> = {};
        for (const item of data) {
          if (item.slug) priceMap[item.slug] = item.price ?? 0;
        }
        setTests(
          ALL_TESTS.map((t) => ({
            ...t,
            price: priceMap[t.slug] ?? t.price,
          }))
        );
      })
      .catch(() => {});
  }, []);

  return tests;
}
