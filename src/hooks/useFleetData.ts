// Hooks for querying multi-tenant data from Supabase
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Json } from "@/integrations/supabase/types";

// ==================== VEHICLES ====================
export const useVehicles = () => {
  return useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("active", true)
        .order("plate");
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateVehicle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vehicle: { tenant_id: string; plate: string; type?: string; brand?: string; model?: string; year?: number; vin?: string }) => {
      const { data, error } = await supabase.from("vehicles").insert(vehicle).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
};

// ==================== DEVICES ====================
export const useDevices = () => {
  return useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("devices")
        .select("*, vehicles(plate)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateDevice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (device: { tenant_id: string; imei: string; vehicle_id?: string; protocol?: string; connectivity?: string }) => {
      const { data, error } = await supabase.from("devices").insert(device).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["devices"] }),
  });
};

// ==================== TELEMETRY ====================
export const useTelemetry = (vehicleId?: string, limit = 100) => {
  return useQuery({
    queryKey: ["telemetry", vehicleId, limit],
    queryFn: async () => {
      let query = supabase
        .from("telemetry_events")
        .select("*")
        .order("ts", { ascending: false })
        .limit(limit);
      if (vehicleId) query = query.eq("vehicle_id", vehicleId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000, // Poll every 10 seconds
  });
};

// ==================== ALERTS ====================
export const useAlerts = (limit = 50) => {
  return useQuery({
    queryKey: ["alerts", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*, vehicles(plate), policies(name)")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });
};

export const useAcknowledgeAlert = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase.from("alerts").update({
        acknowledged: true,
        acknowledged_by: user?.id,
        acknowledged_at: new Date().toISOString(),
      }).eq("id", alertId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
};

// ==================== EVIDENCE ====================
export const useEvidence = (limit = 50) => {
  return useQuery({
    queryKey: ["evidence", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evidence_records")
        .select("*, vehicles(plate)")
        .order("sealed_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });
};

// ==================== COLD CHAIN ====================
export const useColdChainLogs = (vehicleId?: string, limit = 200) => {
  return useQuery({
    queryKey: ["cold_chain", vehicleId, limit],
    queryFn: async () => {
      let query = supabase
        .from("cold_chain_logs")
        .select("*, vehicles(plate)")
        .order("ts", { ascending: false })
        .limit(limit);
      if (vehicleId) query = query.eq("vehicle_id", vehicleId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000,
  });
};

// ==================== POLICIES ====================
export const usePolicies = () => {
  return useQuery({
    queryKey: ["policies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("policies")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useCreatePolicy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (policy: { tenant_id: string; name: string; description?: string; conditions: Json; actions: Json; logic?: string; status?: string; category?: string }) => {
      const { data, error } = await supabase.from("policies").insert(policy).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["policies"] }),
  });
};

export const useUpdatePolicy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string;[key: string]: unknown }) => {
      const { data, error } = await supabase.from("policies").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["policies"] }),
  });
};

export const useDeletePolicy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("policies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["policies"] }),
  });
};

// ==================== GEOFENCES ====================
export const useGeofences = () => {
  return useQuery({
    queryKey: ["geofences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("geofences")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateGeofence = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (geofence: { tenant_id: string; name: string; type?: string; coordinates?: Json; radius?: number; description?: string }) => {
      const { data, error } = await supabase.from("geofences").insert(geofence).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["geofences"] }),
  });
};

export const useUpdateGeofence = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string;[key: string]: unknown }) => {
      const { data, error } = await supabase.from("geofences").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["geofences"] }),
  });
};

export const useDeleteGeofence = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("geofences").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["geofences"] }),
  });
};

// ==================== DRIVERS ====================
export const useDrivers = () => {
  return useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("*, vehicles(plate)")
        .order("score", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateDriver = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (driver: { tenant_id: string; name: string; license_number?: string; phone?: string; email?: string; assigned_vehicle_id?: string }) => {
      const { data, error } = await supabase.from("drivers").insert(driver).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drivers"] }),
  });
};

// ==================== TENANT ====================
export const useTenant = () => {
  return useQuery({
    queryKey: ["tenant"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("user_id", session.user.id)
        .single();

      if (!profile?.tenant_id) return null;

      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", profile.tenant_id)
        .single();
      if (error) return null;
      return data;
    },
  });
};
