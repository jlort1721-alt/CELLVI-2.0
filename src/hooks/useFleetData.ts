// Hooks for querying multi-tenant data from Supabase
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Json } from "@/integrations/supabase/types";
import { getPaginationRange, buildPaginationResult, DEFAULT_PAGE_SIZES, type PaginationResult, type PaginatedQueryOptions } from "@/lib/pagination";
import { toast } from "sonner";

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
    onMutate: async (newVehicle) => {
      await qc.cancelQueries({ queryKey: ["vehicles"] });
      const previous = qc.getQueryData(["vehicles"]);
      qc.setQueryData(["vehicles"], (old: any) => {
        const optimisticVehicle = {
          id: `temp-${Date.now()}`,
          ...newVehicle,
          active: true,
          created_at: new Date().toISOString(),
        };
        return old ? [...old, optimisticVehicle] : [optimisticVehicle];
      });
      return { previous };
    },
    onError: (err, newVehicle, context: any) => {
      qc.setQueryData(["vehicles"], context.previous);
      toast.error("Error al crear vehículo");
    },
    onSuccess: () => {
      toast.success("Vehículo creado exitosamente");
      qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
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
    onMutate: async (newDevice) => {
      await qc.cancelQueries({ queryKey: ["devices"] });
      const previous = qc.getQueryData(["devices"]);
      qc.setQueryData(["devices"], (old: any) => {
        const optimisticDevice = {
          id: `temp-${Date.now()}`,
          ...newDevice,
          created_at: new Date().toISOString(),
        };
        return old ? [...old, optimisticDevice] : [optimisticDevice];
      });
      return { previous };
    },
    onError: (err, newDevice, context: any) => {
      qc.setQueryData(["devices"], context.previous);
      toast.error("Error al crear dispositivo");
    },
    onSuccess: () => {
      toast.success("Dispositivo creado exitosamente");
      qc.invalidateQueries({ queryKey: ["devices"] });
    },
  });
};

// ==================== TELEMETRY ====================
// NOTE: This hook no longer polls. Use useRealtimeTelemetry() to subscribe to live updates.
export const useTelemetry = (vehicleId?: string, options: PaginatedQueryOptions = {}) => {
  const page = options.page || 1;
  const pageSize = options.pageSize || DEFAULT_PAGE_SIZES.telemetry;

  return useQuery({
    queryKey: ["telemetry", vehicleId, page, pageSize],
    queryFn: async (): Promise<PaginationResult<any>> => {
      const { from, to } = getPaginationRange(page, pageSize);

      // Get total count
      let countQuery = supabase
        .from("telemetry_events")
        .select("*", { count: "exact", head: true });
      if (vehicleId) countQuery = countQuery.eq("vehicle_id", vehicleId);
      const { count } = await countQuery;

      // Get paginated data
      let dataQuery = supabase
        .from("telemetry_events")
        .select("*")
        .order("ts", { ascending: false })
        .range(from, to);
      if (vehicleId) dataQuery = dataQuery.eq("vehicle_id", vehicleId);
      const { data, error } = await dataQuery;

      if (error) throw error;

      return buildPaginationResult(data, count || 0, page, pageSize);
    },
    // ✅ NO MORE POLLING - Use useRealtimeTelemetry() hook for live updates
    enabled: options.enabled !== false,
  });
};

// ==================== ALERTS ====================
// NOTE: This hook no longer polls. Use useRealtimeAlerts() to subscribe to live updates.
export const useAlerts = (options: PaginatedQueryOptions = {}) => {
  const page = options.page || 1;
  const pageSize = options.pageSize || DEFAULT_PAGE_SIZES.alerts;

  return useQuery({
    queryKey: ["alerts", page, pageSize],
    queryFn: async (): Promise<PaginationResult<any>> => {
      const { from, to } = getPaginationRange(page, pageSize);

      // Get total count
      const { count } = await supabase
        .from("alerts")
        .select("*", { count: "exact", head: true });

      // Get paginated data
      const { data, error } = await supabase
        .from("alerts")
        .select("*, vehicles(plate), policies(name)")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      return buildPaginationResult(data, count || 0, page, pageSize);
    },
    // ✅ NO MORE POLLING - Use useRealtimeAlerts() hook for live updates
    enabled: options.enabled !== false,
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
    onMutate: async (alertId) => {
      await qc.cancelQueries({ queryKey: ["alerts"] });
      const previous = qc.getQueryData(["alerts"]);
      qc.setQueryData(["alerts"], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((alert: any) =>
            alert.id === alertId
              ? { ...alert, acknowledged: true, acknowledged_by: user?.id, acknowledged_at: new Date().toISOString() }
              : alert
          ),
        };
      });
      return { previous };
    },
    onError: (err, alertId, context: any) => {
      qc.setQueryData(["alerts"], context.previous);
      toast.error("Error al reconocer alerta");
    },
    onSuccess: () => {
      toast.success("Alerta reconocida");
      qc.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
};

// ==================== EVIDENCE ====================
export const useEvidence = (options: PaginatedQueryOptions = {}) => {
  const page = options.page || 1;
  const pageSize = options.pageSize || DEFAULT_PAGE_SIZES.evidence;

  return useQuery({
    queryKey: ["evidence", page, pageSize],
    queryFn: async (): Promise<PaginationResult<any>> => {
      const { from, to } = getPaginationRange(page, pageSize);

      // Get total count
      const { count } = await supabase
        .from("evidence_records")
        .select("*", { count: "exact", head: true });

      // Get paginated data
      const { data, error } = await supabase
        .from("evidence_records")
        .select("*, vehicles(plate)")
        .order("sealed_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      return buildPaginationResult(data, count || 0, page, pageSize);
    },
    enabled: options.enabled !== false,
  });
};

// ==================== COLD CHAIN ====================
// NOTE: Consider adding useRealtimeColdChain() if real-time temperature monitoring is critical
export const useColdChainLogs = (vehicleId?: string, options: PaginatedQueryOptions = {}) => {
  const page = options.page || 1;
  const pageSize = options.pageSize || DEFAULT_PAGE_SIZES.cold_chain;

  return useQuery({
    queryKey: ["cold_chain", vehicleId, page, pageSize],
    queryFn: async (): Promise<PaginationResult<any>> => {
      const { from, to } = getPaginationRange(page, pageSize);

      // Get total count
      let countQuery = supabase
        .from("cold_chain_logs")
        .select("*", { count: "exact", head: true });
      if (vehicleId) countQuery = countQuery.eq("vehicle_id", vehicleId);
      const { count } = await countQuery;

      // Get paginated data
      let dataQuery = supabase
        .from("cold_chain_logs")
        .select("*, vehicles(plate)")
        .order("ts", { ascending: false })
        .range(from, to);
      if (vehicleId) dataQuery = dataQuery.eq("vehicle_id", vehicleId);
      const { data, error } = await dataQuery;

      if (error) throw error;

      return buildPaginationResult(data, count || 0, page, pageSize);
    },
    // ✅ NO MORE POLLING - Consider adding Realtime subscription if needed
    enabled: options.enabled !== false,
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
    onMutate: async (newPolicy) => {
      await qc.cancelQueries({ queryKey: ["policies"] });
      const previous = qc.getQueryData(["policies"]);
      qc.setQueryData(["policies"], (old: any) => {
        const optimisticPolicy = {
          id: `temp-${Date.now()}`,
          ...newPolicy,
          status: newPolicy.status || 'draft',
          created_at: new Date().toISOString(),
        };
        return old ? [optimisticPolicy, ...old] : [optimisticPolicy];
      });
      return { previous };
    },
    onError: (err, newPolicy, context: any) => {
      qc.setQueryData(["policies"], context.previous);
      toast.error("Error al crear política");
    },
    onSuccess: () => {
      toast.success("Política creada exitosamente");
      qc.invalidateQueries({ queryKey: ["policies"] });
    },
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
    onMutate: async ({ id, ...updates }) => {
      await qc.cancelQueries({ queryKey: ["policies"] });
      const previous = qc.getQueryData(["policies"]);
      qc.setQueryData(["policies"], (old: any) => {
        if (!old) return old;
        return old.map((policy: any) =>
          policy.id === id ? { ...policy, ...updates } : policy
        );
      });
      return { previous };
    },
    onError: (err, variables, context: any) => {
      qc.setQueryData(["policies"], context.previous);
      toast.error("Error al actualizar política");
    },
    onSuccess: () => {
      toast.success("Política actualizada exitosamente");
      qc.invalidateQueries({ queryKey: ["policies"] });
    },
  });
};

export const useDeletePolicy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("policies").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["policies"] });
      const previous = qc.getQueryData(["policies"]);
      qc.setQueryData(["policies"], (old: any) => {
        if (!old) return old;
        return old.filter((policy: any) => policy.id !== id);
      });
      return { previous };
    },
    onError: (err, id, context: any) => {
      qc.setQueryData(["policies"], context.previous);
      toast.error("Error al eliminar política");
    },
    onSuccess: () => {
      toast.success("Política eliminada exitosamente");
      qc.invalidateQueries({ queryKey: ["policies"] });
    },
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
    onMutate: async (newGeofence) => {
      await qc.cancelQueries({ queryKey: ["geofences"] });
      const previous = qc.getQueryData(["geofences"]);
      qc.setQueryData(["geofences"], (old: any) => {
        const optimisticGeofence = {
          id: `temp-${Date.now()}`,
          ...newGeofence,
          created_at: new Date().toISOString(),
        };
        return old ? [optimisticGeofence, ...old] : [optimisticGeofence];
      });
      return { previous };
    },
    onError: (err, newGeofence, context: any) => {
      qc.setQueryData(["geofences"], context.previous);
      toast.error("Error al crear geocerca");
    },
    onSuccess: () => {
      toast.success("Geocerca creada exitosamente");
      qc.invalidateQueries({ queryKey: ["geofences"] });
    },
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
    onMutate: async ({ id, ...updates }) => {
      await qc.cancelQueries({ queryKey: ["geofences"] });
      const previous = qc.getQueryData(["geofences"]);
      qc.setQueryData(["geofences"], (old: any) => {
        if (!old) return old;
        return old.map((geofence: any) =>
          geofence.id === id ? { ...geofence, ...updates } : geofence
        );
      });
      return { previous };
    },
    onError: (err, variables, context: any) => {
      qc.setQueryData(["geofences"], context.previous);
      toast.error("Error al actualizar geocerca");
    },
    onSuccess: () => {
      toast.success("Geocerca actualizada exitosamente");
      qc.invalidateQueries({ queryKey: ["geofences"] });
    },
  });
};

export const useDeleteGeofence = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("geofences").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["geofences"] });
      const previous = qc.getQueryData(["geofences"]);
      qc.setQueryData(["geofences"], (old: any) => {
        if (!old) return old;
        return old.filter((geofence: any) => geofence.id !== id);
      });
      return { previous };
    },
    onError: (err, id, context: any) => {
      qc.setQueryData(["geofences"], context.previous);
      toast.error("Error al eliminar geocerca");
    },
    onSuccess: () => {
      toast.success("Geocerca eliminada exitosamente");
      qc.invalidateQueries({ queryKey: ["geofences"] });
    },
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
    onMutate: async (newDriver) => {
      await qc.cancelQueries({ queryKey: ["drivers"] });
      const previous = qc.getQueryData(["drivers"]);
      qc.setQueryData(["drivers"], (old: any) => {
        const optimisticDriver = {
          id: `temp-${Date.now()}`,
          ...newDriver,
          score: 100,
          created_at: new Date().toISOString(),
        };
        return old ? [optimisticDriver, ...old] : [optimisticDriver];
      });
      return { previous };
    },
    onError: (err, newDriver, context: any) => {
      qc.setQueryData(["drivers"], context.previous);
      toast.error("Error al crear conductor");
    },
    onSuccess: () => {
      toast.success("Conductor creado exitosamente");
      qc.invalidateQueries({ queryKey: ["drivers"] });
    },
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

// ==================== VEHICLE POSITIONS (Cache Table) ====================
// FIX: N+1 Problem - Use vehicle_last_positions instead of querying telemetry N times
// ✅ NO MORE POLLING - Use useRealtimePositions() hook for live updates
export const useVehiclePositions = () => {
  return useQuery({
    queryKey: ["vehicle-positions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_last_positions")
        .select("*");
      if (error) throw error;
      return data;
    },
    staleTime: 30000, // 30 seconds - positions update frequently
  });
};

// ==================== DASHBOARD STATS ====================
// FIX: N+1 Problem - Single query for all dashboard metrics
// ✅ NO MORE POLLING - Stats are refreshed via Realtime subscriptions on source tables
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      // Get tenant_id from session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("user_id", session.user.id)
        .single();

      if (!profile?.tenant_id) return null;
      const tenantId = profile.tenant_id;

      // Execute all stats queries in parallel
      const [vehiclesData, alertsData, tripsData, telemetryData] = await Promise.all([
        supabase
          .from("vehicles")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("active", true),
        supabase
          .from("alerts")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("acknowledged", false),
        supabase
          .from("trips")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("status", "pending"),
        supabase
          .from("telemetry_events")
          .select("speed")
          .eq("tenant_id", tenantId)
          .gte("ts", new Date(Date.now() - 3600000).toISOString()) // Last hour
          .limit(1000),
      ]);

      // Calculate average speed
      const speeds = telemetryData.data?.map(t => t.speed).filter(s => s != null) || [];
      const avgSpeed = speeds.length > 0
        ? speeds.reduce((a, b) => a + b, 0) / speeds.length
        : 0;

      return {
        vehicleCount: vehiclesData.count || 0,
        activeAlerts: alertsData.count || 0,
        pendingTrips: tripsData.count || 0,
        avgSpeed: Math.round(avgSpeed * 10) / 10, // Round to 1 decimal
      };
    },
    staleTime: 60000, // 1 minute - dashboard stats don't change frequently
  });
};
