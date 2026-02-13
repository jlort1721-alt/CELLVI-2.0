import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-tenant-id, x-device-imei, x-protocol, x-idempotency-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ═══════════════════════════════════════════════════════════
// Normalized Telemetry Model (common across all protocols)
// ═══════════════════════════════════════════════════════════
interface NormalizedEvent {
  ts: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  altitude: number | null;
  fuel_level: number | null;
  engine_on: boolean | null;
  odometer: number | null;
  satellites: number | null;
  hdop: number | null;
  temperature: number | null;
  humidity: number | null;
  extras: Record<string, unknown>;
}

interface GatewayPayload {
  imei: string;
  protocol?: string;
  sequence?: number;
  events: Record<string, unknown>[];
  // Protocol-specific raw formats
  raw_hex?: string;      // For binary protocols (Teltonika, Concox)
  raw_csv?: string;      // For CSV protocols (Queclink)
  raw_nmea?: string[];   // For NMEA sentences
}

interface ProcessingResult {
  success: boolean;
  events_stored: number;
  events_normalized: number;
  alerts_triggered: number;
  anomalies_detected: number;
  idempotency_key: string;
  duplicate: boolean;
}

// ═══════════════════════════════════════════════════════════
// Protocol Normalizers
// ═══════════════════════════════════════════════════════════

function detectProtocol(payload: GatewayPayload, headerProtocol?: string | null): string {
  if (headerProtocol) return headerProtocol;
  if (payload.protocol) return payload.protocol;
  if (payload.raw_hex) {
    // Teltonika codec8/8e starts with 00000000
    if (payload.raw_hex.startsWith("00000000")) return "teltonika";
    // Concox starts with 78 or 79
    if (payload.raw_hex.startsWith("78") || payload.raw_hex.startsWith("79")) return "concox";
  }
  if (payload.raw_csv) {
    if (payload.raw_csv.startsWith("+RESP") || payload.raw_csv.startsWith("+BUFF")) return "queclink";
  }
  if (payload.raw_nmea?.some(s => s.startsWith("$GP"))) return "nmea";
  return "generic_json";
}

function normalizeTeltonikaEvent(raw: Record<string, unknown>): NormalizedEvent {
  // Teltonika Codec 8/8E IO elements mapping
  const ioElements = (raw.io_elements || raw.ios || {}) as Record<string, unknown>;
  return {
    ts: (raw.timestamp as string) || (raw.ts as string) || new Date().toISOString(),
    latitude: Number(raw.latitude || raw.lat || 0),
    longitude: Number(raw.longitude || raw.lng || raw.lon || 0),
    speed: Number(raw.speed || ioElements["io_24"] || 0),
    heading: Number(raw.heading || raw.angle || ioElements["io_25"] || 0),
    altitude: raw.altitude != null ? Number(raw.altitude) : null,
    fuel_level: ioElements["io_66"] != null ? Number(ioElements["io_66"]) : null,
    engine_on: ioElements["io_239"] != null ? Boolean(ioElements["io_239"]) : (raw.engine_on as boolean | null) ?? null,
    odometer: ioElements["io_16"] != null ? Number(ioElements["io_16"]) : null,
    satellites: raw.satellites != null ? Number(raw.satellites) : (ioElements["io_21"] != null ? Number(ioElements["io_21"]) : null),
    hdop: raw.hdop != null ? Number(raw.hdop) : null,
    temperature: ioElements["io_72"] != null ? Number(ioElements["io_72"]) : null,
    humidity: ioElements["io_73"] != null ? Number(ioElements["io_73"]) : null,
    extras: {
      priority: raw.priority,
      event_id: raw.event_id,
      io_elements: ioElements,
      protocol_specific: { codec: raw.codec || "codec8e" },
    },
  };
}

function normalizeQueclinkEvent(raw: Record<string, unknown>): NormalizedEvent {
  // Queclink CSV-based protocol (+RESP:GTFRI, +RESP:GTSOS, etc.)
  const fields = (raw.fields as string[]) || [];
  return {
    ts: (raw.timestamp as string) || (raw.send_time as string) || new Date().toISOString(),
    latitude: Number(raw.latitude || fields[4] || 0),
    longitude: Number(raw.longitude || fields[5] || 0),
    speed: Number(raw.speed || fields[7] || 0),
    heading: Number(raw.heading || fields[8] || 0),
    altitude: raw.altitude != null ? Number(raw.altitude || fields[6]) : null,
    fuel_level: raw.fuel_level != null ? Number(raw.fuel_level) : null,
    engine_on: raw.engine_on != null ? Boolean(raw.engine_on) : null,
    odometer: raw.odometer != null ? Number(raw.odometer || fields[12]) : null,
    satellites: raw.satellites != null ? Number(raw.satellites || fields[11]) : null,
    hdop: raw.hdop != null ? Number(raw.hdop) : null,
    temperature: raw.temperature != null ? Number(raw.temperature) : null,
    humidity: null,
    extras: {
      message_type: raw.message_type || fields[0],
      device_type: raw.device_type,
      protocol_specific: { format: "csv", report_type: raw.report_type || fields[1] },
    },
  };
}

function normalizeConcoxEvent(raw: Record<string, unknown>): NormalizedEvent {
  // Concox/Jimi binary protocol
  return {
    ts: (raw.timestamp as string) || (raw.ts as string) || new Date().toISOString(),
    latitude: Number(raw.latitude || raw.lat || 0),
    longitude: Number(raw.longitude || raw.lng || 0),
    speed: Number(raw.speed || 0),
    heading: Number(raw.heading || raw.course || 0),
    altitude: raw.altitude != null ? Number(raw.altitude) : null,
    fuel_level: null,
    engine_on: raw.acc != null ? Boolean(raw.acc) : null,
    odometer: raw.mileage != null ? Number(raw.mileage) : null,
    satellites: raw.satellites != null ? Number(raw.satellites) : null,
    hdop: null,
    temperature: null,
    humidity: null,
    extras: {
      gsm_signal: raw.gsm_signal,
      battery_voltage: raw.battery_voltage,
      protocol_specific: { format: "binary", packet_type: raw.packet_type },
    },
  };
}

function normalizeOBD2Event(raw: Record<string, unknown>): NormalizedEvent {
  const pids = (raw.pids || {}) as Record<string, unknown>;
  return {
    ts: (raw.timestamp as string) || new Date().toISOString(),
    latitude: Number(raw.latitude || raw.lat || 0),
    longitude: Number(raw.longitude || raw.lng || 0),
    speed: Number(raw.speed || pids["pid_0D"] || 0),
    heading: Number(raw.heading || 0),
    altitude: null,
    fuel_level: pids["pid_2F"] != null ? Number(pids["pid_2F"]) : null,
    engine_on: pids["pid_0C"] != null ? Number(pids["pid_0C"]) > 0 : null,
    odometer: null,
    satellites: null,
    hdop: null,
    temperature: pids["pid_05"] != null ? Number(pids["pid_05"]) : null,
    humidity: null,
    extras: {
      rpm: pids["pid_0C"],
      coolant_temp: pids["pid_05"],
      throttle: pids["pid_11"],
      dtc_codes: raw.dtc_codes,
      protocol_specific: { format: "obd2", elm_version: raw.elm_version },
    },
  };
}

function normalizeGenericEvent(raw: Record<string, unknown>): NormalizedEvent {
  return {
    ts: (raw.ts as string) || (raw.timestamp as string) || (raw.time as string) || new Date().toISOString(),
    latitude: Number(raw.latitude || raw.lat || raw.y || 0),
    longitude: Number(raw.longitude || raw.lng || raw.lon || raw.x || 0),
    speed: Number(raw.speed || raw.spd || raw.velocity || 0),
    heading: Number(raw.heading || raw.hdg || raw.course || raw.bearing || 0),
    altitude: raw.altitude != null ? Number(raw.altitude || raw.alt || raw.elevation) : null,
    fuel_level: raw.fuel_level != null ? Number(raw.fuel_level || raw.fuel) : null,
    engine_on: raw.engine_on != null ? Boolean(raw.engine_on || raw.ignition) : null,
    odometer: raw.odometer != null ? Number(raw.odometer || raw.mileage) : null,
    satellites: raw.satellites != null ? Number(raw.satellites || raw.sats) : null,
    hdop: raw.hdop != null ? Number(raw.hdop) : null,
    temperature: raw.temperature != null ? Number(raw.temperature || raw.temp) : null,
    humidity: raw.humidity != null ? Number(raw.humidity) : null,
    extras: raw.extras as Record<string, unknown> || {},
  };
}

// ═══════════════════════════════════════════════════════════
// NMEA 0183 Parser ($GPGGA, $GPRMC, $GPVTG)
// ═══════════════════════════════════════════════════════════

function parseNMEACoord(raw: string, dir: string): number {
  if (!raw || !dir) return 0;
  // NMEA: ddmm.mmmm (lat) or dddmm.mmmm (lon)
  const isLon = dir === "E" || dir === "W";
  const degLen = isLon ? 3 : 2;
  const deg = parseInt(raw.substring(0, degLen));
  const min = parseFloat(raw.substring(degLen));
  let result = deg + min / 60;
  if (dir === "S" || dir === "W") result = -result;
  return Math.round(result * 1e7) / 1e7;
}

function parseNMEATime(timeStr: string, dateStr?: string): string {
  if (!timeStr) return new Date().toISOString();
  const hh = timeStr.substring(0, 2);
  const mm = timeStr.substring(2, 4);
  const ss = timeStr.substring(4, 6);
  if (dateStr && dateStr.length >= 6) {
    const dd = dateStr.substring(0, 2);
    const mo = dateStr.substring(2, 4);
    const yy = dateStr.substring(4, 6);
    return new Date(`20${yy}-${mo}-${dd}T${hh}:${mm}:${ss}Z`).toISOString();
  }
  const now = new Date();
  return new Date(`${now.toISOString().split("T")[0]}T${hh}:${mm}:${ss}Z`).toISOString();
}

function normalizeNMEAEvent(raw: Record<string, unknown>): NormalizedEvent {
  // If pre-parsed sentences are passed
  const sentences = (raw.sentences || raw.nmea || []) as string[];
  let lat = 0, lng = 0, alt: number | null = null, speed = 0, heading = 0;
  let sats: number | null = null, hdop: number | null = null;
  let ts = new Date().toISOString();
  let quality = 0;

  for (const sentence of sentences) {
    const parts = sentence.replace(/\*[0-9A-Fa-f]{2}$/, "").split(",");
    const type = parts[0];

    if (type === "$GPGGA" || type === "$GNGGA") {
      // $GPGGA,time,lat,N/S,lon,E/W,quality,sats,hdop,alt,M,...
      ts = parseNMEATime(parts[1]);
      lat = parseNMEACoord(parts[2], parts[3]);
      lng = parseNMEACoord(parts[4], parts[5]);
      quality = parseInt(parts[6]) || 0;
      sats = parseInt(parts[7]) || null;
      hdop = parseFloat(parts[8]) || null;
      alt = parts[9] ? parseFloat(parts[9]) : null;
    } else if (type === "$GPRMC" || type === "$GNRMC") {
      // $GPRMC,time,status,lat,N/S,lon,E/W,speed_knots,course,date,...
      ts = parseNMEATime(parts[1], parts[9]);
      if (parts[3]) lat = parseNMEACoord(parts[3], parts[4]);
      if (parts[5]) lng = parseNMEACoord(parts[5], parts[6]);
      speed = parts[7] ? parseFloat(parts[7]) * 1.852 : 0; // knots -> km/h
      heading = parts[8] ? parseFloat(parts[8]) : 0;
    } else if (type === "$GPVTG" || type === "$GNVTG") {
      // $GPVTG,course_true,T,course_mag,M,speed_knots,N,speed_kmh,K,...
      heading = parts[1] ? parseFloat(parts[1]) : heading;
      speed = parts[7] ? parseFloat(parts[7]) : speed;
    }
  }

  // Fallback to raw fields if no sentences
  if (lat === 0 && lng === 0) {
    lat = Number(raw.latitude || raw.lat || 0);
    lng = Number(raw.longitude || raw.lng || 0);
    speed = Number(raw.speed || 0);
    heading = Number(raw.heading || raw.course || 0);
    alt = raw.altitude != null ? Number(raw.altitude) : null;
    sats = raw.satellites != null ? Number(raw.satellites) : null;
    hdop = raw.hdop != null ? Number(raw.hdop) : null;
    ts = (raw.ts as string) || (raw.timestamp as string) || ts;
  }

  return {
    ts,
    latitude: lat,
    longitude: lng,
    speed: Math.round(speed * 10) / 10,
    heading: Math.round(heading * 10) / 10,
    altitude: alt,
    fuel_level: null,
    engine_on: null,
    odometer: null,
    satellites: sats,
    hdop,
    temperature: raw.temperature != null ? Number(raw.temperature) : null,
    humidity: null,
    extras: {
      nmea_quality: quality,
      protocol_specific: { format: "nmea_0183", sentence_count: sentences.length },
    },
  };
}

function normalizeEvent(protocol: string, raw: Record<string, unknown>): NormalizedEvent {
  switch (protocol) {
    case "teltonika": return normalizeTeltonikaEvent(raw);
    case "queclink": return normalizeQueclinkEvent(raw);
    case "concox": return normalizeConcoxEvent(raw);
    case "obd2": return normalizeOBD2Event(raw);
    case "nmea": return normalizeNMEAEvent(raw);
    default: return normalizeGenericEvent(raw);
  }
}

// ═══════════════════════════════════════════════════════════
// Validation & Quality
// ═══════════════════════════════════════════════════════════

function validateEvent(event: NormalizedEvent): { valid: boolean; reason?: string } {
  if (event.latitude < -90 || event.latitude > 90) return { valid: false, reason: "latitude out of range" };
  if (event.longitude < -180 || event.longitude > 180) return { valid: false, reason: "longitude out of range" };
  if (event.latitude === 0 && event.longitude === 0) return { valid: false, reason: "null island coordinates" };
  if (event.speed < 0 || event.speed > 400) return { valid: false, reason: "speed out of range" };
  const ts = new Date(event.ts);
  if (isNaN(ts.getTime())) return { valid: false, reason: "invalid timestamp" };
  // Reject events more than 7 days in the future or 1 year in the past
  const now = Date.now();
  if (ts.getTime() > now + 7 * 86400000) return { valid: false, reason: "timestamp in future" };
  if (ts.getTime() < now - 365 * 86400000) return { valid: false, reason: "timestamp too old" };
  return { valid: true };
}

function generateIdempotencyKey(imei: string, payload: GatewayPayload): string {
  // Deterministic key based on IMEI + first event timestamp + event count
  const firstTs = payload.events?.[0]?.ts || payload.events?.[0]?.timestamp || "no-ts";
  const count = payload.events?.length || 0;
  const seq = payload.sequence ?? "no-seq";
  return `${imei}:${firstTs}:${count}:${seq}`;
}

function sortEventsByTimestamp(events: NormalizedEvent[]): NormalizedEvent[] {
  return events.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
}

// ═══════════════════════════════════════════════════════════
// Main Handler
// ═══════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const payload: GatewayPayload = await req.json();
    const headerProtocol = req.headers.get("x-protocol");
    const headerIdempotencyKey = req.headers.get("x-idempotency-key");

    // ── Validation ──
    if (!payload.imei) {
      return new Response(JSON.stringify({ error: "imei required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!payload.events?.length) {
      return new Response(JSON.stringify({ error: "events array required and must not be empty" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Protocol Detection ──
    const protocol = detectProtocol(payload, headerProtocol);

    // ── Idempotency Check ──
    const idempotencyKey = headerIdempotencyKey || generateIdempotencyKey(payload.imei, payload);

    // ── Device Lookup ──
    const { data: device, error: deviceErr } = await supabase
      .from("devices")
      .select("id, vehicle_id, tenant_id, protocol, protocol_version")
      .eq("imei", payload.imei)
      .eq("active", true)
      .single();

    if (deviceErr || !device) {
      // Store & Forward: save raw message even if device not found
      // Device might be registered later
      await supabase.from("device_messages_raw").upsert({
        imei: payload.imei,
        protocol,
        raw_payload: payload,
        idempotency_key: idempotencyKey,
        status: "orphan",
        event_count: payload.events.length,
        sequence_number: payload.sequence,
        tenant_id: "00000000-0000-0000-0000-000000000000", // placeholder for orphan
        error_message: "Device not found: " + payload.imei,
      }, { onConflict: "idempotency_key", ignoreDuplicates: true });

      return new Response(JSON.stringify({
        error: "Device not found",
        imei: payload.imei,
        stored: true,
        message: "Message stored for future processing when device is registered",
      }), {
        status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Deduplication Check ──
    const { data: existingMsg } = await supabase
      .from("device_messages_raw")
      .select("id, status")
      .eq("idempotency_key", idempotencyKey)
      .single();

    if (existingMsg?.status === "processed") {
      return new Response(JSON.stringify({
        success: true,
        duplicate: true,
        idempotency_key: idempotencyKey,
        message: "Message already processed (idempotent)",
      } satisfies Partial<ProcessingResult>), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Store Raw Message (Store & Forward) ──
    const { error: storeErr } = await supabase.from("device_messages_raw").upsert({
      tenant_id: device.tenant_id,
      device_id: device.id,
      imei: payload.imei,
      protocol,
      raw_payload: payload,
      idempotency_key: idempotencyKey,
      status: "processing",
      event_count: payload.events.length,
      sequence_number: payload.sequence,
      attempts: (existingMsg ? 1 : 0) + 1,
    }, { onConflict: "idempotency_key" });

    if (storeErr) {
      console.error("Store raw message error:", storeErr);
    }

    // ── Normalize Events ──
    const normalizedEvents: NormalizedEvent[] = [];
    const invalidEvents: { index: number; reason: string }[] = [];

    for (let i = 0; i < payload.events.length; i++) {
      const raw = payload.events[i] as Record<string, unknown>;
      const normalized = normalizeEvent(protocol, raw);
      const validation = validateEvent(normalized);

      if (validation.valid) {
        normalizedEvents.push(normalized);
      } else {
        invalidEvents.push({ index: i, reason: validation.reason! });
      }
    }

    // ── Sort by Timestamp (handle out-of-order) ──
    const sortedEvents = sortEventsByTimestamp(normalizedEvents);

    // ── Insert Telemetry Events ──
    const telemetryRows = sortedEvents.map((e) => ({
      tenant_id: device.tenant_id,
      vehicle_id: device.vehicle_id,
      device_id: device.id,
      ts: e.ts,
      latitude: e.latitude,
      longitude: e.longitude,
      speed: e.speed,
      heading: e.heading,
      altitude: e.altitude,
      fuel_level: e.fuel_level,
      engine_on: e.engine_on,
      odometer: e.odometer,
      satellites: e.satellites ?? 0,
      hdop: e.hdop,
      extras: e.extras,
      source: protocol,
    }));

    const { error: insertErr } = await supabase.from("telemetry_events").insert(telemetryRows);

    if (insertErr) {
      // Mark as failed for retry
      await supabase.from("device_messages_raw").update({
        status: "failed",
        error_message: insertErr.message,
        next_retry_at: new Date(Date.now() + 30000).toISOString(), // retry in 30s
        normalized_payload: { events: sortedEvents },
      }).eq("idempotency_key", idempotencyKey);

      return new Response(JSON.stringify({
        error: "Processing failed, message stored for retry",
        details: insertErr.message,
        idempotency_key: idempotencyKey,
      }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Update Device State ──
    await supabase.from("devices").update({
      last_seen_at: new Date().toISOString(),
      protocol: protocol,
    }).eq("id", device.id);

    // ── Cold Chain Data ──
    const coldChainRows = sortedEvents
      .filter((e) => e.temperature !== null)
      .map((e) => ({
        tenant_id: device.tenant_id,
        vehicle_id: device.vehicle_id!,
        sensor_id: payload.imei,
        temperature: e.temperature!,
        humidity: e.humidity,
        ts: e.ts,
        in_range: e.temperature! >= -25 && e.temperature! <= 25,
        latitude: e.latitude,
        longitude: e.longitude,
      }));

    if (coldChainRows.length > 0) {
      await supabase.from("cold_chain_logs").insert(coldChainRows);
    }

    // ── GNSS Anomaly Detection (inline) ──
    let anomaliesDetected = 0;
    const { data: prevTelemetry } = await supabase
      .from("telemetry_events")
      .select("latitude, longitude, speed, heading, altitude, ts")
      .eq("vehicle_id", device.vehicle_id)
      .order("ts", { ascending: false })
      .limit(2); // Get 2: the one we just inserted + previous

    // Use second result (actual previous) if available
    const prevState = prevTelemetry && prevTelemetry.length >= 2 ? prevTelemetry[1] : null;
    const gnssAnomalies: Record<string, unknown>[] = [];

    if (prevState) {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { count: fleetCount } = await supabase
        .from("gnss_anomalies")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", device.tenant_id)
        .gte("ts", fiveMinAgo)
        .neq("vehicle_id", device.vehicle_id);
      const fleetAnomalyCount = fleetCount || 0;

      for (const event of sortedEvents) {
        const rules: string[] = [];
        let totalWeight = 0;

        if (event.satellites !== null) {
          if (event.satellites <= 2) { rules.push("SAT_DROP_CRITICAL"); totalWeight += 0.35; }
          else if (event.satellites <= 4) { rules.push("SAT_DROP_LOW"); totalWeight += 0.20; }
        }
        if (event.hdop !== null) {
          if (event.hdop > 10) { rules.push("HDOP_DEGRADED"); totalWeight += 0.25; }
          else if (event.hdop < 0.5) { rules.push("HDOP_TOO_PERFECT"); totalWeight += 0.20; }
        }

        const R = 6371000;
        const pLat = Number(prevState.latitude || 0);
        const pLon = Number(prevState.longitude || 0);
        const dLat = ((event.latitude - pLat) * Math.PI) / 180;
        const dLon = ((event.longitude - pLon) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(pLat * Math.PI / 180) * Math.cos(event.latitude * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        const jumpM = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const dtSec = (new Date(event.ts).getTime() - new Date(prevState.ts).getTime()) / 1000;
        const maxSpd = Math.max(Number(prevState.speed || 0), event.speed) / 3.6;
        const expectedMaxM = dtSec > 0 ? Math.max(maxSpd * dtSec * 1.5, 100) : 100;

        if (dtSec > 0 && jumpM > expectedMaxM * 3) { rules.push("POSITION_TELEPORT"); totalWeight += 0.40; }
        else if (dtSec > 0 && jumpM > expectedMaxM * 1.5) { rules.push("POSITION_JUMP"); totalWeight += 0.20; }

        if (event.speed > 20 && jumpM < 5) { rules.push("SPEED_WITHOUT_MOVEMENT"); totalWeight += 0.25; }

        if (rules.length > 0) {
          let confidence = Math.min(totalWeight, 1.0);
          if (fleetAnomalyCount >= 3) { confidence = Math.min(confidence + 0.15, 1.0); rules.push("FLEET_CORRELATED"); }

          let anomalyType = "unknown";
          if (rules.includes("HDOP_TOO_PERFECT") || rules.includes("SPEED_WITHOUT_MOVEMENT") || rules.includes("POSITION_TELEPORT")) anomalyType = "spoofing";
          else if (rules.includes("SAT_DROP_CRITICAL") || rules.includes("SAT_DROP_LOW")) anomalyType = fleetAnomalyCount >= 2 ? "jamming" : "interference";
          else if (rules.includes("POSITION_JUMP")) anomalyType = "drift";

          let severity = "low";
          if (confidence >= 0.8) severity = "critical";
          else if (confidence >= 0.6) severity = "high";
          else if (confidence >= 0.35) severity = "medium";

          gnssAnomalies.push({
            tenant_id: device.tenant_id, vehicle_id: device.vehicle_id, device_id: device.id,
            ts: event.ts, anomaly_type: anomalyType, confidence_score: Math.round(confidence * 100) / 100,
            severity, satellites: event.satellites, hdop: event.hdop,
            speed: event.speed, heading: event.heading, altitude: event.altitude,
            position_jump_m: jumpM, expected_max_m: expectedMaxM,
            fleet_anomaly_count: fleetAnomalyCount, rules_triggered: rules,
            features_snapshot: { jumpM, expectedMaxM, dtSec, protocol }, status: "open",
          });
          anomaliesDetected++;
        }
      }

      if (gnssAnomalies.length > 0) {
        await supabase.from("gnss_anomalies").insert(gnssAnomalies);
      }
    }

    // ── Policy Engine Evaluation ──
    const { data: activePolicies } = await supabase
      .from("policies")
      .select("*")
      .eq("tenant_id", device.tenant_id)
      .eq("status", "active");

    const triggeredAlerts: Record<string, unknown>[] = [];

    if (activePolicies) {
      for (const policy of activePolicies) {
        for (const event of sortedEvents) {
          const conditions = policy.conditions as { type: string; operator: string; value: string }[];
          const allMatch = conditions.every((c) => {
            const val = parseFloat(c.value);
            switch (c.type) {
              case "speed": return c.operator === ">" ? event.speed > val : event.speed < val;
              case "temperature": return event.temperature !== null && (c.operator === ">" ? event.temperature > val : event.temperature < val);
              case "fuel": return event.fuel_level !== null && c.operator === "<" && event.fuel_level < val;
              default: return false;
            }
          });

          if (allMatch && conditions.length > 0) {
            const actions = policy.actions as { type: string; config?: Record<string, unknown> }[];
            const severity = (actions.find((a) => a.type === "alert")?.config?.severity as string) || "medium";

            triggeredAlerts.push({
              tenant_id: device.tenant_id,
              vehicle_id: device.vehicle_id,
              policy_id: policy.id,
              severity,
              type: conditions[0]?.type || "custom",
              message: `${policy.name}: ${policy.description || ""}`,
              data: { event, policy_id: policy.id, protocol },
            });

            await supabase.from("policies").update({
              trigger_count: (policy.trigger_count || 0) + 1,
              last_triggered_at: new Date().toISOString(),
            }).eq("id", policy.id);
          }
        }
      }
    }

    if (triggeredAlerts.length > 0) {
      await supabase.from("alerts").insert(triggeredAlerts);
    }

    // ── Mark Raw Message as Processed ──
    await supabase.from("device_messages_raw").update({
      status: "processed",
      processed_at: new Date().toISOString(),
      normalized_payload: { events: sortedEvents },
    }).eq("idempotency_key", idempotencyKey);

    // ── Update Protocol Registry Stats ──
    await supabase.from("protocol_registry").update({
      last_message_at: new Date().toISOString(),
    }).eq("protocol_name", protocol);

    const result: ProcessingResult = {
      success: true,
      events_stored: sortedEvents.length,
      events_normalized: normalizedEvents.length,
      alerts_triggered: triggeredAlerts.length,
      anomalies_detected: anomaliesDetected,
      idempotency_key: idempotencyKey,
      duplicate: false,
    };

    const processingMs = Date.now() - startTime;

    return new Response(JSON.stringify({
      ...result,
      processing_ms: processingMs,
      protocol,
      invalid_events: invalidEvents.length > 0 ? invalidEvents : undefined,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Device Gateway error:", err);
    return new Response(JSON.stringify({ error: "Internal gateway error", message: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
