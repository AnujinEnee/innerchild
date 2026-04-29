"use client";

import { useEffect, useState } from "react";
import { useTheme } from "../ThemeContext";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/upload-image";

interface Content {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  thumbnail: string;
  created_at: string;
  active: boolean;
}

function getYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function getYoutubeThumbnail(url: string): string {
  const id = getYoutubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
}

function getYoutubeEmbed(url: string): string {
  const id = getYoutubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : "";
}

const EMPTY_FORM = { title: "", description: "", url: "", category: "", thumbnail: "", active: true };

export default function ContentPage() {
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [contents, setContents] = useState<Content[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewContent, setViewContent] = useState<Content | null>(null);
  const [filter, setFilter] = useState<string>("Бүгд");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);

  async function fetchContents() {
    const { data } = await createClient()
      .from("content")
      .select("id, title, description, url, category, thumbnail, active, created_at")
      .order("created_at", { ascending: false });
    setContents(data ?? []);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchContents(); }, []);

  const filtered = filter === "Бүгд" ? contents : filter === "Идэвхтэй" ? contents.filter((c) => c.active) : contents.filter((c) => !c.active);

  const counts = {
    Бүгд: contents.length,
    Идэвхтэй: contents.filter((c) => c.active).length,
    Идэвхгүй: contents.filter((c) => !c.active).length,
  };

  function openNew() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(c: Content) {
    setForm({ title: c.title, description: c.description, url: c.url, category: c.category, thumbnail: c.thumbnail, active: c.active });
    setEditId(c.id);
    setShowForm(true);
  }

  async function save() {
    if (!form.title.trim() || !form.url.trim()) return;
    setSaving(true);
    const thumb = form.thumbnail || getYoutubeThumbnail(form.url);
    const sb = createClient();
    if (editId) {
      const { error } = await sb.from("content").update({ ...form, thumbnail: thumb }).eq("id", editId);
      if (error) { alert(`Алдаа: ${error.message}`); setSaving(false); return; }
    } else {
      const { error } = await sb.from("content").insert({ ...form, thumbnail: thumb, type: "youtube" });
      if (error) { alert(`Алдаа: ${error.message}`); setSaving(false); return; }
    }
    await fetchContents();
    setSaving(false);
    setShowForm(false);
  }

  async function remove(id: string) {
    const { data, error } = await createClient().from("content").delete().eq("id", id).select("id");
    if (error) { alert(`Алдаа: ${error.message}`); return; }
    if (!data?.length) { alert("Устгах боломжгүй. Supabase RLS эрхийг шалгана уу."); return; }
    setContents((prev) => prev.filter((c) => c.id !== id));
    if (viewContent?.id === id) setViewContent(null);
  }

  async function toggleActive(id: string) {
    const item = contents.find((c) => c.id === id);
    if (!item) return;
    const { data, error } = await createClient().from("content").update({ active: !item.active }).eq("id", id).select("id");
    if (error) { alert(`Алдаа: ${error.message}`); return; }
    if (!data?.length) { alert("Өөрчлөлт хадгалагдсангүй. Supabase RLS эрхийг шалгана уу."); return; }
    setContents((prev) => prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c)));
    if (viewContent?.id === id) setViewContent({ ...viewContent, active: !item.active });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const url = await uploadImage(file);
      setForm({ ...form, thumbnail: url });
    } catch (err) {
      alert(`Зураг upload хийхэд алдаа: ${err instanceof Error ? err.message : "тодорхойгүй"}`);
    }
  }

  const inputCls = dark
    ? "bg-white/10 text-white placeholder:text-white/30 focus:bg-white/15"
    : "border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-purple-500";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className={`text-2xl font-bold ${dark ? "text-white" : "text-gray-900"}`}>Контент</h1>
        <button onClick={openNew} className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700">
          + Шинэ контент
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Нийт контент", value: contents.length, color: "from-purple-500 to-indigo-600" },
          { label: "Идэвхтэй", value: counts["Идэвхтэй"], color: "from-emerald-500 to-teal-600" },
          { label: "Идэвхгүй", value: counts["Идэвхгүй"], color: "from-amber-500 to-orange-500" },
        ].map((s) => (
          <div key={s.label} className={`relative overflow-hidden rounded-2xl p-5 ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}>
            <div className={`absolute -right-3 -top-3 h-16 w-16 rounded-full bg-linear-to-br ${s.color} opacity-20 blur-xl`} />
            <p className={`text-xs font-medium ${dark ? "text-white/40" : "text-gray-500"}`}>{s.label}</p>
            <p className={`mt-2 text-2xl font-bold ${dark ? "text-white" : "text-gray-900"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-2">
        {(["Бүгд", "Идэвхтэй", "Идэвхгүй"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              filter === f
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                : dark ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f}
            <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${filter === f ? "bg-white/20" : dark ? "bg-white/10" : "bg-gray-200"}`}>
              {counts[f as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>

      {/* View Content Modal */}
      {viewContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`w-full max-w-2xl rounded-2xl ${dark ? "bg-[#1e1e36]" : "bg-white"} max-h-[90vh] overflow-y-auto`}>
            <div className="relative aspect-video w-full overflow-hidden rounded-t-2xl bg-black">
              {getYoutubeEmbed(viewContent.url) ? (
                <iframe
                  src={getYoutubeEmbed(viewContent.url)}
                  className="h-full w-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <p className="text-sm text-white/50">YouTube линк буруу байна</p>
                </div>
              )}
              <button onClick={() => setViewContent(null)} className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div className="px-6 pb-6 pt-5">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${viewContent.active ? (dark ? "bg-emerald-500/15 text-emerald-500" : "bg-emerald-50 text-emerald-600") : (dark ? "bg-white/10 text-white/40" : "bg-gray-100 text-gray-400")}`}>
                  {viewContent.active ? "Идэвхтэй" : "Идэвхгүй"}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${dark ? "bg-white/5 text-white/40" : "bg-gray-100 text-gray-500"}`}>{viewContent.category}</span>
                <span className={`text-[10px] ${dark ? "text-white/30" : "text-gray-400"}`}>{new Date(viewContent.created_at).toLocaleDateString("mn-MN")}</span>
              </div>
              <h2 className={`mt-3 text-xl font-bold ${dark ? "text-white" : "text-gray-900"}`}>{viewContent.title}</h2>
              <p className={`mt-3 text-sm leading-relaxed ${dark ? "text-white/60" : "text-gray-600"}`}>{viewContent.description}</p>

              <div className={`mt-4 flex items-center gap-2 rounded-xl px-4 py-3 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0 text-red-500">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.029 5.804 0 12c.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0C23.512 20.55 23.971 18.196 24 12c-.029-6.185-.484-8.549-4.385-8.816zM9 16V8l8 4-8 4z" />
                </svg>
                <a href={viewContent.url} target="_blank" rel="noopener noreferrer" className={`text-xs font-medium truncate ${dark ? "text-white/50 hover:text-white" : "text-gray-500 hover:text-gray-900"}`}>
                  {viewContent.url}
                </a>
              </div>

              <div className="mt-5 flex gap-2">
                <button onClick={() => { setViewContent(null); openEdit(viewContent); }} className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700">Засах</button>
                <button onClick={() => setViewContent(null)} className={`rounded-xl px-5 py-2.5 text-sm font-medium ${dark ? "text-white/50 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"}`}>Хаах</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`w-full max-w-lg rounded-2xl ${dark ? "bg-[#1e1e36]" : "bg-white"} max-h-[90vh] overflow-y-auto p-6`}>
            <h2 className={`mb-6 text-lg font-bold ${dark ? "text-white" : "text-gray-900"}`}>
              {editId ? "Контент засах" : "Шинэ контент"}
            </h2>

            <div className="flex flex-col gap-4">
              {/* YouTube URL */}
              <div>
                <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>YouTube линк</label>
                <div className={`flex items-center gap-2 rounded-xl px-4 py-2.5 ${dark ? "bg-white/10" : "border border-gray-200"}`}>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0 text-red-500">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.029 5.804 0 12c.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0C23.512 20.55 23.971 18.196 24 12c-.029-6.185-.484-8.549-4.385-8.816zM9 16V8l8 4-8 4z" />
                  </svg>
                  <input
                    type="url"
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                    className={`flex-1 bg-transparent text-sm outline-none ${dark ? "text-white placeholder:text-white/30" : "text-gray-900 placeholder:text-gray-400"}`}
                  />
                </div>
                {form.url && getYoutubeId(form.url) && (
                  <div className="mt-3 overflow-hidden rounded-xl">
                    <img src={getYoutubeThumbnail(form.url)} alt="YouTube thumbnail" className="w-full object-cover" />
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Гарчиг</label>
                  <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Контентын нэр" className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`} />
                </div>
                <div>
                  <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Ангилал</label>
                  <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Жишээ: Стресс" className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`} />
                </div>
              </div>

              <div>
                <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Тайлбар</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Контентын тайлбар..." rows={4} className={`w-full resize-none rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`} />
              </div>

              <div>
                <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Зураг (заавал биш — YouTube-с авна)</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer rounded-lg bg-purple-600 px-4 py-2 text-xs font-medium text-white hover:bg-purple-700">
                    Зураг оруулах
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  {form.thumbnail && !form.thumbnail.startsWith("https://img.youtube.com") && (
                    <button onClick={() => setForm({ ...form, thumbnail: "" })} className="text-xs text-red-500 hover:underline">Устгах</button>
                  )}
                </div>
              </div>

              <div className="flex items-center">
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

      {/* Content Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => {
          const thumb = c.thumbnail || getYoutubeThumbnail(c.url);
          return (
            <div key={c.id} className={`overflow-hidden rounded-2xl ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}>
              <div className="group relative h-40 cursor-pointer bg-black" onClick={() => setViewContent(c)}>
                {thumb ? (
                  <img src={thumb} alt="" className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-70" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-purple-500 to-indigo-600" />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 shadow-lg transition-transform group-hover:scale-110">
                    <svg viewBox="0 0 24 24" fill="white" className="ml-1 h-5 w-5">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                </div>
                <div className="absolute left-3 top-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${c.active ? "bg-emerald-500/80 text-white" : "bg-white/30 text-white/80 backdrop-blur-sm"}`}>
                    {c.active ? "Идэвхтэй" : "Идэвхгүй"}
                  </span>
                </div>
              </div>

              <div className="px-5 pb-5 pt-4">
                <p className={`text-xs ${dark ? "text-white/30" : "text-gray-400"}`}>{c.category} · {new Date(c.created_at).toLocaleDateString("mn-MN")}</p>
                <h3 className={`mt-1 text-sm font-bold line-clamp-2 ${dark ? "text-white" : "text-gray-900"}`}>{c.title}</h3>
                <p className={`mt-2 text-xs line-clamp-2 ${dark ? "text-white/40" : "text-gray-500"}`}>{c.description}</p>

                <div className={`mt-4 flex gap-2 border-t pt-4 ${dark ? "border-white/5" : "border-gray-100"}`}>
                  <button onClick={() => setViewContent(c)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${dark ? "text-purple-400 hover:bg-white/10" : "text-purple-600 hover:bg-purple-50"}`}>
                    Үзэх
                  </button>
                  <button onClick={() => openEdit(c)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${dark ? "text-white/50 hover:bg-white/10" : "text-gray-500 hover:bg-gray-50"}`}>
                    Засах
                  </button>
                  <button onClick={() => toggleActive(c.id)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                    c.active ? (dark ? "text-amber-400 hover:bg-amber-500/10" : "text-amber-600 hover:bg-amber-50") : (dark ? "text-emerald-400 hover:bg-emerald-500/10" : "text-emerald-600 hover:bg-emerald-50")
                  }`}>
                    {c.active ? "Идэвхгүй" : "Идэвхжүүлэх"}
                  </button>
                  <button onClick={() => remove(c.id)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${dark ? "text-red-400 hover:bg-red-500/10" : "text-red-500 hover:bg-red-50"}`}>
                    Устгах
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
