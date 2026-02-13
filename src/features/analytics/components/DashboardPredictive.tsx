import { useState, useEffect, useMemo } from "react";
import {
    Brain, TrendingUp, AlertTriangle, Gauge, Target, Activity,
    BarChart3, Clock, Shield, Zap, ArrowUpRight, ArrowDownRight,
    RefreshCw, Eye
} from "lucide-react";
import {
    AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, LineChart, Line,
    ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from "recharts";

/* ── Simulated Predictive Data ── */
const generatePredictiveData = () => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return months.map((m, i) => ({
        name: m,
        actual: Math.round(85 + Math.random() * 10 + (i * 0.3)),
        predicted: Math.round(84 + (i * 0.8) + Math.random() * 5),
        anomalies: Math.round(Math.random() * 5),
        risk: Math.round(20 + Math.random() * 30),
    }));
};

const riskFactors = [
    { factor: "Velocidad", score: 78, trend: "down" as const },
    { factor: "Frenos", score: 92, trend: "up" as const },
    { factor: "Combustible", score: 65, trend: "down" as const },
    { factor: "Ruta", score: 88, trend: "up" as const },
    { factor: "Fatiga", score: 71, trend: "down" as const },
    { factor: "Mantenimiento", score: 95, trend: "up" as const },
];

const anomalyEvents = [
    { id: 1, type: "SPEED", vehicle: "NAR-123", description: "Patrón de velocidad anómalo detectado — 3σ sobre media", confidence: 94, time: "Hace 12 min", severity: "alta" },
    { id: 2, type: "FUEL", vehicle: "PUT-321", description: "Consumo irregular — posible fuga o drenaje no autorizado", confidence: 87, time: "Hace 28 min", severity: "crítica" },
    { id: 3, type: "ROUTE", vehicle: "CAU-654", description: "Desviación de ruta predictiva — 4.2 km fuera de corredor", confidence: 91, time: "Hace 45 min", severity: "media" },
    { id: 4, type: "MAINTENANCE", vehicle: "NAR-456", description: "Predicción de fallo en frenos — 320 km restantes", confidence: 83, time: "Hace 1h", severity: "alta" },
    { id: 5, type: "DRIVER", vehicle: "VAL-789", description: "Patrón de conducción irregular — fatiga estimada", confidence: 76, time: "Hace 2h", severity: "media" },
];

const radarData = [
    { subject: "Eficiencia", A: 89, B: 75, fullMark: 100 },
    { subject: "Seguridad", A: 92, B: 68, fullMark: 100 },
    { subject: "Puntualidad", A: 78, B: 82, fullMark: 100 },
    { subject: "Combustible", A: 85, B: 70, fullMark: 100 },
    { subject: "Mantenimiento", A: 95, B: 60, fullMark: 100 },
    { subject: "Cumplimiento", A: 91, B: 77, fullMark: 100 },
];

const maintenancePredict = [
    { vehicle: "NAR-123", component: "Frenos", health: 78, daysLeft: 45, status: "warning" },
    { vehicle: "PUT-321", component: "Aceite Motor", health: 92, daysLeft: 90, status: "good" },
    { vehicle: "CAU-654", component: "Neumáticos", health: 45, daysLeft: 12, status: "critical" },
    { vehicle: "NAR-456", component: "Filtro Aire", health: 85, daysLeft: 60, status: "good" },
    { vehicle: "VAL-789", component: "Batería", health: 62, daysLeft: 30, status: "warning" },
    { vehicle: "NAR-987", component: "Suspensión", health: 95, daysLeft: 120, status: "good" },
];

const severityColors: Record<string, string> = {
    crítica: "text-red-400 bg-red-400/10 border-red-400/30",
    alta: "text-orange-400 bg-orange-400/10 border-orange-400/30",
    media: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
    baja: "text-blue-400 bg-blue-400/10 border-blue-400/30",
};

const healthColor = (v: number) => v >= 80 ? "text-emerald-400" : v >= 60 ? "text-yellow-400" : "text-red-400";
const healthBg = (v: number) => v >= 80 ? "bg-emerald-400" : v >= 60 ? "bg-yellow-400" : "bg-red-400";

/* ── Main Component ── */
const DashboardPredictive = () => {
    const [predictData, setPredictData] = useState(generatePredictiveData());
    const [selectedView, setSelectedView] = useState<"anomalies" | "maintenance" | "fleet">("anomalies");
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshData = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setPredictData(generatePredictiveData());
            setIsRefreshing(false);
        }, 800);
    };

    const overallHealth = useMemo(() => {
        const avg = riskFactors.reduce((a, b) => a + b.score, 0) / riskFactors.length;
        return Math.round(avg);
    }, []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="flex items-center gap-2 text-lg font-bold text-primary-foreground font-heading">
                        <Brain className="w-5 h-5 text-violet-400" />
                        Análisis Predictivo
                    </h2>
                    <p className="text-xs text-primary-foreground/40 mt-1">
                        Machine Learning • Detección de anomalías • Predicción de fallas
                    </p>
                </div>
                <button
                    onClick={refreshData}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-colors border border-violet-500/30"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                    Actualizar Modelos
                </button>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { icon: Brain, label: "Salud de Flota", value: `${overallHealth}%`, delta: "+2.3%", type: "up", color: "violet" },
                    { icon: AlertTriangle, label: "Anomalías Detectadas", value: "5", delta: "-18%", type: "down", color: "orange" },
                    { icon: Target, label: "Precisión Modelo", value: "94.2%", delta: "+1.1%", type: "up", color: "emerald" },
                    { icon: Clock, label: "Tiempo Predicción", value: "< 3s", delta: "Real-time", type: "neutral", color: "blue" },
                ].map((kpi, i) => (
                    <div key={i} className="rounded-xl p-4 bg-card/50 border border-sidebar-border/50 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-3">
                            <kpi.icon className={`w-5 h-5 text-${kpi.color}-400`} />
                            <span className={`text-[10px] font-medium flex items-center gap-0.5 ${kpi.type === "up" ? "text-emerald-400" : kpi.type === "down" ? "text-orange-400" : "text-blue-400"
                                }`}>
                                {kpi.type === "up" && <ArrowUpRight className="w-3 h-3" />}
                                {kpi.type === "down" && <ArrowDownRight className="w-3 h-3" />}
                                {kpi.delta}
                            </span>
                        </div>
                        <div className="text-2xl font-bold text-primary-foreground">{kpi.value}</div>
                        <div className="text-[10px] text-primary-foreground/40 mt-1 uppercase tracking-wider">{kpi.label}</div>
                    </div>
                ))}
            </div>

            {/* Prediction vs Actual Chart */}
            <div className="rounded-xl p-5 bg-card/50 border border-sidebar-border/50">
                <h3 className="text-sm font-semibold text-primary-foreground mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-violet-400" />
                    Predicción vs. Real — Eficiencia Operativa
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={predictData}>
                        <defs>
                            <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gradPredict" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
                                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                        <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} domain={[70, 100]} />
                        <Tooltip
                            contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 8, fontSize: 11 }}
                            labelStyle={{ color: "#a78bfa" }}
                        />
                        <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                        <Area type="monotone" dataKey="actual" name="Real" stroke="#8b5cf6" fill="url(#gradActual)" strokeWidth={2} />
                        <Area type="monotone" dataKey="predicted" name="Predicción ML" stroke="#22c55e" fill="url(#gradPredict)" strokeWidth={2} strokeDasharray="5 5" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Risk Radar */}
                <div className="rounded-xl p-5 bg-card/50 border border-sidebar-border/50">
                    <h3 className="text-sm font-semibold text-primary-foreground mb-4 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-cyan-400" />
                        Radar de Riesgo Operacional
                    </h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <RadarChart data={radarData}>
                            <PolarGrid stroke="rgba(255,255,255,0.1)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 8 }} />
                            <Radar name="Este Mes" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                            <Radar name="Mes Anterior" dataKey="B" stroke="#64748b" fill="#64748b" fillOpacity={0.1} />
                            <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                {/* Risk Factor Bar */}
                <div className="rounded-xl p-5 bg-card/50 border border-sidebar-border/50">
                    <h3 className="text-sm font-semibold text-primary-foreground mb-4 flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-amber-400" />
                        Factores de Riesgo por Categoría
                    </h3>
                    <div className="space-y-3">
                        {riskFactors.map((rf, i) => (
                            <div key={i}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-primary-foreground/60">{rf.factor}</span>
                                    <span className={`text-xs font-bold flex items-center gap-1 ${healthColor(rf.score)}`}>
                                        {rf.trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                        {rf.score}%
                                    </span>
                                </div>
                                <div className="h-2 rounded-full bg-primary-foreground/5">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${healthBg(rf.score)}`}
                                        style={{ width: `${rf.score}%`, opacity: 0.8 }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tab Selector */}
            <div className="flex gap-1 p-1 rounded-lg bg-primary-foreground/5 w-fit">
                {[
                    { key: "anomalies" as const, label: "Anomalías", icon: AlertTriangle },
                    { key: "maintenance" as const, label: "Predicción Mtto.", icon: Zap },
                    { key: "fleet" as const, label: "Análisis de Flota", icon: BarChart3 },
                ].map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setSelectedView(key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${selectedView === key
                                ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                                : "text-primary-foreground/40 hover:text-primary-foreground/60"
                            }`}
                    >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Anomaly Detection */}
            {selectedView === "anomalies" && (
                <div className="rounded-xl border border-sidebar-border/50 overflow-hidden">
                    <div className="px-4 py-3 bg-card/50 border-b border-sidebar-border/50">
                        <h3 className="text-sm font-semibold text-primary-foreground flex items-center gap-2">
                            <Eye className="w-4 h-4 text-orange-400" />
                            Detección de Anomalías en Tiempo Real
                        </h3>
                    </div>
                    <div className="divide-y divide-sidebar-border/30">
                        {anomalyEvents.map((event) => (
                            <div key={event.id} className="flex items-start gap-4 px-4 py-3 hover:bg-primary-foreground/[0.02] transition-colors">
                                <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${severityColors[event.severity]}`}>
                                    {event.severity.toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-xs font-bold text-primary-foreground">{event.vehicle}</span>
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300 font-mono">{event.type}</span>
                                    </div>
                                    <p className="text-[11px] text-primary-foreground/50 leading-relaxed">{event.description}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <div className="text-xs font-bold text-emerald-400">{event.confidence}%</div>
                                    <div className="text-[9px] text-primary-foreground/30">{event.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Predictive Maintenance */}
            {selectedView === "maintenance" && (
                <div className="rounded-xl border border-sidebar-border/50 overflow-hidden">
                    <div className="px-4 py-3 bg-card/50 border-b border-sidebar-border/50">
                        <h3 className="text-sm font-semibold text-primary-foreground flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-400" />
                            Mantenimiento Predictivo — Estado de Componentes
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                        {maintenancePredict.map((item, i) => (
                            <div key={i} className="rounded-lg p-3 bg-primary-foreground/[0.03] border border-sidebar-border/30">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-primary-foreground">{item.vehicle}</span>
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${item.status === "good" ? "bg-emerald-400/10 text-emerald-400" :
                                            item.status === "warning" ? "bg-yellow-400/10 text-yellow-400" :
                                                "bg-red-400/10 text-red-400"
                                        }`}>
                                        {item.status === "good" ? "OK" : item.status === "warning" ? "ATENCIÓN" : "CRÍTICO"}
                                    </span>
                                </div>
                                <div className="text-[11px] text-primary-foreground/50 mb-2">{item.component}</div>
                                <div className={`text-lg font-bold ${healthColor(item.health)}`}>{item.health}%</div>
                                <div className="h-1.5 rounded-full bg-primary-foreground/5 mt-1.5 mb-1">
                                    <div className={`h-full rounded-full ${healthBg(item.health)}`} style={{ width: `${item.health}%` }} />
                                </div>
                                <div className="text-[9px] text-primary-foreground/30">{item.daysLeft} días restantes estimados</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Fleet Analysis */}
            {selectedView === "fleet" && (
                <div className="rounded-xl p-5 bg-card/50 border border-sidebar-border/50">
                    <h3 className="text-sm font-semibold text-primary-foreground mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-cyan-400" />
                        Análisis Comparativo de Flota — Anomalías por Mes
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={predictData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                            <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                            <Tooltip
                                contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 8, fontSize: 11 }}
                            />
                            <Bar dataKey="anomalies" name="Anomalías" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="risk" name="Riesgo %" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.5} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Model Info Footer */}
            <div className="rounded-lg p-3 bg-violet-500/5 border border-violet-500/20">
                <div className="flex items-center gap-3 text-[10px] text-violet-300/60">
                    <Brain className="w-4 h-4 text-violet-400 flex-shrink-0" />
                    <span>
                        Modelos: Random Forest (velocidad), LSTM (combustible), Isolation Forest (anomalías) •
                        Última actualización del modelo: {new Date().toLocaleDateString("es-CO")} •
                        Dataset: 2.4M registros • Latencia: {"<"}50ms
                    </span>
                </div>
            </div>
        </div>
    );
};

export default DashboardPredictive;
