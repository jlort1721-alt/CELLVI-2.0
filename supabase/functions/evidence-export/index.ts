import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function sha256(data: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function buildMerkleRoot(hashes: string[]): Promise<string> {
  if (hashes.length === 0) return "";
  let level = [...hashes];
  while (level.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] ?? left;
      next.push(await sha256(left + right));
    }
    level = next;
  }
  return level[0];
}

async function buildMerkleProof(hashes: string[], index: number): Promise<{ hash: string; position: "left" | "right" }[]> {
  const proof: { hash: string; position: "left" | "right" }[] = [];
  let level = [...hashes];
  let idx = index;
  while (level.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] ?? left;
      if (i === idx || i + 1 === idx) {
        proof.push(idx % 2 === 0 ? { hash: right, position: "right" } : { hash: left, position: "left" });
      }
      next.push(await sha256(left + right));
    }
    level = next;
    idx = Math.floor(idx / 2);
  }
  return proof;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { tenant_id, record_ids, from_date, to_date, include_proofs } = await req.json();

    if (!tenant_id) {
      return new Response(JSON.stringify({ error: "tenant_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch records by IDs or date range
    let query = supabase
      .from("evidence_records")
      .select("*")
      .eq("tenant_id", tenant_id)
      .order("chain_index", { ascending: true });

    if (record_ids?.length) {
      query = query.in("id", record_ids);
    } else if (from_date && to_date) {
      query = query.gte("sealed_at", from_date).lte("sealed_at", to_date);
    }

    const { data: records, error } = await query;
    if (error || !records?.length) {
      return new Response(JSON.stringify({ error: "No records found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify chain integrity within export
    const chainIntegrity: { verified: boolean; broken_at?: number } = { verified: true };
    for (let i = 1; i < records.length; i++) {
      if (records[i].prev_hash !== records[i - 1].sha256_hash) {
        chainIntegrity.verified = false;
        chainIntegrity.broken_at = records[i].chain_index;
        break;
      }
    }

    // Build Merkle tree for the export bundle
    const leafHashes = records.map(r => r.sha256_hash);
    const exportMerkleRoot = await buildMerkleRoot(leafHashes);

    // Generate per-record Merkle proofs if requested
    let proofs: Record<string, { hash: string; position: string }[]> | undefined;
    if (include_proofs) {
      proofs = {};
      for (let i = 0; i < records.length; i++) {
        proofs[records[i].id] = await buildMerkleProof(leafHashes, i);
      }
    }

    // Build the verifiable export bundle
    const bundle = {
      version: "2.0",
      format: "cellvi-evidence-bundle",
      exported_at: new Date().toISOString(),
      tenant_id,
      integrity: {
        algorithm: "SHA-256",
        chain_verified: chainIntegrity.verified,
        chain_broken_at: chainIntegrity.broken_at ?? null,
        merkle_root: exportMerkleRoot,
        leaf_count: records.length,
        first_chain_index: records[0].chain_index,
        last_chain_index: records[records.length - 1].chain_index,
      },
      records: records.map(r => ({
        id: r.id,
        chain_index: r.chain_index,
        prev_hash: r.prev_hash,
        sha256_hash: r.sha256_hash,
        event_type: r.event_type,
        vehicle_id: r.vehicle_id,
        description: r.description,
        data: r.data,
        source: r.source,
        sealed_at: r.sealed_at,
        device_fingerprint: r.device_fingerprint,
        device_signature: r.device_signature,
      })),
      merkle_proofs: proofs ?? null,
      verification_instructions: {
        step_1: "For each record, recompute SHA-256 of JSON.stringify({chain_index, prev_hash, event_type, vehicle_id, description, data, device_fingerprint, sealed_at})",
        step_2: "Verify computed hash matches record.sha256_hash",
        step_3: "Verify record[n].prev_hash === record[n-1].sha256_hash for chain continuity",
        step_4: "Recompute Merkle root from all sha256_hash values; must match integrity.merkle_root",
        step_5: "If merkle_proofs included, verify each proof independently against the root",
      },
    };

    // Hash the entire bundle for tamper detection
    const bundleHash = await sha256(JSON.stringify(bundle));

    // Log the export
    const { data: exportRecord } = await supabase.from("evidence_exports").insert({
      tenant_id,
      record_count: records.length,
      bundle_hash: bundleHash,
      format: "json",
    }).select().single();

    // Update access logs
    for (const r of records) {
      const accessLog = Array.isArray(r.access_log) ? [...r.access_log] : [];
      accessLog.push({ user: "export-api", action: "exported", timestamp: new Date().toISOString() });
      await supabase.from("evidence_records").update({ access_log: accessLog }).eq("id", r.id);
    }

    return new Response(JSON.stringify({
      export_id: exportRecord?.id,
      bundle_hash: bundleHash,
      bundle,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Evidence export error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
