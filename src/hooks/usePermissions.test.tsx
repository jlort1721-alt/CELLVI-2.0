import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { render } from "@testing-library/react";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/hooks/useAuth";
import { usePermissions, Can } from "@/hooks/usePermissions";

const mockUseAuth = vi.mocked(useAuth);

describe("usePermissions", () => {
  it("super_admin can do anything", () => {
    mockUseAuth.mockReturnValue({ role: "super_admin" } as ReturnType<typeof useAuth>);
    const { result } = renderHook(() => usePermissions());
    expect(result.current.can("anything.at.all")).toBe(true);
  });

  it("operator can read monitoring but not admin", () => {
    mockUseAuth.mockReturnValue({ role: "operator" } as ReturnType<typeof useAuth>);
    const { result } = renderHook(() => usePermissions());
    expect(result.current.can("monitoring.read")).toBe(true);
    expect(result.current.can("admin.users")).toBe(false);
  });

  it("auditor can access compliance but not admin", () => {
    mockUseAuth.mockReturnValue({ role: "auditor" } as ReturnType<typeof useAuth>);
    const { result } = renderHook(() => usePermissions());
    expect(result.current.can("compliance.read")).toBe(true);
    expect(result.current.can("admin.billing")).toBe(false);
  });

  it("driver has limited access", () => {
    mockUseAuth.mockReturnValue({ role: "driver" } as ReturnType<typeof useAuth>);
    const { result } = renderHook(() => usePermissions());
    expect(result.current.can("monitoring.own")).toBe(true);
    expect(result.current.can("fleet.read")).toBe(false);
    expect(result.current.can("admin.users")).toBe(false);
  });

  it("null role denies everything", () => {
    mockUseAuth.mockReturnValue({ role: null } as ReturnType<typeof useAuth>);
    const { result } = renderHook(() => usePermissions());
    expect(result.current.can("monitoring.read")).toBe(false);
  });

  it("canAny returns true if any permission matches", () => {
    mockUseAuth.mockReturnValue({ role: "operator" } as ReturnType<typeof useAuth>);
    const { result } = renderHook(() => usePermissions());
    expect(result.current.canAny("admin.users", "monitoring.read")).toBe(true);
    expect(result.current.canAny("admin.users", "compliance.write")).toBe(false);
  });
});

describe("Can component", () => {
  it("renders children when permitted", () => {
    mockUseAuth.mockReturnValue({ role: "admin" } as ReturnType<typeof useAuth>);
    const { getByText } = render(<Can do="monitoring.read"><span>Visible</span></Can>);
    expect(getByText("Visible")).toBeInTheDocument();
  });

  it("renders fallback when not permitted", () => {
    mockUseAuth.mockReturnValue({ role: "driver" } as ReturnType<typeof useAuth>);
    const { queryByText, getByText } = render(<Can do="admin.users" fallback={<span>No access</span>}><span>Hidden</span></Can>);
    expect(queryByText("Hidden")).not.toBeInTheDocument();
    expect(getByText("No access")).toBeInTheDocument();
  });

  it("renders nothing when not permitted and no fallback", () => {
    mockUseAuth.mockReturnValue({ role: "client" } as ReturnType<typeof useAuth>);
    const { container } = render(<Can do="admin.users"><span>Hidden</span></Can>);
    expect(container.innerHTML).toBe("");
  });
});
