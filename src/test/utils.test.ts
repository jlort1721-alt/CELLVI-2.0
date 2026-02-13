import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn — className merge utility", () => {
    it("merges multiple classes", () => {
        const result = cn("text-red-500", "bg-blue-500");
        expect(result).toContain("text-red-500");
        expect(result).toContain("bg-blue-500");
    });

    it("handles undefined and null gracefully", () => {
        const result = cn("foo", undefined, null, "bar");
        expect(result).toContain("foo");
        expect(result).toContain("bar");
    });

    it("handles empty string", () => {
        const result = cn("");
        expect(typeof result).toBe("string");
    });

    it("merges conflicting Tailwind classes (last wins)", () => {
        const result = cn("px-4", "px-6");
        expect(result).toBe("px-6");
    });

    it("handles conditional classes", () => {
        const isActive = true;
        const result = cn("base", isActive && "active");
        expect(result).toContain("active");
    });

    it("handles false conditional classes", () => {
        const isActive = false;
        const result = cn("base", isActive && "active");
        expect(result).not.toContain("active");
        expect(result).toContain("base");
    });

    it("handles no arguments", () => {
        const result = cn();
        expect(result).toBe("");
    });

    it("resolves conflicting text colors", () => {
        const result = cn("text-red-500", "text-blue-500");
        expect(result).toBe("text-blue-500");
    });

    it("handles array of classes", () => {
        const result = cn(["foo", "bar"]);
        expect(result).toContain("foo");
        expect(result).toContain("bar");
    });
});
