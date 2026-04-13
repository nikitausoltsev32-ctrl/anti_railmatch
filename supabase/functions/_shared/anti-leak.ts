const HOMOGLYPHS: Record<string, string> = {
  "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "у": "y",
  "х": "x", "к": "k", "в": "b", "н": "h", "м": "m", "т": "t",
  "А": "a", "Е": "e", "О": "o", "Р": "p", "С": "c", "У": "y",
  "Х": "x", "К": "k", "В": "b", "Н": "h", "М": "m", "Т": "t",
};

const ZERO_WIDTH = /[\u200b-\u200f\u2060\ufeff]/g;

export function normalize(input: string): string {
  if (!input) return "";
  let s = input.normalize("NFKC");
  s = s.replace(ZERO_WIDTH, "");
  s = s.replace(/[а-яА-Я]/g, (c) => HOMOGLYPHS[c] ?? c);
  s = s.toLowerCase();
  // Collapse punctuation/spaces between alphanumerics for "a @ b . c" → "a@b.c"
  s = s.replace(/([a-z0-9])\s*([.@\/])\s*([a-z0-9])/g, "$1$2$3");
  s = s.replace(/([a-z0-9])\s*([.@\/])\s*([a-z0-9])/g, "$1$2$3");
  return s;
}

export type DetectorId =
  | "email" | "email_spelled"
  | "phone"
  | "tg_handle" | "tg_link"
  | "wa"
  | "phone_sequence" | "email_sequence";

export interface Detection {
  detector: DetectorId;
  severity: "low" | "medium" | "high";
  snippet: string;
}

const SEVERITY: Record<DetectorId, "low" | "medium" | "high"> = {
  email: "high",
  email_spelled: "high",
  phone: "high",
  phone_sequence: "high",
  email_sequence: "high",
  tg_handle: "medium",
  tg_link: "medium",
  wa: "medium",
};

const RULES: { id: DetectorId; re: RegExp }[] = [
  { id: "email",         re: /[\w.+-]+@[\w-]+\.[\w.-]+/ },
  { id: "email_spelled", re: /[a-z0-9_]+\s*(?:at|собака)\s*[a-z0-9_]+\s*(?:dot|точка)\s*[a-z]{2,}/ },
  { id: "tg_link",       re: /t\.me\/[a-z0-9_]+/ },
  { id: "tg_handle",     re: /(?:^|[^a-z0-9_])@[a-z0-9_]{4,}/ },
  { id: "wa",            re: /whats?app|вотсап|вацап|wa\.me/ },
];

function snippetAround(src: string, match: RegExpMatchArray, pad = 20): string {
  const start = Math.max(0, (match.index ?? 0) - pad);
  const end = Math.min(src.length, (match.index ?? 0) + match[0].length + pad);
  return src.slice(start, end).replace(/\s+/g, " ").trim();
}

function detectPhone(s: string): Detection | null {
  const digitsOnly = s.replace(/[^\d+]/g, "");
  const m = digitsOnly.match(/\+?\d{9,}/);
  if (!m) return null;
  const origMatch = s.match(/(?:\+?\d[\d\s().\-]{8,}\d)/);
  const snippet = origMatch ? snippetAround(s, origMatch) : m[0];
  return { detector: "phone", severity: "high", snippet };
}

export function detect(input: string): Detection | null {
  const s = normalize(input);
  for (const rule of RULES) {
    const m = s.match(rule.re);
    if (m) {
      return {
        detector: rule.id,
        severity: SEVERITY[rule.id],
        snippet: snippetAround(s, m),
      };
    }
  }
  return detectPhone(s);
}

export const SEQUENCE_WINDOW = 8;

export function detectSequence(current: string, history: string[]): Detection | null {
  // Skip if current message alone already matches — single detector handles it
  if (detect(current)) return null;
  const joined = [...history.slice(-SEQUENCE_WINDOW), current]
    .map((m) => normalize(m))
    .join(" ");
  const phoneHit = detectPhone(joined);
  if (phoneHit) {
    return { detector: "phone_sequence", severity: "high", snippet: phoneHit.snippet };
  }
  const emailHit = joined.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  if (emailHit) {
    return {
      detector: "email_sequence",
      severity: "high",
      snippet: snippetAround(joined, emailHit),
    };
  }
  return null;
}
