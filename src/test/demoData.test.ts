import { describe, it, expect } from "vitest";
import {
    vehicles,
    routeRecords,
    geofences,
    fuelRecords,
    alerts,
    type Vehicle,
    type RouteRecord,
    type Geofence,
    type FuelRecord,
    type Alert,
} from "@/lib/demoData";

// ===== VEHICLE DATA TESTS =====
describe("demoData — vehicles", () => {
    it("should export a non-empty array of vehicles", () => {
        expect(vehicles).toBeInstanceOf(Array);
        expect(vehicles.length).toBeGreaterThan(0);
    });

    it("each vehicle has required fields", () => {
        vehicles.forEach((v: Vehicle) => {
            expect(v.id).toBeTruthy();
            expect(v.plate).toMatch(/^[A-Z]{3}-\d{3}$/);
            expect(v.driver).toBeTruthy();
            expect(["activo", "detenido", "alerta", "apagado"]).toContain(v.status);
            expect(v.speed).toBeGreaterThanOrEqual(0);
            expect(v.fuel).toBeGreaterThanOrEqual(0);
            expect(v.fuel).toBeLessThanOrEqual(100);
            expect(v.battery).toBeGreaterThanOrEqual(0);
            expect(v.battery).toBeLessThanOrEqual(100);
            expect(typeof v.lat).toBe("number");
            expect(typeof v.lng).toBe("number");
            expect(typeof v.engineOn).toBe("boolean");
            expect(typeof v.locked).toBe("boolean");
            expect(v.km).toBeGreaterThanOrEqual(0);
        });
    });

    it("all vehicle IDs are unique", () => {
        const ids = vehicles.map((v) => v.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("all plates are unique", () => {
        const plates = vehicles.map((v) => v.plate);
        expect(new Set(plates).size).toBe(plates.length);
    });

    it("stopped vehicles have speed 0", () => {
        vehicles
            .filter((v) => v.status === "detenido" || v.status === "apagado")
            .forEach((v) => {
                expect(v.speed).toBe(0);
            });
    });

    it("coordinates are within Colombia bounds", () => {
        vehicles.forEach((v) => {
            expect(v.lat).toBeGreaterThanOrEqual(-4.5);
            expect(v.lat).toBeLessThanOrEqual(13.0);
            expect(v.lng).toBeGreaterThanOrEqual(-82.0);
            expect(v.lng).toBeLessThanOrEqual(-66.0);
        });
    });
});

// ===== ROUTE RECORDS TESTS =====
describe("demoData — routeRecords", () => {
    it("should export a non-empty array", () => {
        expect(routeRecords).toBeInstanceOf(Array);
        expect(routeRecords.length).toBeGreaterThan(0);
    });

    it("each route has required fields", () => {
        routeRecords.forEach((r: RouteRecord) => {
            expect(r.id).toBeTruthy();
            expect(r.vehicleId).toBeTruthy();
            expect(r.plate).toBeTruthy();
            expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(r.origin).toBeTruthy();
            expect(r.destination).toBeTruthy();
            expect(r.distanceKm).toBeGreaterThan(0);
            expect(r.durationMin).toBeGreaterThan(0);
            expect(r.stops).toBeGreaterThanOrEqual(0);
            expect(r.fuelUsedL).toBeGreaterThan(0);
            expect(r.events).toBeInstanceOf(Array);
            expect(r.events.length).toBeGreaterThan(0);
        });
    });

    it("route events have valid types", () => {
        const validTypes = ["start", "stop", "speeding", "geofence_enter", "geofence_exit", "fuel_drop", "end"];
        routeRecords.forEach((r) => {
            r.events.forEach((e) => {
                expect(validTypes).toContain(e.type);
                expect(e.description).toBeTruthy();
                expect(typeof e.lat).toBe("number");
                expect(typeof e.lng).toBe("number");
            });
        });
    });

    it("all route IDs are unique", () => {
        const ids = routeRecords.map((r) => r.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("vehicleIds reference existing vehicles", () => {
        const vehicleIds = new Set(vehicles.map((v) => v.id));
        routeRecords.forEach((r) => {
            expect(vehicleIds.has(r.vehicleId)).toBe(true);
        });
    });
});

// ===== GEOFENCES TESTS =====
describe("demoData — geofences", () => {
    it("should export a non-empty array", () => {
        expect(geofences).toBeInstanceOf(Array);
        expect(geofences.length).toBeGreaterThan(0);
    });

    it("each geofence has required fields", () => {
        geofences.forEach((g: Geofence) => {
            expect(g.id).toBeTruthy();
            expect(g.name).toBeTruthy();
            expect(["circle", "polygon"]).toContain(g.type);
            expect(typeof g.active).toBe("boolean");
            expect(typeof g.lat).toBe("number");
            expect(typeof g.lng).toBe("number");
            expect(g.radiusM).toBeGreaterThan(0);
            expect(g.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });

    it("all geofence IDs are unique", () => {
        const ids = geofences.map((g) => g.id);
        expect(new Set(ids).size).toBe(ids.length);
    });
});

// ===== FUEL RECORDS TESTS =====
describe("demoData — fuelRecords", () => {
    it("should export a non-empty array", () => {
        expect(fuelRecords).toBeInstanceOf(Array);
        expect(fuelRecords.length).toBeGreaterThan(0);
    });

    it("each fuel record has valid consumption values", () => {
        fuelRecords.forEach((f: FuelRecord) => {
            expect(f.consumptionLPer100Km).toBeGreaterThan(0);
            expect(f.consumptionLPer100Km).toBeLessThan(100);
            expect(f.totalLiters).toBeGreaterThanOrEqual(0);
            expect(f.distanceKm).toBeGreaterThan(0);
            expect(f.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(f.vehicleId).toBeTruthy();
            expect(f.plate).toBeTruthy();
        });
    });

    it("generates 30 days × 4 vehicles = 120 records", () => {
        expect(fuelRecords.length).toBe(120);
    });
});

// ===== ALERTS TESTS =====
describe("demoData — alerts", () => {
    it("should export a non-empty array", () => {
        expect(alerts).toBeInstanceOf(Array);
        expect(alerts.length).toBeGreaterThan(0);
    });

    it("each alert has required fields", () => {
        alerts.forEach((a: Alert) => {
            expect(a.id).toBeTruthy();
            expect(a.vehicleId).toBeTruthy();
            expect(a.plate).toBeTruthy();
            expect(a.type).toBeTruthy();
            expect(a.message).toBeTruthy();
            expect(a.timestamp).toBeTruthy();
            expect(["low", "medium", "high"]).toContain(a.severity);
        });
    });

    it("all alert IDs are unique", () => {
        const ids = alerts.map((a) => a.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("alert vehicleIds reference existing vehicles", () => {
        const vehicleIds = new Set(vehicles.map((v) => v.id));
        alerts.forEach((a) => {
            expect(vehicleIds.has(a.vehicleId)).toBe(true);
        });
    });
});
