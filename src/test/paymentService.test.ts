import { describe, it, expect } from "vitest";
import { paymentService } from "@/lib/paymentService";

describe("paymentService.calculateEstimate", () => {
    it("calculates monthly estimate for SMB plan", () => {
        const result = paymentService.calculateEstimate({
            planKey: "smb",
            vehicleCount: 10,
            billingPeriod: "monthly",
            addOns: [],
            countryCode: "CO",
        });

        expect(result.subtotal).toBe(450000); // 45000 × 10
        expect(result.discount).toBe(0);
        expect(result.tax).toBe(85500); // 19% IVA
        expect(result.total).toBe(535500);
        expect(result.currency).toBe("COP");
    });

    it("calculates yearly estimate with 20% discount", () => {
        const result = paymentService.calculateEstimate({
            planKey: "smb",
            vehicleCount: 10,
            billingPeriod: "yearly",
            addOns: [],
            countryCode: "CO",
        });

        expect(result.subtotal).toBe(5400000); // 45000 × 10 × 12
        expect(result.discount).toBe(1080000); // 20% of 5400000
        expect(result.tax).toBe(820800); // 19% of 4320000
        expect(result.total).toBe(5140800);
    });

    it("includes add-ons in calculation", () => {
        const withAddons = paymentService.calculateEstimate({
            planKey: "professional",
            vehicleCount: 5,
            billingPeriod: "monthly",
            addOns: ["video", "evidence"],
            countryCode: "CO",
        });

        const withoutAddons = paymentService.calculateEstimate({
            planKey: "professional",
            vehicleCount: 5,
            billingPeriod: "monthly",
            addOns: [],
            countryCode: "CO",
        });

        expect(withAddons.subtotal).toBeGreaterThan(withoutAddons.subtotal);
    });

    it("handles support247 as flat fee", () => {
        const result = paymentService.calculateEstimate({
            planKey: "business",
            vehicleCount: 100,
            billingPeriod: "monthly",
            addOns: ["support247"],
            countryCode: "CO",
        });

        // support247 is 350000 flat, not per vehicle
        // So total = (30000 × 100 + 350000) × 1 with IVA
        const expectedSubtotal = 30000 * 100 + 350000;
        expect(result.subtotal).toBe(expectedSubtotal);
    });

    it("no tax for non-CO countries", () => {
        const result = paymentService.calculateEstimate({
            planKey: "smb",
            vehicleCount: 10,
            billingPeriod: "monthly",
            addOns: [],
            countryCode: "EC",
        });

        expect(result.tax).toBe(0);
        expect(result.currency).toBe("USD");
    });

    it("enterprise plan returns 0 base", () => {
        const result = paymentService.calculateEstimate({
            planKey: "enterprise",
            vehicleCount: 1000,
            billingPeriod: "monthly",
            addOns: [],
            countryCode: "CO",
        });

        expect(result.subtotal).toBe(0);
        expect(result.total).toBe(0);
    });

    it("handles 1 vehicle correctly", () => {
        const result = paymentService.calculateEstimate({
            planKey: "smb",
            vehicleCount: 1,
            billingPeriod: "monthly",
            addOns: [],
            countryCode: "CO",
        });

        expect(result.subtotal).toBe(45000);
        expect(result.tax).toBe(8550);
        expect(result.total).toBe(53550);
    });

    it("handles multiple add-ons", () => {
        const result = paymentService.calculateEstimate({
            planKey: "professional",
            vehicleCount: 50,
            billingPeriod: "monthly",
            addOns: ["video", "evidence", "coldchain"],
            countryCode: "CO",
        });

        // Base: 38000 × 50 = 1,900,000
        // video: 18000 × 50 = 900,000
        // evidence: 12000 × 50 = 600,000
        // coldchain: 15000 × 50 = 750,000
        // subtotal = 4,150,000
        expect(result.subtotal).toBe(4150000);
    });
});

describe("paymentService.getPSEBanks", () => {
    it("returns a list of banks", async () => {
        const banks = await paymentService.getPSEBanks();
        expect(banks).toBeInstanceOf(Array);
        expect(banks.length).toBeGreaterThan(0);
        banks.forEach((bank) => {
            expect(bank.code).toBeTruthy();
            expect(bank.name).toBeTruthy();
        });
    });

    it("includes Bancolombia and Nequi", async () => {
        const banks = await paymentService.getPSEBanks();
        const names = banks.map((b) => b.name);
        expect(names).toContain("Bancolombia");
        expect(names).toContain("Nequi");
    });
});
