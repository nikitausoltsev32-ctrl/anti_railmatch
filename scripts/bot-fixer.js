/**
 * Bot #2 — Bug Fixer
 * Uses Google Gemini API (free tier).
 *
 * Run: node scripts/bot-fixer.js
 * Env: NOTION_TOKEN, NOTION_BUGS_DB_ID, GEMINI_API_KEY, GITHUB_TOKEN, GITHUB_REPO
 */

import { Client } from "@notionhq/client";
import { Octokit } from "@octokit/rest";
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const DB_ID = process.env.NOTION_BUGS_DB_ID;
const [OWNER, REPO] = (process.env.GITHUB_REPO || "nikitausoltsev32-ctrl/anti_railmatch").split("/");

if (!DB_ID || !process.env.NOTION_TOKEN || !process.env.GEMINI_API_KEY || !process.env.GITHUB_TOKEN) {
  console.error("Missing: NOTION_TOKEN, NOTION_BUGS_DB_ID, GEMINI_API_KEY, GITHUB_TOKEN");
  process.exit(1);
}

function extractField(description, label) {
  const match = description.match(new RegExp(`${label}: ([^\\n]+)`));
  const val = match?.[1]?.trim();
  return val && val !== "null" ? val : null;
}

async function generateFix(description, fileContent, filePath, fixSuggestion) {
  const prompt = `Исправь баг в файле ${filePath}.

БАГ: ${description.split("---")[0].slice(0, 500)}
${fixSuggestion ? `ИДЕЯ ФИКСА: ${fixSuggestion}` : ""}

ФАЙЛ:
${fileContent}

Верни ТОЛЬКО исправленный файл целиком. Без пояснений, без markdown-блоков \`\`\`.`;

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent(prompt);
  let fixed = result.response.text().trim();

  // Убрать markdown если модель добавила
  fixed = fixed.replace(/^```(?:\w+)?\n/, "").replace(/\n```$/, "");
  return fixed;
}

async function run() {
  console.log("[Fixer] Querying Notion...");
  const { results } = await notion.databases.query({
    database_id: DB_ID,
    filter: { property: "Status", select: { equals: "Подтвержден" } },
    page_size: 5,
  });

  if (!results.length) { console.log("[Fixer] No confirmed bugs."); return; }
  console.log(`[Fixer] ${results.length} bug(s) to fix.`);

  const { data: mainRef } = await octokit.git.getRef({ owner: OWNER, repo: REPO, ref: "heads/main" });
  const mainSha = mainRef.object.sha;

  for (const page of results) {
    const description = page.properties.Description?.rich_text?.[0]?.plain_text || "";
    const bugId = page.properties["Bug ID"]?.unique_id?.number || "?";
    const pageIdShort = page.id.replace(/-/g, "").slice(0, 8);
    const branchName = `fix/bug-${pageIdShort}`;

    const likelyFile = extractField(description, "Файл");
    const fixSuggestion = extractField(description, "Идея фикса");

    if (!likelyFile) {
      console.log(`[Fixer] BUG-${bugId}: no file identified, skipping.`);
      continue;
    }

    console.log(`[Fixer] BUG-${bugId}: fixing ${likelyFile}...`);

    await notion.pages.update({
      page_id: page.id,
      properties: {
        Status: { select: { name: "В работе" } },
        Branch: { rich_text: [{ text: { content: branchName } }] },
      },
    });

    // Получить файл из GitHub
    let fileData;
    try {
      const res = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path: likelyFile });
      fileData = res.data;
    } catch (e) {
      console.error(`[Fixer] BUG-${bugId}: file not found: ${likelyFile}`);
      await notion.pages.update({ page_id: page.id, properties: { Status: { select: { name: "Подтвержден" } } } });
      continue;
    }

    const fileContent = Buffer.from(fileData.content, "base64").toString("utf-8");

    // Сгенерировать фикс
    let fixedContent;
    try {
      fixedContent = await generateFix(description, fileContent, likelyFile, fixSuggestion);
    } catch (e) {
      console.error(`[Fixer] BUG-${bugId}: fix generation failed:`, e.message);
      await notion.pages.update({ page_id: page.id, properties: { Status: { select: { name: "Подтвержден" } } } });
      continue;
    }

    if (fixedContent.trim() === fileContent.trim()) {
      console.log(`[Fixer] BUG-${bugId}: no changes generated, skipping.`);
      await notion.pages.update({ page_id: page.id, properties: { Status: { select: { name: "Подтвержден" } } } });
      continue;
    }

    // Создать ветку
    try {
      await octokit.git.createRef({ owner: OWNER, repo: REPO, ref: `refs/heads/${branchName}`, sha: mainSha });
    } catch (e) {
      if (!e.message.includes("already exists")) {
        console.error(`[Fixer] BUG-${bugId}: branch failed:`, e.message); continue;
      }
    }

    // Запушить фикс
    try {
      await octokit.repos.createOrUpdateFileContents({
        owner: OWNER, repo: REPO, path: likelyFile,
        message: `fix(auto): BUG-${bugId} — ${description.slice(0, 60).split("\n")[0]}`,
        content: Buffer.from(fixedContent).toString("base64"),
        branch: branchName,
        sha: fileData.sha,
      });
    } catch (e) {
      console.error(`[Fixer] BUG-${bugId}: push failed:`, e.message); continue;
    }

    // Открыть PR
    let pr;
    try {
      const { data } = await octokit.pulls.create({
        owner: OWNER, repo: REPO,
        title: `[Auto-fix] BUG-${bugId}: ${description.slice(0, 60).split("\n")[0]}`,
        body: [
          "## Автоматический фикс (Gemini)",
          `**Notion:** https://notion.so/${page.id.replace(/-/g, "")}`,
          "",
          "**Описание:**",
          description.split("---")[0].slice(0, 400),
          fixSuggestion ? `\n**Применённая идея:** ${fixSuggestion}` : "",
          `\n**Файл:** \`${likelyFile}\``,
          "\n> ⚠️ Требуется ревью перед мержем.",
        ].join("\n"),
        head: branchName, base: "main",
      });
      pr = data;
    } catch (e) {
      console.error(`[Fixer] BUG-${bugId}: PR failed:`, e.message); continue;
    }

    await notion.pages.update({
      page_id: page.id,
      properties: {
        Status: { select: { name: "Выполнено" } },
        "PR URL": { url: pr.html_url },
      },
    });

    console.log(`[Fixer] BUG-${bugId} → PR: ${pr.html_url}`);
  }
  console.log("[Fixer] Done.");
}

run().catch(e => { console.error(e); process.exit(1); });
