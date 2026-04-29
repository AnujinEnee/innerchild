"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle, Color, FontSize, LineHeight } from "@tiptap/extension-text-style";
import { LetterSpacing } from "@/lib/tiptap-letter-spacing";
import { useEffect } from "react";

function Toolbar({ editor, dark }: { editor: ReturnType<typeof useEditor> | null; dark: boolean }) {
  if (!editor) return null;
  const btn = (active: boolean) =>
    `rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
      active
        ? dark ? "bg-purple-600 text-white" : "bg-purple-100 text-purple-700"
        : dark ? "text-white/60 hover:bg-white/10" : "text-zinc-500 hover:bg-zinc-100"
    }`;
  const selCls = `rounded-lg px-1.5 py-1 text-xs outline-none ${dark ? "bg-white/10 text-white/60" : "bg-zinc-100 text-zinc-600"}`;
  return (
    <div className={`flex flex-wrap gap-1 rounded-t-xl border-x border-t px-3 py-2 ${dark ? "border-white/10 bg-[#1e1e36]" : "border-zinc-200 bg-zinc-50"}`}>
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive("bold"))}><strong>B</strong></button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive("italic"))}><em>I</em></button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btn(editor.isActive("underline"))}><u>U</u></button>
      <span className={`mx-1 w-px ${dark ? "bg-white/10" : "bg-zinc-200"}`} />
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive("heading", { level: 2 }))}>H2</button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn(editor.isActive("heading", { level: 3 }))}>H3</button>
      <span className={`mx-1 w-px ${dark ? "bg-white/10" : "bg-zinc-200"}`} />
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive("bulletList"))}>• Жагсаалт</button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive("orderedList"))}>1. Дугаарлалт</button>
      <span className={`mx-1 w-px ${dark ? "bg-white/10" : "bg-zinc-200"}`} />
      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn(editor.isActive("blockquote"))}>❝ Ишлэл</button>
      <span className={`mx-1 w-px ${dark ? "bg-white/10" : "bg-zinc-200"}`} />
      <select onChange={(e) => { const v = e.target.value; if (v === "default") editor.chain().focus().unsetFontSize().run(); else editor.chain().focus().setFontSize(v).run(); }} className={selCls}>
        <option value="default">Хэмжээ</option>
        <option value="12px">Жижиг</option>
        <option value="14px">Бага</option>
        <option value="16px">Хэвийн</option>
        <option value="18px">Том</option>
        <option value="20px">Маш том</option>
        <option value="24px">Гарчиг</option>
      </select>
      <select onChange={(e) => { const v = e.target.value; if (v === "default") editor.chain().focus().unsetLineHeight().run(); else editor.chain().focus().setLineHeight(v).run(); }} className={selCls}>
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
      <select onChange={(e) => { const v = e.target.value; if (v === "default") editor.chain().focus().unsetLetterSpacing().run(); else editor.chain().focus().setLetterSpacing(v).run(); }} className={selCls}>
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
      <input type="color" onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()} className="h-7 w-7 cursor-pointer rounded-lg border-0 bg-transparent p-0.5" title="Текстийн өнгө" />
      <button type="button" onClick={() => editor.chain().focus().unsetColor().run()} className={btn(false)} title="Өнгө арилгах">✕</button>
    </div>
  );
}

export default function RichTextEditor({
  content,
  onChange,
  dark,
  minHeight = "120px",
}: {
  content: string;
  onChange: (html: string) => void;
  dark: boolean;
  minHeight?: string;
}) {
  const editor = useEditor({
    extensions: [StarterKit, Underline, TextStyle, Color, FontSize, LineHeight, LetterSpacing],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
    editorProps: {
      attributes: {
        class: `w-full px-4 py-2.5 text-sm leading-relaxed outline-none ${dark ? "text-white/80" : "text-zinc-700"} prose prose-sm max-w-none [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-3 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_blockquote]:border-l-4 [&_blockquote]:border-purple-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-zinc-500`,
        style: `min-height: ${minHeight}`,
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  return (
    <div className={`overflow-hidden rounded-xl border ${dark ? "border-white/10 bg-white/5" : "border-zinc-200 bg-white"}`}>
      <Toolbar editor={editor} dark={dark} />
      <EditorContent editor={editor} />
    </div>
  );
}
