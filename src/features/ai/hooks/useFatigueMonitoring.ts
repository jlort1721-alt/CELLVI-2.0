import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { FatigueState, FatigueAlert, FatigueMetrics } from '../lib/visionGuard';

// =====================================================
// TYPES
// =====================================================

export interface FatigueMonitoringSession {
  id: string;
  driver_id: string;
  vehicle_id: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  total_alerts: number;
  critical_alerts: number;
  warning_alerts: number;
  max_fatigue_score: number;
  avg_fatigue_score: number;
  breaks_taken: number;
  total_break_time_minutes: number;
  session_status: 'active' | 'completed' | 'interrupted';
  created_at: string;
  updated_at: string;
}

export interface FatigueAlertRecord {
  id: string;
  session_id: string;
  driver_id: string;
  alert_type: 'eyes_closed' | 'yawning' | 'head_nodding' | 'micro_sleep' | 'prolonged_driving';
  severity: 'low' | 'medium' | 'high';
  fatigue_score: number;
  fatigue_level: 'green' | 'yellow' | 'red';
  metrics: FatigueMetrics;
  description: string;
  action_taken: string | null;
  acknowledged: boolean;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  timestamp: string;
  latitude: number | null;
  longitude: number | null;
}

export interface CreateSessionInput {
  vehicle_id?: string;
}

export interface CreateAlertInput {
  session_id: string;
  alert: FatigueAlert;
  fatigue_state: FatigueState;
  metrics: FatigueMetrics;
  location?: { latitude: number; longitude: number };
}

export interface EndSessionInput {
  session_id: string;
  duration_minutes: number;
  status?: 'completed' | 'interrupted';
}

export interface AcknowledgeAlertInput {
  alert_id: string;
  action_taken?: string;
}

// =====================================================
// HOOKS - Sesiones
// =====================================================

/**
 * Hook para obtener la sesión activa del conductor
 */
export function useActiveSession(driverId?: string) {
  return useQuery({
    queryKey: ['active-fatigue-session', driverId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fatigue_monitoring_sessions')
        .select('*')
        .eq('driver_id', driverId || '')
        .eq('session_status', 'active')
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as FatigueMonitoringSession | null;
    },
    enabled: !!driverId,
  });
}

/**
 * Hook para obtener sesiones del conductor (historial)
 */
export function useDriverSessions(driverId?: string, limit: number = 20) {
  return useQuery({
    queryKey: ['fatigue-sessions', driverId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fatigue_monitoring_sessions')
        .select('*')
        .eq('driver_id', driverId || '')
        .order('start_time', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as FatigueMonitoringSession[];
    },
    enabled: !!driverId,
  });
}

/**
 * Hook para crear una nueva sesión de monitoreo
 */
export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSessionInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('fatigue_monitoring_sessions')
        .insert({
          driver_id: user.id,
          vehicle_id: input.vehicle_id,
          start_time: new Date().toISOString(),
          session_status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return data as FatigueMonitoringSession;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['active-fatigue-session', data.driver_id] });
      queryClient.invalidateQueries({ queryKey: ['fatigue-sessions', data.driver_id] });
    },
  });
}

/**
 * Hook para finalizar una sesión de monitoreo
 */
export function useEndSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: EndSessionInput) => {
      const { data, error } = await supabase
        .from('fatigue_monitoring_sessions')
        .update({
          end_time: new Date().toISOString(),
          duration_minutes: input.duration_minutes,
          session_status: input.status || 'completed',
        })
        .eq('id', input.session_id)
        .select()
        .single();

      if (error) throw error;
      return data as FatigueMonitoringSession;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['active-fatigue-session', data.driver_id] });
      queryClient.invalidateQueries({ queryKey: ['fatigue-sessions', data.driver_id] });
    },
  });
}

/**
 * Hook para registrar un descanso
 */
export function useRecordBreak() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, breakDuration }: { sessionId: string; breakDuration: number }) => {
      const { data, error } = await supabase.rpc('increment_session_breaks', {
        p_session_id: sessionId,
        p_break_duration: breakDuration,
      });

      if (error) {
        // Si el RPC no existe, hacerlo manualmente
        const { data: session, error: fetchError } = await supabase
          .from('fatigue_monitoring_sessions')
          .select('breaks_taken, total_break_time_minutes')
          .eq('id', sessionId)
          .single();

        if (fetchError) throw fetchError;

        const { data: updated, error: updateError } = await supabase
          .from('fatigue_monitoring_sessions')
          .update({
            breaks_taken: (session.breaks_taken || 0) + 1,
            total_break_time_minutes: (session.total_break_time_minutes || 0) + breakDuration,
          })
          .eq('id', sessionId)
          .select()
          .single();

        if (updateError) throw updateError;
        return updated;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-fatigue-session'] });
      queryClient.invalidateQueries({ queryKey: ['fatigue-sessions'] });
    },
  });
}

// =====================================================
// HOOKS - Alertas
// =====================================================

/**
 * Hook para obtener alertas de una sesión
 */
export function useSessionAlerts(sessionId?: string) {
  return useQuery({
    queryKey: ['fatigue-alerts', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];

      const { data, error } = await supabase
        .from('fatigue_alerts')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      return data as FatigueAlertRecord[];
    },
    enabled: !!sessionId,
  });
}

/**
 * Hook para obtener alertas críticas recientes
 */
export function useCriticalAlerts(driverId?: string, limit: number = 10) {
  return useQuery({
    queryKey: ['critical-fatigue-alerts', driverId, limit],
    queryFn: async () => {
      let query = supabase
        .from('fatigue_alerts')
        .select('*')
        .eq('severity', 'high')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (driverId) {
        query = query.eq('driver_id', driverId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as FatigueAlertRecord[];
    },
  });
}

/**
 * Hook para crear una alerta de fatiga
 */
export function useCreateAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAlertInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('fatigue_alerts')
        .insert({
          session_id: input.session_id,
          driver_id: user.id,
          alert_type: input.alert.type,
          severity: input.alert.severity,
          fatigue_score: input.fatigue_state.score,
          fatigue_level: input.fatigue_state.level,
          metrics: input.metrics,
          description: input.alert.description,
          timestamp: input.alert.timestamp.toISOString(),
          latitude: input.location?.latitude,
          longitude: input.location?.longitude,
        })
        .select()
        .single();

      if (error) throw error;
      return data as FatigueAlertRecord;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fatigue-alerts', data.session_id] });
      queryClient.invalidateQueries({ queryKey: ['critical-fatigue-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['active-fatigue-session'] });
    },
  });
}

/**
 * Hook para acknowledjar una alerta
 */
export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AcknowledgeAlertInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('fatigue_alerts')
        .update({
          acknowledged: true,
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user.id,
          action_taken: input.action_taken,
        })
        .eq('id', input.alert_id)
        .select()
        .single();

      if (error) throw error;
      return data as FatigueAlertRecord;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fatigue-alerts', data.session_id] });
      queryClient.invalidateQueries({ queryKey: ['critical-fatigue-alerts'] });
    },
  });
}

// =====================================================
// HOOKS - Estadísticas
// =====================================================

/**
 * Hook para obtener estadísticas de fatiga del conductor
 */
export function useDriverFatigueStats(driverId?: string, daysBack: number = 30) {
  return useQuery({
    queryKey: ['driver-fatigue-stats', driverId, daysBack],
    queryFn: async () => {
      if (!driverId) return null;

      const { data, error } = await supabase.rpc('get_driver_fatigue_stats', {
        driver_uuid: driverId,
        days_back: daysBack,
      });

      if (error) {
        // Si la función RPC no existe, calcular manualmente
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysBack);

        const { data: sessions, error: sessionsError } = await supabase
          .from('fatigue_monitoring_sessions')
          .select('*')
          .eq('driver_id', driverId)
          .gte('start_time', startDate.toISOString());

        if (sessionsError) throw sessionsError;

        const stats = {
          total_sessions: sessions.length,
          total_alerts: sessions.reduce((sum, s) => sum + (s.total_alerts || 0), 0),
          critical_alerts: sessions.reduce((sum, s) => sum + (s.critical_alerts || 0), 0),
          avg_fatigue_score:
            sessions.length > 0
              ? sessions.reduce((sum, s) => sum + (s.avg_fatigue_score || 0), 0) / sessions.length
              : 0,
          total_driving_hours:
            sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / 60,
        };

        return stats;
      }

      return data[0];
    },
    enabled: !!driverId,
  });
}

/**
 * Hook para obtener tendencia de fatiga (últimos N días)
 */
export function useFatigueTrend(driverId?: string, days: number = 7) {
  return useQuery({
    queryKey: ['fatigue-trend', driverId, days],
    queryFn: async () => {
      if (!driverId) return [];

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('fatigue_monitoring_sessions')
        .select('start_time, avg_fatigue_score, total_alerts, critical_alerts')
        .eq('driver_id', driverId)
        .gte('start_time', startDate.toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;

      return data.map((session) => ({
        date: new Date(session.start_time).toLocaleDateString('es-CO'),
        avgScore: session.avg_fatigue_score || 0,
        alerts: session.total_alerts || 0,
        criticalAlerts: session.critical_alerts || 0,
      }));
    },
    enabled: !!driverId,
  });
}
