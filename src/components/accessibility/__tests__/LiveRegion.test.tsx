import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";
import {
  useLiveRegion,
  GlobalLiveRegion,
  useAnnounce,
  announce,
} from "../LiveRegion";

describe("LiveRegion", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset Zustand store state before each test
    useLiveRegion.setState({ message: "" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── announce function ──────────────────────────────────────────────────

  describe("announce function (standalone)", () => {
    it("updates the store message", () => {
      announce("File uploaded successfully");
      expect(useLiveRegion.getState().message).toBe("File uploaded successfully");
    });

    it("clears the message after timeout", () => {
      announce("Temporary message");
      expect(useLiveRegion.getState().message).toBe("Temporary message");

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(useLiveRegion.getState().message).toBe("");
    });

    it("supports sequential announcements", () => {
      announce("First message");
      expect(useLiveRegion.getState().message).toBe("First message");

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      announce("Second message");
      expect(useLiveRegion.getState().message).toBe("Second message");
    });
  });

  // ── useLiveRegion store ────────────────────────────────────────────────

  describe("useLiveRegion store", () => {
    it("starts with an empty message", () => {
      expect(useLiveRegion.getState().message).toBe("");
    });

    it("announce method updates the message", () => {
      useLiveRegion.getState().announce("Store announcement");
      expect(useLiveRegion.getState().message).toBe("Store announcement");
    });

    it("message clears after 1 second", () => {
      useLiveRegion.getState().announce("Will clear");

      act(() => {
        vi.advanceTimersByTime(999);
      });
      expect(useLiveRegion.getState().message).toBe("Will clear");

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(useLiveRegion.getState().message).toBe("");
    });
  });

  // ── GlobalLiveRegion component ─────────────────────────────────────────

  describe("GlobalLiveRegion component", () => {
    it("renders aria-live polite region", () => {
      render(<GlobalLiveRegion />);
      const politeRegion = screen.getByRole("status");
      expect(politeRegion).toBeInTheDocument();
      expect(politeRegion).toHaveAttribute("aria-live", "polite");
      expect(politeRegion).toHaveAttribute("aria-atomic", "true");
    });

    it("renders aria-live assertive region", () => {
      render(<GlobalLiveRegion />);
      const alertRegion = screen.getByRole("alert");
      expect(alertRegion).toBeInTheDocument();
      expect(alertRegion).toHaveAttribute("aria-live", "assertive");
      expect(alertRegion).toHaveAttribute("aria-atomic", "true");
    });

    it("displays the announced message in the polite region", () => {
      render(<GlobalLiveRegion />);

      act(() => {
        useLiveRegion.getState().announce("Data loaded");
      });

      const politeRegion = screen.getByRole("status");
      expect(politeRegion).toHaveTextContent("Data loaded");
    });

    it("clears the message from the DOM after timeout", () => {
      render(<GlobalLiveRegion />);

      act(() => {
        useLiveRegion.getState().announce("Temporary DOM message");
      });

      expect(screen.getByRole("status")).toHaveTextContent("Temporary DOM message");

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByRole("status")).toHaveTextContent("");
    });
  });

  // ── useAnnounce hook ───────────────────────────────────────────────────

  describe("useAnnounce hook", () => {
    it("returns announce, announcePolite, and announceAssertive functions", () => {
      const { result } = renderHook(() => useAnnounce());
      expect(typeof result.current.announce).toBe("function");
      expect(typeof result.current.announcePolite).toBe("function");
      expect(typeof result.current.announceAssertive).toBe("function");
    });

    it("announce updates the store message", () => {
      const { result } = renderHook(() => useAnnounce());

      act(() => {
        result.current.announce("Hook announcement");
      });

      expect(useLiveRegion.getState().message).toBe("Hook announcement");
    });

    it("announcePolite updates the store message", () => {
      const { result } = renderHook(() => useAnnounce());

      act(() => {
        result.current.announcePolite("Polite message");
      });

      expect(useLiveRegion.getState().message).toBe("Polite message");
    });

    it("announceAssertive updates the store message", () => {
      const { result } = renderHook(() => useAnnounce());

      act(() => {
        result.current.announceAssertive("Assertive message");
      });

      expect(useLiveRegion.getState().message).toBe("Assertive message");
    });

    it("message clears after timeout when using hook", () => {
      const { result } = renderHook(() => useAnnounce());

      act(() => {
        result.current.announce("Will clear from hook");
      });

      expect(useLiveRegion.getState().message).toBe("Will clear from hook");

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(useLiveRegion.getState().message).toBe("");
    });
  });
});
