"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "../../ThemeContext";
import { createClient } from "@/lib/supabase/client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import { TextStyle, Color, FontSize, LineHeight } from "@tiptap/extension-text-style";
import { LetterSpacing } from "@/lib/tiptap-letter-spacing";

import { uploadImage } from "@/lib/upload-image";

function TiptapToolbar({ editor, dark }: { editor: ReturnType<typeof useEditor> | null; dark: boolean }) {
  if (!editor) return null;
  const btnCls = (active: boolean) =>
    `rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
      active
        ? dark ? "bg-purple-600 text-white" : "bg-purple-100 text-purple-700"
        : dark ? "text-white/60 hover:bg-white/10" : "text-zinc-500 hover:bg-zinc-100"
    }`;
  return (
    <div className={`sticky top-13 z-20 flex flex-wrap gap-1 rounded-t-xl border px-3 py-2 sm:top-15 ${dark ? "border-white/10 bg-[#1e1e36]" : "border-zinc-200 bg-zinc-50"}`}>
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnCls(editor.isActive("bold"))}><strong>B</strong></button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnCls(editor.isActive("italic"))}><em>I</em></button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnCls(editor.isActive("underline"))}><u>U</u></button>
      <span className={`mx-1 w-px ${dark ? "bg-white/10" : "bg-zinc-200"}`} />
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnCls(editor.isActive("heading", { level: 2 }))}>H2</button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnCls(editor.isActive("heading", { level: 3 }))}>H3</button>
      <span className={`mx-1 w-px ${dark ? "bg-white/10" : "bg-zinc-200"}`} />
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnCls(editor.isActive("bulletList"))}>• Жагсаалт</button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnCls(editor.isActive("orderedList"))}>1. Дугаарлалт</button>
      <span className={`mx-1 w-px ${dark ? "bg-white/10" : "bg-zinc-200"}`} />
      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnCls(editor.isActive("blockquote"))}>❝ Ишлэл</button>
      <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btnCls(false)}>― Зураас</button>
      <label className={`${btnCls(false)} cursor-pointer`} title="Текст дунд зураг оруулах">
        🖼 Зураг
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            try {
              const url = await uploadImage(file);
              editor.chain().focus().setImage({ src: url, alt: file.name }).run();
            } catch (err) {
              alert(`Зураг upload хийхэд алдаа: ${err instanceof Error ? err.message : "тодорхойгүй"}`);
            }
          }}
        />
      </label>
      <span className={`mx-1 w-px ${dark ? "bg-white/10" : "bg-zinc-200"}`} />
      <select
        onChange={(e) => {
          const v = e.target.value;
          if (v === "default") editor.chain().focus().unsetFontSize().run();
          else editor.chain().focus().setFontSize(v).run();
        }}
        className={`rounded-lg px-1.5 py-1 text-xs outline-none ${dark ? "bg-white/10 text-white/60" : "bg-zinc-100 text-zinc-600"}`}
      >
        <option value="default">Хэмжээ</option>
        <option value="12px">Жижиг</option>
        <option value="14px">Бага</option>
        <option value="16px">Хэвийн</option>
        <option value="18px">Том</option>
        <option value="20px">Маш том</option>
        <option value="24px">Гарчиг</option>
      </select>
      <select
        onChange={(e) => {
          const v = e.target.value;
          if (v === "default") editor.chain().focus().unsetLineHeight().run();
          else editor.chain().focus().setLineHeight(v).run();
        }}
        className={`rounded-lg px-1.5 py-1 text-xs outline-none ${dark ? "bg-white/10 text-white/60" : "bg-zinc-100 text-zinc-600"}`}
      >
        <option value="default">Мөр зай</option>
        <option value="0">0</option>
        <option value="0.1">0.1</option>
        <option value="0.2">0.2</option>
        <option value="0.3">0.3</option>
        <option value="0.4">0.4</option>
        <option value="0.5">0.5</option>
        <option value="0.8">0.8</option>
        <option value="1">1</option>
        <option value="1.2">1.2</option>
        <option value="1.4">1.4</option>
        <option value="1.6">1.6</option>
        <option value="2">2</option>
        <option value="2.5">2.5</option>
      </select>
      <select
        onChange={(e) => {
          const v = e.target.value;
          if (v === "default") editor.chain().focus().unsetLetterSpacing().run();
          else editor.chain().focus().setLetterSpacing(v).run();
        }}
        className={`rounded-lg px-1.5 py-1 text-xs outline-none ${dark ? "bg-white/10 text-white/60" : "bg-zinc-100 text-zinc-600"}`}
      >
        <option value="default">Үсэг зай</option>
        <option value="-1px">-1</option>
        <option value="-0.5px">-0.5</option>
        <option value="0px">0</option>
        <option value="0.5px">0.5</option>
        <option value="1px">1</option>
        <option value="2px">2</option>
        <option value="3px">3</option>
        <option value="5px">5</option>
      </select>
      <input
        type="color"
        onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
        className="h-7 w-7 cursor-pointer rounded-lg border-0 bg-transparent p-0.5"
        title="Текстийн өнгө"
      />
      <button type="button" onClick={() => editor.chain().focus().unsetColor().run()} className={btnCls(false)} title="Өнгө арилгах">✕</button>
    </div>
  );
}

export default function NewArticlePage() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    category: "",
    subcategory: "",
    author_id: "",
    reviewed_by: "",
    published_date: "",
    content: "",
    image_url: "",
    status: "draft" as "draft" | "published",
  });
  const [saving, setSaving] = useState(false);
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    createClient()
      .from("team_members")
      .select("id, last_name, first_name")
      .order("created_at")
      .then(({ data }) => {
        setTeamMembers((data ?? []).map((m: { id: string; last_name: string; first_name: string }) => ({
          id: m.id,
          name: `${m.last_name} ${m.first_name}`.trim(),
        })));
      });
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({ inline: false, HTMLAttributes: { class: "rounded-lg max-w-full h-auto my-3" } }),
      TextStyle,
      Color,
      FontSize,
      LineHeight,
      LetterSpacing,
    ],
    content: "",
    immediatelyRender: false,
    onUpdate: ({ editor: e }) => setForm((prev) => ({ ...prev, content: e.getHTML() })),
    editorProps: {
      attributes: {
        class: `w-full px-4 py-2.5 text-sm leading-relaxed outline-none min-h-[400px] ${dark ? "text-white/80" : "text-zinc-700"} prose prose-sm max-w-none [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-3 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_blockquote]:border-l-4 [&_blockquote]:border-purple-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-zinc-500 [&_hr]:my-4`,
      },
      handlePaste: (_view, event) => {
        const html = event.clipboardData?.getData("text/html");
        if (html) return false;
        const text = event.clipboardData?.getData("text/plain");
        if (!text) return false;
        // Double newlines = new paragraph, single newlines = space (continuous text)
        const paragraphs = text.split(/\n{2,}/);
        const htmlContent = paragraphs
          .map((p) => `<p>${p.replace(/\n/g, " ").trim()}</p>`)
          .join("");
        editor?.commands.insertContent(htmlContent);
        return true;
      },
    },
  });

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const url = await uploadImage(file);
      setForm((prev) => ({ ...prev, image_url: url }));
    } catch (err) {
      alert(`Зураг upload хийхэд алдаа: ${err instanceof Error ? err.message : "тодорхойгүй"}`);
    }
  }

  async function save() {
    if (!form.title.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const selectedAuthor = teamMembers.find((m) => m.id === form.author_id);
    const reviewedMember = teamMembers.find((m) => m.id === form.reviewed_by);
    const payload = {
      title: form.title.trim(),
      category: form.category.trim(),
      subcategory: form.subcategory.trim() || null,
      author_id: form.author_id || null,
      author_name: selectedAuthor?.name || null,
      reviewed_by: reviewedMember?.name || null,
      published_date: form.published_date || null,
      content: form.content,
      image_url: form.image_url || null,
      status: form.status,
      published_at: form.status === "published" ? new Date().toISOString() : null,
    };

    const { error } = await supabase.from("articles").insert(payload);
    setSaving(false);
    if (error) { alert(`Алдаа: ${error.message}`); return; }
    router.push("/admin/articles");
  }

  const inputCls = dark
    ? "bg-white/10 text-white placeholder:text-white/30 focus:bg-white/15"
    : "border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-purple-500";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className={`text-2xl font-bold ${dark ? "text-white" : "text-gray-900"}`}>Шинэ нийтлэл</h1>
        <button
          onClick={() => router.push("/admin/articles")}
          className={`rounded-xl px-5 py-2.5 text-sm font-medium ${dark ? "text-white/50 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"}`}
        >
          ← Буцах
        </button>
      </div>

      <div className={`rounded-2xl p-6 ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}>
        <div className="flex flex-col gap-4">
          {/* Image */}
          <div>
            <label className={`mb-1 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Зураг</label>
            <p className={`mb-2 text-[10px] ${dark ? "text-white/30" : "text-gray-400"}`}>Зөвлөмж: 1200×675px (16:9), JPG/WebP, 500KB хүртэл</p>
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

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Дэд ангилал</label>
              <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Жишээ: Сэтгэцийн эмгэг" className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`} />
            </div>
            <div>
              <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Ангилал</label>
              <input type="text" value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} placeholder="Жишээ: Сэтгэл гутрал" className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`} />
            </div>
            <div>
              <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Гарчиг</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Гарчиг" className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Нийтлэгч</label>
              <select value={form.author_id} onChange={(e) => setForm({ ...form, author_id: e.target.value })} className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`}>
                <option value="">Нийтлэгч сонгох...</option>
                {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className={`mb-1.5 block text-xs font-medium ${dark ? "text-white/50" : "text-gray-500"}`}>Хянасан сэтгэл судлаач</label>
              <select value={form.reviewed_by} onChange={(e) => setForm({ ...form, reviewed_by: e.target.value })} className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${inputCls}`}>
                <option value="">Хянасан сэтгэл судлаач сонгох...</option>
                {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
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
            <TiptapToolbar editor={editor} dark={dark} />
            <div className={`rounded-b-xl ${dark ? "border border-t-0 border-white/10" : "border border-t-0 border-zinc-200"}`}>
              <EditorContent editor={editor} />
            </div>
            <p className={`mt-1 text-[10px] ${dark ? "text-white/30" : "text-gray-400"}`}>
              Bold, italic, жагсаалт, гарчиг зэргийг toolbar-аас сонгоно
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => router.push("/admin/articles")} className={`rounded-xl px-5 py-2.5 text-sm font-medium ${dark ? "text-white/50 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"}`}>Болих</button>
          <button onClick={save} disabled={saving} className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60">
            {saving ? "Хадгалж байна..." : "Хадгалах"}
          </button>
        </div>
      </div>
    </div>
  );
}
