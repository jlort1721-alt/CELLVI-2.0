import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

/**
 * Request Validation Utilities
 *
 * Security: Reject invalid inputs before they reach the database.
 * All validation errors return 400 with detailed field-level errors.
 */

// ============================================================================
// VALIDATION ERROR CLASS
// ============================================================================

export class ValidationError extends Error {
  constructor(
    public issues: z.ZodIssue[],
    public statusCode = 400
  ) {
    super("Validation failed");
    this.name = "ValidationError";
  }

  toJSON() {
    return {
      error: "Validation failed",
      issues: this.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
        received: (issue as any).received,
      })),
    };
  }
}

// ============================================================================
// VALIDATION FUNCTION
// ============================================================================

/**
 * Validates request data against a Zod schema.
 *
 * @param schema - Zod schema to validate against
 * @param data - Untrusted input data
 * @returns Validated and typed data
 * @throws ValidationError if validation fails
 *
 * @example
 * const validatedOrder = validateRequest(CreateOrderSchema, await req.json());
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new ValidationError(result.error.issues);
  }

  return result.data;
}

// ============================================================================
// SANITIZATION UTILITIES
// ============================================================================

/**
 * Sanitizes string input to prevent XSS attacks.
 * Use for user-facing text that will be rendered in HTML.
 *
 * @param input - Raw string input
 * @returns Sanitized string with HTML entities escaped
 */
export function sanitizeHtml(input: string): string {
  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };
  return input.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char);
}

/**
 * Strips potential SQL injection characters (defense in depth).
 * Note: Supabase uses prepared statements, but this adds extra safety.
 */
export function sanitizeSql(input: string): string {
  return input.replace(/[;'"\\]/g, "");
}

/**
 * Normalizes whitespace and trims string
 */
export function normalizeString(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

// ============================================================================
// ERROR RESPONSE FORMATTERS
// ============================================================================

/**
 * Formats validation error for consistent API responses
 */
export function formatValidationError(error: ValidationError): object {
  return error.toJSON();
}

/**
 * Creates a standard error response
 */
export function createErrorResponse(
  message: string,
  statusCode: number,
  details?: Record<string, unknown>
): Response {
  return new Response(
    JSON.stringify({
      error: message,
      ...details,
    }),
    {
      status: statusCode,
      headers: { "content-type": "application/json" },
    }
  );
}

/**
 * Creates a standard success response
 */
export function createSuccessResponse<T>(
  data: T,
  statusCode = 200
): Response {
  return new Response(
    JSON.stringify({ data }),
    {
      status: statusCode,
      headers: { "content-type": "application/json" },
    }
  );
}

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

/**
 * Higher-order function that wraps a handler with validation
 *
 * @example
 * const createOrderHandler = withValidation(
 *   CreateOrderSchema,
 *   async (validatedData, req) => {
 *     // validatedData is fully typed and validated
 *     return createSuccessResponse(validatedData);
 *   }
 * );
 */
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (validatedData: T, req: Request) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    try {
      const rawBody = await req.json();
      const validatedData = validateRequest(schema, rawBody);
      return await handler(validatedData, req);
    } catch (error) {
      if (error instanceof ValidationError) {
        return new Response(
          JSON.stringify(formatValidationError(error)),
          {
            status: 400,
            headers: { "content-type": "application/json" },
          }
        );
      }
      throw error; // Re-throw non-validation errors
    }
  };
}
