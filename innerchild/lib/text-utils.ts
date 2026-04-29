// Strip HTML tags + comments, decode common HTML entities, collapse whitespace.
// Used to derive plain-text excerpts from rich-text article content stored as HTML.
export function stripHtml(input: string | null | undefined): string {
  if (!input) return "";
  let s = input;
  // Drop HTML/SSI comments before tag stripping (otherwise their text leaks).
  s = s.replace(/<!--[\s\S]*?-->/g, " ");
  // Drop <script> / <style> blocks entirely (content + tags).
  s = s.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ");
  // Strip remaining tags.
  s = s.replace(/<[^>]+>/g, " ");
  // Decode named entities.
  s = s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&hellip;/g, "…")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&lsquo;/g, "‘")
    .replace(/&rsquo;/g, "’")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&bull;/g, "•")
    .replace(/&middot;/g, "·")
    .replace(/&copy;/g, "©")
    .replace(/&reg;/g, "®")
    .replace(/&trade;/g, "™");
  // Decode numeric entities (decimal + hex).
  s = s
    .replace(/&#x([\da-fA-F]+);/g, (_, h: string) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(parseInt(n, 10)));
  // Drop any remaining "&name;" entities we don't know about.
  s = s.replace(/&[a-zA-Z]+;/g, " ");
  return s.replace(/\s+/g, " ").trim();
}

export function excerptOf(html: string | null | undefined, max = 160): string {
  const plain = stripHtml(html);
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 60 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}
