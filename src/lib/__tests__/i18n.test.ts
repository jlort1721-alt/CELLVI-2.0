import { describe, it, expect, afterAll } from "vitest";
import i18n from "../i18n";

describe("i18n configuration", () => {
  // Restore the original language after all tests
  const originalLanguage = i18n.language;
  afterAll(() => {
    i18n.changeLanguage(originalLanguage);
  });

  it("i18n is initialized", () => {
    expect(i18n.isInitialized).toBe(true);
  });

  it("has 'es' and 'en' as resource languages", () => {
    const languages = Object.keys(i18n.options.resources || {});
    expect(languages).toContain("es");
    expect(languages).toContain("en");
  });

  it("fallback language is set to Spanish (es)", () => {
    // i18next normalizes fallbackLng to an array internally
    const fallback = i18n.options.fallbackLng;
    if (Array.isArray(fallback)) {
      expect(fallback).toContain("es");
    } else {
      expect(fallback).toBe("es");
    }
  });

  it("interpolation escapeValue is disabled (React handles XSS)", () => {
    expect(i18n.options.interpolation?.escapeValue).toBe(false);
  });

  // ── Spanish translations ─────────────────────────────────────────────

  describe("Spanish (es) translations", () => {
    it("loads Spanish translations correctly", async () => {
      await i18n.changeLanguage("es");
      expect(i18n.language).toBe("es");
    });

    it("t() returns correct Spanish translation for nav.inicio", () => {
      i18n.changeLanguage("es");
      expect(i18n.t("nav.inicio")).toBe("Inicio");
    });

    it("t() returns correct Spanish translation for nav.contacto", () => {
      i18n.changeLanguage("es");
      expect(i18n.t("nav.contacto")).toBe("Contacto");
    });

    it("t() returns correct Spanish translation for nav.servicios", () => {
      i18n.changeLanguage("es");
      expect(i18n.t("nav.servicios")).toBe("Soluciones");
    });
  });

  // ── English translations ─────────────────────────────────────────────

  describe("English (en) translations", () => {
    it("loads English translations correctly", async () => {
      await i18n.changeLanguage("en");
      expect(i18n.language).toBe("en");
    });

    it("t() returns correct English translation for nav.inicio", () => {
      i18n.changeLanguage("en");
      expect(i18n.t("nav.inicio")).toBe("Home");
    });

    it("t() returns correct English translation for nav.contacto", () => {
      i18n.changeLanguage("en");
      expect(i18n.t("nav.contacto")).toBe("Contact");
    });

    it("t() returns correct English translation for nav.servicios", () => {
      i18n.changeLanguage("en");
      expect(i18n.t("nav.servicios")).toBe("Solutions");
    });
  });

  // ── Fallback behavior ────────────────────────────────────────────────

  describe("missing key fallback", () => {
    it("returns the key itself when translation is missing", () => {
      i18n.changeLanguage("es");
      const missingKey = "this.key.does.not.exist";
      expect(i18n.t(missingKey)).toBe(missingKey);
    });

    it("returns the key for a deeply nested missing key", () => {
      i18n.changeLanguage("en");
      const missingKey = "deeply.nested.missing.translation.key";
      expect(i18n.t(missingKey)).toBe(missingKey);
    });
  });

  // ── Language switching ────────────────────────────────────────────────

  describe("language switching", () => {
    it("switches from Spanish to English and back", async () => {
      await i18n.changeLanguage("es");
      expect(i18n.t("nav.inicio")).toBe("Inicio");

      await i18n.changeLanguage("en");
      expect(i18n.t("nav.inicio")).toBe("Home");

      await i18n.changeLanguage("es");
      expect(i18n.t("nav.inicio")).toBe("Inicio");
    });
  });
});
