
import { useState, useEffect } from "react";
import { Shield, Radio, AlertTriangle, Activity, Map, Signal, Zap } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const DashboardGnssSecurity = () => {
  const [jammingLevel, setJammingLevel] = useState(0);
  const [spoofingDetected, setSpoofingDetected] = useState(false);

  // Mock realtime data
  const [signalData, setSignalData] = useState<{ time: string, strength: number, interference: number }[]>([]);

  useEffect(() => {
    // Generate initial data
    const initialData = Array.from({ length: 20 }, (_, i) => ({
      time: `${10 + Math.floor(i / 2)}:${(i % 2) * 30}`,
      strength: 85 + Math.random() * 10,
      interference: 5 + Math.random() * 5
    }));
    setSignalData(initialData);

    const interval = setInterval(() => {
      setSignalData(prev => {
        const last = prev[prev.length - 1];
        const newItem = {
          time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          strength: 80 + Math.random() * 15,
          interference: 5 + Math.random() * (Math.random() > 0.9 ? 40 : 5) // Occasional spike
        };
        return [...prev.slice(1), newItem];
      });

      // Update gauge
      setJammingLevel(prev => {
        const noise = Math.random() * 10;
        return noise > 8 ? 45 : noise * 2;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="font-heading font-bold text-sidebar-foreground text-2xl flex items-center gap-3">
          <Shield className="w-8 h-8 text-gold" /> Seguridad GNSS & Anti-Jamming
        </h2>
        <p className="text-sm text-sidebar-foreground/50">Monitoreo de espectro electromagnético y validación de integridad satelital.</p>
      </div>

      {/* Main Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Signal Integrity Gauge */}
        <div className="rounded-xl p-6 border bg-sidebar border-sidebar-border relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Radio className="w-24 h-24 text-gold" />
          </div>
          <h3 className="font-heading font-bold text-sidebar-foreground mb-4 flex items-center gap-2">
            <Signal className="w-5 h-5 text-gold" /> Integridad de Señal
          </h3>

          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative w-40 h-40">
              {/* Simple CSS Gauge */}
              <div className="w-full h-full rounded-full border-8 border-sidebar-border relative flex items-center justify-center">
                <div className="text-4xl font-bold font-mono text-white">{Math.round(100 - jammingLevel)}%</div>
              </div>
              <svg className="absolute inset-0 rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="none" stroke={jammingLevel > 30 ? "#ef4444" : "#22c55e"} strokeWidth="8" strokeDasharray={`${100 - jammingLevel} 289`} strokeLinecap="round" />
              </svg>
            </div>
            <span className={`mt-4 px-3 py-1 rounded-full text-xs font-bold ${jammingLevel > 30 ? "bg-red-500/20 text-red-500" : "bg-green-500/20 text-green-500"}`}>
              {jammingLevel > 30 ? "INTERFERENCIA DETECTADA" : "SEÑAL LIMPIA"}
            </span>
          </div>
        </div>

        {/* Attack Vector Analysis */}
        <div className="col-span-2 rounded-xl p-6 border bg-sidebar border-sidebar-border flex flex-col">
          <h3 className="font-heading font-bold text-sidebar-foreground mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-gold" /> Análisis de Espectro (Tiempo Real)
          </h3>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={signalData}>
                <defs>
                  <linearGradient id="colorStrength" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorInterference" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#666' }} interval={4} />
                <YAxis hide />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                <Area type="monotone" dataKey="strength" stroke="#22c55e" fillOpacity={1} fill="url(#colorStrength)" name="Potencia Satelital" />
                <Area type="monotone" dataKey="interference" stroke="#ef4444" fillOpacity={1} fill="url(#colorInterference)" name="Ruido / Jamming" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl p-6 border bg-sidebar border-sidebar-border">
          <h3 className="font-heading font-bold text-sidebar-foreground mb-4">🛡️ Playbooks de Respuesta Automática</h3>
          <div className="space-y-3">
            {[
              { name: "Jamming Leve (<1min)", action: "Log + Notificación Operador", status: "active" },
              { name: "Jamming Crítico (>1min)", action: "Bloqueo Motor + Alerta Policial", status: "active" },
              { name: "Spoofing GPS", action: "Switch a Triangulación Celular", status: "monitoring" },
            ].map((rule, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-sidebar-accent border border-sidebar-border">
                <div>
                  <div className="font-bold text-sm text-sidebar-foreground">{rule.name}</div>
                  <div className="text-xs text-sidebar-foreground/50">Acción: {rule.action}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-xs font-mono text-green-500 uppercase">Activo</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-6 border bg-sidebar-accent/50 border-sidebar-border relative">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <h3 className="font-heading font-bold text-sidebar-foreground mb-2 flex items-center gap-2">
            <Map className="w-4 h-4 text-gold" /> Mapa de Calor de Anomalías
          </h3>
          <div className="h-48 rounded-lg bg-sidebar border border-sidebar-border flex items-center justify-center relative overflow-hidden">
            {/* Abstract Heatmap Visualization */}
            <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-red-500/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-orange-500/20 rounded-full blur-xl animate-pulse delay-700"></div>
            <p className="relative z-10 text-xs text-sidebar-foreground/60 bg-sidebar/80 px-2 py-1 rounded backdrop-blur-sm">
              Concentración de interferencia detectada en: <span className="text-sidebar-foreground font-bold">Ruta del Sol II, Km 45</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardGnssSecurity;
