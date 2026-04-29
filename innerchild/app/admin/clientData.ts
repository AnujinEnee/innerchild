const cyrToLat: Record<string, string> = {
  "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "ye", "ё": "yo",
  "ж": "j", "з": "z", "и": "i", "й": "i", "к": "k", "л": "l", "м": "m",
  "н": "n", "о": "o", "ө": "u", "п": "p", "р": "r", "с": "s", "т": "t",
  "у": "u", "ү": "u", "ф": "f", "х": "kh", "ц": "ts", "ч": "ch",
  "ш": "sh", "щ": "sh", "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
};

const latToCyr: Record<string, string> = {
  "a": "а", "b": "б", "v": "в", "g": "г", "d": "д", "e": "э",
  "j": "ж", "z": "з", "i": "и", "k": "к", "l": "л", "m": "м",
  "n": "н", "o": "о", "p": "п", "r": "р", "s": "с", "t": "т",
  "u": "у", "f": "ф", "h": "х", "y": "й", "w": "в",
};

const multiLatToCyr: [string, string][] = [
  ["kh", "х"], ["sh", "ш"], ["ch", "ч"], ["ts", "ц"],
  ["yo", "ё"], ["ye", "е"], ["yu", "ю"], ["ya", "я"],
];

function toLatin(text: string): string {
  return text.toLowerCase().split("").map((ch) => cyrToLat[ch] ?? ch).join("");
}

function toCyrillic(text: string): string {
  let result = text.toLowerCase();
  for (const [lat, cyr] of multiLatToCyr) {
    result = result.replaceAll(lat, cyr);
  }
  return result.split("").map((ch) => latToCyr[ch] ?? ch).join("");
}

export function nameMatch(name: string, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const n = name.toLowerCase();
  if (n.includes(q)) return true;
  if (toLatin(n).includes(q)) return true;
  if (n.includes(toCyrillic(q))) return true;
  if (toLatin(n).includes(toLatin(q))) return true;
  return false;
}
