import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { normalize, detect, detectSequence } from "./anti-leak.ts";

// Normalizer tests
Deno.test("normalize: NFKC + lowercase", () => {
  assertEquals(normalize("HELLO"), "hello");
});

Deno.test("normalize: cyrillic homoglyph fold", () => {
  // 'а','е','о','р','с' here are cyrillic
  assertEquals(normalize("ареса"), "apeca");
});

Deno.test("normalize: zero-width strip", () => {
  assertEquals(normalize("a\u200bb\u200cc\ufeff"), "abc");
});

Deno.test("normalize: collapse spaces inside emails/links", () => {
  assertEquals(normalize("a @ b . c"), "a@b.c");
  assertEquals(normalize("t . m e / foo"), "t.me/foo");
});

Deno.test("normalize: preserves regular spaces between words", () => {
  assertEquals(normalize("hello world"), "hello world");
});

// Detector tests
Deno.test("detect: plain email", () => {
  const r = detect("write me at john.doe@example.com please");
  assertEquals(r?.detector, "email");
});

Deno.test("detect: spelled-out email", () => {
  const r = detect("john at example dot com");
  assertEquals(r?.detector, "email_spelled");
});

Deno.test("detect: phone with country code", () => {
  const r = detect("звони +7 999 123 45 67");
  assertEquals(r?.detector, "phone");
});

Deno.test("detect: telegram handle", () => {
  const r = detect("пиши в @ivan_petrov_77");
  assertEquals(r?.detector, "tg_handle");
});

Deno.test("detect: t.me link", () => {
  const r = detect("t.me/ivan_petrov");
  assertEquals(r?.detector, "tg_link");
});

Deno.test("detect: whatsapp keyword", () => {
  const r = detect("есть вотсап?");
  assertEquals(r?.detector, "wa");
});

Deno.test("detect: clean text returns null", () => {
  assertEquals(detect("сколько вагонов в марте?"), null);
});

Deno.test("detect: snippet bounds around match", () => {
  const r = detect("hello my email is bob@bob.io thanks");
  assertEquals(r?.snippet.includes("bob@bob.io"), true);
});

Deno.test("detect: cyrillic homoglyph email", () => {
  // mix of cyrillic letters
  const r = detect("ивaн@мaил.com"); // 'a' cyrillic
  assertEquals(r?.detector, "email");
});

// Sequence detector tests
Deno.test("detectSequence: assembled phone across messages", () => {
  const history = ["мой телефон", "+7", "999", "123", "45"];
  const r = detectSequence("67", history);
  assertEquals(r?.detector, "phone_sequence");
});

Deno.test("detectSequence: clean history returns null", () => {
  const r = detectSequence("ок согласен", ["когда поедем", "в среду"]);
  assertEquals(r, null);
});

Deno.test("detectSequence: ignores when current message alone is dirty", () => {
  const r = detectSequence("+79991234567", ["привет"]);
  assertEquals(r, null);
});
