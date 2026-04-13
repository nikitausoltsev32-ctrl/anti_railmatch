import { describe, it, expect } from "vitest";
import { detect, normalize } from "../src/anti-leak.js";

describe("client anti-leak mirror", () => {
    it("normalizes homoglyphs", () => {
        expect(normalize("ареса")).toBe("apeca");
    });
    it("detects email", () => {
        expect(detect("write me at john@example.com")?.detector).toBe("email");
    });
    it("detects phone", () => {
        expect(detect("звони +79991234567")?.detector).toBe("phone");
    });
    it("detects t.me link", () => {
        expect(detect("t.me/foo")?.detector).toBe("tg_link");
    });
    it("returns null on clean text", () => {
        expect(detect("когда грузим в марте")).toBeNull();
    });
});
