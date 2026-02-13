import { describe, it, expect, vi } from "vitest";

// We test matchPermission logic directly since usePermissions depends on useAuth react context
// Extract the permission matching logic for testability

type AppRole = "super_admin" | "admin" | "manager" | "operator" | "driver" | "client" | "auditor";

const PERMISSION_MAP: Record<AppRole, string[]> = {
    super_admin: ['*'],
    admin: ['monitoring.*', 'fleet.*', 'operations.*', 'control.*', 'compliance.*', 'admin.*', 'reports.*'],
    manager: ['monitoring.*', 'fleet.read', 'operations.read', 'control.read', 'compliance.read', 'reports.*'],
    operator: ['monitoring.*', 'fleet.read', 'operations.read'],
    driver: ['monitoring.own', 'compliance.inspections.own'],
    client: ['monitoring.read', 'reports.read'],
    auditor: ['compliance.*', 'control.audit', 'control.evidence', 'reports.read'],
};

function matchPermission(userPerms: string[], required: string): boolean {
    if (userPerms.includes('*')) return true;
    for (const perm of userPerms) {
        if (perm === required) return true;
        if (perm.endsWith('.*')) {
            const prefix = perm.slice(0, -2);
            if (required.startsWith(prefix)) return true;
        }
    }
    return false;
}

function can(role: AppRole | null, permission: string): boolean {
    if (!role) return false;
    const perms = PERMISSION_MAP[role] || [];
    return matchPermission(perms, permission);
}

function canAny(role: AppRole | null, ...permissions: string[]): boolean {
    return permissions.some(p => can(role, p));
}

// ===== matchPermission unit tests =====
describe("matchPermission", () => {
    it("wildcard '*' matches everything", () => {
        expect(matchPermission(['*'], 'anything')).toBe(true);
        expect(matchPermission(['*'], 'monitoring.read')).toBe(true);
        expect(matchPermission(['*'], 'admin.delete')).toBe(true);
    });

    it("exact match works", () => {
        expect(matchPermission(['monitoring.read'], 'monitoring.read')).toBe(true);
    });

    it("exact match does not match different permission", () => {
        expect(matchPermission(['monitoring.read'], 'monitoring.write')).toBe(false);
    });

    it("glob match (monitoring.*) matches sub-permissions", () => {
        expect(matchPermission(['monitoring.*'], 'monitoring.read')).toBe(true);
        expect(matchPermission(['monitoring.*'], 'monitoring.write')).toBe(true);
        expect(matchPermission(['monitoring.*'], 'monitoring.delete')).toBe(true);
    });

    it("glob match does not cross domain boundaries", () => {
        expect(matchPermission(['monitoring.*'], 'fleet.read')).toBe(false);
    });

    it("empty permissions deny everything", () => {
        expect(matchPermission([], 'monitoring.read')).toBe(false);
    });

    it("multiple permissions — any match is sufficient", () => {
        expect(matchPermission(['fleet.read', 'monitoring.*'], 'monitoring.write')).toBe(true);
    });
});

// ===== Role-based permission tests =====
describe("RBAC — role permissions", () => {
    it("super_admin can do everything", () => {
        expect(can("super_admin", "monitoring.read")).toBe(true);
        expect(can("super_admin", "admin.delete")).toBe(true);
        expect(can("super_admin", "anything.at.all")).toBe(true);
    });

    it("admin can access all domains", () => {
        expect(can("admin", "monitoring.read")).toBe(true);
        expect(can("admin", "fleet.write")).toBe(true);
        expect(can("admin", "operations.read")).toBe(true);
        expect(can("admin", "control.audit")).toBe(true);
        expect(can("admin", "compliance.view")).toBe(true);
        expect(can("admin", "admin.settings")).toBe(true);
        expect(can("admin", "reports.generate")).toBe(true);
    });

    it("manager has limited write access", () => {
        expect(can("manager", "monitoring.read")).toBe(true);
        expect(can("manager", "fleet.read")).toBe(true);
        expect(can("manager", "reports.generate")).toBe(true);
        // manager has fleet.read but NOT fleet.write (not fleet.*)
        expect(can("manager", "fleet.write")).toBe(false);
    });

    it("operator has monitoring + read-only fleet/operations", () => {
        expect(can("operator", "monitoring.read")).toBe(true);
        expect(can("operator", "fleet.read")).toBe(true);
        expect(can("operator", "operations.read")).toBe(true);
        expect(can("operator", "admin.settings")).toBe(false);
        expect(can("operator", "reports.generate")).toBe(false);
    });

    it("driver has very limited permissions", () => {
        expect(can("driver", "monitoring.own")).toBe(true);
        expect(can("driver", "compliance.inspections.own")).toBe(true);
        expect(can("driver", "fleet.read")).toBe(false);
        expect(can("driver", "admin.settings")).toBe(false);
    });

    it("client can only read monitoring and reports", () => {
        expect(can("client", "monitoring.read")).toBe(true);
        expect(can("client", "reports.read")).toBe(true);
        expect(can("client", "fleet.read")).toBe(false);
        expect(can("client", "admin.settings")).toBe(false);
    });

    it("auditor can access compliance and control", () => {
        expect(can("auditor", "compliance.view")).toBe(true);
        expect(can("auditor", "control.audit")).toBe(true);
        expect(can("auditor", "control.evidence")).toBe(true);
        expect(can("auditor", "reports.read")).toBe(true);
        expect(can("auditor", "admin.settings")).toBe(false);
        expect(can("auditor", "fleet.read")).toBe(false);
    });

    it("null role denies everything", () => {
        expect(can(null, "monitoring.read")).toBe(false);
    });
});

// ===== canAny tests =====
describe("canAny", () => {
    it("returns true if any permission matches", () => {
        expect(canAny("operator", "admin.settings", "monitoring.read")).toBe(true);
    });

    it("returns false if no permissions match", () => {
        expect(canAny("driver", "admin.settings", "fleet.write")).toBe(false);
    });

    it("returns false for null role", () => {
        expect(canAny(null, "monitoring.read")).toBe(false);
    });
});
