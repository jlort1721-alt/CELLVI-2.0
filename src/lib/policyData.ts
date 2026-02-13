export type ConditionType = "speed" | "geofence" | "temperature" | "fuel" | "time" | "engine" | "sensor";
export type ActionType = "alert" | "notification" | "engine_block" | "evidence_log" | "webhook";
export type PolicyStatus = "active" | "inactive" | "draft";

export interface PolicyCondition {
  type: ConditionType;
  operator: ">" | "<" | "==" | "!=" | "enter" | "exit";
  value: string;
  label: string;
}

export interface PolicyAction {
  type: ActionType;
  config: Record<string, string>;
  label: string;
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  conditions: PolicyCondition[];
  actions: PolicyAction[];
  logic: "AND" | "OR";
  status: PolicyStatus;
  category: "safety" | "compliance" | "operational" | "custom";
  triggerCount: number;
  lastTriggered: string | null;
  createdAt: string;
  createdBy: string;
}

export const policies: Policy[] = [
  {
    id: "p-1", name: "Exceso de velocidad > 80 km/h", description: "Alerta cuando un vehículo supera 80 km/h en zona urbana",
    conditions: [{ type: "speed", operator: ">", value: "80", label: "Velocidad > 80 km/h" }],
    actions: [
      { type: "alert", config: { severity: "high", channel: "push" }, label: "Alerta alta por push" },
      { type: "evidence_log", config: {}, label: "Registrar en Truth Layer" },
    ],
    logic: "AND", status: "active", category: "safety", triggerCount: 47, lastTriggered: "2026-02-11T10:15:00", createdAt: "2026-01-15", createdBy: "Admin",
  },
  {
    id: "p-2", name: "Salida de geocerca - Base Pasto", description: "Notifica al supervisor cuando un vehículo sale de la geocerca de Base Pasto",
    conditions: [{ type: "geofence", operator: "exit", value: "Base Pasto", label: "Sale de Base Pasto" }],
    actions: [
      { type: "notification", config: { channel: "whatsapp", to: "supervisor" }, label: "WhatsApp a supervisor" },
      { type: "evidence_log", config: {}, label: "Registrar en Truth Layer" },
    ],
    logic: "AND", status: "active", category: "operational", triggerCount: 12, lastTriggered: "2026-02-10T22:30:00", createdAt: "2026-01-20", createdBy: "Admin",
  },
  {
    id: "p-3", name: "Temperatura fuera de rango", description: "Bloquea motor y genera evidencia cuando la temperatura sale del rango permitido por más de 5 minutos",
    conditions: [
      { type: "temperature", operator: ">", value: "8", label: "Temperatura > 8°C" },
      { type: "time", operator: ">", value: "5", label: "Duración > 5 min" },
    ],
    actions: [
      { type: "alert", config: { severity: "critical", channel: "sms" }, label: "Alerta crítica SMS" },
      { type: "engine_block", config: {}, label: "Bloqueo de motor" },
      { type: "evidence_log", config: {}, label: "Registrar en Truth Layer" },
    ],
    logic: "AND", status: "active", category: "compliance", triggerCount: 3, lastTriggered: "2026-02-09T08:00:00", createdAt: "2026-01-25", createdBy: "HSEQ",
  },
  {
    id: "p-4", name: "Consumo anómalo de combustible", description: "Detecta caídas abruptas de combustible (posible hurto)",
    conditions: [{ type: "fuel", operator: "<", value: "-15", label: "Caída > 15% en 30min" }],
    actions: [
      { type: "alert", config: { severity: "high", channel: "push" }, label: "Alerta alta" },
      { type: "notification", config: { channel: "email", to: "gerente" }, label: "Email a gerente" },
    ],
    logic: "AND", status: "active", category: "operational", triggerCount: 8, lastTriggered: "2026-02-08T16:45:00", createdAt: "2026-02-01", createdBy: "Admin",
  },
  {
    id: "p-5", name: "Horas de conducción continua > 4h", description: "Alerta de fatiga cuando el conductor lleva más de 4 horas sin pausa",
    conditions: [{ type: "engine", operator: ">", value: "240", label: "Motor encendido > 240 min" }],
    actions: [
      { type: "notification", config: { channel: "push", to: "driver" }, label: "Push al conductor" },
      { type: "alert", config: { severity: "medium", channel: "dashboard" }, label: "Alerta en dashboard" },
    ],
    logic: "AND", status: "draft", category: "safety", triggerCount: 0, lastTriggered: null, createdAt: "2026-02-10", createdBy: "HSEQ",
  },
];

export const conditionTypes: { value: ConditionType; label: string; icon: string }[] = [
  { value: "speed", label: "Velocidad", icon: "⚡" },
  { value: "geofence", label: "Geocerca", icon: "📍" },
  { value: "temperature", label: "Temperatura", icon: "🌡️" },
  { value: "fuel", label: "Combustible", icon: "⛽" },
  { value: "time", label: "Tiempo", icon: "⏱️" },
  { value: "engine", label: "Motor", icon: "🔧" },
  { value: "sensor", label: "Sensor", icon: "📡" },
];

export const actionTypes: { value: ActionType; label: string; icon: string }[] = [
  { value: "alert", label: "Alerta", icon: "🔔" },
  { value: "notification", label: "Notificación", icon: "📨" },
  { value: "engine_block", label: "Bloqueo Motor", icon: "🚫" },
  { value: "evidence_log", label: "Log Evidencia", icon: "🛡️" },
  { value: "webhook", label: "Webhook", icon: "🔌" },
];
