import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { routeRecords } from '@/lib/demoData';
import type { RouteReplayPoint } from '@/features/monitoring/types/mapTypes';

export function useRouteHistory(vehicleId: string | null, dateRange?: { start: string; end: string }) {
  return useQuery<RouteReplayPoint[]>({
    queryKey: ['route-history', vehicleId, dateRange],
    queryFn: async () => {
      try {
        const startDate = dateRange?.start || new Date(Date.now() - 86400000).toISOString();
        const endDate = dateRange?.end || new Date().toISOString();

        const { data, error } = await supabase
          .from('telemetry_events')
          .select('latitude, longitude, speed, heading, ts')
          .eq('vehicle_id', vehicleId!)
          .gte('ts', startDate)
          .lte('ts', endDate)
          .order('ts', { ascending: true })
          .limit(5000);

        if (error) throw error;
        if (data && data.length > 0) {
          return data.map((p) => ({
            lat: p.latitude,
            lng: p.longitude,
            speed: p.speed || 0,
            heading: p.heading || 0,
            timestamp: p.ts,
          }));
        }
        throw new Error('No data');
      } catch {
        // Fallback to demo data
        const route = routeRecords.find((r) => r.vehicleId === vehicleId) || routeRecords[0];
        return route.events.map((e) => ({
          lat: e.lat,
          lng: e.lng,
          speed: e.type === 'speeding' ? 110 : e.type === 'stop' ? 0 : 65,
          heading: Math.random() * 360,
          timestamp: `2026-02-11T${e.time}:00`,
        }));
      }
    },
    enabled: !!vehicleId,
    staleTime: 5 * 60 * 1000,
  });
}
