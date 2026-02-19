import { describe, it, expect } from "vitest";
import {
  statusConfig,
  severityConfig,
  classificationConfig,
  containerVariants,
  itemVariants,
} from "../coldChainConfig";

describe("coldChainConfig", () => {
  // ── statusConfig ───────────────────────────────────────────────────────

  describe("statusConfig", () => {
    const expectedStatuses = ["normal", "warning", "critical", "offline"] as const;
    const requiredProperties = ["color", "bg", "border", "icon", "labelKey", "pulse"] as const;

    it("has all 4 status types", () => {
      const keys = Object.keys(statusConfig);
      expect(keys).toHaveLength(4);
      expectedStatuses.forEach((status) => {
        expect(statusConfig).toHaveProperty(status);
      });
    });

    expectedStatuses.forEach((status) => {
      describe(`status: ${status}`, () => {
        requiredProperties.forEach((prop) => {
          it(`has '${prop}' property`, () => {
            expect(statusConfig[status]).toHaveProperty(prop);
          });
        });

        it("color is a Tailwind text class", () => {
          expect(statusConfig[status].color).toMatch(/^text-/);
        });

        it("bg is a Tailwind bg class", () => {
          expect(statusConfig[status].bg).toMatch(/^bg-/);
        });

        it("border is a Tailwind border class", () => {
          expect(statusConfig[status].border).toMatch(/^border-/);
        });

        it("icon is a valid React component", () => {
          const icon = statusConfig[status].icon;
          // Lucide icons are ForwardRef components (objects with $$typeof or render)
          expect(icon).toBeDefined();
          expect(typeof icon === "function" || typeof icon === "object").toBe(true);
        });

        it("labelKey starts with 'coldChain.'", () => {
          expect(statusConfig[status].labelKey).toMatch(/^coldChain\./);
        });

        it("pulse is a Tailwind bg class", () => {
          expect(statusConfig[status].pulse).toMatch(/^bg-/);
        });
      });
    });
  });

  // ── severityConfig ─────────────────────────────────────────────────────

  describe("severityConfig", () => {
    const expectedSeverities = ["critical", "warning", "info"] as const;

    it("has all 3 severity levels", () => {
      const keys = Object.keys(severityConfig);
      expect(keys).toHaveLength(3);
      expectedSeverities.forEach((severity) => {
        expect(severityConfig).toHaveProperty(severity);
      });
    });

    expectedSeverities.forEach((severity) => {
      describe(`severity: ${severity}`, () => {
        it("has color, bg, border, and icon", () => {
          expect(severityConfig[severity]).toHaveProperty("color");
          expect(severityConfig[severity]).toHaveProperty("bg");
          expect(severityConfig[severity]).toHaveProperty("border");
          expect(severityConfig[severity]).toHaveProperty("icon");
        });

        it("color is a Tailwind text class", () => {
          expect(severityConfig[severity].color).toMatch(/^text-/);
        });

        it("icon is a valid React component", () => {
          const icon = severityConfig[severity].icon;
          // Lucide icons are ForwardRef components (objects with $$typeof or render)
          expect(icon).toBeDefined();
          expect(typeof icon === "function" || typeof icon === "object").toBe(true);
        });
      });
    });
  });

  // ── classificationConfig ───────────────────────────────────────────────

  describe("classificationConfig", () => {
    const expectedClassifications = [
      "pharma",
      "frozen",
      "refrigerated",
      "ambient-controlled",
    ] as const;

    it("has all 4 classification types", () => {
      const keys = Object.keys(classificationConfig);
      expect(keys).toHaveLength(4);
      expectedClassifications.forEach((classification) => {
        expect(classificationConfig).toHaveProperty(classification);
      });
    });

    expectedClassifications.forEach((classification) => {
      describe(`classification: ${classification}`, () => {
        it("has labelKey and color", () => {
          expect(classificationConfig[classification]).toHaveProperty("labelKey");
          expect(classificationConfig[classification]).toHaveProperty("color");
        });

        it("labelKey starts with 'coldChain.'", () => {
          expect(classificationConfig[classification].labelKey).toMatch(/^coldChain\./);
        });

        it("color is a Tailwind text class", () => {
          expect(classificationConfig[classification].color).toMatch(/^text-/);
        });
      });
    });
  });

  // ── Animation Variants ─────────────────────────────────────────────────

  describe("containerVariants", () => {
    it("has 'hidden' state with opacity 0", () => {
      expect(containerVariants).toHaveProperty("hidden");
      expect(containerVariants.hidden.opacity).toBe(0);
    });

    it("has 'visible' state with opacity 1", () => {
      expect(containerVariants).toHaveProperty("visible");
      expect(containerVariants.visible.opacity).toBe(1);
    });

    it("visible state has staggerChildren transition", () => {
      expect(containerVariants.visible.transition).toBeDefined();
      expect(containerVariants.visible.transition).toHaveProperty("staggerChildren");
      expect(containerVariants.visible.transition.staggerChildren).toBe(0.06);
    });
  });

  describe("itemVariants", () => {
    it("has 'hidden' state with y offset and opacity 0", () => {
      expect(itemVariants).toHaveProperty("hidden");
      expect(itemVariants.hidden.y).toBe(20);
      expect(itemVariants.hidden.opacity).toBe(0);
    });

    it("has 'visible' state with y=0 and opacity 1", () => {
      expect(itemVariants).toHaveProperty("visible");
      expect(itemVariants.visible.y).toBe(0);
      expect(itemVariants.visible.opacity).toBe(1);
    });

    it("visible state uses spring animation", () => {
      expect(itemVariants.visible.transition).toBeDefined();
      expect(itemVariants.visible.transition.type).toBe("spring");
    });

    it("visible state has stiffness and damping", () => {
      const transition = itemVariants.visible.transition;
      expect(transition.stiffness).toBe(300);
      expect(transition.damping).toBe(30);
    });
  });
});
