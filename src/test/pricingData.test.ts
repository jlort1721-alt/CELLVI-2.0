import { describe, it, expect } from "vitest";
import { tiers, addOns, countries, fairUseRules, partnerCommissions, type PricingTier, type AddOn, type CountryConfig } from "@/lib/pricingData";

describe("pricingData — countries", () => {
    it("exports a non-empty array of countries", () => {
        expect(countries).toBeInstanceOf(Array);
        expect(countries.length).toBeGreaterThan(0);
    });

    it("each country has required fields", () => {
        countries.forEach((c: CountryConfig) => {
            expect(c.code).toMatch(/^[A-Z]{2}$/);
            expect(c.name).toBeTruthy();
            expect(c.flag).toBeTruthy();
            expect(c.currency).toBeTruthy();
        });
    });

    it("includes Colombia as primary market", () => {
        const co = countries.find((c) => c.code === "CO");
        expect(co).toBeDefined();
        expect(co!.currency).toBe("COP");
    });

    it("all country codes are unique", () => {
        const codes = countries.map((c) => c.code);
        expect(new Set(codes).size).toBe(codes.length);
    });
});

describe("pricingData — tiers", () => {
    it("exports exactly 4 tiers", () => {
        expect(tiers).toHaveLength(4);
    });

    it("tier order is smb → professional → business → enterprise", () => {
        expect(tiers.map((t) => t.key)).toEqual(["smb", "professional", "business", "enterprise"]);
    });

    it("only professional is marked as popular", () => {
        const popular = tiers.filter((t) => t.popular);
        expect(popular).toHaveLength(1);
        expect(popular[0].key).toBe("professional");
    });

    it("each tier has pricing for all defined countries", () => {
        const countryCodes = countries.map((c) => c.code);
        tiers.forEach((tier) => {
            countryCodes.forEach((code) => {
                expect(tier.basePrice[code]).toBeDefined();
                expect(tier.basePrice[code].currency).toBeTruthy();
                expect(tier.basePrice[code].amount).toBeTruthy();
            });
        });
    });

    it("each tier has features array", () => {
        tiers.forEach((tier) => {
            expect(tier.features).toBeInstanceOf(Array);
            expect(tier.features.length).toBeGreaterThan(0);
        });
    });

    it("higher tiers have more features", () => {
        for (let i = 1; i < tiers.length; i++) {
            expect(tiers[i].features.length).toBeGreaterThanOrEqual(tiers[i - 1].features.length);
        }
    });

    it("each tier has valid limits", () => {
        tiers.forEach((tier) => {
            expect(tier.limits).toBeDefined();
            expect(typeof tier.limits.usersIncluded).toBe("number");
            expect(typeof tier.limits.eventsPerDay).toBe("number");
            expect(typeof tier.limits.retentionDays).toBe("number");
            expect(typeof tier.limits.apiCallsPerMonth).toBe("number");
            expect(typeof tier.limits.reportsPerMonth).toBe("number");
        });
    });

    it("enterprise tier has unlimited (-1) limits", () => {
        const enterprise = tiers.find((t) => t.key === "enterprise")!;
        expect(enterprise.limits.usersIncluded).toBe(-1);
        expect(enterprise.limits.eventsPerDay).toBe(-1);
        expect(enterprise.limits.retentionDays).toBe(-1);
        expect(enterprise.limits.apiCallsPerMonth).toBe(-1);
        expect(enterprise.limits.reportsPerMonth).toBe(-1);
    });
});

describe("pricingData — addOns", () => {
    it("exports a non-empty array of add-ons", () => {
        expect(addOns).toBeInstanceOf(Array);
        expect(addOns.length).toBeGreaterThan(0);
    });

    it("each add-on has pricing for all countries", () => {
        const countryCodes = countries.map((c) => c.code);
        addOns.forEach((addon: AddOn) => {
            expect(addon.key).toBeTruthy();
            countryCodes.forEach((code) => {
                expect(addon.price[code]).toBeDefined();
            });
        });
    });

    it("all add-on keys are unique", () => {
        const keys = addOns.map((a) => a.key);
        expect(new Set(keys).size).toBe(keys.length);
    });
});

describe("pricingData — fairUseRules", () => {
    it("exports non-empty rules", () => {
        expect(fairUseRules).toBeInstanceOf(Array);
        expect(fairUseRules.length).toBeGreaterThan(0);
    });
});

describe("pricingData — partnerCommissions", () => {
    it("exports partner commission tiers", () => {
        expect(partnerCommissions).toBeInstanceOf(Array);
        expect(partnerCommissions.length).toBeGreaterThan(0);
    });

    it("commissions increase with higher minimums", () => {
        for (let i = 1; i < partnerCommissions.length; i++) {
            expect(partnerCommissions[i].minAssets).toBeGreaterThan(partnerCommissions[i - 1].minAssets);
        }
    });

    it("each commission has required fields", () => {
        partnerCommissions.forEach((pc) => {
            expect(pc.key).toBeTruthy();
            expect(pc.minAssets).toBeGreaterThan(0);
            expect(pc.commission).toMatch(/^\d+%$/);
        });
    });
});
