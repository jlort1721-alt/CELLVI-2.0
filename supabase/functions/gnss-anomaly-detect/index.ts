import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ═══════════════════════════════════════════════════════════════
// GNSS ANOMALY DETECTION ENGINE — MVP Heuristic Rules
// Features: satellite count, HDOP, speed coherence, position jump,
//           heading continuity, altitude coherence, multi-asset correlation
// ═══════════════════════════════════════════════════════════════

interface TelemetryEvent {
  ts: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  satellites?: number;
  hdop?: number;
  fuel_level?: number;
  engine_on?: boolean;
  extras?: Record<string, unknown>;
}

interface PreviousState {
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  altitude: number;
  ts: string;
}

interface DetectionResult {
  anomaly_type: string;
  confidence_score: number;
  severity: string;
  rules_triggered: string[];
  features_snapshot: Record<string, unknown>;
  satellites: number | null;
  hdop: number | null;
  speed: number | null;
  speed_delta: number | null;
  heading: number | null;
  heading_delta: number | null;
  altitude: number | null;
  altitude_delta: number | null;
  position_jump_m: number | null;
  expected_max_m: number | null;
}

// ─── Haversine distance (meters) ─────────────────────────────
function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Heuristic Rules (MVP) ──────────────────────────────────
// Each rule returns [triggered: boolean, weight: number, ruleName: string]

function ruleSatelliteDrop(satellites: number | undefined): [boolean, number, string] {
  if (satellites === undefined) return [false, 0, ""];
  // Jamming typically causes satellite count to drop to 0-3
  if (satellites <= 2) return [true, 0.35, "SAT_DROP_CRITICAL"];
  if (satellites <= 4) return [true, 0.20, "SAT_DROP_LOW"];
  return [false, 0, ""];
}

function ruleHdopSpike(hdop: number | undefined): [boolean, number, string] {
  if (hdop === undefined) return [false, 0, ""];
  // HDOP > 5 indicates poor geometry; spoofing often shows perfect HDOP (< 0.8)
  if (hdop > 10) return [true, 0.25, "HDOP_DEGRADED"];
  if (hdop < 0.5) return [true, 0.20, "HDOP_TOO_PERFECT"]; // spoofing indicator
  return [false, 0, ""];
}

function rulePositionJump(
  event: TelemetryEvent,
  prev: PreviousState | null,
): [boolean, number, string, number, number] {
  if (!prev) return [false, 0, "", 0, 0];
  const jumpM = haversineM(prev.latitude, prev.longitude, event.latitude, event.longitude);
  const dtSec = (new Date(event.ts || Date.now()).getTime() - new Date(prev.ts).getTime()) / 1000;
  if (dtSec <= 0) return [false, 0, "", jumpM, 0];

  // Max plausible distance: speed (m/s) * dt * 1.5 safety factor, min 100m
  const maxSpeed = Math.max(prev.speed, event.speed || 0) / 3.6; // km/h to m/s
  const expectedMaxM = Math.max(maxSpeed * dtSec * 1.5, 100);

  if (jumpM > expectedMaxM * 3) return [true, 0.40, "POSITION_TELEPORT", jumpM, expectedMaxM];
  if (jumpM > expectedMaxM * 1.5) return [true, 0.20, "POSITION_JUMP", jumpM, expectedMaxM];
  return [false, 0, "", jumpM, expectedMaxM];
}

function ruleSpeedAnomaly(
  event: TelemetryEvent,
  prev: PreviousState | null,
): [boolean, number, string, number] {
  if (!prev || event.speed === undefined) return [false, 0, "", 0];
  const delta = Math.abs((event.speed || 0) - prev.speed);
  const dtSec = (new Date(event.ts || Date.now()).getTime() - new Date(prev.ts).getTime()) / 1000;
  if (dtSec <= 0) return [false, 0, "", delta];

  // Acceleration > 50 km/h in 1 second is physically impossible for most vehicles
  const accel = delta / dtSec;
  if (accel > 50) return [true, 0.30, "SPEED_IMPOSSIBLE_ACCEL", delta];
  if (accel > 25) return [true, 0.15, "SPEED_SUSPICIOUS_ACCEL", delta];
  return [false, 0, "", delta];
}

function ruleHeadingJump(
  event: TelemetryEvent,
  prev: PreviousState | null,
): [boolean, number, string, number] {
  if (!prev || event.heading === undefined) return [false, 0, "", 0];
  let delta = Math.abs((event.heading || 0) - prev.heading);
  if (delta > 180) delta = 360 - delta;

  // At high speed, sudden 180° heading change is suspicious
  if (delta > 150 && (event.speed || 0) > 30) return [true, 0.20, "HEADING_REVERSAL_AT_SPEED", delta];
  if (delta > 90 && (event.speed || 0) > 60) return [true, 0.15, "HEADING_SHARP_AT_SPEED", delta];
  return [false, 0, "", delta];
}

function ruleAltitudeAnomaly(
  event: TelemetryEvent,
  prev: PreviousState | null,
): [boolean, number, string, number] {
  if (!prev || event.altitude === undefined || prev.altitude === 0) return [false, 0, "", 0];
  const delta = Math.abs((event.altitude || 0) - prev.altitude);
  const dtSec = (new Date(event.ts || Date.now()).getTime() - new Date(prev.ts).getTime()) / 1000;
  if (dtSec <= 0) return [false, 0, "", delta];

  // Vertical rate > 50 m/s is impossible for ground vehicles
  const vRate = delta / dtSec;
  if (vRate > 50) return [true, 0.15, "ALTITUDE_IMPOSSIBLE", delta];
  return [false, 0, "", delta];
}

function ruleStaticWithMovement(event: TelemetryEvent, prev: PreviousState | null): [boolean, number, string] {
  if (!prev) return [false, 0, ""];
  // Speed reports movement but position is identical (spoofing replaying static coords)
  if ((event.speed || 0) > 20) {
    const jumpM = haversineM(prev.latitude, prev.longitude, event.latitude, event.longitude);
    if (jumpM < 5) return [true, 0.25, "SPEED_WITHOUT_MOVEMENT"];
  }
  return [false, 0, ""];
}

// ─── Main Detection Pipeline ────────────────────────────────
export function detectAnomalies(
  event: TelemetryEvent,
  prev: PreviousState | null,
  fleetAnomalyCount: number = 0,
): DetectionResult | null {
  const rules: string[] = [];
  let totalWeight = 0;
  let maxWeight = 0;
  const features: Record<string, unknown> = {};

  // Run all rules
  const [sat, satW, satR] = ruleSatelliteDrop(event.satellites);
  if (sat) { rules.push(satR); totalWeight += satW; maxWeight = Math.max(maxWeight, satW); }
  features.satellites = event.satellites;

  const [hdop, hdopW, hdopR] = ruleHdopSpike(event.hdop);
  if (hdop) { rules.push(hdopR); totalWeight += hdopW; maxWeight = Math.max(maxWeight, hdopW); }
  features.hdop = event.hdop;

  const [posJ, posJW, posJR, jumpM, expectedM] = rulePositionJump(event, prev);
  if (posJ) { rules.push(posJR); totalWeight += posJW; maxWeight = Math.max(maxWeight, posJW); }
  features.position_jump_m = jumpM;
  features.expected_max_m = expectedM;

  const [spdA, spdAW, spdAR, speedDelta] = ruleSpeedAnomaly(event, prev);
  if (spdA) { rules.push(spdAR); totalWeight += spdAW; maxWeight = Math.max(maxWeight, spdAW); }
  features.speed_delta = speedDelta;

  const [hdgJ, hdgJW, hdgJR, headingDelta] = ruleHeadingJump(event, prev);
  if (hdgJ) { rules.push(hdgJR); totalWeight += hdgJW; maxWeight = Math.max(maxWeight, hdgJW); }
  features.heading_delta = headingDelta;

  const [altA, altAW, altAR, altDelta] = ruleAltitudeAnomaly(event, prev);
  if (altA) { rules.push(altAR); totalWeight += altAW; maxWeight = Math.max(maxWeight, altAW); }
  features.altitude_delta = altDelta;

  const [stM, stMW, stMR] = ruleStaticWithMovement(event, prev);
  if (stM) { rules.push(stMR); totalWeight += stMW; maxWeight = Math.max(maxWeight, stMW); }

  // No rules triggered => no anomaly
  if (rules.length === 0) return null;

  // Confidence score: weighted sum clamped to [0, 1]
  let confidence = Math.min(totalWeight, 1.0);

  // Boost if multi-asset correlation (fleet-wide event = likely jamming)
  if (fleetAnomalyCount >= 3) {
    confidence = Math.min(confidence + 0.15, 1.0);
    rules.push("FLEET_CORRELATED");
  }

  // Classify anomaly type
  let anomalyType = "unknown";
  if (rules.includes("HDOP_TOO_PERFECT") || rules.includes("SPEED_WITHOUT_MOVEMENT") || rules.includes("POSITION_TELEPORT")) {
    anomalyType = "spoofing";
  } else if (rules.includes("SAT_DROP_CRITICAL") || rules.includes("SAT_DROP_LOW")) {
    anomalyType = fleetAnomalyCount >= 2 ? "jamming" : "interference";
  } else if (rules.includes("POSITION_JUMP") || rules.includes("SPEED_IMPOSSIBLE_ACCEL")) {
    anomalyType = "drift";
  }

  // Severity from confidence
  let severity = "low";
  if (confidence >= 0.8) severity = "critical";
  else if (confidence >= 0.6) severity = "high";
  else if (confidence >= 0.35) severity = "medium";

  return {
    anomaly_type: anomalyType,
    confidence_score: Math.round(confidence * 100) / 100,
    severity,
    rules_triggered: rules,
    features_snapshot: features,
    satellites: event.satellites ?? null,
    hdop: event.hdop ?? null,
    speed: event.speed ?? null,
    speed_delta: speedDelta || null,
    heading: event.heading ?? null,
    heading_delta: headingDelta || null,
    altitude: event.altitude ?? null,
    altitude_delta: altDelta || null,
    position_jump_m: jumpM || null,
    expected_max_m: expectedM || null,
  };
}

// ─── Edge Function Handler ──────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { tenant_id, vehicle_id, device_id, events, previous_state } = body;

    if (!tenant_id || !vehicle_id || !events?.length) {
      return new Response(JSON.stringify({ error: "tenant_id, vehicle_id, and events required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anomalies: Record<string, unknown>[] = [];
    let prev: PreviousState | null = previous_state || null;

    // Check fleet-wide anomaly count in last 5 minutes
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count: fleetCount } = await supabase
      .from("gnss_anomalies")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenant_id)
      .gte("ts", fiveMinAgo)
      .neq("vehicle_id", vehicle_id);

    const fleetAnomalyCount = fleetCount || 0;

    for (const event of events) {
      const result = detectAnomalies(event, prev, fleetAnomalyCount);

      if (result) {
        anomalies.push({
          tenant_id,
          vehicle_id,
          device_id,
          ts: event.ts || new Date().toISOString(),
          anomaly_type: result.anomaly_type,
          confidence_score: result.confidence_score,
          severity: result.severity,
          satellites: result.satellites,
          hdop: result.hdop,
          speed: result.speed,
          speed_delta: result.speed_delta,
          heading: result.heading,
          heading_delta: result.heading_delta,
          altitude: result.altitude,
          altitude_delta: result.altitude_delta,
          position_jump_m: result.position_jump_m,
          expected_max_m: result.expected_max_m,
          fleet_anomaly_count: fleetAnomalyCount,
          features_snapshot: result.features_snapshot,
          rules_triggered: result.rules_triggered,
          status: "open",
        });
      }

      // Update prev state for next event
      prev = {
        latitude: event.latitude,
        longitude: event.longitude,
        speed: event.speed || 0,
        heading: event.heading || 0,
        altitude: event.altitude || 0,
        ts: event.ts || new Date().toISOString(),
      };
    }

    if (anomalies.length > 0) {
      const { error: insertErr } = await supabase.from("gnss_anomalies").insert(anomalies);
      if (insertErr) {
        console.error("Anomaly insert error:", insertErr);
        return new Response(JSON.stringify({ error: "Insert failed", details: insertErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      events_analyzed: events.length,
      anomalies_detected: anomalies.length,
      anomalies: anomalies.map(a => ({
        type: a.anomaly_type,
        confidence: a.confidence_score,
        severity: a.severity,
        rules: a.rules_triggered,
      })),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("GNSS anomaly detection error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
