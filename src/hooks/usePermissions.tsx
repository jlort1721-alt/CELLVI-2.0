import { useAuth } from "@/hooks/useAuth";
import { ReactNode } from "react";

type AppRole = "super_admin" | "admin" | "manager" | "operator" | "driver" | "client" | "auditor";

/**
 * Permission mapping for each role
 * Defines what permissions each role has access to
 */
const ROLE_PERMISSIONS: Record<AppRole, string[]> = {
  super_admin: ["*"], // Can do anything

  admin: [
    "monitoring.read",
    "monitoring.alerts",
    "fleet.read",
    "operations.read",
    "control.read",
    "control.evidence",
    "control.audit",
    "reports.read",
    "compliance.read",
    "admin.billing",
    "admin.users",
    "asegurar_ia.view",
    "ai.route_optimizer",
    "ai.fatigue_detection",
    "ai.chatbot",
  ],

  manager: [
    "monitoring.read",
    "monitoring.alerts",
    "fleet.read",
    "operations.read",
    "control.read",
    "reports.read",
    "compliance.read",
    "asegurar_ia.view",
    "ai.route_optimizer",
    "ai.fatigue_detection",
    "ai.chatbot",
  ],

  operator: [
    "monitoring.read",
    "monitoring.alerts",
    "fleet.read",
    "operations.read",
    "control.read",
    "reports.read",
    "ai.route_optimizer",
    "ai.fatigue_detection",
    "ai.chatbot",
  ],

  auditor: [
    "monitoring.read",
    "compliance.read",
    "control.audit",
    "reports.read",
  ],

  client: [
    "monitoring.read",
    "reports.read",
  ],

  driver: [
    "monitoring.own", // Can only see their own data
  ],
};

/**
 * Hook to check user permissions based on their role
 * @returns Object with permission checking functions
 */
export const usePermissions = () => {
  const { role } = useAuth();

  /**
   * Check if user has a specific permission
   * @param permission - Permission string to check (e.g., "monitoring.read")
   * @returns true if user has permission, false otherwise
   */
  const can = (permission: string): boolean => {
    if (!role) return false;

    const permissions = ROLE_PERMISSIONS[role];
    if (!permissions) return false;

    // Super admin can do anything
    if (permissions.includes("*")) return true;

    // Check exact permission match
    return permissions.includes(permission);
  };

  /**
   * Check if user has ANY of the provided permissions
   * @param permissions - Array of permission strings to check
   * @returns true if user has at least one permission, false otherwise
   */
  const canAny = (...permissions: string[]): boolean => {
    return permissions.some((permission) => can(permission));
  };

  /**
   * Check if user has ALL of the provided permissions
   * @param permissions - Array of permission strings to check
   * @returns true if user has all permissions, false otherwise
   */
  const canAll = (...permissions: string[]): boolean => {
    return permissions.every((permission) => can(permission));
  };

  return { can, canAny, canAll };
};

/**
 * Component for conditional rendering based on permissions
 * Renders children only if user has the required permission
 */
interface CanProps {
  do: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export const Can = ({ do: permission, children, fallback = null }: CanProps) => {
  const { can } = usePermissions();

  if (can(permission)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};
