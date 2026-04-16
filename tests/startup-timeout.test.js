import { describe, it, expect } from "vitest";
import { withTimeout } from "../src/supabaseClient.js";

describe("startup timeout guard", () => {
    it("returns fallback when async startup hangs too long", async () => {
        const neverSettles = new Promise(() => {});

        await expect(
            withTimeout(neverSettles, 20, "startup-fallback")
        ).resolves.toBe("startup-fallback");
    });
});
