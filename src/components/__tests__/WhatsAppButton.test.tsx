import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock framer-motion to avoid animation complexities in tests
vi.mock("framer-motion", () => ({
  motion: {
    a: ({
      children,
      ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
      children: React.ReactNode;
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
      whileHover?: unknown;
    }) => {
      // Strip framer-motion specific props and render a plain anchor
      const {
        initial: _i,
        animate: _a,
        exit: _e,
        whileHover: _wh,
        ...htmlProps
      } = props as Record<string, unknown>;
      return <a {...(htmlProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>{children}</a>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import WhatsAppButton from "../WhatsAppButton";

describe("WhatsAppButton", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderWithRouter = (initialRoute = "/") => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <WhatsAppButton />
      </MemoryRouter>
    );
  };

  it("renders the WhatsApp button after delay", () => {
    renderWithRouter();

    // Button should not be visible before the 1-second delay
    expect(screen.queryByLabelText("Contactar por WhatsApp")).not.toBeInTheDocument();

    // Advance timers to trigger the visibility
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByLabelText("Contactar por WhatsApp")).toBeInTheDocument();
  });

  it("has correct href attribute containing whatsapp URL", () => {
    renderWithRouter();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const link = screen.getByLabelText("Contactar por WhatsApp");
    const href = link.getAttribute("href");
    expect(href).toContain("api.whatsapp.com");
    expect(href).toContain("573187500962");
  });

  it("has target='_blank' for opening in new tab", () => {
    renderWithRouter();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const link = screen.getByLabelText("Contactar por WhatsApp");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("has rel='noopener noreferrer' for security", () => {
    renderWithRouter();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const link = screen.getByLabelText("Contactar por WhatsApp");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("is accessible with an aria-label", () => {
    renderWithRouter();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const link = screen.getByLabelText("Contactar por WhatsApp");
    expect(link).toHaveAttribute("aria-label", "Contactar por WhatsApp");
  });

  it("uses demo message when on a demo page", () => {
    renderWithRouter("/demo");

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const link = screen.getByLabelText("Contactar por WhatsApp");
    const href = link.getAttribute("href")!;
    const decodedHref = decodeURIComponent(href);
    expect(decodedHref).toContain("estoy viendo el Demo de CELLVI");
  });

  it("uses platform support message when on platform page", () => {
    renderWithRouter("/platform");

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const link = screen.getByLabelText("Contactar por WhatsApp");
    const href = link.getAttribute("href")!;
    const decodedHref = decodeURIComponent(href);
    expect(decodedHref).toContain("soporte técnico en la plataforma");
  });

  it("uses default message on other pages", () => {
    renderWithRouter("/");

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const link = screen.getByLabelText("Contactar por WhatsApp");
    const href = link.getAttribute("href")!;
    const decodedHref = decodeURIComponent(href);
    expect(decodedHref).toContain("servicios de ASEGURAR LTDA");
  });
});
