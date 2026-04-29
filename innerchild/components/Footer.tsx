"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const pageLinks = [
  { label: "Нүүр хуудас", href: "/" },
  { label: "Нийтлэл", href: "/niitlel" },
  { label: "Манай хамт олон", href: "/team" },
  { label: "Бидний контентууд", href: "/content" },
];

const serviceLinks = [
  { label: "Бүртгүүлэх", href: "/register" },
  { label: "Зөвлөгөөний цаг авах", href: "/consultation" },
  { label: "Сэтгэл зүйн тест бөглөх", href: "/niitlel?tab=test" },
  { label: "Нууцлалын бодлого", href: "/privacy" },
  { label: "Нийтлэл оруулах", href: "/submit-article" },
];

const socials = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/people/Innerchild-%D1%81%D1%8D%D1%82%D0%B3%D1%8D%D0%BB-%D0%B7%D0%B0%D1%81%D0%BB%D1%8B%D0%BD-%D1%82%D3%A9%D0%B2/61583972801179/",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/results?search_query=innerchild+c%D1%8D%D1%82%D0%B3%D1%8D%D0%BB+%D0%B7%D0%B0%D1%81%D0%BB%D1%8B%D0%BD+%D1%82%D3%A9%D0%B2",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48" fill="white" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/innerchild.psychotherapy/",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-4 w-4"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@innerchild.psy",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78c.28 0 .56.04.82.1v-3.5a6.37 6.37 0 0 0-.82-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 10.86 4.49V12.8a8.28 8.28 0 0 0 4.85 1.56V10.9a4.84 4.84 0 0 1-.27-4.21z" />
      </svg>
    ),
  },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubscribe(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("newsletter_subscriptions")
      .insert({ email: trimmed, subscribed_at: new Date().toISOString() });
    if (error && error.code !== "23505") {
      console.error("Newsletter error:", JSON.stringify(error));
      return;
    }
    setSent(true);
    setEmail("");
  }

  return (
    <footer className="bg-[#1e1145] px-0 py-0 sm:bg-transparent sm:px-9 sm:py-8 md:px-16 lg:px-28">
      <div className="rounded-none bg-[#1e1145] px-5 pt-10 pb-6 sm:rounded-3xl sm:px-8 sm:pt-14 sm:pb-8 lg:px-28">
        <div className="grid gap-8 sm:gap-12 md:grid-cols-[1.2fr_1fr_1fr]">
          {/* Contact info */}
          <div>
            {/* Logo */}
            <Link href="/" className="mb-8 inline-block">
              <img src="/1.png" alt="Inner Child" className="h-10" />
            </Link>

            {/* Phone */}
            <div className="mb-6">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-purple-400">
                Утас
              </p>
              <Link
                href="tel:+97672700800"
                className="text-sm font-medium text-purple-200 hover:underline"
              >
                (+976) 99734116 , 76000111
              </Link>
            </div>

            {/* Email */}
            <div className="mb-6">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-purple-400">
                Мэйл
              </p>
              <Link
                href="mailto:info@innerchild.mn"
                className="text-sm font-medium text-purple-200 hover:underline"
              >
                info@innerchild.mn
              </Link>
            </div>

            {/* Address */}
            <div className="mb-8">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-purple-400">
                Хаяг
              </p>
              <p className="text-sm leading-relaxed text-purple-200">
                СБД, 2-р хороо, 220k
                <br />
                урд, Моба оффис
                <br />2 давхар 204 тоот
              </p>
            </div>

            {/* Social icons + Newsletter */}
            <div className="flex flex-wrap items-center gap-2">
              {socials.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  className="flex items-center gap-1.5 rounded-full border border-purple-700 px-3 py-1.5 text-xs text-purple-300 transition-colors hover:border-purple-500 hover:bg-purple-900/30 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
                >
                  {social.icon}
                  {social.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Page links */}
          <div>
            <h4 className="mb-5 text-sm font-semibold text-pink-300">
              Хуудсууд
            </h4>
            <ul className="flex flex-col gap-3">
              {pageLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-purple-300/70 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Service links */}
          <div className="flex flex-col gap-8 ">
            <div>
              <h4 className="mb-5 text-sm font-semibold text-pink-300">
                Үйлчилгээ
              </h4>
              <ul className="flex flex-col gap-3">
                {serviceLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-purple-300/70 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold  text-purple-200">
                Манай сэтгэл зүйн нийтлэлүүдийг тогтмол авахыг хүсвэл
              </p>
              {sent ? (
                <p className="text-xs text-purple-300">
                  Баярлалаа! Таны email бүртгэгдлээ.
                </p>
              ) : (
                <form
                  className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center"
                  onSubmit={handleSubscribe}
                >
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Энд email хаягаа үлдээгээрэй"
                    className="w-full rounded-full border border-purple-700 bg-purple-900/30 px-4 py-2 text-xs text-purple-200 placeholder-purple-400/60 outline-none transition-colors focus:border-purple-500 sm:w-55"
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-linear-to-r from-pink-500 to-purple-500 px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
                  >
                    Илгээх
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 flex flex-col items-center gap-4 border-t border-purple-800/50 pt-6 sm:mt-12 sm:flex-row sm:justify-between">
          <p className="text-xs text-purple-400/60">
            Copyright © {new Date().getFullYear()} ExpontMind
          </p>
          <Link
            href="/consultation"
            className="rounded-full bg-linear-to-r from-pink-500 to-purple-500 px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Зөвлөгөө авах
          </Link>
        </div>
      </div>
    </footer>
  );
}
