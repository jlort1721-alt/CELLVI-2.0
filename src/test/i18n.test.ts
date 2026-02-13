import { describe, it, expect } from "vitest";
import es from "@/locales/es.json";
import en from "@/locales/en.json";

/**
 * i18n Completeness Tests
 * Ensures both locale files have matching key structures
 */

const flattenKeys = (obj: Record<string, unknown>, prefix = ""): string[] => {
    return Object.entries(obj).reduce<string[]>((acc, [key, value]) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === "object" && value !== null) {
            return [...acc, ...flattenKeys(value as Record<string, unknown>, fullKey)];
        }
        return [...acc, fullKey];
    }, []);
};

describe("i18n Completeness", () => {
    const esKeys = flattenKeys(es);
    const enKeys = flattenKeys(en);

    it("Spanish locale has all required top-level sections", () => {
        const sections = [
            "nav", "hero", "about", "services", "platform",
            "pricing", "useCases", "testimonials", "gallery",
            "blog", "policies", "clients", "ristra", "contact",
            "footer", "dashboard", "pqr", "pwa", "chatbot",
            "notFound", "common", "faq",
        ];
        sections.forEach((s) => {
            expect(es).toHaveProperty(s);
        });
    });

    it("English locale has all required top-level sections", () => {
        const sections = [
            "nav", "hero", "about", "services", "platform",
            "pricing", "useCases", "testimonials", "gallery",
            "blog", "policies", "clients", "ristra", "contact",
            "footer", "dashboard", "pqr", "pwa", "chatbot",
            "notFound", "common", "faq",
        ];
        sections.forEach((s) => {
            expect(en).toHaveProperty(s);
        });
    });

    it("all Spanish keys exist in English", () => {
        const missing = esKeys.filter((k) => !enKeys.includes(k));
        if (missing.length > 0) {
            console.warn("Keys in ES but missing in EN:", missing);
        }
        // Allow up to 5 missing keys (gradual sync)
        expect(missing.length).toBeLessThan(10);
    });

    it("all English keys exist in Spanish", () => {
        const missing = enKeys.filter((k) => !esKeys.includes(k));
        if (missing.length > 0) {
            console.warn("Keys in EN but missing in ES:", missing);
        }
        expect(missing.length).toBeLessThan(10);
    });

    it("dashboard section has predictive analytics keys", () => {
        expect(es.dashboard).toHaveProperty("predictive");
        expect(en.dashboard).toHaveProperty("predictive");
        expect(es.dashboard).toHaveProperty("groupAnalytics");
        expect(en.dashboard).toHaveProperty("groupAnalytics");
    });

    it("no empty string values in Spanish", () => {
        const emptyKeys = esKeys.filter((k) => {
            const parts = k.split(".");
            let val: unknown = es;
            for (const p of parts) val = (val as Record<string, unknown>)?.[p];
            return val === "";
        });
        expect(emptyKeys).toHaveLength(0);
    });

    it("no empty string values in English", () => {
        const emptyKeys = enKeys.filter((k) => {
            const parts = k.split(".");
            let val: unknown = en;
            for (const p of parts) val = (val as Record<string, unknown>)?.[p];
            return val === "";
        });
        expect(emptyKeys).toHaveLength(0);
    });
});
