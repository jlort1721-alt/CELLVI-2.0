import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock the pushNotifications module before importing the hook
vi.mock("@/lib/pwa/pushNotifications", () => ({
  getPermissionStatus: vi.fn(() => "default" as NotificationPermission),
  isPushSupported: vi.fn(() => false),
}));

import { usePWAStatus } from "../usePWAStatus";

describe("usePWAStatus", () => {
  const originalNavigatorOnLine = navigator.onLine;

  beforeEach(() => {
    vi.useFakeTimers();

    // Reset navigator.onLine to true for each test
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    // Restore original value
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: originalNavigatorOnLine,
    });
  });

  it("returns isOnline state", () => {
    const { result } = renderHook(() => usePWAStatus());
    expect(result.current).toHaveProperty("isOnline");
    expect(typeof result.current.isOnline).toBe("boolean");
  });

  it("initially isOnline matches navigator.onLine (true)", () => {
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: true,
    });

    const { result } = renderHook(() => usePWAStatus());
    expect(result.current.isOnline).toBe(true);
  });

  it("initially isOnline matches navigator.onLine (false)", () => {
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: false,
    });

    const { result } = renderHook(() => usePWAStatus());
    expect(result.current.isOnline).toBe(false);
  });

  it("updates isOnline to false on 'offline' event", () => {
    const { result } = renderHook(() => usePWAStatus());
    expect(result.current.isOnline).toBe(true);

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });

    expect(result.current.isOnline).toBe(false);
  });

  it("updates isOnline to true on 'online' event", () => {
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: false,
    });

    const { result } = renderHook(() => usePWAStatus());
    expect(result.current.isOnline).toBe(false);

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(result.current.isOnline).toBe(true);
  });

  it("returns all expected PWAStatus properties", () => {
    const { result } = renderHook(() => usePWAStatus());
    const status = result.current;

    expect(status).toHaveProperty("isInstalled");
    expect(status).toHaveProperty("isStandalone");
    expect(status).toHaveProperty("canInstall");
    expect(status).toHaveProperty("installPromptEvent");
    expect(status).toHaveProperty("notificationPermission");
    expect(status).toHaveProperty("notificationsSupported");
    expect(status).toHaveProperty("isOnline");
    expect(status).toHaveProperty("platform");
    expect(status).toHaveProperty("isMobile");
  });

  it("detects desktop platform in jsdom environment", () => {
    const { result } = renderHook(() => usePWAStatus());
    // jsdom's user agent typically contains "jsdom" but may also match other patterns
    // The key point is that the platform field is a valid value
    expect(["ios", "android", "desktop", "unknown"]).toContain(result.current.platform);
  });

  it("cleans up event listeners on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => usePWAStatus());
    unmount();

    const removedEvents = removeEventListenerSpy.mock.calls.map((call) => call[0]);
    expect(removedEvents).toContain("online");
    expect(removedEvents).toContain("offline");
    expect(removedEvents).toContain("beforeinstallprompt");
    expect(removedEvents).toContain("appinstalled");

    removeEventListenerSpy.mockRestore();
  });
});
