import { assertEquals, assertExists, assert } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import {
  CreateOrderSchema,
  CreateTripSchema,
  CreateWorkOrderSchema,
  CreateVehicleSchema,
  AcknowledgeAlertSchema,
} from "./schemas.ts";
import { validateRequest, ValidationError, sanitizeHtml } from "./validation.ts";

// ============================================================================
// ORDER SCHEMA TESTS
// ============================================================================

Deno.test("CreateOrderSchema - accepts valid input", () => {
  const validOrder = {
    client_id: "123e4567-e89b-12d3-a456-426614174000",
    items: [
      {
        product_id: "223e4567-e89b-12d3-a456-426614174000",
        quantity: 5,
        unit_price: 1500.50,
      },
    ],
    delivery_address: "Calle 123 #45-67, Bogotá, Colombia",
  };

  const result = validateRequest(CreateOrderSchema, validOrder);
  assertExists(result);
  assertEquals(result.client_id, validOrder.client_id);
  assertEquals(result.items.length, 1);
});

Deno.test("CreateOrderSchema - REJECTS unknown fields (mass assignment protection)", () => {
  const maliciousOrder = {
    client_id: "123e4567-e89b-12d3-a456-426614174000",
    items: [
      {
        product_id: "223e4567-e89b-12d3-a456-426614174000",
        quantity: 5,
        unit_price: 1500.50,
      },
    ],
    delivery_address: "Calle 123 #45-67, Bogotá",
    // ❌ ATTACK: Injecting server-side fields
    tenant_id: "00000000-0000-0000-0000-000000000000",
    admin: true,
    status: "approved",
    internal_notes: "Bypass approval",
  };

  let error: ValidationError | null = null;
  try {
    validateRequest(CreateOrderSchema, maliciousOrder);
  } catch (e) {
    error = e as ValidationError;
  }

  assertExists(error, "Should throw ValidationError");
  assertEquals(error?.name, "ValidationError");
  assert(error!.issues.length > 0, "Should have validation issues");
});

Deno.test("CreateOrderSchema - rejects invalid UUID", () => {
  const invalidOrder = {
    client_id: "not-a-uuid",
    items: [{ product_id: "also-not-uuid", quantity: 1, unit_price: 100 }],
    delivery_address: "Valid address here",
  };

  let error: ValidationError | null = null;
  try {
    validateRequest(CreateOrderSchema, invalidOrder);
  } catch (e) {
    error = e as ValidationError;
  }

  assertExists(error);
  assert(error!.issues.some(issue => issue.path.includes("client_id")));
});

Deno.test("CreateOrderSchema - rejects negative quantity", () => {
  const invalidOrder = {
    client_id: "123e4567-e89b-12d3-a456-426614174000",
    items: [
      {
        product_id: "223e4567-e89b-12d3-a456-426614174000",
        quantity: -5, // ❌ Negative quantity
        unit_price: 1500.50,
      },
    ],
    delivery_address: "Valid address",
  };

  let error: ValidationError | null = null;
  try {
    validateRequest(CreateOrderSchema, invalidOrder);
  } catch (e) {
    error = e as ValidationError;
  }

  assertExists(error);
  assert(error!.issues.some(issue => issue.path.includes("quantity")));
});

Deno.test("CreateOrderSchema - rejects excessive unit price", () => {
  const invalidOrder = {
    client_id: "123e4567-e89b-12d3-a456-426614174000",
    items: [
      {
        product_id: "223e4567-e89b-12d3-a456-426614174000",
        quantity: 1,
        unit_price: 9999999999, // ❌ Exceeds max
      },
    ],
    delivery_address: "Valid address",
  };

  let error: ValidationError | null = null;
  try {
    validateRequest(CreateOrderSchema, invalidOrder);
  } catch (e) {
    error = e as ValidationError;
  }

  assertExists(error);
});

Deno.test("CreateOrderSchema - rejects empty items array", () => {
  const invalidOrder = {
    client_id: "123e4567-e89b-12d3-a456-426614174000",
    items: [], // ❌ Empty
    delivery_address: "Valid address",
  };

  let error: ValidationError | null = null;
  try {
    validateRequest(CreateOrderSchema, invalidOrder);
  } catch (e) {
    error = e as ValidationError;
  }

  assertExists(error);
});

// ============================================================================
// TRIP SCHEMA TESTS
// ============================================================================

Deno.test("CreateTripSchema - accepts valid input", () => {
  const validTrip = {
    vehicle_id: "123e4567-e89b-12d3-a456-426614174000",
    driver_id: "223e4567-e89b-12d3-a456-426614174000",
    origin: { lat: 4.6097, lng: -74.0817, address: "Bogotá, Colombia" },
    destination: { lat: 6.2442, lng: -75.5812, address: "Medellín, Colombia" },
    scheduled_start: new Date().toISOString(),
  };

  const result = validateRequest(CreateTripSchema, validTrip);
  assertExists(result);
  assertEquals(result.vehicle_id, validTrip.vehicle_id);
});

Deno.test("CreateTripSchema - REJECTS tenant_id injection", () => {
  const maliciousTrip = {
    vehicle_id: "123e4567-e89b-12d3-a456-426614174000",
    driver_id: "223e4567-e89b-12d3-a456-426614174000",
    origin: { lat: 4.6097, lng: -74.0817, address: "Bogotá" },
    destination: { lat: 6.2442, lng: -75.5812, address: "Medellín" },
    scheduled_start: new Date().toISOString(),
    tenant_id: "HACKER-TENANT", // ❌ Should be rejected
  };

  let error: ValidationError | null = null;
  try {
    validateRequest(CreateTripSchema, maliciousTrip);
  } catch (e) {
    error = e as ValidationError;
  }

  assertExists(error);
});

Deno.test("CreateTripSchema - rejects invalid coordinates", () => {
  const invalidTrip = {
    vehicle_id: "123e4567-e89b-12d3-a456-426614174000",
    driver_id: "223e4567-e89b-12d3-a456-426614174000",
    origin: { lat: 200, lng: -74.0817, address: "Invalid" }, // ❌ lat > 90
    destination: { lat: 6.2442, lng: -75.5812, address: "Valid" },
    scheduled_start: new Date().toISOString(),
  };

  let error: ValidationError | null = null;
  try {
    validateRequest(CreateTripSchema, invalidTrip);
  } catch (e) {
    error = e as ValidationError;
  }

  assertExists(error);
  assert(error!.issues.some(issue => issue.path.includes("lat")));
});

// ============================================================================
// WORK ORDER SCHEMA TESTS
// ============================================================================

Deno.test("CreateWorkOrderSchema - accepts valid input", () => {
  const validWorkOrder = {
    vehicle_id: "123e4567-e89b-12d3-a456-426614174000",
    type: "preventive" as const,
    priority: "medium" as const,
    title: "10,000 km maintenance",
    description: "Standard preventive maintenance service including oil change and filter replacement.",
  };

  const result = validateRequest(CreateWorkOrderSchema, validWorkOrder);
  assertExists(result);
  assertEquals(result.type, "preventive");
});

Deno.test("CreateWorkOrderSchema - rejects invalid enum value", () => {
  const invalidWorkOrder = {
    vehicle_id: "123e4567-e89b-12d3-a456-426614174000",
    type: "invalid-type", // ❌ Not in enum
    priority: "medium",
    title: "Test",
    description: "Test description here",
  };

  let error: ValidationError | null = null;
  try {
    validateRequest(CreateWorkOrderSchema, invalidWorkOrder);
  } catch (e) {
    error = e as ValidationError;
  }

  assertExists(error);
});

// ============================================================================
// VEHICLE SCHEMA TESTS
// ============================================================================

Deno.test("CreateVehicleSchema - accepts valid input", () => {
  const validVehicle = {
    plate: "ABC123",
    brand: "Toyota",
    model: "Hilux",
    year: 2023,
    vehicle_type: "truck" as const,
    fuel_type: "diesel" as const,
  };

  const result = validateRequest(CreateVehicleSchema, validVehicle);
  assertExists(result);
  assertEquals(result.plate, "ABC123");
});

Deno.test("CreateVehicleSchema - rejects invalid plate format", () => {
  const invalidVehicle = {
    plate: "abc@123!", // ❌ Invalid characters
    brand: "Toyota",
    model: "Hilux",
    year: 2023,
    vehicle_type: "truck" as const,
    fuel_type: "diesel" as const,
  };

  let error: ValidationError | null = null;
  try {
    validateRequest(CreateVehicleSchema, invalidVehicle);
  } catch (e) {
    error = e as ValidationError;
  }

  assertExists(error);
});

Deno.test("CreateVehicleSchema - rejects future year beyond next year", () => {
  const invalidVehicle = {
    plate: "ABC123",
    brand: "Toyota",
    model: "Hilux",
    year: 2030, // ❌ Too far in future
    vehicle_type: "truck" as const,
    fuel_type: "diesel" as const,
  };

  let error: ValidationError | null = null;
  try {
    validateRequest(CreateVehicleSchema, invalidVehicle);
  } catch (e) {
    error = e as ValidationError;
  }

  assertExists(error);
});

// ============================================================================
// ALERT SCHEMA TESTS
// ============================================================================

Deno.test("AcknowledgeAlertSchema - accepts valid input", () => {
  const validAck = {
    alert_id: "123e4567-e89b-12d3-a456-426614174000",
    notes: "Reviewed and action taken",
  };

  const result = validateRequest(AcknowledgeAlertSchema, validAck);
  assertExists(result);
  assertEquals(result.alert_id, validAck.alert_id);
});

// ============================================================================
// SANITIZATION TESTS
// ============================================================================

Deno.test("sanitizeHtml - escapes HTML characters", () => {
  const input = '<script>alert("XSS")</script>';
  const sanitized = sanitizeHtml(input);
  assertEquals(sanitized, "&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;");
  assert(!sanitized.includes("<script>"), "Should not contain script tags");
});

Deno.test("sanitizeHtml - escapes ampersand", () => {
  const input = "foo & bar";
  const sanitized = sanitizeHtml(input);
  assertEquals(sanitized, "foo &amp; bar");
});

Deno.test("sanitizeHtml - handles multiple special characters", () => {
  const input = `<div onclick="alert('XSS')" data-attr="value">Content</div>`;
  const sanitized = sanitizeHtml(input);
  assert(!sanitized.includes("<div"));
  assert(!sanitized.includes("onclick"));
  assert(sanitized.includes("&lt;"));
  assert(sanitized.includes("&gt;"));
});

// ============================================================================
// EDGE CASE TESTS
// ============================================================================

Deno.test("Schema validation - handles null input", () => {
  let error: ValidationError | null = null;
  try {
    validateRequest(CreateOrderSchema, null);
  } catch (e) {
    error = e as ValidationError;
  }

  assertExists(error, "Should reject null");
});

Deno.test("Schema validation - handles undefined input", () => {
  let error: ValidationError | null = null;
  try {
    validateRequest(CreateOrderSchema, undefined);
  } catch (e) {
    error = e as ValidationError;
  }

  assertExists(error, "Should reject undefined");
});

Deno.test("Schema validation - handles non-object input", () => {
  let error: ValidationError | null = null;
  try {
    validateRequest(CreateOrderSchema, "not an object");
  } catch (e) {
    error = e as ValidationError;
  }

  assertExists(error, "Should reject string");
});

Deno.test("Schema validation - handles array instead of object", () => {
  let error: ValidationError | null = null;
  try {
    validateRequest(CreateOrderSchema, [1, 2, 3]);
  } catch (e) {
    error = e as ValidationError;
  }

  assertExists(error, "Should reject array");
});
