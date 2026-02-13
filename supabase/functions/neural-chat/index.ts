
import { createClient } from '@supabase/supabase-js';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.2.1";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { query, history } = await req.json();

        // 1. Generate Embeddings (OpenAI)
        const openai = new OpenAIApi(new Configuration({
            apiKey: Deno.env.get('OPENAI_API_KEY'),
        }));

        const embeddingResponse = await openai.createEmbedding({
            model: 'text-embedding-3-small',
            input: query,
        });

        const embedding = embeddingResponse.data.data[0].embedding;

        // 2. Search Postgres Knowledge Base (Similarity Search)
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Check JWT context for tenant_id (security first!)
        // In a real implementation, we extract user from Authorization header
        // For this prototype, we simulate tenant context search

        const { data: documents, error } = await supabaseClient.rpc('match_knowledge', {
            query_embedding: embedding,
            match_threshold: 0.78, // High semantic similarity
            match_count: 3,
            filter_tenant_id: 'e9259174-275d-4f16-95aa-28267df3c942' // Replace with dynamic user.tenant_id
        });

        if (error) throw error;

        // 3. Synthesize Answer (RAG)
        const contextText = documents?.map((d: any) => d.content).join('\n---\n');

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
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: 'You are a helpful logistics AI.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.2, // Fact-based answers
        });

        const answer = chatResponse.data.choices[0].message?.content;

        return new Response(JSON.stringify({
            answer,
            sources: documents?.map((d: any) => d.metadata)
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
