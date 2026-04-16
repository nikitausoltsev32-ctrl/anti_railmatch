import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function readText(...parts) {
    return fs.readFileSync(path.join(root, ...parts), "utf8");
}

describe("release flow configuration", () => {
    it("keeps frontend env vars out of vercel.json", () => {
        const vercel = JSON.parse(readText("vercel.json"));

        expect(vercel.build?.env).toBeUndefined();
    });

    it("defines a dedicated CI workflow for release checks", () => {
        const workflowPath = path.join(root, ".github", "workflows", "ci.yml");

        expect(fs.existsSync(workflowPath)).toBe(true);

        const workflow = fs.readFileSync(workflowPath, "utf8");
        expect(workflow).toContain("npm ci");
        expect(workflow).toContain("npm run build");
        expect(workflow).toContain("npm test");
        expect(workflow).toContain("pull_request");
    });

    it("documents the pilot release flow and environment ownership", () => {
        const readme = readText("README.md");

        expect(readme).toContain("release/closed-pilot-v1");
        expect(readme).toContain("Vercel Project Settings");
        expect(readme).toContain("Cloudflare");
        expect(readme).toContain("DNS-only");
    });

    it("ships a frontend env example for local setup", () => {
        const envExamplePath = path.join(root, ".env.example");

        expect(fs.existsSync(envExamplePath)).toBe(true);

        const envExample = fs.readFileSync(envExamplePath, "utf8");
        expect(envExample).toContain("VITE_SUPABASE_URL=");
        expect(envExample).toContain("VITE_SUPABASE_ANON_KEY=");
        expect(envExample).toContain("VITE_TELEGRAM_BOT_USERNAME=");
    });
});
