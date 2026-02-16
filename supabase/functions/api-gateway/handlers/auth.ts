import { RouteHandler } from "../router.ts";
import { createErrorResponse, createSuccessResponse } from "../validation.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

/**
 * Auth Wrapper Handlers
 *
 * Wraps Supabase Auth with additional functionality:
 * - Audit logging
 * - Rate limiting
 * - Tenant initialization
 * - Session management
 *
 * Endpoints:
 * - POST /auth/login - Email/password login
 * - POST /auth/register - User registration with tenant setup
 * - POST /auth/refresh - Refresh JWT token
 * - POST /auth/logout - Logout with cleanup
 */

// ============================================================================
// SCHEMAS
// ============================================================================

const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  remember_me: z.boolean().optional().default(false),
}).strict();

const RegisterSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  full_name: z.string().min(2).max(100),
  company_name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number").optional(),
  plan_id: z.string().uuid().optional(), // If registering directly to a paid plan
}).strict();

const RefreshTokenSchema = z.object({
  refresh_token: z.string().min(1),
}).strict();

// ============================================================================
// POST /auth/login - User login
// ============================================================================

export const login: RouteHandler = async (req, params, context) => {
  const { supabase } = context;

  try {
    const rawBody = await req.json();
    const validationResult = LoginSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          issues: validationResult.error.issues.map((issue: any) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const { email, password, remember_me } = validationResult.data;

    // Attempt login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      // Log failed attempt
      await supabase.from("auth_logs").insert({
        email,
        event_type: "login_failed",
        ip_address: req.headers.get("x-forwarded-for") || "unknown",
        user_agent: req.headers.get("user-agent") || "unknown",
        error_message: authError.message,
        created_at: new Date().toISOString(),
      }).catch(() => {}); // Don't fail login if logging fails

      return createErrorResponse("Invalid credentials", 401, {
        details: authError.message,
      });
    }

    const { user, session } = authData;

    // Get user's tenant information
    const { data: userProfile } = await supabase
      .from("users")
      .select(`
        *,
        tenant:tenants(
          id,
          name,
          status,
          subscription:subscriptions(
            status,
            plan:subscription_plans(name, limits)
          )
        )
      `)
      .eq("id", user.id)
      .single();

    // Check if user's tenant is active
    if (userProfile?.tenant?.status !== "active") {
      return createErrorResponse(
        `Account is ${userProfile?.tenant?.status || "inactive"}. Please contact support.`,
        403
      );
    }

    // Log successful login
    await supabase.from("auth_logs").insert({
      user_id: user.id,
      tenant_id: userProfile?.tenant?.id,
      email,
      event_type: "login_success",
      ip_address: req.headers.get("x-forwarded-for") || "unknown",
      user_agent: req.headers.get("user-agent") || "unknown",
      created_at: new Date().toISOString(),
    }).catch(() => {});

    // Update last login
    await supabase
      .from("users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", user.id)
      .catch(() => {});

    return createSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        full_name: userProfile?.full_name,
        role: userProfile?.role,
        tenant: {
          id: userProfile?.tenant?.id,
          name: userProfile?.tenant?.name,
          status: userProfile?.tenant?.status,
          subscription: userProfile?.tenant?.subscription?.[0],
        },
      },
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
      },
    }, 200);
  } catch (error) {
    console.error("Login error:", error);
    return createErrorResponse("Internal server error", 500);
  }
};

// ============================================================================
// POST /auth/register - User registration
// ============================================================================

export const register: RouteHandler = async (req, params, context) => {
  const { supabase } = context;

  try {
    const rawBody = await req.json();
    const validationResult = RegisterSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          issues: validationResult.error.issues.map((issue: any) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const { email, password, full_name, company_name, phone, plan_id } = validationResult.data;

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return createErrorResponse("Email already registered", 409);
    }

    // 1. Create tenant first
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .insert({
        name: company_name,
        status: "active",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (tenantError || !tenant) {
      console.error("Failed to create tenant:", tenantError);
      return createErrorResponse("Failed to create organization", 500);
    }

    // 2. Create auth user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          tenant_id: tenant.id,
          role: "admin", // First user is admin
        },
      },
    });

    if (authError || !authData.user) {
      // Rollback tenant creation
      await supabase.from("tenants").delete().eq("id", tenant.id).catch(() => {});

      return createErrorResponse("Failed to create user", 500, {
        details: authError?.message,
      });
    }

    const { user, session } = authData;

    // 3. Create user profile
    const { error: profileError } = await supabase
      .from("users")
      .insert({
        id: user.id,
        email,
        full_name,
        tenant_id: tenant.id,
        role: "admin",
        phone,
        created_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error("Failed to create profile:", profileError);
      // Auth user was created, but profile failed - user can still login
    }

    // 4. Create subscription (free plan by default)
    const effectivePlanId = plan_id || await getFreePlanId(supabase);

    if (effectivePlanId) {
      const periodStart = new Date();
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      await supabase.from("subscriptions").insert({
        tenant_id: tenant.id,
        plan_id: effectivePlanId,
        status: plan_id ? "pending_payment" : "active", // Free plan is active immediately
        billing_cycle: "monthly",
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        created_at: new Date().toISOString(),
      }).catch((error) => {
        console.error("Failed to create subscription:", error);
      });
    }

    // 5. Generate API key for tenant
    const apiKey = await generateApiKey();
    await supabase
      .from("tenants")
      .update({ api_key: apiKey })
      .eq("id", tenant.id)
      .catch(() => {});

    // 6. Log registration
    await supabase.from("auth_logs").insert({
      user_id: user.id,
      tenant_id: tenant.id,
      email,
      event_type: "registration",
      ip_address: req.headers.get("x-forwarded-for") || "unknown",
      user_agent: req.headers.get("user-agent") || "unknown",
      created_at: new Date().toISOString(),
    }).catch(() => {});

    return createSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        full_name,
        role: "admin",
        tenant: {
          id: tenant.id,
          name: company_name,
          api_key: apiKey,
        },
      },
      session: session ? {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
      } : null,
      message: session
        ? "Registration successful"
        : "Registration successful. Please check your email to verify your account.",
    }, 201);
  } catch (error) {
    console.error("Registration error:", error);
    return createErrorResponse("Internal server error", 500);
  }
};

// ============================================================================
// POST /auth/refresh - Refresh JWT token
// ============================================================================

export const refresh: RouteHandler = async (req, params, context) => {
  const { supabase } = context;

  try {
    const rawBody = await req.json();
    const validationResult = RefreshTokenSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          issues: validationResult.error.issues.map((issue: any) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const { refresh_token } = validationResult.data;

    // Refresh session
    const { data: authData, error: authError } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (authError || !authData.session) {
      return createErrorResponse("Invalid or expired refresh token", 401);
    }

    const { session, user } = authData;

    // Log token refresh
    await supabase.from("auth_logs").insert({
      user_id: user.id,
      tenant_id: user.user_metadata?.tenant_id,
      email: user.email,
      event_type: "token_refresh",
      ip_address: req.headers.get("x-forwarded-for") || "unknown",
      user_agent: req.headers.get("user-agent") || "unknown",
      created_at: new Date().toISOString(),
    }).catch(() => {});

    return createSuccessResponse({
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
      },
    }, 200);
  } catch (error) {
    console.error("Refresh error:", error);
    return createErrorResponse("Internal server error", 500);
  }
};

// ============================================================================
// POST /auth/logout - User logout
// ============================================================================

export const logout: RouteHandler = async (req, params, context) => {
  const { supabase } = context;

  try {
    // Get user from Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return createErrorResponse("Missing authorization header", 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return createErrorResponse("Invalid token", 401);
    }

    // Sign out
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      console.error("Sign out error:", signOutError);
    }

    // Log logout
    await supabase.from("auth_logs").insert({
      user_id: user.id,
      tenant_id: user.user_metadata?.tenant_id,
      email: user.email,
      event_type: "logout",
      ip_address: req.headers.get("x-forwarded-for") || "unknown",
      user_agent: req.headers.get("user-agent") || "unknown",
      created_at: new Date().toISOString(),
    }).catch(() => {});

    return createSuccessResponse({
      message: "Logged out successfully",
    }, 200);
  } catch (error) {
    console.error("Logout error:", error);
    return createErrorResponse("Internal server error", 500);
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the free plan ID
 */
async function getFreePlanId(supabase: any): Promise<string | null> {
  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("name", "Free")
    .eq("active", true)
    .single();

  return plan?.id || null;
}

/**
 * Generate a secure API key
 */
async function generateApiKey(): Promise<string> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
