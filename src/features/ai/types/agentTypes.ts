// AI Autonomous Control Center Type Definitions

export interface AIAgentState {
  status: 'active' | 'processing' | 'idle' | 'error';
  devicesMonitored: number;
  activeConnections: number;
  telemetryEventsPerSec: number;
  alertsProcessedPerSec: number;
  uptime: string;
  lastProcessedAt: string;
  cpuLoad: number;
  memoryUsage: number;
}

export interface AIDecisionLog {
  id: string;
  timestamp: string;
  type: 'anomaly_detected' | 'alert_auto_resolved' | 'escalation_triggered' | 'pattern_identified' | 'recommendation_generated' | 'correlation_found' | 'geofence_violation' | 'predictive_maintenance';
  vehicleId?: string;
  vehiclePlate?: string;
  description: string;
  confidence: number;
  action: string;
  result: 'success' | 'pending' | 'failed' | 'escalated';
  processingTimeMs: number;
}

export interface AnomalyPattern {
  id: string;
  type: 'speed_anomaly' | 'route_deviation' | 'fuel_anomaly' | 'temp_anomaly' | 'gnss_spoofing' | 'driver_fatigue' | 'maintenance_prediction' | 'geofence_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  vehicleId: string;
  vehiclePlate: string;
  description: string;
  confidence: number;
  detectedAt: string;
  baseline: number;
  observed: number;
  threshold: number;
  recommendation: string;
  autoResolvable: boolean;
}

export interface EscalationEvent {
  id: string;
  alertId: string;
  anomalyType: string;
  vehiclePlate: string;
  fromLevel: number;
  toLevel: number;
  reason: string;
  timestamp: string;
  assignedTo: string;
  status: 'pending' | 'acknowledged' | 'resolved';
  aiConfidence: number;
  humanRequired: boolean;
  recommendation: string;
}

export interface AgentMetrics {
  totalDevicesMonitored: number;
  activeConnections: number;
  telemetryEventsPerSec: number;
  alertsGeneratedToday: number;
  alertsAutoResolvedToday: number;
  anomaliesDetectedToday: number;
  escalationsToday: number;
  avgResponseTimeMs: number;
  autoResolutionRate: number;
  anomalyDetectionAccuracy: number;
  falsePositiveRate: number;
  hourlyAlertVolume: { hour: string; count: number }[];
  hourlyAnomalies: { hour: string; count: number }[];
  devicesByStatus: Record<string, number>;
  alertsBySeverity: Record<string, number>;
}

export interface DeviceStatus {
  id: string;
  status: 'ok' | 'warning' | 'alert' | 'offline';
}
