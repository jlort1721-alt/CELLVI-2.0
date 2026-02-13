import { describe, it, expect } from "vitest";
import {
    sanitizeInput,
    isValidRedirectUrl,
    generateCSRFToken,
    isRateLimited,
} from "@/lib/security";

describe("Security Utilities", () => {
    describe("sanitizeInput", () => {
        it("escapes HTML characters", () => {
            expect(sanitizeInput('<script>alert("XSS")</script>')).toBe(
                "&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;"
            );
        });

        it("escapes ampersand", () => {
            expect(sanitizeInput("foo & bar")).toBe("foo &amp; bar");
        });

        it("handles empty string", () => {
            expect(sanitizeInput("")).toBe("");
        });

        it("preserves normal text", () => {
            expect(sanitizeInput("Hello World 123")).toBe("Hello World 123");
        });

        it("escapes single quotes", () => {
            expect(sanitizeInput("it's a test")).toBe("it&#x27;s a test");
        });
    });

    describe("isValidRedirectUrl", () => {
        it("accepts same-origin URLs", () => {
            expect(isValidRedirectUrl("/demo")).toBe(true);
            expect(isValidRedirectUrl("/platform")).toBe(true);
        });

        it("accepts allowed domains", () => {
            expect(isValidRedirectUrl("https://cellvi.com/dashboard")).toBe(true);
        });

        it("rejects external URLs", () => {
            expect(isValidRedirectUrl("https://evil.com/phishing")).toBe(false);
        });

        it("rejects javascript: protocol", () => {
            expect(isValidRedirectUrl("javascript:alert(1)")).toBe(false);
        });
    });

    describe("generateCSRFToken", () => {
        it("generates 64-character hex string", () => {
            const token = generateCSRFToken();
            expect(token).toHaveLength(64);
            expect(token).toMatch(/^[0-9a-f]{64}$/);
        });

        it("generates unique tokens", () => {
            const t1 = generateCSRFToken();
            const t2 = generateCSRFToken();
            expect(t1).not.toBe(t2);
        });
    });

    describe("isRateLimited", () => {
        it("allows requests within limit", () => {
            const key = `test-${Date.now()}`;
            expect(isRateLimited(key, 3)).toBe(false);
            expect(isRateLimited(key, 3)).toBe(false);
            expect(isRateLimited(key, 3)).toBe(false);
        });

        it("blocks requests exceeding limit", () => {
            const key = `rate-${Date.now()}`;
            for (let i = 0; i < 5; i++) isRateLimited(key, 5);
            expect(isRateLimited(key, 5)).toBe(true);
        });
    });
});
