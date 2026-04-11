/**
 * Bot #1 — Bug Verifier
 * Uses Google Gemini API (free tier).
 *
 * Run: node scripts/bot-verifier.js
 * Env: NOTION_TOKEN, NOTION_BUGS_DB_ID, GEMINI_API_KEY
 */

import { Client } from "@notionhq/client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync, readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const DB_ID = process.env.NOTION_BUGS_DB_ID;

if (!DB_ID || !process.env.NOTION_TOKEN || !process.env.GEMINI_API_KEY) {
  console.error("Missing: NOTION_TOKEN, NOTION_BUGS_DB_ID, GEMINI_API_KEY");
  process.exit(1);
}

function collectSourceFiles(dir, collected = [], maxFiles = 30) {
  if (collected.length >= maxFiles) return collected;
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return collected; }
  for (const entry of entries) {
    if (collected.length >= maxFiles) break;
    if (["node_modules", ".git", "__pycache__", "dist"].includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectSourceFiles(fullPath, collected, maxFiles);
    } else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
      try {
        const content = readFileSync(fullPath, "utf-8");
        if (content.length < 40000) {
          collected.push(`// FILE: ${path.relative(ROOT, fullPath)}\n${content}`);
        }
      } catch {}
    }
  }
  return collected;
}

async function verifyBug(description, errorLogs) {
  const files = [
    ...collectSourceFiles(path.join(ROOT, "src")),
    ...collectSourceFiles(path.join(ROOT, "components"), [], 15),
  ];
  try {
    const app = readFileSync(path.join(ROOT, "App.jsx"), "utf-8");
    files.unshift(`// FILE: App.jsx\n${app}`);
  } catch {}

  const codebase = files.join("\n\n").slice(0, 100000);

  const prompt = `Ты — верификатор багов в React/Supabase приложении.

БАГ: ${description}
${errorLogs ? `ЛОГИ: ${errorLogs}` : ""}

КОД:
${codebase}

Проверь реален ли баг. Ответь ТОЛЬКО JSON без markdown:
{"valid":true,"reason":"...","likely_file":"path или null","likely_line_hint":"...","severity":"high","fix_suggestion":"..."}`;

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Non-JSON: " + text.slice(0, 100));
  return JSON.parse(match[0]);
}

async function run() {
  console.log("[Verifier] Querying Notion...");
  const { results } = await notion.databases.query({
    database_id: DB_ID,
    filter: { property: "Status", select: { equals: "Новый" } },
    page_size: 10,
  });

  if (!results.length) { console.log("[Verifier] No new bugs."); return; }
  console.log(`[Verifier] ${results.length} bug(s) to verify.`);

  for (const page of results) {
    const description = page.properties.Description?.rich_text?.[0]?.plain_text || "";
    const errorLogs = page.properties["Error Logs"]?.rich_text?.[0]?.plain_text || "";
    const bugId = page.properties["Bug ID"]?.unique_id?.number || "?";
    if (!description) continue;

    console.log(`[Verifier] BUG-${bugId}...`);
    let result;
    try { result = await verifyBug(description, errorLogs); }
    catch (e) { console.error(`[Verifier] BUG-${bugId} failed:`, e.message); continue; }

    const newStatus = result.valid ? "Подтвержден" : "Ложная тревога";
    const note = [
      `\n\n--- Верификация ${new Date().toISOString().slice(0, 10)} ---`,
      `Статус: ${newStatus} | Серьёзность: ${result.severity || "?"}`,
      `Причина: ${result.reason}`,
      result.likely_file && result.likely_file !== "null" ? `Файл: ${result.likely_file}` : null,
      result.likely_line_hint ? `Место: ${result.likely_line_hint}` : null,
      result.fix_suggestion ? `Идея фикса: ${result.fix_suggestion}` : null,
    ].filter(Boolean).join("\n");

    await notion.pages.update({
      page_id: page.id,
      properties: {
        Status: { select: { name: newStatus } },
        Description: { rich_text: [{ text: { content: (description + note).slice(0, 2000) } }] },
      },
    });
    console.log(`[Verifier] BUG-${bugId} → ${newStatus}`);
  }
  console.log("[Verifier] Done.");
}

run().catch(e => { console.error(e); process.exit(1); });
