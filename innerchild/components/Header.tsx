"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navLinks = [
  { label: "Нийтлэл", href: "/niitlel" },
  { label: "Тестүүд", href: "/tests" },
  { label: "Манай хамт олон", href: "/team" },
  { label: "Контент", href: "/content" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  // Close menu on route change
  useEffect(() => {
    queueMicrotask(() => setMenuOpen(false));
  }, [router]);

  async function handleLogout() {
    // Зөвхөн хэрэглэгчийн session-г хаана, admin session-д нөлөөлөхгүй
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "local" });
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="fixed top-0 left-0 z-50 w-full px-6 py-3 sm:px-9 sm:py-4 md:px-16 lg:px-28">
      <div className="flex items-center justify-between rounded-full border border-purple-400/20 bg-purple-900/10 px-4 py-2 backdrop-blur-md sm:px-8 sm:py-2.5">
        {/* Hamburger (mobile) */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition-colors hover:text-white md:hidden"
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          )}
        </button>

        {/* Desktop: default layout — [Нийтлэл Тестүүд Манай хамт олон] [Logo] [Контент Миний хуудас Гарах] */}
        {/* Desktop: scrolled layout — [Logo Нийтлэл Тестүүд Манай хамт олон Контент] [Миний хуудас Гарах] */}

        {/* Left (desktop) */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.slice(0, 3).map((link) => (
            <Link key={link.label} href={link.href} className="text-sm font-medium text-white/80 transition-colors hover:text-white">
              {link.label}
            </Link>
          ))}
        </div>

        {/* Center: Logo */}
        <Link href="/" className="flex items-center">
          <img src="/1.png" alt="Inner Child Logo" className="h-7 sm:h-8" />
        </Link>

        {/* Right (desktop) */}
        <div className="hidden items-center gap-5 md:flex">
          <Link href="/content" className="text-sm font-medium text-white/80 transition-colors hover:text-white">
            Контент
          </Link>
          {!loading && (
            <>
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="rounded-full border border-white/20 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                  >
                    Миний хуудас
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="rounded-full border border-white/20 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                  >
                    Гарах
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-full border border-white/20 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                  >
                    Нэвтрэх
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-full bg-linear-to-r from-purple-500 to-pink-400 px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  >
                    Бүртгүүлэх
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        {/* Right (mobile): CTA */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/consultation"
            className="rounded-full bg-linear-to-r from-purple-500 to-pink-400 px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
          >
            Зөвлөгөө авах
          </Link>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="mt-2 overflow-hidden rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col p-3">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <div className="my-2 border-t border-white/10" />
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="rounded-xl px-4 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      Миний хуудас
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="rounded-xl px-4 py-3 text-left text-sm font-medium text-pink-400 transition-colors hover:bg-pink-400/10"
                    >
                      Гарах
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="rounded-xl px-4 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      Нэвтрэх
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMenuOpen(false)}
                      className="mx-3 mt-1 rounded-full bg-linear-to-r from-purple-500 to-pink-400 px-4 py-2.5 text-center text-sm font-medium text-white transition-opacity hover:opacity-90"
                    >
                      Бүртгүүлэх
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
