const HOMOGLYPHS = {
  "а":"a","е":"e","о":"o","р":"p","с":"c","у":"y","х":"x","к":"k","в":"b","н":"h","м":"m","т":"t",
  "А":"a","Е":"e","О":"o","Р":"p","С":"c","У":"y","Х":"x","К":"k","В":"b","Н":"h","М":"m","Т":"t",
};
const ZW = /[\u200b-\u200f\u2060\ufeff]/g;

export function normalize(input) {
  if (!input) return "";
  let s = input.normalize("NFKC").replace(ZW, "");
  s = s.replace(/[а-яА-Я]/g, (c) => HOMOGLYPHS[c] ?? c).toLowerCase();
  s = s.replace(/([a-z0-9])\s*([.@\/])\s*([a-z0-9])/g, "$1$2$3");
  s = s.replace(/([a-z0-9])\s*([.@\/])\s*([a-z0-9])/g, "$1$2$3");
  return s;
}

const RULES = [
  ["email",         /[\w.+-]+@[\w-]+\.[\w.-]+/],
  ["email_spelled", /[a-z0-9_]+\s*(?:at|собака)\s*[a-z0-9_]+\s*(?:dot|точка)\s*[a-z]{2,}/],
  ["tg_link",       /t\.me\/[a-z0-9_]+/],
  ["tg_handle",     /(?:^|[^a-z0-9_])@[a-z0-9_]{4,}/],
  ["wa",            /whats?app|вотсап|вацап|wa\.me/],
];

export function detect(input) {
  const s = normalize(input);
  for (const [id, re] of RULES) if (re.test(s)) return { detector: id };
  const digits = s.replace(/[^\d+]/g, "");
  if (/\+?\d{9,}/.test(digits)) return { detector: "phone" };
  return null;
}
