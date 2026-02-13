
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useWorkOrders(filters?: { status?: string }) {
    return useQuery({
        queryKey: ["work-orders", filters],
        queryFn: async () => {
            let query = supabase
                .from("work_orders")
                .select(`
          *,
          vehicles ( plate, brand, model )
        `)
                .order("created_at", { ascending: false });

            if (filters?.status) {
                if (filters.status === "active") {
                    query = query.in("status", ["pending", "in_progress"]);
                } else {
                    query = query.eq("status", filters.status);
                }
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        },
    });
}

export function useCreateWorkOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (order: { vehicle_id: string; type: string; description: string; priority: string; scheduled_at?: string }) => {
            // 1. Get Session for fallback
            const { data: { session } } = await supabase.auth.getSession();
            const sessionTenantId = session?.user?.user_metadata?.tenant_id;

            // 2. Always get vehicle tenant_id to be safe and consistent with vehicle owner
            const { data: v, error: vehError } = await supabase
                .from("vehicles")
                .select("tenant_id")
                .eq("id", order.vehicle_id)
                .single();

            if (vehError || !v) throw new Error("Vehicle not found or no tenant associated");

            const tenantId = v.tenant_id || sessionTenantId;

            if (!tenantId) throw new Error("Cannot determine tenant_id for new work order");

            const { data, error } = await supabase
                .from("work_orders")
                .insert({
                    ...order,
                    tenant_id: tenantId,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["work-orders"] });
        },
    });
}

export function useUpdateWorkOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
            const { data, error } = await supabase
                .from("work_orders")
                .update(updates)
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["work-orders"] });
        }
    });
}
