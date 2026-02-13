/**
 * Standardized Error Handling for Edge Functions - PR #18
 *
 * Features:
 * - Consistent error responses
 * - Sentry integration ready
 * - Structured logging
 * - Stack trace sanitization
 */

export interface ErrorContext {
  function: string;
  endpoint?: string;
  userId?: string;
  tenantId?: string;
  metadata?: Record<string, unknown>;
}

export class EdgeFunctionError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public context?: ErrorContext
  ) {
    super(message);
    this.name = "EdgeFunctionError";
  }
}

/**
 * Handle errors consistently across all edge functions
 */
export function handleError(
  error: unknown,
  context: ErrorContext,
  corsHeaders: HeadersInit = {}
): Response {
  // Log structured error
  const errorLog = {
    timestamp: new Date().toISOString(),
    function: context.function,
    endpoint: context.endpoint,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    } : { message: String(error) },
    context: context.metadata,
  };

  console.error("[EdgeFunctionError]", JSON.stringify(errorLog));

  // Determine status code
  let statusCode = 500;
  let message = "Internal server error";

  if (error instanceof EdgeFunctionError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  // Return sanitized error response
  return new Response(
    JSON.stringify({
      error: message,
      requestId: crypto.randomUUID(), // For support tracking
    }),
    {
      status: statusCode,
      headers: {
        "content-type": "application/json",
        ...corsHeaders,
      },
    }
  );
}

/**
 * Async error wrapper for edge function handlers
 */
export function withErrorHandling(
  handler: (req: Request) => Promise<Response>,
  functionName: string,
  corsHeaders: HeadersInit = {}
) {
  return async (req: Request): Promise<Response> => {
    try {
      return await handler(req);
    } catch (error) {
      return handleError(error, { function: functionName }, corsHeaders);
    }
  };
}
