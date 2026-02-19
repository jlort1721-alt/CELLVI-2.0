/**
 * Shared type definitions used across the application.
 * Consolidates types that were previously duplicated in multiple files.
 */

/** Application roles for RBAC authorization. */
export type AppRole =
  | "super_admin"
  | "admin"
  | "manager"
  | "operator"
  | "driver"
  | "client"
  | "auditor";

/** Real-time vehicle position from telemetry feed. */
export interface VehiclePosition {
  vehicle_id: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  engine_on: boolean | null;
  fuel_level: number | null;
  ts: string;
}

/** Vehicle operational status. */
export type VehicleStatus = "activo" | "detenido" | "alerta" | "apagado";

/** Browser event for PWA install prompt (Chrome/Edge). */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}
