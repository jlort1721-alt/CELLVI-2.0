import { describe, it, expect, beforeEach } from "vitest";
import { vehicleService, routeService, geofenceService, fuelService, alertService } from "@/lib/demoServices";

// ===== VEHICLE SERVICE TESTS =====
describe("vehicleService", () => {
    it("getAll returns all vehicles", () => {
        const all = vehicleService.getAll();
        expect(all).toBeInstanceOf(Array);
        expect(all.length).toBeGreaterThan(0);
    });

    it("getById returns correct vehicle", () => {
        const v = vehicleService.getById("V001");
        expect(v).toBeDefined();
        expect(v!.plate).toBe("NAR-123");
    });

    it("getById returns undefined for non-existent", () => {
        const v = vehicleService.getById("NONEXISTENT");
        expect(v).toBeUndefined();
    });
});

// ===== ROUTE SERVICE TESTS =====
describe("routeService", () => {
    it("getAll returns all routes without filters", () => {
        const all = routeService.getAll();
        expect(all).toBeInstanceOf(Array);
        expect(all.length).toBeGreaterThan(0);
    });

    it("getAll filters by vehicleId", () => {
        const filtered = routeService.getAll({ vehicleId: "V001" });
        filtered.forEach((r) => {
            expect(r.vehicleId).toBe("V001");
        });
    });

    it("getAll filters by dateFrom", () => {
        const filtered = routeService.getAll({ dateFrom: "2026-02-10" });
        filtered.forEach((r) => {
            expect(r.date >= "2026-02-10").toBe(true);
        });
    });

    it("getAll filters by dateTo", () => {
        const filtered = routeService.getAll({ dateTo: "2026-02-10" });
        filtered.forEach((r) => {
            expect(r.date <= "2026-02-10").toBe(true);
        });
    });

    it("getAll with combined filters", () => {
        const filtered = routeService.getAll({ vehicleId: "V001", dateFrom: "2026-02-10", dateTo: "2026-02-10" });
        filtered.forEach((r) => {
            expect(r.vehicleId).toBe("V001");
            expect(r.date).toBe("2026-02-10");
        });
    });

    it("getById returns correct route", () => {
        const r = routeService.getById("R001");
        expect(r).toBeDefined();
        expect(r!.origin).toBe("Pasto");
        expect(r!.destination).toBe("Cali");
    });

    it("getById returns undefined for non-existent", () => {
        const r = routeService.getById("NONEXISTENT");
        expect(r).toBeUndefined();
    });
});

// ===== GEOFENCE SERVICE TESTS =====
describe("geofenceService", () => {
    it("getAll returns geofences", () => {
        const all = geofenceService.getAll();
        expect(all).toBeInstanceOf(Array);
        expect(all.length).toBeGreaterThan(0);
    });

    it("create adds a new geofence with generated id", () => {
        const before = geofenceService.getAll().length;
        const created = geofenceService.create({
            name: "Test Zone",
            type: "circle",
            active: true,
            lat: 1.0,
            lng: -77.0,
            radiusM: 500,
        });
        expect(created.id).toBeTruthy();
        expect(created.name).toBe("Test Zone");
        expect(created.createdAt).toBeTruthy();
        expect(geofenceService.getAll().length).toBe(before + 1);
    });

    it("update modifies an existing geofence", () => {
        const all = geofenceService.getAll();
        const target = all[0];
        const updated = geofenceService.update(target.id, { name: "Updated Name" });
        expect(updated).not.toBeNull();
        expect(updated!.name).toBe("Updated Name");
    });

    it("update returns null for non-existent", () => {
        const result = geofenceService.update("NONEXISTENT", { name: "Nope" });
        expect(result).toBeNull();
    });

    it("delete removes a geofence", () => {
        const all = geofenceService.getAll();
        const target = all[all.length - 1];
        const before = all.length;
        const result = geofenceService.delete(target.id);
        expect(result).toBe(true);
        expect(geofenceService.getAll().length).toBe(before - 1);
    });

    it("delete returns false for non-existent", () => {
        const result = geofenceService.delete("NONEXISTENT");
        expect(result).toBe(false);
    });
});

// ===== FUEL SERVICE TESTS =====
describe("fuelService", () => {
    it("getAll returns fuel records", () => {
        const all = fuelService.getAll();
        expect(all).toBeInstanceOf(Array);
        expect(all.length).toBeGreaterThan(0);
    });

    it("getAll filters by vehicleId", () => {
        const filtered = fuelService.getAll({ vehicleId: "V001" });
        filtered.forEach((f) => {
            expect(f.vehicleId).toBe("V001");
        });
        expect(filtered.length).toBeGreaterThan(0);
    });

    it("getStats returns valid aggregation", () => {
        const stats = fuelService.getStats();
        expect(typeof stats.avg).toBe("number");
        expect(typeof stats.max).toBe("number");
        expect(typeof stats.min).toBe("number");
        expect(stats.avg).toBeGreaterThan(0);
        expect(stats.max).toBeGreaterThanOrEqual(stats.avg);
        expect(stats.min).toBeLessThanOrEqual(stats.avg);
    });

    it("getStats with vehicleId returns vehicle-specific stats", () => {
        const statsV1 = fuelService.getStats("V001");
        const statsV4 = fuelService.getStats("V004");
        // V004 is a tanker truck with higher base consumption
        expect(statsV4.avg).toBeGreaterThan(statsV1.avg);
    });

    it("getStats with non-existent vehicle returns zeros", () => {
        const stats = fuelService.getStats("NONEXISTENT");
        expect(stats.avg).toBe(0);
        expect(stats.max).toBe(0);
        expect(stats.min).toBe(0);
    });
});

// ===== ALERT SERVICE TESTS =====
describe("alertService", () => {
    it("getAll returns alerts", () => {
        const all = alertService.getAll();
        expect(all).toBeInstanceOf(Array);
        expect(all.length).toBeGreaterThan(0);
    });

    it("getByVehicle filters correctly", () => {
        const filtered = alertService.getByVehicle("V004");
        filtered.forEach((a) => {
            expect(a.vehicleId).toBe("V004");
        });
        expect(filtered.length).toBeGreaterThan(0);
    });

    it("getByVehicle returns empty for vehicle without alerts", () => {
        const filtered = alertService.getByVehicle("V003");
        expect(filtered).toEqual([]);
    });
});
