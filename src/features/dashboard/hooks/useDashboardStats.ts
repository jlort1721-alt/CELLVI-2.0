
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDashboardStats() {
    return useQuery({
        queryKey: ["dashboard-stats-overview"],
        queryFn: async () => {
            // For real implementation, parallel calls or a materialized view is ideal
            // For MVP, parallel counts:

            console.time("dashboard-stats");
            const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD local

            const [
                { count: vehiclesCount },
                { count: inspectionsTotal },
                { count: inspectionsFailed },
                { count: alertsCritical }
            ] = await Promise.all([
                supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("active", true),
                supabase.from("pesv_inspections").select("*", { count: "exact", head: true }).eq("inspection_date", today),
                supabase.from("pesv_inspections").select("*", { count: "exact", head: true }).eq("inspection_date", today).neq("status", "approved"),
                supabase.from("alerts").select("*", { count: "exact", head: true }).eq("status", "open").eq("severity", "critical")
            ]);
            console.timeEnd("dashboard-stats");

            return {
                vehicles: vehiclesCount || 0,
                inspectionsToday: inspectionsTotal || 0,
                failedInspections: inspectionsFailed || 0,
                criticalAlerts: alertsCritical || 0,
                efficiency: 0.94 // Mock for now, would be formula based on active time
            };
        },
        refetchInterval: 30000,
    });
}
