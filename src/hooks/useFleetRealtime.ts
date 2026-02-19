import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { VehiclePosition } from "@/types/shared";

export type { VehiclePosition };

export function useFleetRealtime() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const [positions, setPositions] = useState<Map<string, VehiclePosition>>(new Map());
  const positionsRef = useRef(positions);
  positionsRef.current = positions;

  useEffect(() => {
    if (!tenantId) return;

    // Load latest positions first
    const loadLatest = async () => {
      const { data } = await supabase
        .from("telemetry_events")
        .select("vehicle_id, latitude, longitude, speed, heading, engine_on, fuel_level, ts")
        .eq("tenant_id", tenantId)
        .order("ts", { ascending: false })
        .limit(100);

      if (data) {
        const map = new Map<string, VehiclePosition>();
        data.forEach((row) => {
          if (!map.has(row.vehicle_id) && row.latitude && row.longitude) {
            map.set(row.vehicle_id, {
              vehicle_id: row.vehicle_id,
              latitude: row.latitude,
              longitude: row.longitude,
              speed: row.speed || 0,
              heading: row.heading || 0,
              engine_on: row.engine_on,
              fuel_level: row.fuel_level,
              ts: row.ts,
            });
          }
        });
        setPositions(map);
      }
    };

    loadLatest();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`fleet-positions:${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "telemetry_events",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (row.latitude && row.longitude) {
            setPositions((prev) => {
              const next = new Map(prev);
              next.set(String(row.vehicle_id), {
                vehicle_id: String(row.vehicle_id),
                latitude: Number(row.latitude),
                longitude: Number(row.longitude),
                speed: Number(row.speed) || 0,
                heading: Number(row.heading) || 0,
                engine_on: row.engine_on as boolean | null,
                fuel_level: row.fuel_level as number | null,
                ts: String(row.ts),
              });
              return next;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  return { positions: Array.from(positions.values()), positionsMap: positions };
}
