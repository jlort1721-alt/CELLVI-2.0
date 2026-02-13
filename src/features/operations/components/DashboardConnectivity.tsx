import { Signal, Wifi, Radio, Satellite, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const connectivityData = [
  { name: "Celular 4G/5G", value: 72, color: "#22c55e" },
  { name: "GNSS", value: 18, color: "#3b82f6" },
  { name: "Satelital", value: 7, color: "#a855f7" },
  { name: "Sin cobertura", value: 3, color: "#ef4444" },
];

const budgetData = [
  { vehicle: "PUT-321", used: 45, budget: 100 },
  { vehicle: "NAR-123", used: 78, budget: 100 },
  { vehicle: "CAU-654", used: 12, budget: 80 },
  { vehicle: "NAR-456", used: 92, budget: 100 },
  { vehicle: "VAL-789", used: 30, budget: 60 },
];

const devices = [
  { id: "d-1", plate: "PUT-321", model: "Teltonika FMB920", signal: "4G", strength: 85, lastPing: "2s", status: "online" },
  { id: "d-2", plate: "NAR-123", model: "Queclink GV300", signal: "4G", strength: 72, lastPing: "5s", status: "online" },
  { id: "d-3", plate: "CAU-654", model: "CalAmp LMU-3640", signal: "Satelital", strength: 40, lastPing: "45s", status: "online" },
  { id: "d-4", plate: "NAR-456", model: "Teltonika FMB140", signal: "3G", strength: 55, lastPing: "8s", status: "online" },
  { id: "d-5", plate: "VAL-789", model: "Meitrack T366G", signal: "4G", strength: 90, lastPing: "3s", status: "online" },
  { id: "d-6", plate: "BOG-111", model: "Teltonika FMB920", signal: "—", strength: 0, lastPing: "2h", status: "offline" },
];

const DashboardConnectivity = () => {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
          <Signal className="w-5 h-5 text-green-500 mb-2" />
          <div className="text-2xl font-bold text-sidebar-foreground font-heading">{devices.filter(d => d.status === "online").length}/{devices.length}</div>
          <div className="text-xs text-sidebar-foreground/50">Dispositivos online</div>
        </div>
        <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
          <Wifi className="w-5 h-5 text-blue-400 mb-2" />
          <div className="text-2xl font-bold text-sidebar-foreground font-heading">97%</div>
          <div className="text-xs text-sidebar-foreground/50">Cobertura total</div>
        </div>
        <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
          <Satellite className="w-5 h-5 text-purple-400 mb-2" />
          <div className="text-2xl font-bold text-sidebar-foreground font-heading">7%</div>
          <div className="text-xs text-sidebar-foreground/50">Tráfico satelital</div>
        </div>
        <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
          <TrendingUp className="w-5 h-5 text-gold mb-2" />
          <div className="text-2xl font-bold text-sidebar-foreground font-heading">4</div>
          <div className="text-xs text-sidebar-foreground/50">Conmutaciones hoy</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Connectivity breakdown pie */}
        <div className="rounded-xl border bg-sidebar border-sidebar-border p-4">
          <h3 className="font-heading font-bold text-sidebar-foreground text-sm mb-4">Distribución de Conectividad</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={connectivityData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                  {connectivityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#1a2744", border: "1px solid rgba(212,160,23,0.2)", borderRadius: 8, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Satellite budget */}
        <div className="rounded-xl border bg-sidebar border-sidebar-border p-4">
          <h3 className="font-heading font-bold text-sidebar-foreground text-sm mb-4">Presupuesto Satelital por Vehículo</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="vehicle" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }} />
                <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }} />
                <Tooltip contentStyle={{ background: "#1a2744", border: "1px solid rgba(212,160,23,0.2)", borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="used" fill="#a855f7" radius={[4, 4, 0, 0]} name="Usado (MB)" />
                <Bar dataKey="budget" fill="rgba(255,255,255,0.1)" radius={[4, 4, 0, 0]} name="Presupuesto (MB)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Device table */}
      <div className="rounded-xl border bg-sidebar border-sidebar-border p-4">
        <h3 className="font-heading font-bold text-sidebar-foreground text-sm mb-3">Estado de Dispositivos</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-sidebar-foreground/40 border-b border-sidebar-border">
                <th className="text-left py-2 px-3">Vehículo</th>
                <th className="text-left py-2 px-3">Modelo</th>
                <th className="text-left py-2 px-3">Señal</th>
                <th className="text-left py-2 px-3">Intensidad</th>
                <th className="text-left py-2 px-3">Último ping</th>
                <th className="text-left py-2 px-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.id} className="border-b border-sidebar-border/50">
                  <td className="py-2 px-3 text-sidebar-foreground font-bold">{d.plate}</td>
                  <td className="py-2 px-3 text-sidebar-foreground/60">{d.model}</td>
                  <td className="py-2 px-3 text-sidebar-foreground/60">{d.signal}</td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-sidebar-foreground/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${d.strength}%`, background: d.strength > 60 ? "#22c55e" : d.strength > 30 ? "#eab308" : "#ef4444" }} />
                      </div>
                      <span className="text-sidebar-foreground/50">{d.strength}%</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-sidebar-foreground/60">{d.lastPing}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${d.status === "online" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardConnectivity;
