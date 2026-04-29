"use client";

import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import Niitlel from "@/components/Niitlel";
import Amlalt from "@/components/Amlalt";
import Hamtragch from "@/components/Hamtragch";
import ContentPreview from "@/components/ContentPreview";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="relative min-h-screen  ">
      <Header />

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #0f0720 0%, #1e1145 30%, #2d1b69 60%, #6d28d9 85%, #ec4899 100%)",
          }}
        >
          {/* Decorative blobs — smaller on mobile */}
          <div className="absolute -top-16 -left-16 h-[250px] w-[250px] rounded-full bg-purple-600/25 blur-[80px] sm:-top-32 sm:-left-32 sm:h-[500px] sm:w-[500px] sm:blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[200px] w-[200px] rounded-full bg-pink-500/25 blur-[60px] sm:h-[400px] sm:w-[400px] sm:blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-indigo-600/15 blur-[80px] sm:h-[600px] sm:w-[600px] sm:blur-[150px]" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-4 px-5 text-center sm:gap-6 sm:px-8 md:px-16">
          {/* Badge */}
          <span className="whitespace-nowrap rounded-full border border-purple-400/30 bg-purple-500/10 px-3 py-1.5 text-[9px] font-semibold tracking-widest text-purple-300 backdrop-blur-sm sm:px-5 sm:py-2 sm:text-xs">
            СЭТГЭЦИЙН ЭРҮҮЛ МЭНД · МЭРГЭЖЛИЙН ЗӨВЛӨГӨӨ
          </span>

          <h1 className="max-w-4xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-7xl">
            Дотоод хүүхэддээ
            <br />
            <span className="bg-linear-to-r from-pink-400 to-purple-300 bg-clip-text text-transparent">
              Гаргах Цаг
            </span>
          </h1>

          <p className="max-w-xl text-sm leading-relaxed text-purple-200/80 sm:text-base md:text-lg">
            Та дэлхийн хаанаас ч, хэзээ ч мэргэжлийн сэтгэл зүйч, сэтгэл
            засалчтай холбогдох боломжтой. Сэтгэл зүйн боловсрол, сэтгэцийн
            эрүүл мэндээ нэн тэргүүнд тавиарай.
          </p>

          <div className="mt-1 flex flex-col items-center gap-3 sm:mt-2 sm:flex-row sm:gap-4">
            <Link
              href="/consultation"
              className="w-full rounded-full bg-linear-to-r from-pink-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-900/40 transition-opacity hover:opacity-90 sm:w-auto sm:px-8 sm:py-3.5"
            >
              Зөвлөгөө авах
            </Link>
            {user ? (
              <Link
                href="/dashboard"
                className="w-full rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20 sm:w-auto sm:px-8 sm:py-3.5"
              >
                Миний хуудас
              </Link>
            ) : (
              <Link
                href="/register"
                className="w-full rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20 sm:w-auto sm:px-8 sm:py-3.5"
              >
                Бүртгүүлэх
              </Link>
            )}
          </div>

          {/* Stats row */}
          <div className="mt-4 flex items-center justify-center gap-6 sm:mt-8 sm:gap-8">
            {[
              { value: "100+", label: "Хэрэглэгч" },
              { value: "10+", label: "Мэргэжилтэн" },
              { value: "1000+", label: "Зөвлөгөө" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-xl font-bold text-white sm:text-2xl">
                  {s.value}
                </p>
                <p className="text-[10px] text-purple-300/70 sm:text-xs">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-2 text-xs italic text-purple-300/60 sm:mt-4 sm:text-sm">
            &ldquo;Дотоод хүүхдээ хайрлая&rdquo;
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30">
          <span className="text-xs tracking-widest">ДООШ</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5 animate-bounce"
          >
            <path d="M7 10l5 5 5-5" />
          </svg>
        </div>
      </section>

      <Niitlel />
      <Amlalt />
      <ContentPreview />
      <Hamtragch />
      <Footer />
    </div>
  );
}
