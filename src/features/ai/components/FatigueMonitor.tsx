import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { VisionGuard, type FatigueState, type FatigueMetrics } from '../lib/visionGuard';
// MediaPipe integration available in '../lib/mediaPipeIntegration' for future enhancement
import {
  useCreateSession,
  useEndSession,
  useRecordBreak,
  useCreateAlert,
  useActiveSession,
  useDriverFatigueStats,
} from '../hooks/useFatigueMonitoring';
import { env } from '@/config/env';

import {
  FatigueHeader,
  FatigueStatsCard,
  FatigueAlertBanner,
  StatusOverviewGrid,
  VideoFeedCard,
  AlertsPanel,
  RecommendationsCard,
  AlertHistoryCard,
  EmptyState,
} from './fatigue-monitor';

// --- Pure helper functions (stable references for sub-components) ---

const getLevelColor = (level: 'green' | 'yellow' | 'red') => {
  switch (level) {
    case 'green':
      return 'bg-green-500';
    case 'yellow':
      return 'bg-yellow-500';
    case 'red':
      return 'bg-red-500';
  }
};

const getLevelText = (level: 'green' | 'yellow' | 'red') => {
  switch (level) {
    case 'green':
      return 'Normal';
    case 'yellow':
      return 'Advertencia';
    case 'red':
      return 'Crítico';
  }
};

const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

// --- Main orchestrator component ---

export default function FatigueMonitor() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [fatigueState, setFatigueState] = useState<FatigueState | null>(null);
  const [metrics, setMetrics] = useState<FatigueMetrics | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const visionGuard = useRef(new VisionGuard());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Mock driver ID (in production, this would come from auth)
  const driverId = 'demo-driver-id';

  // Supabase hooks (only used when not in demo mode)
  const useMockData = env.features.useMockData;
  const createSession = useCreateSession();
  const endSession = useEndSession();
  const recordBreak = useRecordBreak();
  const createAlert = useCreateAlert();
  // activeSession intentionally consumed to keep the query warm
  useActiveSession(driverId);
  const { data: stats } = useDriverFatigueStats(driverId, 30);

  // Simulate video analysis and save alerts to Supabase
  useEffect(() => {
    if (isMonitoring) {
      let previousAlertCount = 0;

      intervalRef.current = setInterval(async () => {
        // Analyze frame (simulated - MediaPipe integration available for future enhancement)
        const currentMetrics = visionGuard.current.analyzeFrame();
        setMetrics(currentMetrics);

        const currentState = visionGuard.current.evaluateFatigue(currentMetrics);
        setFatigueState(currentState);

        // Save new alerts to Supabase when not in demo mode
        if (!useMockData && currentSessionId && currentState.alerts.length > previousAlertCount) {
          const newAlerts = currentState.alerts.slice(previousAlertCount);

          for (const alert of newAlerts) {
            try {
              await createAlert.mutateAsync({
                session_id: currentSessionId,
                alert,
                fatigue_state: currentState,
                metrics: currentMetrics,
              });
            } catch (error) {
              console.error('Error saving alert:', error);
            }
          }

          previousAlertCount = currentState.alerts.length;
        }
      }, 1000); // Update every second
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isMonitoring, currentSessionId, useMockData, driverId, createAlert]);

  const handleStartMonitoring = useCallback(async () => {
    try {
      visionGuard.current.startDriving();
      setIsMonitoring(true);

      // Create session in Supabase when not in demo mode
      if (!useMockData) {
        const session = await createSession.mutateAsync({});
        setCurrentSessionId(session.id);

        toast({
          title: '✅ Sesión iniciada',
          description: 'Monitoreo de fatiga guardándose en Supabase',
        });
      } else {
        toast({
          title: '🔧 Modo Demo',
          description: 'Monitoreo iniciado (no persistido - modo demo)',
        });
      }
    } catch (error) {
      toast({
        title: '❌ Error',
        description: 'Error al iniciar sesión de monitoreo',
        variant: 'destructive',
      });
      console.error('Error starting monitoring:', error);
    }
  }, [useMockData, createSession, toast]);

  const handleStopMonitoring = useCallback(async () => {
    try {
      setIsMonitoring(false);

      // End session in Supabase when not in demo mode
      if (!useMockData && currentSessionId) {
        const drivingDuration = fatigueState?.drivingDuration || 0;
        const durationMinutes = Math.floor(drivingDuration / 60000);

        await endSession.mutateAsync({
          session_id: currentSessionId,
          duration_minutes: durationMinutes,
          status: 'completed',
        });

        toast({
          title: '✅ Sesión finalizada',
          description: `Duración: ${durationMinutes} minutos`,
        });
      }

      setFatigueState(null);
      setMetrics(null);
      setCurrentSessionId(null);
    } catch (error) {
      toast({
        title: '❌ Error',
        description: 'Error al finalizar sesión',
        variant: 'destructive',
      });
      console.error('Error ending session:', error);
    }
  }, [useMockData, currentSessionId, fatigueState, endSession, toast]);

  const handleTakeBreak = useCallback(async () => {
    try {
      visionGuard.current.takeBreak();

      // Record break in Supabase when not in demo mode
      if (!useMockData && currentSessionId) {
        await recordBreak.mutateAsync({
          sessionId: currentSessionId,
          breakDuration: 15, // Default 15 min break
        });

        toast({
          title: '☕ Descanso registrado',
          description: 'Tiempo de descanso guardado',
        });
      }
    } catch (error) {
      console.error('Error recording break:', error);
    }
  }, [useMockData, currentSessionId, recordBreak, toast]);

  const handleToggleStats = useCallback(() => {
    setShowStats((prev) => !prev);
  }, []);

  const alertHistory = fatigueState ? visionGuard.current.getAlertHistory(10) : [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <FatigueHeader
        useMockData={useMockData}
        isMonitoring={isMonitoring}
        showStats={showStats}
        onToggleStats={handleToggleStats}
        onStartMonitoring={handleStartMonitoring}
        onStopMonitoring={handleStopMonitoring}
        onTakeBreak={handleTakeBreak}
      />

      {/* Historical Stats */}
      {!useMockData && showStats && !isMonitoring && stats && (
        <FatigueStatsCard stats={stats} />
      )}

      {/* Monitoring Active */}
      {isMonitoring && fatigueState && metrics && (
        <>
          {/* Critical / Warning Alert Banner */}
          <FatigueAlertBanner level={fatigueState.level} score={fatigueState.score} />

          {/* Status Overview */}
          <StatusOverviewGrid
            fatigueState={fatigueState}
            metrics={metrics}
            formatDuration={formatDuration}
            getLevelColor={getLevelColor}
            getLevelText={getLevelText}
          />

          {/* Video Feed and Alerts/Recommendations */}
          <div className="grid gap-6 lg:grid-cols-2">
            <VideoFeedCard metrics={metrics} />

            <div className="space-y-6">
              <AlertsPanel alerts={fatigueState.alerts} />
              <RecommendationsCard
                recommendations={fatigueState.recommendations}
                lastBreak={fatigueState.lastBreak}
              />
            </div>
          </div>

          {/* Alert History */}
          <AlertHistoryCard alertHistory={alertHistory} />
        </>
      )}

      {/* Empty State */}
      {!isMonitoring && <EmptyState />}
    </div>
  );
}
