/**
 * Bot #1 — Bug Verifier
 * Uses Google Gemini API (free tier) + Notion REST API directly (no SDK).
 *
 * Run: node scripts/bot-verifier.js
 * Env: NOTION_TOKEN, NOTION_BUGS_DB_ID, GEMINI_API_KEY
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync, readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DB_ID = process.env.NOTION_BUGS_DB_ID;

if (!DB_ID || !NOTION_TOKEN || !process.env.GEMINI_API_KEY) {
  console.error("Missing: NOTION_TOKEN, NOTION_BUGS_DB_ID, GEMINI_API_KEY");
  process.exit(1);
}

// --- Notion REST helpers ---

async function notionRequest(method, path, body) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    method,
    headers: {
      "Authorization": `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Notion ${method} ${path} failed: ${err}`);
  }
  return res.json();
}

async function queryDatabase(filter) {
  return notionRequest("POST", `/databases/${DB_ID}/query`, { filter, page_size: 10 });
}

async function updatePage(pageId, properties) {
  return notionRequest("PATCH", `/pages/${pageId}`, { properties });
}

// --- Source collection ---

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

// --- Bug verification ---

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

Проверь реален ли баг. Ответь ТОЛЬКО JSON без markdown-блоков:
{"valid":true,"reason":"...","likely_file":"path или null","likely_line_hint":"...","severity":"high","fix_suggestion":"..."}`;

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Non-JSON response: " + text.slice(0, 100));
  return JSON.parse(match[0]);
}

// --- Main ---

async function run() {
  console.log("[Verifier] Querying Notion...");

  const data = await queryDatabase({
    property: "Status",
    select: { equals: "Новый" },
  });

  const pages = data.results || [];
  if (!pages.length) { console.log("[Verifier] No new bugs."); return; }
  console.log(`[Verifier] ${pages.length} bug(s) to verify.`);

  for (const page of pages) {
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

    await updatePage(page.id, {
      Status: { select: { name: newStatus } },
      Description: { rich_text: [{ text: { content: (description + note).slice(0, 2000) } }] },
    });
    console.log(`[Verifier] BUG-${bugId} → ${newStatus}`);
  }
  console.log("[Verifier] Done.");
}

run().catch(e => { console.error(e); process.exit(1); });
