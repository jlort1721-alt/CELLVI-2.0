
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface SparePart {
    id: string;
    tenant_id: string;
    part_number: string | null;
    name: string;
    description: string | null;
    category: string | null;
    brand: string | null;
    current_stock: number;
    min_stock_level: number;
    unit_cost: number;
    location_in_warehouse: string | null;
}

export function useInventory() {
    const queryClient = useQueryClient();
    const { profile } = useAuth();

    const { data: parts, isLoading } = useQuery({
        queryKey: ["spare-parts", profile?.tenant_id],
        queryFn: async () => {
            if (!profile?.tenant_id) return [];

            const { data, error } = await (supabase
                .from("spare_parts" as any)
                .select("*")
                .eq("tenant_id", profile.tenant_id)
                .order("name") as any);

            if (error) throw error;
            return data as SparePart[];
        },
        enabled: !!profile?.tenant_id
    });

    const createPart = useMutation({
        mutationFn: async (newPart: Omit<SparePart, "id" | "tenant_id">) => {
            if (!profile?.tenant_id) throw new Error("No tenant ID");

            const { data, error } = await (supabase
                .from("spare_parts" as any)
                .insert({ ...newPart, tenant_id: profile.tenant_id })
                .select()
                .single() as any);

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["spare-parts"] });
        }
    });

    const updatePart = useMutation({
        mutationFn: async (part: Partial<SparePart> & { id: string }) => {
            const { data, error } = await (supabase
                .from("spare_parts" as any)
                .update(part)
                .eq("id", part.id)
                .select()
                .single() as any);

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["spare-parts"] });
        }
    });

    return {
        parts,
        isLoading,
        createPart,
        updatePart
    };
}
