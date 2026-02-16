import type { AIAgentState, AIDecisionLog, AnomalyPattern, EscalationEvent, AgentMetrics, DeviceStatus } from '../types/agentTypes';

const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomBetween = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const colombianPlates = [
  'NAR-123', 'NAR-456', 'NAR-789', 'PUT-321', 'CAU-654', 'NAR-987',
  'VAL-111', 'BOG-222', 'MED-333', 'CAL-444', 'BAR-555', 'CTG-666',
  'BUC-777', 'PER-888', 'MAN-999', 'IBA-101', 'TUN-202', 'NEI-303',
];

export function generateDeviceStatuses(count: number = 10247): DeviceStatus[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `DEV-${String(i).padStart(5, '0')}`,
    status: randomChoice<DeviceStatus['status']>(
      // Weighted: mostly OK
      ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'warning', 'alert', 'offline']
    ),
  }));
}

export function generateDecisionLog(count: number = 60): AIDecisionLog[] {
  const types: AIDecisionLog['type'][] = [
    'anomaly_detected', 'alert_auto_resolved', 'pattern_identified',
    'recommendation_generated', 'correlation_found', 'escalation_triggered',
    'geofence_violation', 'predictive_maintenance',
  ];

  const descriptions: Record<string, string[]> = {
    anomaly_detected: [
      'Patrón de velocidad anómalo detectado en corredor Pasto-Cali',
      'Caída de combustible inexplicada: -18% en 12 minutos',
      'Temperatura fuera de rango: 9.2°C (límite: 8°C)',
      'Desviación de ruta detectada: 4.2 km fuera de corredor asignado',
      'Señal GNSS intermitente — posible jamming en sector rural',
    ],
    alert_auto_resolved: [
      'Alerta de velocidad auto-resuelta: vehículo desaceleró a zona segura',
      'Temperatura estabilizada dentro de rango tras apertura de puerta',
      'Señal GNSS restaurada tras paso por túnel',
      'Nivel de combustible normalizado tras recarga en estación',
    ],
    pattern_identified: [
      'Patrón de exceso de velocidad recurrente en km 45-60 ruta Popayán',
      'Correlación: apertura de puerta + desviación de temperatura en 78% de casos',
      'Patrón de consumo de combustible anómalo en vehículos >200k km',
    ],
    recommendation_generated: [
      'Recomendar mantenimiento preventivo: predicción falla frenos en 1,200 km',
      'Sugerir reasignación de conductor por fatiga acumulada >12h',
      'Optimizar ruta: alternativa reduce 45 min y 12L de combustible',
    ],
    correlation_found: [
      'Correlación entre vibración motor y consumo +15% en últimos 30 días',
      'Vehículos con >300k km muestran 3.2x más alertas de batería',
    ],
    escalation_triggered: [
      'Alerta crítica sin atender por >5 min — escalada a supervisor',
      'Anomalía GNSS persistente — escalada a equipo de seguridad',
    ],
    geofence_violation: [
      'Salida no autorizada de geocerca "Base Pasto" a las 02:15',
      'Ingreso a zona restringida "Zona Militar" sin permiso',
    ],
    predictive_maintenance: [
      'Predicción: cambio de aceite necesario en 500 km para NAR-456',
      'Alerta predictiva: desgaste de frenos al 85% en PUT-321',
    ],
  };

  return Array.from({ length: count }, (_, i) => {
    const type = randomChoice(types);
    const desc = randomChoice(descriptions[type] || descriptions.anomaly_detected);
    return {
      id: `DL-${String(i).padStart(4, '0')}`,
      timestamp: new Date(Date.now() - i * randomBetween(15000, 60000)).toISOString(),
      type,
      vehicleId: `V${String(randomBetween(1, 247)).padStart(3, '0')}`,
      vehiclePlate: randomChoice(colombianPlates),
      description: desc,
      confidence: parseFloat((0.7 + Math.random() * 0.28).toFixed(2)),
      action: type === 'alert_auto_resolved' ? 'Auto-resuelto' : type === 'escalation_triggered' ? 'Escalado' : 'Monitoreo continuo',
      result: randomChoice<AIDecisionLog['result']>(['success', 'success', 'success', 'pending', 'escalated']),
      processingTimeMs: randomBetween(8, 120),
    };
  });
}

export function generateAnomalies(count: number = 12): AnomalyPattern[] {
  const types: AnomalyPattern['type'][] = [
    'speed_anomaly', 'fuel_anomaly', 'temp_anomaly', 'route_deviation',
    'gnss_spoofing', 'maintenance_prediction', 'geofence_violation',
  ];

  return Array.from({ length: count }, (_, i) => {
    const type = types[i % types.length];
    return {
      id: `ANOM-${String(i).padStart(3, '0')}`,
      type,
      severity: randomChoice<AnomalyPattern['severity']>(['low', 'medium', 'high', 'critical']),
      vehicleId: `V${String(randomBetween(1, 247)).padStart(3, '0')}`,
      vehiclePlate: randomChoice(colombianPlates),
      description: `Anomalía tipo ${type.replace(/_/g, ' ')} detectada`,
      confidence: parseFloat((0.75 + Math.random() * 0.24).toFixed(2)),
      detectedAt: new Date(Date.now() - randomBetween(0, 3600000)).toISOString(),
      baseline: type === 'speed_anomaly' ? 80 : type === 'fuel_anomaly' ? 65 : 4,
      observed: type === 'speed_anomaly' ? 115 : type === 'fuel_anomaly' ? 38 : 9.2,
      threshold: type === 'speed_anomaly' ? 90 : type === 'fuel_anomaly' ? 50 : 8,
      recommendation: type === 'speed_anomaly' ? 'Enviar alerta al conductor y registrar evento'
        : type === 'fuel_anomaly' ? 'Verificar con conductor e inspeccionar tanque'
        : 'Monitorear y escalar si persiste',
      autoResolvable: type === 'speed_anomaly' || type === 'temp_anomaly',
    };
  });
}

export function generateEscalations(count: number = 5): EscalationEvent[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `ESC-${String(i).padStart(3, '0')}`,
    alertId: `ALERT-${randomBetween(100, 999)}`,
    anomalyType: randomChoice(['speed_anomaly', 'temp_anomaly', 'gnss_spoofing', 'fuel_anomaly']),
    vehiclePlate: randomChoice(colombianPlates),
    fromLevel: 0,
    toLevel: 1,
    reason: randomChoice([
      'Alerta crítica sin atender por más de 5 minutos',
      'Anomalía GNSS persistente requiere intervención humana',
      'Temperatura fuera de rango crítico en carga farmacéutica',
      'Desviación de ruta en zona de alto riesgo',
      'Patrón sospechoso de consumo de combustible',
    ]),
    timestamp: new Date(Date.now() - randomBetween(0, 1800000)).toISOString(),
    assignedTo: randomChoice(['Supervisor Ops', 'Jefe de Seguridad', 'Gerente de Flota']),
    status: randomChoice<EscalationEvent['status']>(['pending', 'pending', 'acknowledged']),
    aiConfidence: parseFloat((0.82 + Math.random() * 0.17).toFixed(2)),
    humanRequired: true,
    recommendation: randomChoice([
      'Contactar al conductor inmediatamente y verificar estado',
      'Activar protocolo de seguridad y notificar a autoridades',
      'Despachar equipo técnico al punto más cercano',
      'Redirigir vehículo a base más cercana para inspección',
    ]),
  }));
}

function generateHourlyData(): { hour: string; count: number }[] {
  return Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    count: Math.floor(20 + Math.sin(i / 3.8) * 40 + Math.random() * 30),
  }));
}

export function generateAgentMetrics(): AgentMetrics {
  return {
    totalDevicesMonitored: 10247,
    activeConnections: 9891,
    telemetryEventsPerSec: randomBetween(280, 420),
    alertsGeneratedToday: 1847,
    alertsAutoResolvedToday: 1623,
    anomaliesDetectedToday: 234,
    escalationsToday: 12,
    avgResponseTimeMs: randomBetween(15, 45),
    autoResolutionRate: 87.9,
    anomalyDetectionAccuracy: 94.2,
    falsePositiveRate: 3.1,
    hourlyAlertVolume: generateHourlyData(),
    hourlyAnomalies: generateHourlyData().map((h) => ({ ...h, count: Math.floor(h.count * 0.15) })),
    devicesByStatus: { ok: 9203, warning: 674, alert: 218, offline: 152 },
    alertsBySeverity: { critical: 23, high: 89, medium: 412, low: 1323 },
  };
}

export function generateAgentState(): AIAgentState {
  return {
    status: 'active',
    devicesMonitored: 10247,
    activeConnections: 9891,
    telemetryEventsPerSec: randomBetween(280, 420),
    alertsProcessedPerSec: randomBetween(8, 25),
    uptime: '99.97%',
    lastProcessedAt: new Date().toISOString(),
    cpuLoad: randomBetween(25, 55),
    memoryUsage: randomBetween(40, 65),
  };
}
