"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeProvider, useTheme } from "./ThemeContext";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/upload-image";

// Admin — бүх хэсгийг харна
const adminNavItems = [
  {
    label: "Хянах самбар",
    href: "/admin",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: "Нийтлэл",
    href: "/admin/articles",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    label: "Контент",
    href: "/admin/content",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  },
  {
    label: "Хэрэглэгчид",
    href: "/admin/users",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Зөвлөгөө",
    href: "/admin/consultations",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    label: "Тест",
    href: "/admin/tests",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    label: "Цалин",
    href: "/admin/salary",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    label: "Баг",
    href: "/admin/team",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path d="M12 2a5 5 0 0 1 5 5v1a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5z" />
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      </svg>
    ),
  },
  {
    label: "Нийтлэл илгээх",
    href: "/admin/newsletter",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
];

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [adminName, setAdminName] = useState("Админ");
  const [adminImage, setAdminImage] = useState("");
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dark = theme === "dark";
  const navItems = adminNavItems;

  useEffect(() => {
    requestAnimationFrame(() => {
      const savedName = localStorage.getItem("admin_name");
      const savedImage = localStorage.getItem("admin_image");
      if (savedName) setAdminName(savedName);
      if (savedImage) setAdminImage(savedImage);
    });
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
      if (!user && pathname !== "/admin/login") {
        router.push("/admin/login");
      }
    });
  }, [pathname, router]);

  // Close sidebar on route change
  useEffect(() => {
    queueMicrotask(() => setSidebarOpen(false));
  }, [pathname]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (isLoggedIn === null || !isLoggedIn) {
    return null;
  }

  return (
    <div className={`flex min-h-screen ${dark ? "bg-[#1a1a2e]" : "bg-gray-100"}`}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-60 flex-col transition-transform duration-300 ${
          dark
            ? "bg-linear-to-b from-[#5b2a8e] to-[#2d1452]"
            : "bg-linear-to-b from-[#7c3aed] to-[#5b21b6]"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Close button (mobile) */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Profile section */}
        <div className="flex flex-col items-center px-6 pb-6 pt-8">
          <Link href="/admin" className="mb-1">
            <img src="/1.png" alt="Inner Child" className="h-8" />
          </Link>
          <div className="group relative my-5">
            <div className="h-20 w-20 overflow-hidden rounded-full border-3 border-white/30 bg-white/10">
              {adminImage ? (
                <img src={adminImage} alt={adminName} className="h-full w-full object-cover" />
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full p-3 text-white/40">
                  <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v2h20v-2c0-3.3-6.7-5-10-5z" />
                </svg>
              )}
            </div>
            <button
              onClick={() => { setEditName(adminName); setShowProfileEdit(true); }}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white opacity-0 transition-opacity hover:bg-white/30 group-hover:opacity-100"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
          <span className="text-sm font-semibold text-white">{adminName}</span>
          <span className="mt-1 rounded-full bg-white/15 px-3 py-0.5 text-[10px] font-medium text-white/60">
            Admin
          </span>
        </div>

        {/* Profile Edit Modal */}
        {showProfileEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className={`w-full max-w-xs rounded-2xl p-5 ${dark ? "bg-[#1e1e36]" : "bg-white"}`}>
              <h3 className={`mb-4 text-sm font-bold ${dark ? "text-white" : "text-gray-900"}`}>Профайл засах</h3>

              <div className="mb-4 flex flex-col items-center gap-3">
                <div className={`h-20 w-20 overflow-hidden rounded-full ${dark ? "bg-white/10" : "bg-gray-100"}`}>
                  {adminImage ? (
                    <img src={adminImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" className={`h-full w-full p-3 ${dark ? "text-white/20" : "text-gray-300"}`}>
                      <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v2h20v-2c0-3.3-6.7-5-10-5z" />
                    </svg>
                  )}
                </div>
                <div className="flex gap-2">
                  <label className="cursor-pointer rounded-lg bg-purple-600 px-3 py-1.5 text-[10px] font-medium text-white hover:bg-purple-700">
                    Зураг солих
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      try {
                        const url = await uploadImage(file);
                        setAdminImage(url);
                        localStorage.setItem("admin_image", url);
                        const supabase = createClient();
                        const { data: { user } } = await supabase.auth.getUser();
                        if (user?.email) await supabase.from("admin_users").update({ image_url: url }).eq("email", user.email);
                      } catch (err) {
                        alert(`Зураг upload хийхэд алдаа: ${err instanceof Error ? err.message : "тодорхойгүй"}`);
                      }
                    }} />
                  </label>
                  {adminImage && (
                    <button onClick={async () => {
                      setAdminImage(""); localStorage.removeItem("admin_image");
                      const supabase = createClient();
                      const { data: { user } } = await supabase.auth.getUser();
                      if (user?.email) await supabase.from("admin_users").update({ image_url: null }).eq("email", user.email);
                    }}
                      className="rounded-lg px-3 py-1.5 text-[10px] font-medium text-red-500 hover:bg-red-500/10">
                      Устгах
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Нэр</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Админ нэр"
                  className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${
                    dark ? "bg-white/10 text-white placeholder:text-white/30" : "border border-gray-200 text-gray-900 placeholder:text-gray-400"
                  }`}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    const newName = editName || "Админ";
                    setAdminName(newName);
                    localStorage.setItem("admin_name", newName);
                    const supabase = createClient();
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user?.email) await supabase.from("admin_users").update({ name: newName }).eq("email", user.email);
                    setShowProfileEdit(false);
                  }}
                  className="flex-1 rounded-xl bg-purple-600 py-2 text-xs font-medium text-white hover:bg-purple-700"
                >
                  Хадгалах
                </button>
                <button onClick={() => setShowProfileEdit(false)}
                  className={`flex-1 rounded-xl py-2 text-xs font-medium ${dark ? "text-white/50 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"}`}
                >
                  Болих
                </button>
              </div>

              {/* Нууц үг солих */}
              <div className={`mt-4 border-t pt-4 ${dark ? "border-white/10" : "border-gray-200"}`}>
                <p className={`mb-2 text-xs font-semibold ${dark ? "text-white/50" : "text-gray-500"}`}>Нууц үг солих</p>
                <div className="flex flex-col gap-2">
                  <input
                    type="password"
                    placeholder="Шинэ нууц үг"
                    id="admin-new-pw"
                    className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${
                      dark ? "bg-white/10 text-white placeholder:text-white/30" : "border border-gray-200 text-gray-900 placeholder:text-gray-400"
                    }`}
                  />
                  <input
                    type="password"
                    placeholder="Нууц үг давтах"
                    id="admin-confirm-pw"
                    className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${
                      dark ? "bg-white/10 text-white placeholder:text-white/30" : "border border-gray-200 text-gray-900 placeholder:text-gray-400"
                    }`}
                  />
                  <button
                    onClick={async () => {
                      const pw = (document.getElementById("admin-new-pw") as HTMLInputElement).value;
                      const confirm = (document.getElementById("admin-confirm-pw") as HTMLInputElement).value;
                      if (!pw || pw.length < 6) { alert("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой"); return; }
                      if (pw !== confirm) { alert("Нууц үг таарахгүй байна"); return; }
                      const { error } = await createClient().auth.updateUser({ password: pw });
                      if (error) { alert(`Алдаа: ${error.message}`); return; }
                      alert("Нууц үг амжилттай солигдлоо");
                      (document.getElementById("admin-new-pw") as HTMLInputElement).value = "";
                      (document.getElementById("admin-confirm-pw") as HTMLInputElement).value = "";
                    }}
                    className="rounded-xl bg-amber-600 py-2 text-xs font-medium text-white hover:bg-amber-700"
                  >
                    Нууц үг солих
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mx-4 border-t border-white/10" />

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-white/20 text-white shadow-lg shadow-purple-900/30"
                        : "text-white/60 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className={isActive ? "text-white" : "text-white/50"}>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mx-4 border-t border-white/10" />

        {/* Bottom */}
        <div className="p-3">
          <button
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              localStorage.removeItem("admin_role");
              router.push("/admin/login");
            }}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/50 transition-all hover:bg-white/10 hover:text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Гарах
          </button>
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/50 transition-all hover:bg-white/10 hover:text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
            Сайт руу буцах
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-60">
        {/* Top header */}
        <header
          className={`sticky top-0 z-30 flex items-center justify-between px-4 py-3 backdrop-blur-md sm:px-8 sm:py-4 ${
            dark
              ? "border-b border-white/5 bg-[#1a1a2e]/80"
              : "border-b border-gray-200 bg-white/80"
          }`}
        >
          <div className="flex items-center gap-3">
            {/* Hamburger (mobile) */}
            <button
              onClick={() => setSidebarOpen(true)}
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors lg:hidden ${
                dark ? "text-white/60 hover:bg-white/10" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
            <h1 className={`text-sm font-bold uppercase tracking-wider sm:text-lg ${dark ? "text-white" : "text-gray-900"}`}>
              Хянах самбар
            </h1>
          </div>
          <button
            onClick={toggle}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-all sm:h-10 sm:w-10 ${
              dark
                ? "bg-white/10 text-yellow-300 hover:bg-white/20"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            title={dark ? "Light mode" : "Dark mode"}
          >
            {dark ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 sm:h-5 sm:w-5">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 sm:h-5 sm:w-5">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AdminShell>{children}</AdminShell>
    </ThemeProvider>
  );
}
