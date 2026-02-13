import { User, Award, TrendingUp, TrendingDown, Star } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

const drivers = [
  { id: "dr-1", name: "Carlos Muñoz", plate: "PUT-321", score: 87, trend: "up", acceleration: 90, braking: 85, speed: 80, hours: 92, cornering: 88, seatbelt: 95 },
  { id: "dr-2", name: "María López", plate: "NAR-123", score: 92, trend: "up", acceleration: 95, braking: 90, speed: 88, hours: 95, cornering: 92, seatbelt: 98 },
  { id: "dr-3", name: "Pedro García", plate: "CAU-654", score: 65, trend: "down", acceleration: 60, braking: 55, speed: 70, hours: 75, cornering: 60, seatbelt: 70 },
  { id: "dr-4", name: "Ana Rodríguez", plate: "NAR-456", score: 78, trend: "stable", acceleration: 80, braking: 75, speed: 72, hours: 85, cornering: 78, seatbelt: 90 },
  { id: "dr-5", name: "Luis Herrera", plate: "VAL-789", score: 95, trend: "up", acceleration: 98, braking: 95, speed: 92, hours: 96, cornering: 94, seatbelt: 100 },
];

const badges = [
  { name: "🏆 Top Driver", condition: "Score > 90" },
  { name: "🛡️ Safe Driver", condition: "0 alertas velocidad/mes" },
  { name: "⛽ Eco Driver", condition: "Consumo < promedio flota" },
  { name: "⏰ Puntual", condition: "100% rutas a tiempo" },
];

const DashboardDrivers = () => {
  const avgScore = Math.round(drivers.reduce((s, d) => s + d.score, 0) / drivers.length);
  const topDriver = drivers.reduce((a, b) => a.score > b.score ? a : b);
  const selectedDriver = drivers[0];

  const radarData = [
    { metric: "Aceleración", value: selectedDriver.acceleration },
    { metric: "Frenado", value: selectedDriver.braking },
    { metric: "Velocidad", value: selectedDriver.speed },
    { metric: "Horas", value: selectedDriver.hours },
    { metric: "Curvas", value: selectedDriver.cornering },
    { metric: "Cinturón", value: selectedDriver.seatbelt },
  ];

  const rankingData = drivers.sort((a, b) => b.score - a.score).map((d) => ({
    name: d.name.split(" ")[0],
    score: d.score,
  }));

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
          <User className="w-5 h-5 text-gold mb-2" />
          <div className="text-2xl font-bold text-sidebar-foreground font-heading">{drivers.length}</div>
          <div className="text-xs text-sidebar-foreground/50">Conductores activos</div>
        </div>
        <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
          <Star className="w-5 h-5 text-gold mb-2" />
          <div className="text-2xl font-bold text-gold font-heading">{avgScore}</div>
          <div className="text-xs text-sidebar-foreground/50">Score promedio</div>
        </div>
        <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
          <Award className="w-5 h-5 text-green-500 mb-2" />
          <div className="text-lg font-bold text-green-500 font-heading">{topDriver.name}</div>
          <div className="text-xs text-sidebar-foreground/50">Mejor conductor ({topDriver.score})</div>
        </div>
        <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
          <TrendingDown className="w-5 h-5 text-red-400 mb-2" />
          <div className="text-2xl font-bold text-red-400 font-heading">{drivers.filter(d => d.score < 70).length}</div>
          <div className="text-xs text-sidebar-foreground/50">Requieren coaching</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Ranking */}
        <div className="rounded-xl border bg-sidebar border-sidebar-border p-4">
          <h3 className="font-heading font-bold text-sidebar-foreground text-sm mb-4">Ranking de Conductores</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rankingData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }} width={60} />
                <Tooltip contentStyle={{ background: "#1a2744", border: "1px solid rgba(212,160,23,0.2)", borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="score" fill="#d4a017" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar */}
        <div className="rounded-xl border bg-sidebar border-sidebar-border p-4">
          <h3 className="font-heading font-bold text-sidebar-foreground text-sm mb-4">{selectedDriver.name} — Perfil de Conducción</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.5)" }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 8, fill: "rgba(255,255,255,0.3)" }} />
                <Radar name="Score" dataKey="value" stroke="#d4a017" fill="#d4a017" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Driver table */}
      <div className="rounded-xl border bg-sidebar border-sidebar-border p-4">
        <h3 className="font-heading font-bold text-sidebar-foreground text-sm mb-3">Detalle por Conductor</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-sidebar-foreground/40 border-b border-sidebar-border">
                <th className="text-left py-2 px-3">Conductor</th>
                <th className="text-left py-2 px-3">Vehículo</th>
                <th className="text-left py-2 px-3">Score</th>
                <th className="text-left py-2 px-3">Tendencia</th>
                <th className="text-left py-2 px-3">Badges</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.id} className="border-b border-sidebar-border/50">
                  <td className="py-2 px-3 text-sidebar-foreground font-bold">{d.name}</td>
                  <td className="py-2 px-3 text-sidebar-foreground/60">{d.plate}</td>
                  <td className="py-2 px-3">
                    <span className={`font-bold ${d.score >= 80 ? "text-green-500" : d.score >= 60 ? "text-yellow-500" : "text-red-500"}`}>{d.score}</span>
                  </td>
                  <td className="py-2 px-3">
                    {d.trend === "up" && <TrendingUp className="w-4 h-4 text-green-500" />}
                    {d.trend === "down" && <TrendingDown className="w-4 h-4 text-red-500" />}
                    {d.trend === "stable" && <span className="text-sidebar-foreground/40">→</span>}
                  </td>
                  <td className="py-2 px-3">
                    {d.score >= 90 && <span className="mr-1">🏆</span>}
                    {d.score >= 80 && <span className="mr-1">🛡️</span>}
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

export default DashboardDrivers;
