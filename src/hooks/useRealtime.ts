import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNotificationStore } from "@/stores/notificationStore";

export function useRealtimeAlerts() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    if (!tenantId) return;

    const channel = supabase
      .channel(`alerts:${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['alerts'] });
          const alert = payload.new as { id: string; message: string; severity: string; type?: string; vehicle_id?: string; vehicle_plate?: string };

          // Push to notification store for enterprise notification system
          addNotification({
            title: alert.severity === 'critical' ? 'Alerta Crítica' : 'Nueva Alerta',
            message: alert.message,
            severity: (alert.severity as 'critical' | 'high' | 'medium' | 'info') || 'info',
            type: alert.type || 'alert',
            vehicleId: alert.vehicle_id,
            vehiclePlate: alert.vehicle_plate,
          });

          if (alert.severity === 'critical') {
            toast.error(`🚨 ${alert.message}`);
          } else {
            toast.warning(alert.message);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, queryClient, addNotification]);
}

export function useRealtimeTelemetry() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  useEffect(() => {
    if (!tenantId) return;

    const channel = supabase
      .channel(`telemetry:${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'telemetry_events',
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['telemetry'] });
          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, queryClient]);
}

export function useRealtimeGnss() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    if (!tenantId) return;

    const channel = supabase
      .channel(`gnss:${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gnss_anomalies',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['gnss-anomalies'] });
          const anomaly = payload.new as { anomaly_type: string; severity: string; vehicle_plate?: string };

          // Push GNSS anomalies to notification store
          addNotification({
            title: 'Anomalía GNSS Detectada',
            message: `Tipo: ${anomaly.anomaly_type}`,
            severity: anomaly.severity === 'critical' ? 'critical' : 'high',
            type: 'gnss_anomaly',
            vehiclePlate: anomaly.vehicle_plate,
          });

          if (anomaly.severity === 'critical') {
            toast.error(`🛰️ Anomalía GNSS: ${anomaly.anomaly_type}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, queryClient, addNotification]);
}
