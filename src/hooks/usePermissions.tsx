import { useAuth } from "@/hooks/useAuth";
import type { ReactNode } from "react";

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

// eslint-disable-next-line react-refresh/only-export-components -- usePermissions is co-located with Can component intentionally
export function usePermissions() {
  const { role } = useAuth();

  const can = (permission: string): boolean => {
    if (!role) return false;
    const perms = PERMISSION_MAP[role] || [];
    return matchPermission(perms, permission);
  };

  const canAny = (...permissions: string[]): boolean => {
    return permissions.some(p => can(p));
  };

  return { can, canAny, role };
}

interface CanProps {
  do: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export const Can = ({ do: permission, children, fallback = null }: CanProps) => {
  const { can } = usePermissions();
  return can(permission) ? <>{children}</> : <>{fallback}</>;
};
