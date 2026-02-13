import { describe, it, expect, beforeEach, vi } from "vitest";
import { detectSessionHijack } from "../lib/security";

/**
 * Session Fingerprinting Tests - PR #14
 * Validates enhanced fingerprinting with crypto.subtle
 */

describe("Session Fingerprinting - PR #14", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("should generate fingerprint on first call", async () => {
    const isHijacked = await detectSessionHijack();
    expect(isHijacked).toBe(false);
    expect(sessionStorage.getItem("session_fingerprint")).toBeTruthy();
  });

  it("should return false for same session", async () => {
    await detectSessionHijack(); // First call
    const secondCall = await detectSessionHijack(); // Second call
    expect(secondCall).toBe(false);
  });

  it("should detect fingerprint change (simulated hijack)", async () => {
    await detectSessionHijack();

    // Simulate fingerprint change by modifying stored value
    sessionStorage.setItem("session_fingerprint", "different-fingerprint");

    const isHijacked = await detectSessionHijack();
    expect(isHijacked).toBe(true);
  });

  it("should use crypto.subtle if available", async () => {
    // Verify crypto.subtle is available in test environment
    expect(crypto.subtle).toBeDefined();
    expect(crypto.subtle.digest).toBeDefined();

    const isHijacked = await detectSessionHijack();
    const fingerprint = sessionStorage.getItem("session_fingerprint");

    // SHA-256 produces 64 hex characters
    expect(fingerprint).toHaveLength(64);
    expect(fingerprint).toMatch(/^[a-f0-9]{64}$/);
  });

  it("should produce consistent fingerprints for same browser", async () => {
    sessionStorage.clear();
    await detectSessionHijack();
    const first = sessionStorage.getItem("session_fingerprint");

    sessionStorage.clear();
    await detectSessionHijack();
    const second = sessionStorage.getItem("session_fingerprint");

    expect(first).toBe(second);
  });
});
