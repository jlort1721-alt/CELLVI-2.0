
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardStats } from "./useDashboardStats";

export { useDashboardStats };

export function useFleetStatus() {
    return useQuery({
        queryKey: ["fleet-status-list"],
        queryFn: async () => {
            // Fetch vehicles with their assigned driver and linked device status
            const { data: vehicles, error } = await supabase
                .from("vehicles")
                .select(`
            id, plate, brand, model,
            drivers ( name ),
            devices ( last_seen_at, config )
        `)
                .eq("active", true);

            if (error) throw error;

            return vehicles.map(v => {
                const device = v.devices?.[0]; // Assuming 1 active device per vehicle
                const lastSeen = device?.last_seen_at;
                const isOnline = lastSeen && (Date.now() - new Date(lastSeen).getTime()) < 1000 * 60 * 10; // 10 min threshold

                return {
                    id: v.id,
                    plate: v.plate,
                    driver: v.drivers?.[0]?.name || "Sin Asignar",
                    brand: v.brand,
                    status: isOnline ? "activo" : "apagado", // Could be 'detenido' if speed 0. logic TBD
                    lastSeen: lastSeen,
                    // These would come from a 'current_status' cache table or R/T stream
                    speed: 0,
                    fuel: 0
                };
            });
        },
        refetchInterval: 15000,
    });
}

export function useRecentAlerts() {
    return useQuery({
        queryKey: ["recent-alerts-timeline"],
        queryFn: async () => {
            const { data } = await supabase
                .from("alerts")
                .select("*, vehicles(plate)")
                .order("created_at", { ascending: false })
                .limit(15);

            return data?.map(a => ({
                id: a.id,
                time: new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                msg: `${a.vehicles?.plate || 'Sistema'} — ${a.message}`,
                severity: a.severity?.toLowerCase() || "info",
                type: a.type
            })) || [];
        },
        refetchInterval: 10000,
    });
}
