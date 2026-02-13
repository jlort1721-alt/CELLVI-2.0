import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useRealtimeAlerts() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

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
          const alert = payload.new as { message: string; severity: string };
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
  }, [tenantId, queryClient]);
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
          const anomaly = payload.new as { anomaly_type: string; severity: string };
          if (anomaly.severity === 'critical') {
            toast.error(`🛰️ Anomalía GNSS: ${anomaly.anomaly_type}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, queryClient]);
}
