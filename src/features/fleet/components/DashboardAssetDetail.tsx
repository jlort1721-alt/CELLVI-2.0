import { useState, useCallback, lazy, Suspense } from "react";
import { Car, MapPin, Fuel, Gauge, Clock, Shield, Thermometer, Signal, ChevronRight, CheckCircle, Battery, Lock, Unlock, Activity, Send, Power, Locate, AlertTriangle, Zap } from "lucide-react";
import { vehicles } from "@/lib/demoData";
import { Button } from "@/components/ui/button";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from "recharts";
const DigitalTwinViewer = lazy(() => import("./DigitalTwinViewer").then(m => ({ default: m.DigitalTwinViewer })));
import { toast } from "sonner";

/* ── Mock telemetry timeline for selected vehicle ──── */
const generateTimeline = (vehicleId: string) => {
  const events = [
    { time: "06:00", type: "start", icon: "🟢", label: "Motor encendido", detail: "Inspección pre-operacional completada" },
    { time: "06:15", type: "geofence_exit", icon: "📍", label: "Salida geocerca Base Pasto", detail: "Lat: 1.2136, Lng: -77.2811" },
    { time: "07:30", type: "stop", icon: "🔵", label: "Parada en La Unión (12 min)", detail: "Carga de combustible: +45L" },
    { time: "08:45", type: "speed", icon: "⚡", label: "Exceso velocidad: 98 km/h", detail: "Zona límite: 80 km/h — Evidence sellada" },
    { time: "09:20", type: "geofence_enter", icon: "📍", label: "Ingreso geocerca Popayán", detail: "Lat: 2.4419, Lng: -76.6067" },
    { time: "10:00", type: "temp", icon: "🌡️", label: "Temperatura: 7.8°C", detail: "Dentro de rango (2-8°C)" },
    { time: "11:30", type: "fuel_drop", icon: "⛽", label: "Anomalía combustible -12%", detail: "Caída en 15 min — Investigar" },
    { time: "12:15", type: "evidence", icon: "🛡️", label: "Evidence sellada: fuel_anomaly", detail: "SHA-256: a3f8c2d1...4f7a • NTP verified" },
    { time: "14:00", type: "stop", icon: "🔴", label: "Motor apagado", detail: "Destino: Cali — 420 km recorridos" },
  ];
  return events;
};

const generateSpeedHistory = () =>
  Array.from({ length: 48 }, (_, i) => ({
    time: `${Math.floor(i / 2)}:${i % 2 === 0 ? "00" : "30"}`,
    speed: Math.round(Math.max(0, 40 + Math.sin(i / 4) * 35 + (Math.random() - 0.5) * 15)),
    fuel: Math.round(80 - i * 0.8 + Math.random() * 3),
  }));

/* ── Remote Command Panel ──────────────────────────── */
const RemoteCommandPanel = ({ vehiclePlate }: { vehiclePlate: string }) => {
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const commands = [
    { id: "disable_engine", label: "Deshabilitar Motor", icon: Power, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", confirm: true },
    { id: "lock_doors", label: "Bloquear Puertas", icon: Lock, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", confirm: true },
    { id: "unlock_doors", label: "Desbloquear Puertas", icon: Unlock, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20", confirm: false },
    { id: "request_checkin", label: "Solicitar Check-in", icon: Locate, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", confirm: false },
    { id: "speed_limit", label: "Límite 80 km/h", icon: Gauge, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", confirm: true },
    { id: "alert_driver", label: "Alertar Conductor", icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20", confirm: false },
  ];

  const executeCommand = useCallback((cmdId: string) => {
    setSending(true);
    // Simulate remote command execution
    setTimeout(() => {
      setSending(false);
      setConfirmAction(null);
      toast.success(`Comando "${cmdId}" enviado a ${vehiclePlate}`);
    }, 1500);
  }, [vehiclePlate]);

  return (
    <div className="rounded-xl border bg-sidebar border-sidebar-border p-4">
      <h4 className="font-heading font-bold text-sidebar-foreground text-sm mb-3 flex items-center gap-2">
        <Send className="w-4 h-4 text-gold" /> Comandos Remotos
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {commands.map((cmd) => (
          <div key={cmd.id}>
            {confirmAction === cmd.id ? (
              <div className={`p-2 rounded-lg border ${cmd.border} ${cmd.bg} space-y-1.5`}>
                <span className="text-[9px] text-sidebar-foreground/50 block">Confirmar acción?</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => executeCommand(cmd.id)} disabled={sending} className={`h-6 text-[9px] flex-1 ${cmd.color}`}>
                    {sending ? "Enviando..." : "Sí"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmAction(null)} className="h-6 text-[9px] flex-1 text-sidebar-foreground/40">
                    No
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => cmd.confirm ? setConfirmAction(cmd.id) : executeCommand(cmd.id)}
                className={`w-full p-2.5 rounded-lg border ${cmd.border} ${cmd.bg} hover:opacity-80 transition-all flex flex-col items-center gap-1.5`}
              >
                <cmd.icon className={`w-4 h-4 ${cmd.color}`} />
                <span className={`text-[9px] font-bold ${cmd.color}`}>{cmd.label}</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const DashboardAssetDetail = () => {
  const [selectedVehicle, setSelectedVehicle] = useState(vehicles[0] ?? null);
  const [timelineFilter, setTimelineFilter] = useState<string>("all");

  if (!selectedVehicle) {
    return (
      <div className="flex items-center justify-center h-64 text-sidebar-foreground/50 text-sm">
        No hay vehículos disponibles.
      </div>
    );
  }

  const timeline = generateTimeline(selectedVehicle.id);
  const speedHistory = generateSpeedHistory();

  const filteredTimeline = timelineFilter === "all"
    ? timeline
    : timeline.filter((e) => e.type === timelineFilter);

  const statusConfig: Record<string, { color: string; label: string; bg: string }> = {
    activo: { color: "text-green-500", label: "En Movimiento", bg: "bg-green-500/10" },
    detenido: { color: "text-blue-400", label: "Detenido", bg: "bg-blue-500/10" },
    alerta: { color: "text-red-500", label: "¡Alerta!", bg: "bg-red-500/10" },
    apagado: { color: "text-sidebar-foreground/40", label: "Apagado", bg: "bg-sidebar-foreground/5" },
  };

  const st = statusConfig[selectedVehicle.status];

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-sidebar-foreground text-lg flex items-center gap-2">
          <Car className="w-5 h-5 text-gold" /> Detalle de Activo
        </h2>
      </div>

      <div className="grid lg:grid-cols-4 gap-4">
        {/* ── Vehicle selector ──────────────────────── */}
        <div className="rounded-xl border bg-sidebar border-sidebar-border p-3">
          <div className="text-[10px] text-sidebar-foreground/40 uppercase tracking-wider font-bold mb-2">Seleccionar vehículo</div>
          <div className="space-y-1">
            {vehicles.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVehicle(v)}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors ${selectedVehicle.id === v.id ? "bg-gold/10 border border-gold/30" : "hover:bg-sidebar-foreground/[0.03] border border-transparent"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{
                    background: v.status === "activo" ? "#22c55e" : v.status === "alerta" ? "#ef4444" : v.status === "detenido" ? "#3b82f6" : "#6b7280"
                  }} />
                  <div>
                    <div className="text-xs font-bold text-sidebar-foreground">{v.plate}</div>
                    <div className="text-[10px] text-sidebar-foreground/40">{v.type}</div>
                  </div>
                </div>
                <ChevronRight className="w-3 h-3 text-sidebar-foreground/20" />
              </button>
            ))}
          </div>
        </div>

        {/* ── Detail panel ──────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">
          {/* Digital Twin Viewer */}
          <div className="rounded-xl border bg-sidebar border-sidebar-border h-[400px] overflow-hidden relative">
            <Suspense fallback={<div className="h-full animate-pulse bg-gray-800/50 rounded-lg" />}>
              <DigitalTwinViewer vehicleData={selectedVehicle} />
            </Suspense>
          </div>

          {/* Quick metrics */}
          <div className="rounded-xl border bg-sidebar border-sidebar-border p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { icon: Gauge, label: "Velocidad", value: `${selectedVehicle.speed} km/h`, color: "#3b82f6" },
                { icon: Fuel, label: "Combustible", value: `${selectedVehicle.fuel}%`, color: selectedVehicle.fuel > 30 ? "#22c55e" : "#ef4444" },
                { icon: Battery, label: "Batería", value: `${selectedVehicle.battery}%`, color: "#a855f7" },
                { icon: Signal, label: "Señal", value: `${selectedVehicle.signal}/5`, color: "#3b82f6" },
                { icon: Activity, label: "Km Total", value: `${(selectedVehicle.km / 1000).toFixed(0)}k`, color: "hsl(45,95%,55%)" },
                { icon: selectedVehicle.locked ? Lock : Unlock, label: "Motor", value: selectedVehicle.engineOn ? "ON" : "OFF", color: selectedVehicle.engineOn ? "#22c55e" : "#6b7280" },
              ].map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <m.icon className="w-4 h-4 flex-shrink-0" style={{ color: m.color }} />
                  <div>
                    <div className="text-xs font-bold text-sidebar-foreground">{m.value}</div>
                    <div className="text-[9px] text-sidebar-foreground/30">{m.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Remote Commands Panel */}
          <RemoteCommandPanel vehiclePlate={selectedVehicle.plate} />

          {/* Speed & Fuel chart */}
          <div className="rounded-xl border bg-sidebar border-sidebar-border p-4">
            <h4 className="font-heading font-bold text-sidebar-foreground text-sm mb-3">Telemetría (24h)</h4>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={speedHistory}>
                  <defs>
                    <linearGradient id="speedG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="time" tick={{ fontSize: 8, fill: "rgba(255,255,255,0.3)" }} interval={7} />
                  <YAxis tick={{ fontSize: 8, fill: "rgba(255,255,255,0.3)" }} />
                  <Tooltip contentStyle={{ background: "hsl(222,55%,12%)", border: "1px solid hsl(45,95%,55%,0.2)", borderRadius: 8, fontSize: 11, color: "white" }} />
                  <Area type="monotone" dataKey="speed" stroke="#3b82f6" fill="url(#speedG)" strokeWidth={1.5} name="Velocidad (km/h)" />
                  <Line type="monotone" dataKey="fuel" stroke="#f97316" strokeWidth={1} strokeDasharray="4 2" dot={false} name="Combustible (%)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Timeline with filter */}
          <div className="rounded-xl border bg-sidebar border-sidebar-border p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-heading font-bold text-sidebar-foreground text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-gold" /> Timeline del Día
              </h4>
              <div className="flex items-center gap-1">
                {[
                  { key: "all", label: "Todos" },
                  { key: "speed", label: "Velocidad" },
                  { key: "fuel_drop", label: "Combustible" },
                  { key: "geofence_exit", label: "Geocerca" },
                  { key: "evidence", label: "Evidence" },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setTimelineFilter(f.key)}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold transition-colors ${timelineFilter === f.key ? "bg-gold/15 text-gold" : "text-sidebar-foreground/30 hover:text-sidebar-foreground/50"}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-0">
              {filteredTimeline.map((ev, i) => {
                const isAlert = ev.type === "speed" || ev.type === "fuel_drop";
                const isEvidence = ev.type === "evidence";
                return (
                  <div key={i} className="flex gap-3 group">
                    {/* Connector line */}
                    <div className="flex flex-col items-center w-6">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${isAlert ? "bg-red-500/10" : isEvidence ? "bg-gold/10" : "bg-sidebar-foreground/5"
                        }`}>
                        {ev.icon}
                      </div>
                      {i < filteredTimeline.length - 1 && <div className="w-px flex-1 bg-sidebar-border min-h-[16px]" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-sidebar-foreground/30">{ev.time}</span>
                        <span className={`text-xs font-bold ${isAlert ? "text-red-400" : isEvidence ? "text-gold" : "text-sidebar-foreground"}`}>{ev.label}</span>
                      </div>
                      <p className="text-[10px] text-sidebar-foreground/40 mt-0.5">{ev.detail}</p>
                    </div>
                  </div>
                );
              })}
              {filteredTimeline.length === 0 && (
                <div className="text-xs text-center py-8 text-sidebar-foreground/20">Sin eventos para este filtro</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAssetDetail;
