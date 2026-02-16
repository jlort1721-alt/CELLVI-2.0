/**
 * Neural Chat - AI-Powered Logistics Assistant
 *
 * Security Hardening Applied:
 * ✅ JWT authentication with tenant_id extraction
 * ✅ CORS allowlist (no wildcard)
 * ✅ Rate limiting (10 requests/minute per user)
 * ✅ Zod schema validation
 * ✅ withCors wrapper
 * ✅ Sanitized inputs
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.2.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { withCors } from "../_shared/cors.ts";
import { enforceRateLimit, getIdentifier } from "../_shared/rate-limiter.ts";

// ============================================================================
// REQUEST SCHEMA
// ============================================================================

const NeuralChatRequestSchema = z.object({
  query: z.string().min(1).max(500),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(1000),
  })).max(20).optional().default([]),
}).strict();

type NeuralChatRequest = z.infer<typeof NeuralChatRequestSchema>;

// ============================================================================
// RATE LIMIT CONFIG
// ============================================================================

const NEURAL_CHAT_RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60_000, // 1 minute
} as const;

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

    // Extract and validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get user's tenant_id from user metadata
    const tenantId = user.user_metadata?.tenant_id;
    if (!tenantId) {
      return new Response(
        JSON.stringify({ error: "No tenant associated with user" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // ========================================================================
    // RATE LIMITING
    // ========================================================================

    const identifier = getIdentifier(req, user.id);
    await enforceRateLimit(supabase, {
      ...NEURAL_CHAT_RATE_LIMIT,
      identifier,
      endpoint: "neural-chat",
    });

    // ========================================================================
    // VALIDATION
    // ========================================================================

    const rawBody = await req.json();
    const validationResult = NeuralChatRequestSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          issues: validationResult.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { query, history } = validationResult.data;

    // ========================================================================
    // OPENAI EMBEDDINGS
    // ========================================================================

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const openai = new OpenAIApi(new Configuration({ apiKey: openaiApiKey }));

    const embeddingResponse = await openai.createEmbedding({
      model: "text-embedding-3-small",
      input: query,
    });

    const embedding = embeddingResponse.data.data[0].embedding;

    // ========================================================================
    // KNOWLEDGE BASE SEARCH (with tenant_id filter)
    // ========================================================================

    const { data: documents, error: searchError } = await supabase.rpc("match_knowledge", {
      query_embedding: embedding,
      match_threshold: 0.78,
      match_count: 3,
      filter_tenant_id: tenantId, // ✅ SERVER-SIDE tenant filter from JWT
    });

    if (searchError) {
      console.error("Knowledge base search error:", searchError);
      return new Response(
        JSON.stringify({ error: "Failed to search knowledge base" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // ========================================================================
    // RAG SYNTHESIS
    // ========================================================================

    const contextText = documents?.map((d: any) => d.content).join("\n---\n") || "";

    const prompt = `
You are CELLVI AI, an expert logistics assistant. Use the following context to answer the user question.
If the answer is not in the context, say "I don't have that information in my knowledge base yet."

Context:
${contextText}

History:
${JSON.stringify(history || [])}

User Question: ${query}
`;

    const chatResponse = await openai.createChatCompletion({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful logistics AI." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    });

    const answer = chatResponse.data.choices[0].message?.content;

    // ========================================================================
    // RESPONSE
    // ========================================================================

    return new Response(
      JSON.stringify({
        answer,
        sources: documents?.map((d: any) => d.metadata) || [],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error: unknown) {
    console.error("[neural-chat] Error:", error);

    // Handle rate limit errors
    if ((error as any).name === "RateLimitError") {
      return new Response(
        JSON.stringify({
          error: "Too many requests",
          message: (error as Error).message,
        }),
        {
          status: (error as any).statusCode || 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String((error as any).result?.retryAfter || 60),
          },
        }
      );
    }

    // Handle OpenAI errors
    if ((error as any).response?.status) {
      return new Response(
        JSON.stringify({
          error: "OpenAI API error",
          message: (error as Error).message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generic error
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: (error as Error).message || "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Serve with CORS wrapper
serve(withCors(handler));
