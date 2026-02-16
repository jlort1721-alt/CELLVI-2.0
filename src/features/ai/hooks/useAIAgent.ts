import { useState, useEffect, useCallback, useRef } from 'react';
import type { AIAgentState, AIDecisionLog, AnomalyPattern, EscalationEvent, AgentMetrics, DeviceStatus } from '../types/agentTypes';
import { generateAgentState, generateAgentMetrics, generateDecisionLog, generateAnomalies, generateEscalations, generateDeviceStatuses } from '../lib/agentDemoData';

export function useAIAgent() {
  const [agentState, setAgentState] = useState<AIAgentState>(generateAgentState());
  const [decisionLog, setDecisionLog] = useState<AIDecisionLog[]>(generateDecisionLog(60));
  const [metrics, setMetrics] = useState<AgentMetrics>(generateAgentMetrics());
  const [anomalies, setAnomalies] = useState<AnomalyPattern[]>(generateAnomalies(12));
  const [escalations, setEscalations] = useState<EscalationEvent[]>(generateEscalations(5));
  const [devices, setDevices] = useState<DeviceStatus[]>(() => generateDeviceStatuses(10247));
  const logCounterRef = useRef(60);

  // Simulate real-time agent state updates (every 2s)
  useEffect(() => {
    const interval = setInterval(() => {
      setAgentState((prev) => ({
        ...prev,
        telemetryEventsPerSec: Math.max(200, prev.telemetryEventsPerSec + Math.floor(Math.random() * 40 - 20)),
        alertsProcessedPerSec: Math.max(5, prev.alertsProcessedPerSec + Math.floor(Math.random() * 6 - 3)),
        cpuLoad: Math.max(15, Math.min(80, prev.cpuLoad + Math.floor(Math.random() * 10 - 5))),
        memoryUsage: Math.max(30, Math.min(75, prev.memoryUsage + Math.floor(Math.random() * 4 - 2))),
        lastProcessedAt: new Date().toISOString(),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Simulate new decision log entries (every 3-8s)
  useEffect(() => {
    const addLogEntry = () => {
      const newEntries = generateDecisionLog(1);
      const entry = { ...newEntries[0], id: `DL-${String(logCounterRef.current++).padStart(4, '0')}`, timestamp: new Date().toISOString() };

      setDecisionLog((prev) => [entry, ...prev].slice(0, 200));

      // Update metrics based on log type
      setMetrics((prev) => ({
        ...prev,
        telemetryEventsPerSec: Math.max(200, prev.telemetryEventsPerSec + Math.floor(Math.random() * 20 - 10)),
        avgResponseTimeMs: Math.max(10, Math.min(80, prev.avgResponseTimeMs + Math.floor(Math.random() * 10 - 5))),
        alertsGeneratedToday: entry.type === 'anomaly_detected' ? prev.alertsGeneratedToday + 1 : prev.alertsGeneratedToday,
        alertsAutoResolvedToday: entry.type === 'alert_auto_resolved' ? prev.alertsAutoResolvedToday + 1 : prev.alertsAutoResolvedToday,
        anomaliesDetectedToday: entry.type === 'anomaly_detected' ? prev.anomaliesDetectedToday + 1 : prev.anomaliesDetectedToday,
        escalationsToday: entry.type === 'escalation_triggered' ? prev.escalationsToday + 1 : prev.escalationsToday,
      }));

      const nextDelay = 3000 + Math.random() * 5000;
      setTimeout(addLogEntry, nextDelay);
    };

    const timeout = setTimeout(addLogEntry, 3000);
    return () => clearTimeout(timeout);
  }, []);

  // Simulate device status changes (every 5s)
  useEffect(() => {
    const interval = setInterval(() => {
      setDevices((prev) => {
        const updated = [...prev];
        const changeCount = Math.floor(Math.random() * 20) + 5;
        for (let i = 0; i < changeCount; i++) {
          const idx = Math.floor(Math.random() * updated.length);
          const statuses: DeviceStatus['status'][] = ['ok', 'ok', 'ok', 'ok', 'warning', 'alert', 'offline'];
          updated[idx] = { ...updated[idx], status: statuses[Math.floor(Math.random() * statuses.length)] };
        }
        return updated;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Acknowledge escalation
  const acknowledgeEscalation = useCallback((id: string) => {
    setEscalations((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'acknowledged' as const } : e))
    );
  }, []);

  // Resolve escalation
  const resolveEscalation = useCallback((id: string) => {
    setEscalations((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'resolved' as const } : e))
    );
  }, []);

  return {
    agentState,
    decisionLog,
    metrics,
    anomalies,
    escalations,
    devices,
    acknowledgeEscalation,
    resolveEscalation,
  };
}
