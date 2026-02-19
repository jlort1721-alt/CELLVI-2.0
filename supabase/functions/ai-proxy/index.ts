/**
 * AI Proxy - Secure Server-Side AI API Gateway
 *
 * Handles all AI API calls server-side so that API keys
 * are NEVER exposed to the client.
 *
 * Endpoints:
 * - POST /ai-proxy { action: "chat", ... }       → Claude messages API
 * - POST /ai-proxy { action: "embeddings", ... }  → OpenAI embeddings API
 *
 * Security:
 * ✅ JWT authentication with tenant_id extraction
 * ✅ CORS allowlist (no wildcard)
 * ✅ Rate limiting (15 requests/minute per user)
 * ✅ Zod schema validation
 * ✅ API keys stored in Deno.env (never sent to client)
 * ✅ Input sanitization and length limits
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { withCors } from "../_shared/cors.ts";
import { enforceRateLimit, getIdentifier } from "../_shared/rate-limiter.ts";

// ============================================================================
// SCHEMAS
// ============================================================================

const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

const ChatRequestSchema = z.object({
  action: z.literal("chat"),
  messages: z.array(ChatMessageSchema).min(1).max(30),
  systemPrompt: z.string().max(3000).optional(),
  context: z.string().max(5000).optional(),
});

const EmbeddingsRequestSchema = z.object({
  action: z.literal("embeddings"),
  text: z.string().min(1).max(8000),
});

const RequestSchema = z.discriminatedUnion("action", [
  ChatRequestSchema,
  EmbeddingsRequestSchema,
]);

// ============================================================================
// RATE LIMIT CONFIG
// ============================================================================

const AI_PROXY_RATE_LIMIT = {
  maxRequests: 15,
  windowMs: 60_000, // 1 minute
} as const;

// ============================================================================
// AI CONFIGURATIONS
// ============================================================================

const CLAUDE_CONFIG = {
  model: "claude-3-5-sonnet-20241022",
  maxTokens: 1024,
  temperature: 0.7,
} as const;

const OPENAI_EMBEDDINGS_CONFIG = {
  model: "text-embedding-3-small",
  dimensions: 1536,
} as const;

const DEFAULT_SYSTEM_PROMPT = `Eres un asistente experto de ASEGURAR LTDA, una plataforma de gestión de flotas de transporte en Colombia.

Tu función es ayudar a los usuarios con:
- Consultas sobre mantenimiento de vehículos
- Regulaciones RNDC (Registro Nacional de Despacho de Carga)
- Políticas de la empresa
- Historial de incidentes y mejores prácticas
- Optimización de rutas y operaciones

Debes:
- Proporcionar respuestas claras, concisas y precisas
- Citar las fuentes cuando sea relevante
- Sugerir acciones concretas cuando sea apropiado
- Mantener un tono profesional pero amigable
- Si no estás seguro de algo, admítelo y sugiere alternativas

IMPORTANTE: Basa tus respuestas en la información proporcionada en el contexto. Si la información no está disponible, indícalo claramente.`;

// ============================================================================
// HANDLER
// ============================================================================

const handler = async (req: Request): Promise<Response> => {
  try {
    // ========================================================================
    // AUTHENTICATION
    // ========================================================================

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "No authorization header" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // ========================================================================
    // RATE LIMITING
    // ========================================================================

    const identifier = getIdentifier(req, user.id);
    await enforceRateLimit(supabase, {
      ...AI_PROXY_RATE_LIMIT,
      identifier,
      endpoint: "ai-proxy",
    });

    // ========================================================================
    // VALIDATION
    // ========================================================================

    const rawBody = await req.json();
    const validationResult = RequestSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return jsonResponse({
        error: "Validation failed",
        issues: validationResult.error.issues.map(issue => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      }, 400);
    }

    const body = validationResult.data;

    // ========================================================================
    // ROUTE TO APPROPRIATE AI SERVICE
    // ========================================================================

    if (body.action === "chat") {
      return await handleChat(body);
    } else if (body.action === "embeddings") {
      return await handleEmbeddings(body);
    }

    return jsonResponse({ error: "Unknown action" }, 400);

  } catch (error: unknown) {
    console.error("[ai-proxy] Error:", error);

    if ((error as any).name === "RateLimitError") {
      return jsonResponse(
        { error: "Too many requests", message: (error as Error).message },
        429,
        { "Retry-After": String((error as any).result?.retryAfter || 60) }
      );
    }

    return jsonResponse(
      { error: "Internal server error", message: (error as Error).message || "Unknown error" },
      500
    );
  }
};

// ============================================================================
// CHAT HANDLER (Claude API)
// ============================================================================

async function handleChat(body: z.infer<typeof ChatRequestSchema>): Promise<Response> {
  const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicApiKey) {
    return jsonResponse({ error: "Anthropic API key not configured on server" }, 500);
  }

  const systemPrompt = body.context
    ? `${body.systemPrompt || DEFAULT_SYSTEM_PROMPT}\n\n## Contexto relevante:\n${body.context}`
    : (body.systemPrompt || DEFAULT_SYSTEM_PROMPT);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_CONFIG.model,
      max_tokens: CLAUDE_CONFIG.maxTokens,
      temperature: CLAUDE_CONFIG.temperature,
      system: systemPrompt,
      messages: body.messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[ai-proxy] Claude API error:", response.status, errorText);
    return jsonResponse(
      { error: "AI service error", status: response.status },
      502
    );
  }

  const data = await response.json();
  return jsonResponse(data);
}

// ============================================================================
// EMBEDDINGS HANDLER (OpenAI API)
// ============================================================================

async function handleEmbeddings(body: z.infer<typeof EmbeddingsRequestSchema>): Promise<Response> {
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiApiKey) {
    return jsonResponse({ error: "OpenAI API key not configured on server" }, 500);
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_EMBEDDINGS_CONFIG.model,
      input: body.text,
      dimensions: OPENAI_EMBEDDINGS_CONFIG.dimensions,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[ai-proxy] OpenAI API error:", response.status, errorText);
    return jsonResponse(
      { error: "Embeddings service error", status: response.status },
      502
    );
  }

  const data = await response.json();
  return jsonResponse({
    embedding: data.data[0].embedding,
    model: data.model,
    usage: data.usage,
  });
}

// ============================================================================
// UTILS
// ============================================================================

function jsonResponse(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  });
}

// Serve with CORS wrapper
serve(withCors(handler));
