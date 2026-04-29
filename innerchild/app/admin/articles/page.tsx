"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "../ThemeContext";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/upload-image";

interface Article {
  id: string;
  title: string;
  category: string;
  author_name: string | null;
  reviewed_by: string | null;
  published_date: string | null;
  content: string;
  image_url: string | null;
  published_at: string | null;
  created_at: string;
  status: "published" | "draft";
  view_count: number | null;
}

interface SubmittedArticle {
  id: string;
  title: string;
  content: string;
  author_name: string;
  author_email: string;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
}

// ─── Article view modal ───────────────────────────────────────
function ArticleViewModal({
  article: a,
  dark,
  onClose,
  onEdit,
}: {
  article: Article;
  dark: boolean;
  onClose: () => void;
  onEdit: (a: Article) => void;
}) {
  const statusLabel = a.status === "published" ? "Нийтлэгдсэн" : "Ноорог";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`w-full max-w-2xl rounded-2xl ${dark ? "bg-[#1e1e36]" : "bg-white"} max-h-[90vh] overflow-y-auto`}>
        {a.image_url ? (
          <div className="relative h-56 overflow-hidden rounded-t-2xl">
            <img src={a.image_url} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
            <button onClick={onClose} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <div className="absolute bottom-4 left-6 right-6">
              <span className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${a.status === "published" ? "bg-emerald-500/30 text-white" : "bg-amber-500/30 text-white"}`}>{statusLabel}</span>
              <h2 className="text-xl font-bold text-white">{a.title}</h2>
            </div>
          </div>
        ) : (
          <div className="relative bg-linear-to-br from-purple-600 to-indigo-700 px-6 py-6">
            <button onClick={onClose} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <span className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${a.status === "published" ? "bg-emerald-500/30 text-white" : "bg-amber-500/30 text-white"}`}>{statusLabel}</span>
            <h2 className="text-xl font-bold text-white">{a.title}</h2>
          </div>
        )}
        <div className="px-6 pb-6 pt-5">
          <div className="flex flex-wrap gap-3 text-xs">
            <span className={`rounded-full px-3 py-1 ${dark ? "bg-white/5 text-white/60" : "bg-gray-100 text-gray-600"}`}>{a.category}</span>
            <span className={dark ? "text-white/40" : "text-gray-400"}>
              {a.author_name}{a.reviewed_by ? ` · Хянасан: ${a.reviewed_by}` : ""} · {(a.published_date ?? a.published_at ?? a.created_at).slice(0, 10)}
            </span>
          </div>
          <div
            className={`mt-5 text-sm leading-relaxed ${dark ? "text-white/70" : "text-gray-600"} [&_b]:font-bold [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1`}
            dangerouslySetInnerHTML={{ __html: a.content }}
          />
          <div className="mt-6 flex gap-2">
            <button onClick={() => onEdit(a)} className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700">Засах</button>
            <button onClick={onClose} className={`rounded-xl px-5 py-2.5 text-sm font-medium ${dark ? "text-white/50 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"}`}>Хаах</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tiptap Rich Text Editor ─────────────────────────────────
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";

function TiptapToolbar({ editor, dark }: { editor: ReturnType<typeof useEditor> | null; dark: boolean }) {
  if (!editor) return null;
  const btnCls = (active: boolean) =>
    `rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
      active
        ? dark ? "bg-purple-600 text-white" : "bg-purple-100 text-purple-700"
        : dark ? "text-white/60 hover:bg-white/10" : "text-zinc-500 hover:bg-zinc-100"
    }`;
  return (
    <div className={`sticky top-0 z-10 flex flex-wrap gap-1 rounded-t-xl border-b px-3 py-2 ${dark ? "border-white/10 bg-[#1e1e36]" : "border-zinc-200 bg-zinc-50"}`}>
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnCls(editor.isActive("bold"))}>
        <strong>B</strong>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnCls(editor.isActive("italic"))}>
        <em>I</em>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnCls(editor.isActive("underline"))}>
        <u>U</u>
      </button>
      <span className={`mx-1 w-px ${dark ? "bg-white/10" : "bg-zinc-200"}`} />
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnCls(editor.isActive("heading", { level: 2 }))}>
        H2
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnCls(editor.isActive("heading", { level: 3 }))}>
        H3
      </button>
      <span className={`mx-1 w-px ${dark ? "bg-white/10" : "bg-zinc-200"}`} />
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnCls(editor.isActive("bulletList"))}>
        • Жагсаалт
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnCls(editor.isActive("orderedList"))}>
        1. Дугаарлалт
      </button>
      <span className={`mx-1 w-px ${dark ? "bg-white/10" : "bg-zinc-200"}`} />
      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnCls(editor.isActive("blockquote"))}>
        ❝ Ишлэл
      </button>
      <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btnCls(false)}>
        ― Зураас
      </button>
    </div>
  );
}

function ContentEditor({ initialContent, onChange, className, dark }: { initialContent: string; onChange: (html: string) => void; className: string; dark: boolean }) {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: initialContent,
    immediatelyRender: false,
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    editorProps: {
      attributes: {
        class: `${className} min-h-[250px] outline-none prose prose-sm max-w-none [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-3 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_blockquote]:border-l-4 [&_blockquote]:border-purple-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-zinc-500 [&_hr]:my-4`,
      },
    },
  });

  return (
    <div className={`overflow-hidden rounded-xl ${dark ? "border border-white/10" : "border border-zinc-200"}`}>
      <TiptapToolbar editor={editor} dark={dark} />
      <EditorContent editor={editor} />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function ArticlesPage() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const router = useRouter();

  const [articles, setArticles] = useState<Article[]>([]);
  const [submitted, setSubmitted] = useState<SubmittedArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewArticle, setViewArticle] = useState<Article | null>(null);
  const [viewSubmitted, setViewSubmitted] = useState<SubmittedArticle | null>(null);
  const [filter, setFilter] = useState<string>("Бүгд");
  const [mainTab, setMainTab] = useState<"articles" | "submitted">("articles");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    category: "",
    author_name: "",
    reviewed_by: "",
    published_date: "",
    content: "",
    image_url: "",
    status: "draft" as "draft" | "published",
  });

  async function fetchAll() {
    const supabase = createClient();
    const [{ data: arts }, { data: subs }] = await Promise.all([
      supabase.from("articles").select("id, title, category, author_name, reviewed_by, published_date, content, image_url, published_at, created_at, status, view_count").order("created_at", { ascending: false }),
      supabase.from("submitted_articles").select("id, title, content, author_name, author_email, status, submitted_at").order("submitted_at", { ascending: false }),
    ]);
    setArticles(arts ?? []);
    setSubmitted(subs ?? []);
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchAll(); }, []);

  // ── Articles CRUD ──
  async function save() {
    if (!form.title.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const payload = {
      title: form.title.trim(),
      category: form.category.trim(),
      author_name: form.author_name.trim() || null,
      reviewed_by: form.reviewed_by.trim() || null,
      published_date: form.published_date || null,
      content: form.content,
      image_url: form.image_url || null,
      status: form.status,
      published_at: form.status === "published" ? new Date().toISOString() : null,
    };

    if (editId) {
      const { data, error } = await supabase.from("articles").update(payload).eq("id", editId).select().single();
      if (error) { alert(`Алдаа: ${error.message}`); setSaving(false); return; }
      if (data) setArticles((prev) => prev.map((a) => (a.id === editId ? data : a)));
    } else {
      const { data, error } = await supabase.from("articles").insert(payload).select().single();
      if (error) { alert(`Алдаа: ${error.message}`); setSaving(false); return; }
      if (data) setArticles((prev) => [data, ...prev]);
    }
    setSaving(false);
    setShowForm(false);
  }

  async function remove(id: string) {
    const { data, error } = await createClient().from("articles").delete().eq("id", id).select("id");
    if (error) { alert(`Алдаа: ${error.message}`); return; }
    if (!data?.length) { alert("Устгах боломжгүй. Supabase эрхийг шалгана уу."); return; }
    setArticles((prev) => prev.filter((a) => a.id !== id));
  }

  async function toggleStatus(article: Article) {
    const newStatus = article.status === "published" ? "draft" : "published";
    const { data, error } = await createClient().from("articles").update({
      status: newStatus,
      published_at: newStatus === "published" ? new Date().toISOString() : null,
    }).eq("id", article.id).select("id");
    if (error) { alert(`Алдаа: ${error.message}`); return; }
    if (!data?.length) { alert("Өөрчлөлт хадгалагдсангүй. Supabase RLS эрхийг шалгана уу."); return; }
    setArticles((prev) => prev.map((a) => a.id === article.id ? { ...a, status: newStatus } : a));
  }

  // ── Submitted articles ──
  async function updateSubmittedStatus(id: string, status: "approved" | "rejected" | "pending") {
    const { data, error } = await createClient()
      .from("submitted_articles")
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("id", id)
      .select("id");
    if (error) { alert(`Алдаа: ${error.message}`); return; }
    if (!data?.length) { alert("Өөрчлөлт хадгалагдсангүй. Supabase RLS эрхийг шалгана уу."); return; }
    setSubmitted((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    setViewSubmitted(null);
  }

  async function deleteSubmitted(id: string) {
    const { data, error } = await createClient().from("submitted_articles").delete().eq("id", id).select("id");
    if (error) { alert(`Алдаа: ${error.message}`); return; }
    if (!data?.length) { alert("Устгах боломжгүй. Supabase RLS эрхийг шалгана уу."); return; }
    setSubmitted((prev) => prev.filter((a) => a.id !== id));
    setViewSubmitted(null);
  }

  function openNew() {
    router.push("/admin/articles/new");
  }

  function openEdit(a: Article) {
    router.push(`/admin/articles/edit/${a.id}`);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const url = await uploadImage(file);
      setForm({ ...form, image_url: url });
    } catch (err) {
      alert(`Зураг upload хийхэд алдаа: ${err instanceof Error ? err.message : "тодорхойгүй"}`);
    }
  }

  const filtered = filter === "Бүгд" ? articles : articles.filter((a) => (filter === "Нийтлэгдсэн" ? a.status === "published" : a.status === "draft"));

  const counts = {
    Бүгд: articles.length,
    Нийтлэгдсэн: articles.filter((a) => a.status === "published").length,
    Ноорог: articles.filter((a) => a.status === "draft").length,
  };

  const pendingCount = submitted.filter((a) => a.status === "pending").length;

  const inputCls = dark
    ? "bg-white/10 text-white placeholder:text-white/30 focus:bg-white/15"
    : "border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-purple-500";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className={`text-2xl font-bold ${dark ? "text-white" : "text-gray-900"}`}>Нийтлэл</h1>
        {mainTab === "articles" && (
          <button onClick={openNew} className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700">
            + Шинэ нийтлэл
          </button>
        )}
      </div>

      {/* Main tabs */}
      <div className={`mb-6 flex gap-1 border-b ${dark ? "border-white/10" : "border-gray-200"}`}>
        {([
          { id: "articles", label: "Нийтлэлүүд" },
          { id: "submitted", label: "Илгээсэн", badge: pendingCount },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setMainTab(t.id)}
            className={`flex items-center gap-2 rounded-t-lg px-5 py-2.5 text-sm font-medium transition-colors ${
              mainTab === t.id ? "border-b-2 border-purple-500 text-purple-500" : dark ? "text-white/40 hover:text-white/70" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {t.label}
            {"badge" in t && t.badge > 0 && (
              <span className="rounded-full bg-pink-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Submitted tab ── */}
      {mainTab === "submitted" && (
        <div>
          {viewSubmitted && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className={`w-full max-w-2xl rounded-2xl ${dark ? "bg-[#1e1e36]" : "bg-white"} max-h-[90vh] overflow-y-auto p-6`}>
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h2 className={`text-lg font-bold ${dark ? "text-white" : "text-gray-900"}`}>{viewSubmitted.title}</h2>
                    <p className={`mt-1 text-xs ${dark ? "text-white/40" : "text-gray-400"}`}>
                      {viewSubmitted.author_name} · {viewSubmitted.author_email} · {viewSubmitted.submitted_at?.slice(0, 10)}
                    </p>
                  </div>
                  <button onClick={() => setViewSubmitted(null)} className={`rounded-lg p-1.5 ${dark ? "hover:bg-white/10 text-white/50" : "hover:bg-gray-100 text-gray-400"}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                <div className={`whitespace-pre-line rounded-xl p-4 text-sm leading-relaxed ${dark ? "bg-white/5 text-white/70" : "bg-gray-50 text-gray-700"}`}>
                  {viewSubmitted.content}
                </div>
                <div className="mt-4 flex gap-2">
                  {viewSubmitted.status === "pending" && (
                    <>
                      <button onClick={() => updateSubmittedStatus(viewSubmitted.id, "approved")} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700">Нийтлэх</button>
                      <button onClick={() => updateSubmittedStatus(viewSubmitted.id, "rejected")} className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-600">Татгалзах</button>
                    </>
                  )}
                  {viewSubmitted.status === "approved" && (
                    <button onClick={() => updateSubmittedStatus(viewSubmitted.id, "pending")} className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-600">Ноорог болгох</button>
                  )}
                  {viewSubmitted.status === "rejected" && (
                    <>
                      <button onClick={() => updateSubmittedStatus(viewSubmitted.id, "pending")} className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-600">Буцаах</button>
                      <button onClick={() => deleteSubmitted(viewSubmitted.id)} className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-600">Устгах</button>
                    </>
                  )}
                  <button onClick={() => setViewSubmitted(null)} className={`rounded-xl px-5 py-2.5 text-sm font-medium ${dark ? "text-white/50 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"}`}>Хаах</button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <p className={`py-16 text-center text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>Уншиж байна...</p>
          ) : submitted.length === 0 ? (
            <p className={`py-16 text-center text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>Илгээсэн нийтлэл байхгүй байна.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {submitted.map((a) => (
                <div key={a.id} className={`flex items-start justify-between gap-4 rounded-2xl p-5 ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        a.status === "approved" ? "bg-emerald-500/20 text-emerald-500"
                        : a.status === "rejected" ? "bg-red-500/20 text-red-400"
                        : "bg-amber-500/20 text-amber-500"
                      }`}>
                        {a.status === "approved" ? "Нийтлэгдсэн" : a.status === "rejected" ? "Татгалзсан" : "Хүлээгдэж байна"}
                      </span>
                      <span className={`text-[10px] ${dark ? "text-white/30" : "text-gray-400"}`}>{a.submitted_at?.slice(0, 10)}</span>
                    </div>
                    <h3 className={`mt-1.5 text-sm font-semibold ${dark ? "text-white" : "text-gray-900"}`}>{a.title}</h3>
                    <p className={`mt-0.5 text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>{a.author_name} · {a.author_email}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => setViewSubmitted(a)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${dark ? "text-purple-400 hover:bg-white/10" : "text-purple-600 hover:bg-purple-50"}`}>Харах</button>
                    {a.status === "pending" && (
                      <>
                        <button onClick={() => updateSubmittedStatus(a.id, "approved")} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${dark ? "text-emerald-400 hover:bg-emerald-500/10" : "text-emerald-600 hover:bg-emerald-50"}`}>Нийтлэх</button>
                        <button onClick={() => updateSubmittedStatus(a.id, "rejected")} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${dark ? "text-red-400 hover:bg-red-500/10" : "text-red-500 hover:bg-red-50"}`}>Татгалзах</button>
                      </>
                    )}
                    {a.status === "approved" && (
                      <button onClick={() => updateSubmittedStatus(a.id, "pending")} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${dark ? "text-amber-400 hover:bg-amber-500/10" : "text-amber-600 hover:bg-amber-50"}`}>Ноорог болгох</button>
                    )}
                    {a.status === "rejected" && (
                      <>
                        <button onClick={() => updateSubmittedStatus(a.id, "pending")} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${dark ? "text-amber-400 hover:bg-amber-500/10" : "text-amber-600 hover:bg-amber-50"}`}>Буцаах</button>
                        <button onClick={() => deleteSubmitted(a.id)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${dark ? "text-red-400 hover:bg-red-500/10" : "text-red-500 hover:bg-red-50"}`}>Устгах</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Articles tab ── */}
      {mainTab === "articles" && (
        <>
          {/* Stats */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Нийт нийтлэл", value: counts["Бүгд"], color: "from-purple-500 to-indigo-600" },
              { label: "Нийтлэгдсэн", value: counts["Нийтлэгдсэн"], color: "from-emerald-500 to-teal-600" },
              { label: "Ноорог", value: counts["Ноорог"], color: "from-amber-500 to-orange-500" },
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
            {(["Бүгд", "Нийтлэгдсэн", "Ноорог"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  filter === f ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" : dark ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f}
                <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${filter === f ? "bg-white/20" : dark ? "bg-white/10" : "bg-gray-200"}`}>
                  {counts[f]}
                </span>
              </button>
            ))}
          </div>

          {/* Article view modal */}
          {viewArticle && <ArticleViewModal article={viewArticle} dark={dark} onClose={() => setViewArticle(null)} onEdit={(a) => { setViewArticle(null); openEdit(a); }} />}

          {/* Create/Edit form modal */}
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className={`w-full max-w-2xl rounded-2xl ${dark ? "bg-[#1e1e36]" : "bg-white"} max-h-[90vh] overflow-y-auto p-6`}>
                <h2 className={`mb-6 text-lg font-bold ${dark ? "text-white" : "text-gray-900"}`}>
                  {editId ? "Нийтлэл засах" : "Шинэ нийтлэл"}
                </h2>
                <div className="flex flex-col gap-4">
                  {/* Image */}
                  <div>
                    <label className={`mb-2 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Зураг</label>
                    <div className="flex items-center gap-4">
                      <div className={`h-24 w-40 overflow-hidden rounded-xl ${dark ? "bg-white/10" : "bg-gray-100"}`}>
                        {form.image_url ? (
                          <img src={form.image_url} alt="Preview" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`h-8 w-8 ${dark ? "text-white/20" : "text-gray-300"}`}>
                              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="cursor-pointer rounded-lg bg-purple-600 px-4 py-2 text-xs font-medium text-white hover:bg-purple-700">
                          Зураг оруулах
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                        {form.image_url && (
                          <button onClick={() => setForm({ ...form, image_url: "" })} className="text-xs text-red-500 hover:underline">Устгах</button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Ангилал</label>
                      <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ангилал" className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`} />
                    </div>
                    <div>
                      <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Гарчиг</label>
                      <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Гарчиг" className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`} />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Нийтлэгч</label>
                      <input type="text" value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} placeholder="Нийтлэгч" className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`} />
                    </div>
                    <div>
                      <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Хянасан сэтгэл судлаач</label>
                      <input type="text" value={form.reviewed_by} onChange={(e) => setForm({ ...form, reviewed_by: e.target.value })} placeholder="Хянасан сэтгэл судлаач" className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`} />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Огноо</label>
                      <input type="date" value={form.published_date} onChange={(e) => setForm({ ...form, published_date: e.target.value })} className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`} />
                    </div>
                    <div className="flex items-end">
                      <label className="flex cursor-pointer items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, status: form.status === "published" ? "draft" : "published" })}
                          className={`relative h-7 w-12 rounded-full transition-colors ${form.status === "published" ? "bg-emerald-500" : dark ? "bg-white/20" : "bg-gray-300"}`}
                        >
                          <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${form.status === "published" ? "left-5.5" : "left-0.5"}`} />
                        </button>
                        <span className={`text-sm font-medium ${dark ? "text-white" : "text-gray-700"}`}>
                          {form.status === "published" ? "Нийтлэгдсэн" : "Ноорог"}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Нийтлэл</label>
                    {/* Admin-only rich text editor — preserves pasted formatting (bold, lists) */}
                    <ContentEditor
                      key={editId ?? "new"}
                      initialContent={form.content}
                      onChange={(html) => setForm((prev) => ({ ...prev, content: html }))}
                      className={`w-full px-4 py-2.5 text-sm leading-relaxed ${dark ? "text-white/80" : "text-zinc-700"}`}
                      dark={dark}
                    />
                    <p className={`mt-1 text-[10px] ${dark ? "text-white/30" : "text-gray-400"}`}>
                      Bold, italic, жагсаалт, гарчиг зэргийг toolbar-аас сонгоно
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button onClick={() => setShowForm(false)} className={`rounded-xl px-5 py-2.5 text-sm font-medium ${dark ? "text-white/50 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"}`}>Болих</button>
                  <button onClick={save} disabled={saving} className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60">
                    {saving ? "Хадгалж байна..." : "Хадгалах"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cards */}
          {loading ? (
            <div className="py-16 text-center"><p className={`text-sm ${dark ? "text-white/30" : "text-gray-400"}`}>Уншиж байна...</p></div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((a) => (
                <div key={a.id} className={`overflow-hidden rounded-2xl ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}>
                  <div className={`relative h-36 ${a.image_url ? "" : "bg-linear-to-br from-purple-500 to-indigo-600"}`}>
                    {a.image_url ? (
                      <img src={a.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="h-12 w-12 text-white/20">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute left-3 top-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${a.status === "published" ? "bg-emerald-500/80 text-white" : "bg-amber-500/80 text-white"}`}>
                        {a.status === "published" ? "Нийтлэгдсэн" : "Ноорог"}
                      </span>
                    </div>
                  </div>
                  <div className="px-5 pb-5 pt-4">
                    <p className={`text-xs ${dark ? "text-white/30" : "text-gray-400"}`}>{a.category} · {(a.published_at ?? a.created_at).slice(0, 10)}</p>
                    <h3 className={`mt-1 line-clamp-2 text-sm font-bold ${dark ? "text-white" : "text-gray-900"}`}>{a.title}</h3>
                    <p className={`mt-2 line-clamp-2 text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>{a.content}</p>
                    <div className="mt-2 flex items-center gap-3 text-[10px]">
                      <span className={`font-medium ${dark ? "text-purple-400" : "text-purple-600"}`}>{a.author_name}</span>
                      <span className={`flex items-center gap-1 ${dark ? "text-white/40" : "text-gray-500"}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        {(a.view_count ?? 0).toLocaleString()} уншсан
                      </span>
                    </div>
                    <div className={`mt-4 flex gap-2 border-t pt-4 ${dark ? "border-white/5" : "border-gray-100"}`}>
                      <button onClick={() => setViewArticle(a)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${dark ? "text-purple-400 hover:bg-white/10" : "text-purple-600 hover:bg-purple-50"}`}>Харах</button>
                      <button onClick={() => openEdit(a)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${dark ? "text-white/50 hover:bg-white/10" : "text-gray-500 hover:bg-gray-50"}`}>Засах</button>
                      <button onClick={() => toggleStatus(a)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${a.status === "published" ? dark ? "text-amber-400 hover:bg-amber-500/10" : "text-amber-600 hover:bg-amber-50" : dark ? "text-emerald-400 hover:bg-emerald-500/10" : "text-emerald-600 hover:bg-emerald-50"}`}>
                        {a.status === "published" ? "Ноорог болгох" : "Нийтлэх"}
                      </button>
                      <button onClick={() => remove(a.id)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${dark ? "text-red-400 hover:bg-red-500/10" : "text-red-500 hover:bg-red-50"}`}>Устгах</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
