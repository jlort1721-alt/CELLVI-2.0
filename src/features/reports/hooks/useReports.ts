
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useOperationalReport(dateRange: { start: string, end: string }) {
    return useQuery({
        queryKey: ["ops-report", dateRange],
        queryFn: async () => {
            // 1. Fetch Maintenance Costs
            // Aggregate total cost from work orders in range
            const { data: wo, error: woError } = await supabase
                .from("work_orders")
                .select("total_cost, status")
                .gte("created_at", dateRange.start)
                .lte("created_at", dateRange.end);

            if (woError) throw woError;

            const maintenanceCost = wo.reduce((sum, order) => sum + (order.total_cost || 0), 0);
            const ordersCount = wo.length;

            // 2. Fetch Inspections Count
            const { count: inspectionsCount, error: inspError } = await supabase
                .from("pesv_inspections")
                .select("*", { count: "exact", head: true })
                .gte("inspection_date", dateRange.start)
                .lte("inspection_date", dateRange.end);

            if (inspError) throw inspError;

            // 3. Calculate Fuel Efficiency (Real Aggregation)
            const { data: trips, error: tripsError } = await supabase
                .from("trips")
                .select("distance_actual_km, fuel_consumed_gal")
                .eq("status", "completed")
                .gte("actual_end_at", dateRange.start)
                .lte("actual_end_at", dateRange.end);

            if (tripsError) throw tripsError;

            let totalKm = 0;
            let totalFuelGal = 0;

            trips?.forEach(t => {
                totalKm += (t.distance_actual_km || 0);
                totalFuelGal += (t.fuel_consumed_gal || 0);
            });

            // Avoid division by zero
            // Formula: L/100km = (Gal * 3.785) / (Km / 100)
            let fuelEfficiency = 0;
            if (totalKm > 0 && totalFuelGal > 0) {
                const totalLiters = totalFuelGal * 3.78541;
                fuelEfficiency = (totalLiters / (totalKm / 100));
            }

            return {
                maintenanceCost,
                ordersCount,
                inspectionsCount: inspectionsCount || 0,
                fuelEfficiency: Number(fuelEfficiency.toFixed(2)),
                totalKm: Number(totalKm.toFixed(1)),
                period: `${dateRange.start} - ${dateRange.end}`
            };
        },
        staleTime: 1000 * 60 * 5
    });
}

export function useSecurityReport(dateRange: { start: string, end: string }) {
    return useQuery({
        queryKey: ["security-report", dateRange],
        queryFn: async () => {
            const { data: alerts, error } = await supabase
                .from("alerts")
                .select("severity, type, created_at")
                .gte("created_at", dateRange.start)
                .lte("created_at", dateRange.end)
                .in("severity", ["critical", "high"]);

            if (error) throw error;

            // Group alerts by type for charting
            const stats = alerts.reduce((acc, curr) => {
                acc[curr.type] = (acc[curr.type] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            return {
                totalIncidents: alerts.length,
                stats,
                raw: alerts
            };
        }
    });
}
