import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

/**
 * API Gateway Request Schemas
 *
 * Security Requirements:
 * - All schemas use .strict() to reject unknown fields (mass assignment protection)
 * - tenant_id is NEVER accepted from client (injected server-side only)
 * - UUIDs validated, coordinates bounded, strings limited
 * - Enums for controlled values
 */

// ============================================================================
// BASE SCHEMAS
// ============================================================================

const UUIDSchema = z.string().uuid({ message: "Invalid UUID format" });

const TimestampSchema = z.string().datetime().or(z.date());

const CoordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().min(5).max(300),
});

// ============================================================================
// ORDER SCHEMAS
// ============================================================================

export const CreateOrderSchema = z.object({
  client_id: UUIDSchema,
  items: z.array(z.object({
    product_id: UUIDSchema,
    quantity: z.number().int().positive().max(10000),
    unit_price: z.number().positive().max(1000000000),
  })).min(1).max(100),
  delivery_address: z.string().min(10).max(500),
  delivery_date: TimestampSchema.optional(),
  notes: z.string().max(1000).optional(),
}).strict(); // ⚠️ CRITICAL: Reject unknown keys

// ============================================================================
// TRIP SCHEMAS
// ============================================================================

export const CreateTripSchema = z.object({
  vehicle_id: UUIDSchema,
  driver_id: UUIDSchema,
  origin: CoordinatesSchema,
  destination: CoordinatesSchema,
  scheduled_start: TimestampSchema,
  scheduled_end: TimestampSchema.optional(),
  cargo_type: z.enum(['general', 'refrigerated', 'hazmat', 'fragile']).optional(),
  cargo_weight_kg: z.number().positive().max(50000).optional(),
  cargo_description: z.string().max(500).optional(),
  estimated_distance_km: z.number().positive().max(10000).optional(),
}).strict();

export const UpdateTripStatusSchema = z.object({
  trip_id: UUIDSchema,
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']),
  notes: z.string().max(1000).optional(),
}).strict();

// ============================================================================
// WORK ORDER SCHEMAS
// ============================================================================

export const CreateWorkOrderSchema = z.object({
  vehicle_id: UUIDSchema,
  type: z.enum(['preventive', 'corrective', 'inspection', 'emergency']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  estimated_cost: z.number().positive().max(100000000).optional(),
  estimated_hours: z.number().positive().max(1000).optional(),
  scheduled_date: TimestampSchema.optional(),
  assigned_technician_id: UUIDSchema.optional(),
}).strict();

export const UpdateWorkOrderSchema = z.object({
  work_order_id: UUIDSchema,
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  actual_cost: z.number().positive().max(100000000).optional(),
  actual_hours: z.number().positive().max(1000).optional(),
  completion_notes: z.string().max(2000).optional(),
}).strict();

// ============================================================================
// ALERT SCHEMAS
// ============================================================================

export const AcknowledgeAlertSchema = z.object({
  alert_id: UUIDSchema,
  acknowledged_by: UUIDSchema.optional(), // Will be set server-side from auth
  notes: z.string().max(1000).optional(),
}).strict();

export const CreateAlertSchema = z.object({
  vehicle_id: UUIDSchema,
  type: z.enum(['speed', 'geofence', 'battery', 'gnss_jamming', 'unauthorized_door', 'maintenance', 'fuel', 'temperature']),
  severity: z.enum(['info', 'warning', 'critical']),
  message: z.string().min(5).max(500),
  metadata: z.record(z.unknown()).optional(),
}).strict();

// ============================================================================
// VEHICLE SCHEMAS
// ============================================================================

export const CreateVehicleSchema = z.object({
  plate: z.string().min(3).max(20).regex(/^[A-Z0-9-]+$/, "Invalid plate format"),
  vin: z.string().min(17).max(17).optional(),
  brand: z.string().min(2).max(50),
  model: z.string().min(1).max(50),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  color: z.string().max(30).optional(),
  vehicle_type: z.enum(['car', 'truck', 'van', 'motorcycle', 'bus']),
  fuel_type: z.enum(['gasoline', 'diesel', 'electric', 'hybrid', 'gas']),
  capacity_kg: z.number().positive().max(100000).optional(),
  capacity_m3: z.number().positive().max(1000).optional(),
}).strict();

export const UpdateVehicleSchema = z.object({
  vehicle_id: UUIDSchema,
  plate: z.string().min(3).max(20).regex(/^[A-Z0-9-]+$/).optional(),
  color: z.string().max(30).optional(),
  status: z.enum(['active', 'inactive', 'maintenance', 'decommissioned']).optional(),
  odometer_km: z.number().nonnegative().max(10000000).optional(),
  last_maintenance_date: TimestampSchema.optional(),
}).strict();

// ============================================================================
// DRIVER SCHEMAS
// ============================================================================

export const CreateDriverSchema = z.object({
  first_name: z.string().min(2).max(100),
  last_name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  phone: z.string().min(7).max(20).regex(/^[+\d\s()-]+$/, "Invalid phone format"),
  license_number: z.string().min(5).max(50),
  license_expiry: TimestampSchema,
  license_type: z.string().max(20).optional(),
  emergency_contact_name: z.string().max(200).optional(),
  emergency_contact_phone: z.string().max(20).optional(),
}).strict();

// ============================================================================
// GEOFENCE SCHEMAS
// ============================================================================

export const CreateGeofenceSchema = z.object({
  name: z.string().min(3).max(200),
  type: z.enum(['safe_zone', 'restricted', 'customer_site', 'depot', 'service_area']),
  center: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  radius_meters: z.number().positive().max(100000),
  polygon: z.array(z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  })).optional(),
  active: z.boolean().optional().default(true),
}).strict();

// ============================================================================
// INVENTORY SCHEMAS (Maintenance Parts)
// ============================================================================

export const CreateInventoryItemSchema = z.object({
  part_number: z.string().min(1).max(100),
  name: z.string().min(3).max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(['engine', 'transmission', 'brakes', 'electrical', 'body', 'tires', 'fluids', 'filters', 'other']),
  unit_cost: z.number().positive().max(10000000),
  quantity: z.number().int().nonnegative().max(1000000),
  minimum_stock: z.number().int().nonnegative().max(100000),
  supplier: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
}).strict();

export const UpdateInventoryItemSchema = z.object({
  item_id: UUIDSchema,
  quantity: z.number().int().nonnegative().max(1000000).optional(),
  unit_cost: z.number().positive().max(10000000).optional(),
  location: z.string().max(200).optional(),
}).strict();

// ============================================================================
// FUEL LOG SCHEMAS
// ============================================================================

export const CreateFuelLogSchema = z.object({
  vehicle_id: UUIDSchema,
  driver_id: UUIDSchema.optional(),
  liters: z.number().positive().max(10000),
  cost_per_liter: z.number().positive().max(100000),
  total_cost: z.number().positive().max(10000000),
  odometer_km: z.number().positive().max(10000000),
  station_name: z.string().max(200).optional(),
  receipt_number: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
}).strict();

// ============================================================================
// SCHEMA REGISTRY
// ============================================================================

export const schemas = {
  // Orders
  'POST /orders': CreateOrderSchema,

  // Trips
  'POST /trips': CreateTripSchema,
  'PATCH /trips/:id/status': UpdateTripStatusSchema,

  // Work Orders
  'POST /work-orders': CreateWorkOrderSchema,
  'PATCH /work-orders/:id': UpdateWorkOrderSchema,

  // Alerts
  'POST /alerts': CreateAlertSchema,
  'PATCH /alerts/:id/acknowledge': AcknowledgeAlertSchema,

  // Vehicles
  'POST /vehicles': CreateVehicleSchema,
  'PATCH /vehicles/:id': UpdateVehicleSchema,

  // Drivers
  'POST /drivers': CreateDriverSchema,

  // Geofences
  'POST /geofences': CreateGeofenceSchema,

  // Inventory
  'POST /inventory': CreateInventoryItemSchema,
  'PATCH /inventory/:id': UpdateInventoryItemSchema,

  // Fuel Logs
  'POST /fuel-logs': CreateFuelLogSchema,
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type CreateTripInput = z.infer<typeof CreateTripSchema>;
export type UpdateTripStatusInput = z.infer<typeof UpdateTripStatusSchema>;
export type CreateWorkOrderInput = z.infer<typeof CreateWorkOrderSchema>;
export type UpdateWorkOrderInput = z.infer<typeof UpdateWorkOrderSchema>;
export type AcknowledgeAlertInput = z.infer<typeof AcknowledgeAlertSchema>;
export type CreateAlertInput = z.infer<typeof CreateAlertSchema>;
export type CreateVehicleInput = z.infer<typeof CreateVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof UpdateVehicleSchema>;
export type CreateDriverInput = z.infer<typeof CreateDriverSchema>;
export type CreateGeofenceInput = z.infer<typeof CreateGeofenceSchema>;
export type CreateInventoryItemInput = z.infer<typeof CreateInventoryItemSchema>;
export type UpdateInventoryItemInput = z.infer<typeof UpdateInventoryItemSchema>;
export type CreateFuelLogInput = z.infer<typeof CreateFuelLogSchema>;
