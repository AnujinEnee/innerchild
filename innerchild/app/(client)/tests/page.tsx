"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TestCatalogCard from "@/components/test/TestCatalogCard";
import { useTestsWithPrices } from "@/hooks/useTestPrices";

const tabs = [
  { id: "paid", label: "Төлбөртэй" },
  { id: "free", label: "Үнэгүй" },
];

export default function TestsPage() {
  const [activeTab, setActiveTab] = useState("paid");
  const allTests = useTestsWithPrices();

  const filtered = activeTab === "free"
    ? allTests.filter((t) => !t.price)
    : allTests.filter((t) => !!t.price);

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <div className="bg-[#2d1b69] px-6 pt-28 pb-10 sm:px-9 sm:pt-36 sm:pb-14 md:px-16 lg:px-28">
        <h1 className="mb-3 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
          Сэтгэл зүйн{" "}
          <span className="bg-linear-to-r from-pink-300 to-purple-300 bg-clip-text italic text-transparent">
            тестүүд
          </span>
        </h1>
        <p className="max-w-lg text-sm text-purple-300/70">
          Өөрийгөө илүү сайн таних, сэтгэл зүйн байдлаа үнэлэхэд тусална.
        </p>
      </div>

      {/* Content */}
      <div className="px-6 py-8 sm:px-9 sm:py-12 md:px-16 lg:px-28">
        <div className="mb-6 flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-[#2d1b69] text-white"
                  : "border border-gray-300 text-gray-500 hover:border-purple-300 hover:text-purple-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((test) => (
            <TestCatalogCard key={test.slug} test={test} />
          ))}
        </div>
      </div>

      <div className="h-10" />
      <Footer />
    </main>
  );
}
