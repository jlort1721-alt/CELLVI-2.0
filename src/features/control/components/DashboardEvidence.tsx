import { Shield, Hash, Clock, Eye, Download, CheckCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const evidenceEvents = [
  {
    id: "ev-1", type: "speed_violation", hash: "a3f8c2d1e9b0...4f7a", timestamp: "2026-02-11T10:15:32.456Z", source: "GNSS+NTP",
    vehicle: "PUT-321", description: "Exceso de velocidad: 110 km/h en zona 80 km/h",
    data: { speed: 110, limit: 80, lat: 2.4392, lng: -76.6122, satellites: 12, hdop: 0.8 },
    verified: true, accessLog: [
      { user: "sistema", action: "created", timestamp: "2026-02-11T10:15:32Z" },
      { user: "operator@asegurar.com", action: "viewed", timestamp: "2026-02-11T10:18:00Z" },
    ],
  },
  {
    id: "ev-2", type: "geofence_exit", hash: "b7e4a1c3f5d2...8e9b", timestamp: "2026-02-10T22:30:15.123Z", source: "GNSS",
    vehicle: "NAR-123", description: "Salida de geocerca: Base Pasto sin autorización",
    data: { geofence: "Base Pasto", direction: "exit", lat: 1.2136, lng: -77.2811, satellites: 8, hdop: 1.2 },
    verified: true, accessLog: [
      { user: "sistema", action: "created", timestamp: "2026-02-10T22:30:15Z" },
      { user: "admin@asegurar.com", action: "viewed", timestamp: "2026-02-10T22:35:00Z" },
      { user: "auditor@seguro.com", action: "exported", timestamp: "2026-02-11T09:00:00Z" },
    ],
  },
  {
    id: "ev-3", type: "temp_violation", hash: "c9d3b5a7e1f4...2c6d", timestamp: "2026-02-09T08:00:45.789Z", source: "NTP",
    vehicle: "NAR-456", description: "Temperatura fuera de rango: 9.1°C (máximo 8°C) durante 12 min",
    data: { temp: 9.1, limit: 8, duration: 12, sensor: "BLE-003", lat: 0.8615, lng: -77.6736, satellites: 6, hdop: 1.8 },
    verified: true, accessLog: [
      { user: "sistema", action: "created", timestamp: "2026-02-09T08:00:45Z" },
    ],
  },
  {
    id: "ev-4", type: "fuel_anomaly", hash: "d2f6e8a4b1c3...7a9e", timestamp: "2026-02-08T16:45:22.001Z", source: "GNSS+NTP",
    vehicle: "CAU-654", description: "Caída abrupta de combustible: -18% en 25 minutos",
    data: { fuelDrop: 18, duration: 25, lat: 2.4469, lng: -76.6062, satellites: 10, hdop: 0.9 },
    verified: true, accessLog: [
      { user: "sistema", action: "created", timestamp: "2026-02-08T16:45:22Z" },
      { user: "gerente@asegurar.com", action: "viewed", timestamp: "2026-02-08T17:00:00Z" },
    ],
  },
];

const typeLabels: Record<string, { label: string; color: string }> = {
  speed_violation: { label: "Exceso velocidad", color: "text-red-400" },
  geofence_exit: { label: "Salida geocerca", color: "text-orange-400" },
  temp_violation: { label: "Temp. fuera rango", color: "text-blue-400" },
  fuel_anomaly: { label: "Anomalía combustible", color: "text-purple-400" },
};

const DashboardEvidence = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-sidebar-foreground text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-gold" /> Truth Layer — Evidence & Auditoría
          </h2>
          <p className="text-xs text-sidebar-foreground/50">Eventos inmutables con integridad criptográfica y cadena de custodia</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
          <Lock className="w-5 h-5 text-gold mb-2" />
          <div className="text-2xl font-bold text-sidebar-foreground font-heading">{evidenceEvents.length}</div>
          <div className="text-xs text-sidebar-foreground/50">Eventos sellados</div>
        </div>
        <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
          <CheckCircle className="w-5 h-5 text-green-500 mb-2" />
          <div className="text-2xl font-bold text-green-500 font-heading">100%</div>
          <div className="text-xs text-sidebar-foreground/50">Integridad verificada</div>
        </div>
        <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
          <Eye className="w-5 h-5 text-blue-400 mb-2" />
          <div className="text-2xl font-bold text-sidebar-foreground font-heading">
            {evidenceEvents.reduce((s, e) => s + e.accessLog.length, 0)}
          </div>
          <div className="text-xs text-sidebar-foreground/50">Accesos registrados</div>
        </div>
        <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
          <Download className="w-5 h-5 text-purple-400 mb-2" />
          <div className="text-2xl font-bold text-sidebar-foreground font-heading">
            {evidenceEvents.reduce((s, e) => s + e.accessLog.filter(l => l.action === "exported").length, 0)}
          </div>
          <div className="text-xs text-sidebar-foreground/50">Exportaciones forenses</div>
        </div>
      </div>

      {/* Events */}
      <div className="space-y-4">
        {evidenceEvents.map((event) => {
          const typeInfo = typeLabels[event.type];
          return (
            <div key={event.id} className="rounded-xl border bg-sidebar border-sidebar-border p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold ${typeInfo.color}`}>{typeInfo.label}</span>
                    <span className="text-[10px] text-sidebar-foreground/30">•</span>
                    <span className="text-xs text-sidebar-foreground/60">{event.vehicle}</span>
                  </div>
                  <p className="text-sm text-sidebar-foreground">{event.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {event.verified && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-green-500/10 text-green-500 text-[10px] font-bold">
                      <CheckCircle className="w-3 h-3" /> Verificado
                    </span>
                  )}
                  <Button size="sm" variant="outline" className="text-[10px] h-7 border-gold/20 text-gold">
                    <Download className="w-3 h-3 mr-1" /> Exportar
                  </Button>
                </div>
              </div>

              {/* Hash & timestamp */}
              <div className="flex flex-wrap gap-4 mb-3 text-[10px]">
                <div className="flex items-center gap-1 text-sidebar-foreground/40">
                  <Hash className="w-3 h-3" />
                  <code className="font-mono bg-sidebar-foreground/5 px-1.5 py-0.5 rounded">{event.hash}</code>
                </div>
                <div className="flex items-center gap-1 text-sidebar-foreground/40">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(event.timestamp).toLocaleString("es-CO")} ({event.source})</span>
                </div>
              </div>

              {/* Chain of custody */}
              <div className="border-t border-sidebar-border pt-2">
                <div className="text-[10px] text-sidebar-foreground/40 mb-1">Cadena de Custodia</div>
                <div className="flex flex-wrap gap-2">
                  {event.accessLog.map((log, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-sidebar-foreground/5 text-sidebar-foreground/50 text-[10px]">
                      {log.user} • {log.action} • {new Date(log.timestamp).toLocaleTimeString("es-CO")}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardEvidence;
