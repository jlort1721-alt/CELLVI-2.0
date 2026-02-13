import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

/* ── Crypto helpers ──────────────────────────── */
async function sha256(data: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

/** Build a Merkle root from an array of leaf hashes */
async function buildMerkleRoot(hashes: string[]): Promise<{ root: string; depth: number }> {
  if (hashes.length === 0) return { root: "", depth: 0 };
  let level = [...hashes];
  let depth = 0;
  while (level.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] ?? left; // duplicate last if odd
      next.push(await sha256(left + right));
    }
    level = next;
    depth++;
  }
  return { root: level[0], depth };
}

/** Generate a Merkle proof (array of {hash, position}) for a leaf at `index` */
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
        if (idx % 2 === 0) {
          proof.push({ hash: right, position: "right" });
        } else {
          proof.push({ hash: left, position: "left" });
        }
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

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    /* ═══════════════════════════════════════════════
       POST — Seal a new evidence record (hash-chained)
       ═══════════════════════════════════════════════ */
    if (req.method === "POST" && action !== "merkle") {
      const body = await req.json();
      const { tenant_id, event_type, vehicle_id, description, data, source, device_fingerprint, device_signature } = body;

      if (!tenant_id || !event_type || !description) {
        return new Response(JSON.stringify({ error: "tenant_id, event_type, description required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 1. Get previous hash and next chain index (append-only)
      const { data: prevRec } = await supabase
        .from("evidence_records")
        .select("sha256_hash, chain_index")
        .eq("tenant_id", tenant_id)
        .order("chain_index", { ascending: false, nullsFirst: false })
        .limit(1)
        .single();

      const prevHash = prevRec?.sha256_hash ?? "GENESIS";
      const chainIndex = (prevRec?.chain_index ?? 0) + 1;

      // 2. Build deterministic payload and hash WITH prev_hash (chain link)
      const sealedAt = new Date().toISOString();
      const payload = JSON.stringify({
        chain_index: chainIndex,
        prev_hash: prevHash,
        event_type,
        vehicle_id: vehicle_id ?? null,
        description,
        data: data ?? {},
        device_fingerprint: device_fingerprint ?? null,
        sealed_at: sealedAt,
      });
      const currentHash = await sha256(payload);

      // 3. If device_fingerprint provided, validate cert exists
      if (device_fingerprint) {
        const { data: cert } = await supabase
          .from("device_certificates")
          .select("id, status")
          .eq("fingerprint", device_fingerprint)
          .eq("status", "active")
          .single();

        if (!cert) {
          return new Response(JSON.stringify({ error: "Device certificate not found or revoked" }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // 4. Insert record
      const { data: record, error } = await supabase.from("evidence_records").insert({
        tenant_id,
        event_type,
        vehicle_id,
        sha256_hash: currentHash,
        prev_hash: prevHash,
        chain_index: chainIndex,
        description,
        data: data ?? {},
        source: source ?? "manual",
        sealed_at: sealedAt,
        device_fingerprint: device_fingerprint ?? null,
        device_signature: device_signature ?? null,
        access_log: [{ user: "sistema", action: "sealed", timestamp: sealedAt }],
      }).select().single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        record,
        chain: { index: chainIndex, prev_hash: prevHash, current_hash: currentHash },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    /* ═══════════════════════════════════════════════
       POST ?action=merkle — Build Merkle root for batch
       ═══════════════════════════════════════════════ */
    if (req.method === "POST" && action === "merkle") {
      const { tenant_id, from_index, to_index } = await req.json();

      if (!tenant_id || from_index == null || to_index == null) {
        return new Response(JSON.stringify({ error: "tenant_id, from_index, to_index required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: records, error } = await supabase
        .from("evidence_records")
        .select("id, sha256_hash, chain_index, sealed_at")
        .eq("tenant_id", tenant_id)
        .gte("chain_index", from_index)
        .lte("chain_index", to_index)
        .order("chain_index", { ascending: true });

      if (error || !records?.length) {
        return new Response(JSON.stringify({ error: "No records found in range" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const leafHashes = records.map(r => r.sha256_hash);
      const { root, depth } = await buildMerkleRoot(leafHashes);

      // Store Merkle root
      const { data: merkleRoot, error: mrErr } = await supabase.from("merkle_roots").insert({
        tenant_id,
        root_hash: root,
        leaf_count: records.length,
        first_chain_index: from_index,
        last_chain_index: to_index,
        first_event_at: records[0].sealed_at,
        last_event_at: records[records.length - 1].sealed_at,
        tree_depth: depth,
      }).select().single();

      if (mrErr) {
        return new Response(JSON.stringify({ error: mrErr.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update records with merkle_root_id
      for (let i = 0; i < records.length; i++) {
        await supabase.from("evidence_records")
          .update({ merkle_root_id: merkleRoot.id, merkle_leaf_index: i })
          .eq("id", records[i].id);
      }

      return new Response(JSON.stringify({
        success: true,
        merkle_root: merkleRoot,
        leaf_count: records.length,
        tree_depth: depth,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    /* ═══════════════════════════════════════════════
       GET — Verify single record + chain integrity
       ═══════════════════════════════════════════════ */
    if (req.method === "GET") {
      const id = url.searchParams.get("id");
      const verifyChain = url.searchParams.get("chain") === "true";

      if (!id) {
        return new Response(JSON.stringify({ error: "id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: record, error } = await supabase.from("evidence_records").select("*").eq("id", id).single();
      if (error || !record) {
        return new Response(JSON.stringify({ error: "Record not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Recompute hash
      const payload = JSON.stringify({
        chain_index: record.chain_index,
        prev_hash: record.prev_hash,
        event_type: record.event_type,
        vehicle_id: record.vehicle_id,
        description: record.description,
        data: record.data,
        device_fingerprint: record.device_fingerprint,
        sealed_at: record.sealed_at,
      });
      const computedHash = await sha256(payload);
      const hashVerified = computedHash === record.sha256_hash;

      // Optional: verify chain backwards
      let chainVerified = null;
      let chainBrokenAt = null;
      if (verifyChain && record.chain_index > 1) {
        chainVerified = true;
        const { data: chainRecords } = await supabase
          .from("evidence_records")
          .select("sha256_hash, prev_hash, chain_index")
          .eq("tenant_id", record.tenant_id)
          .lte("chain_index", record.chain_index)
          .order("chain_index", { ascending: true });

        if (chainRecords) {
          for (let i = 1; i < chainRecords.length; i++) {
            if (chainRecords[i].prev_hash !== chainRecords[i - 1].sha256_hash) {
              chainVerified = false;
              chainBrokenAt = chainRecords[i].chain_index;
              break;
            }
          }
        }
      }

      // Optional: Merkle proof
      let merkleProof = null;
      if (record.merkle_root_id && record.merkle_leaf_index != null) {
        const { data: siblings } = await supabase
          .from("evidence_records")
          .select("sha256_hash")
          .eq("merkle_root_id", record.merkle_root_id)
          .order("merkle_leaf_index", { ascending: true });

        if (siblings) {
          const leafHashes = siblings.map(s => s.sha256_hash);
          merkleProof = await buildMerkleProof(leafHashes, record.merkle_leaf_index);
        }
      }

      // Log access
      const accessLog = Array.isArray(record.access_log) ? [...record.access_log] : [];
      accessLog.push({ user: "verify-api", action: "verified", timestamp: new Date().toISOString() });
      await supabase.from("evidence_records").update({ access_log: accessLog }).eq("id", id);

      return new Response(JSON.stringify({
        id: record.id,
        hash_verified: hashVerified,
        chain_index: record.chain_index,
        prev_hash: record.prev_hash,
        sha256_hash: record.sha256_hash,
        computed_hash: computedHash,
        chain_verified: chainVerified,
        chain_broken_at: chainBrokenAt,
        merkle_proof: merkleProof,
        device_fingerprint: record.device_fingerprint,
        sealed_at: record.sealed_at,
        access_count: accessLog.length,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Evidence service error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
