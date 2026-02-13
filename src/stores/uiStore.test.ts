import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "@/stores/uiStore";

describe("uiStore", () => {
  beforeEach(() => {
    // Reset store state between tests
    useUIStore.setState({ sidebarOpen: true, activeModule: "overview" });
  });

  it("has correct initial state", () => {
    const state = useUIStore.getState();
    expect(state.sidebarOpen).toBe(true);
    expect(state.activeModule).toBe("overview");
  });

  it("toggles sidebar", () => {
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(false);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it("sets sidebar open state directly", () => {
    useUIStore.getState().setSidebarOpen(false);
    expect(useUIStore.getState().sidebarOpen).toBe(false);
  });

  it("sets active module", () => {
    useUIStore.getState().setActiveModule("alerts");
    expect(useUIStore.getState().activeModule).toBe("alerts");

    useUIStore.getState().setActiveModule("compliance");
    expect(useUIStore.getState().activeModule).toBe("compliance");
  });
});
