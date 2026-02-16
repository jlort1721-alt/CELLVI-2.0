/**
 * API Gateway Router
 *
 * Modular route matching and dispatch system
 * Replaces monolithic if/else routing with clean handler-based architecture
 */

export interface RouteMatch {
  handler: RouteHandler;
  params: Record<string, string>;
}

export type RouteHandler = (
  req: Request,
  params: Record<string, string>,
  context: RouteContext
) => Promise<Response>;

export interface RouteContext {
  tenantId: string;
  supabase: any; // SupabaseClient type
  url: URL;
}

interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

// ============================================================================
// ROUTER CLASS
// ============================================================================

export class Router {
  private routes: Route[] = [];

  /**
   * Registers a route with the router
   *
   * @param method - HTTP method (GET, POST, PATCH, DELETE)
   * @param path - Path pattern with :params (e.g., "/vehicles/:id")
   * @param handler - Handler function
   */
  register(method: string, path: string, handler: RouteHandler): void {
    const { pattern, paramNames } = this.compilePattern(path);

    this.routes.push({
      method: method.toUpperCase(),
      pattern,
      paramNames,
      handler,
    });
  }

  /**
   * Convenience methods for HTTP verbs
   */
  get(path: string, handler: RouteHandler): void {
    this.register("GET", path, handler);
  }

  post(path: string, handler: RouteHandler): void {
    this.register("POST", path, handler);
  }

  patch(path: string, handler: RouteHandler): void {
    this.register("PATCH", path, handler);
  }

  put(path: string, handler: RouteHandler): void {
    this.register("PUT", path, handler);
  }

  delete(path: string, handler: RouteHandler): void {
    this.register("DELETE", path, handler);
  }

  /**
   * Matches a request to a route and extracts parameters
   *
   * @param method - HTTP method
   * @param path - Request path
   * @returns RouteMatch or null if no match found
   */
  match(method: string, path: string): RouteMatch | null {
    const normalizedMethod = method.toUpperCase();

    for (const route of this.routes) {
      if (route.method !== normalizedMethod) continue;

      const match = path.match(route.pattern);
      if (!match) continue;

      // Extract parameters from regex groups
      const params: Record<string, string> = {};
      for (let i = 0; i < route.paramNames.length; i++) {
        params[route.paramNames[i]] = match[i + 1];
      }

      return {
        handler: route.handler,
        params,
      };
    }

    return null;
  }

  /**
   * Handles a request by matching to a route and executing handler
   *
   * @param req - Request object
   * @param context - Route context (tenantId, supabase client, etc.)
   * @returns Response from handler or 404
   */
  async handle(req: Request, context: RouteContext): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname.replace("/api-gateway", "");
    const method = req.method;

    const routeMatch = this.match(method, path);

    if (!routeMatch) {
      return this.notFoundResponse(method, path);
    }

    try {
      return await routeMatch.handler(req, routeMatch.params, context);
    } catch (error) {
      console.error(`Route handler error [${method} ${path}]:`, error);
      throw error; // Re-throw to be caught by main error handler
    }
  }

  /**
   * Compiles a path pattern into a regex and extracts parameter names
   *
   * @param path - Path pattern (e.g., "/vehicles/:id/status")
   * @returns Compiled regex and parameter names
   */
  private compilePattern(path: string): { pattern: RegExp; paramNames: string[] } {
    const paramNames: string[] = [];

    // Replace :param with capture group and collect param names
    const regexPattern = path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, paramName) => {
      paramNames.push(paramName);
      return "([^/]+)"; // Match anything except /
    });

    // Exact match with optional trailing slash
    const pattern = new RegExp(`^${regexPattern}/?$`);

    return { pattern, paramNames };
  }

  /**
   * Generates 404 response with available endpoints
   */
  private notFoundResponse(method: string, path: string): Response {
    const availableEndpoints = this.routes.map(
      (r) => `${r.method} ${this.patternToPath(r.pattern, r.paramNames)}`
    );

    return new Response(
      JSON.stringify({
        error: "Endpoint not found",
        method,
        path,
        availableEndpoints,
      }),
      {
        status: 404,
        headers: { "content-type": "application/json" },
      }
    );
  }

  /**
   * Converts regex pattern back to human-readable path
   */
  private patternToPath(pattern: RegExp, paramNames: string[]): string {
    let path = pattern.source
      .replace(/^\^/, "")
      .replace(/\/\?\$$/, "");

    // Replace capture groups with :param
    let paramIndex = 0;
    path = path.replace(/\(\[\^\/\]\+\)/g, () => {
      const paramName = paramNames[paramIndex++];
      return `:${paramName}`;
    });

    return path;
  }

  /**
   * Lists all registered routes (useful for debugging)
   */
  listRoutes(): string[] {
    return this.routes.map(
      (r) => `${r.method} ${this.patternToPath(r.pattern, r.paramNames)}`
    );
  }
}

/**
 * Creates a new router instance with all routes registered
 */
export function createRouter(): Router {
  return new Router();
}
