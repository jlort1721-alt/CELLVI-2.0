
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Fuel, Wrench, AlertTriangle, TrendingDown, TrendingUp, CheckCircle, Clock, Zap, BarChart3, CloudRain, ShieldCheck, Cpu } from "lucide-react";
import { vehicles } from "@/lib/demoData";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area, BarChart, Bar, Cell, PieChart, Pie } from "recharts";
import { Button } from "@/components/ui/button";

const maintenanceData = [
    { name: "Motor", status: 85, health: "good", lastCheck: "3 días" },
    { name: "Frenos", status: 42, health: "warning", lastCheck: "12 días" },
    { name: "Llantas", status: 15, health: "urgent", lastCheck: "Hoy" },
    { name: "Suspensión", status: 70, health: "good", lastCheck: "1 mes" },
    { name: "Batería", status: 92, health: "good", lastCheck: "2 meses" },
];

const fuelEfficiencyHistory = Array.from({ length: 14 }, (_, i) => ({
    day: `Feb ${i + 1}`,
    real: 7.2 + Math.random() * 2,
    expected: 9.5,
    cost: Math.round(120 + Math.random() * 50)
}));

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
};

const DashboardPredictive = () => {
    const [selectedVehicle, setSelectedVehicle] = useState(vehicles[0]);

    return (
        <motion.div
            className="space-y-6"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* ── Header ──────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="font-heading font-bold text-sidebar-foreground text-2xl flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-gold/10">
                            <Brain className="w-7 h-7 text-gold animate-pulse" />
                        </div>
                        Inteligencia Predictiva
                    </h2>
                    <p className="text-sm text-sidebar-foreground/50 mt-1">Algoritmos de IA analizando 1.2M de puntos de datos para tu flota.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="text-[10px] h-9 bg-gold/5 border-gold/20 text-gold hover:bg-gold/20 rounded-xl px-4">
                        <Zap className="w-3.5 h-3.5 mr-2" /> Re-entrenar Modelos
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Left Column: Health Score Card ──────────── */}
                <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
                    <div className="rounded-3xl border bg-sidebar/40 backdrop-blur-xl border-white/5 p-6 relative overflow-hidden group shadow-2xl">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-gold/5 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-gold/10 transition-all duration-700" />

                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-gold/60" />
                                <h3 className="text-xs font-bold text-sidebar-foreground/40 uppercase tracking-widest">Estado Vital: {selectedVehicle.plate}</h3>
                            </div>
                            <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full font-bold">LIVE</span>
                        </div>

                        <div className="flex flex-col items-center justify-center py-6">
                            <div className="relative w-44 h-44 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="88" cy="88" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-sidebar-border/30" />
                                    <motion.circle
                                        cx="88" cy="88" r="80"
                                        stroke="currentColor"
                                        strokeWidth="12"
                                        fill="transparent"
                                        strokeDasharray={502.6}
                                        initial={{ strokeDashoffset: 502.6 }}
                                        animate={{ strokeDashoffset: 502.6 - (502.6 * 78) / 100 }}
                                        transition={{ duration: 2, ease: "easeOut" }}
                                        className="text-gold"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-bold font-heading text-sidebar-foreground tracking-tighter">78<span className="text-xl text-gold/60">%</span></span>
                                    <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold mt-1">
                                        <TrendingUp className="w-3 h-3" /> OPTIMAL
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 mt-8">
                            {maintenanceData.map((item, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between items-center text-[10px]">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${item.health === 'urgent' ? 'bg-red-500 animate-pulse' : 'bg-sidebar-foreground/20'}`} />
                                            <span className="text-sidebar-foreground/70 font-medium">{item.name}</span>
                                        </div>
                                        <span className={`font-bold transition-all ${item.health === 'urgent' ? 'text-red-500 scale-110' : item.health === 'warning' ? 'text-orange-500' : 'text-green-500'}`}>
                                            {item.status}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-sidebar-foreground/5 rounded-full overflow-hidden">
                                        <motion.div
                                            className={`h-full ${item.health === 'urgent' ? 'bg-red-500' : item.health === 'warning' ? 'bg-orange-500' : 'bg-green-500'}`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${item.status}%` }}
                                            transition={{ duration: 1.5, delay: i * 0.1 }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button className="w-full mt-8 bg-gold hover:bg-gold/80 text-black font-bold text-xs h-11 rounded-xl shadow-lg shadow-gold/20 transition-all hover:-translate-y-1">
                            <Wrench className="w-3.5 h-3.5 mr-2" /> Agendar Mantenimiento
                        </Button>
                    </div>

                    <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        className="rounded-2xl border bg-red-500/5 border-red-500/10 p-5 flex items-start gap-4"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-6 h-6 text-red-500 animate-bounce" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-red-500">Alerta de Desgaste Crítico</div>
                            <p className="text-[11px] text-sidebar-foreground/60 mt-1 leading-relaxed">
                                El sensor de vibración en el eje trasero reporta patrones irregulares.
                                <span className="text-red-500 font-bold"> Probabilidad de fallo: 89% </span> antes de 450 km.
                            </p>
                            <Button variant="link" size="sm" className="p-0 h-auto text-[10px] text-red-500/80 font-bold mt-2 uppercase tracking-wide">
                                Ver Diagnóstico Completo →
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>

                {/* ── Main Content Column ────────────────────── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Fuel Efficiency Section */}
                    <motion.div variants={itemVariants} className="rounded-3xl border bg-sidebar/40 backdrop-blur-xl border-white/5 p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="font-heading font-bold text-sidebar-foreground text-sm flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                                        <Fuel className="w-5 h-5" />
                                    </div>
                                    Eficiencia de Combustible (KM/GL)
                                </h3>
                            </div>
                            <div className="flex items-center gap-4 bg-sidebar-foreground/5 p-1.5 rounded-full px-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <span className="text-[10px] text-sidebar-foreground/60 font-medium">Real</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-sidebar-foreground/20" />
                                    <span className="text-[10px] text-sidebar-foreground/60 font-medium">IA Target</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={fuelEfficiencyHistory}>
                                    <defs>
                                        <linearGradient id="fuelG" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} tickMargin={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} />
                                    <Tooltip
                                        contentStyle={{ background: "rgba(10,15,30,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, backdropFilter: 'blur(10px)', fontSize: 11 }}
                                        itemStyle={{ color: "#22c55e" }}
                                    />
                                    <Area type="monotone" dataKey="real" stroke="#22c55e" fill="url(#fuelG)" strokeWidth={3} animationDuration={2000} />
                                    <Line type="monotone" dataKey="expected" stroke="rgba(255,255,255,0.2)" strokeDasharray="5 5" dot={false} strokeWidth={1} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                            {[
                                { label: "Ahorro IA Mes", value: "$842", sub: "-12%", icon: TrendingDown, color: "text-green-500" },
                                { label: "Impacto CO2", value: "-2.4t", sub: "Carbon Zero", icon: CloudRain, color: "text-blue-400" },
                                { label: "Driving Score", value: "94/100", sub: "+3%", icon: ShieldCheck, color: "text-gold" },
                            ].map((stat, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ y: -5 }}
                                    className="p-4 rounded-2xl bg-sidebar-foreground/[0.03] border border-white/5 hover:border-white/10 transition-colors"
                                >
                                    <div className="text-[10px] text-sidebar-foreground/40 mb-2 uppercase tracking-wider font-bold">{stat.label}</div>
                                    <div className="flex items-end justify-between">
                                        <span className="text-2xl font-bold text-sidebar-foreground font-heading tracking-tighter">{stat.value}</span>
                                        <div className={`flex items-center ${stat.color} text-[10px] font-bold`}>
                                            <stat.icon className="w-3 h-3 mr-1" /> {stat.sub}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Performance Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div variants={itemVariants} className="rounded-3xl border bg-sidebar/40 backdrop-blur-xl border-white/5 p-6 shadow-xl">
                            <h4 className="text-xs font-bold text-sidebar-foreground/40 uppercase tracking-widest mb-6 flex items-center gap-3">
                                <BarChart3 className="w-4 h-4 text-gold/60" /> Ineficiencia por Ruta
                            </h4>
                            <div className="h-44">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[
                                        { name: 'Cali', val: 45 },
                                        { name: 'Pasto', val: 78 },
                                        { name: 'Ipial', val: 56 },
                                        { name: 'Buen', val: 32 },
                                    ]}>
                                        <Bar dataKey="val" radius={[6, 6, 0, 0]}>
                                            {[0, 1, 2, 3].map((_, i) => (
                                                <Cell key={i} fill={i === 1 ? '#ef4444' : '#3b82f6'} fillOpacity={0.4} stroke={i === 1 ? '#ef4444' : '#3b82f6'} strokeWidth={1} />
                                            ))}
                                        </Bar>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} />
                                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: '#0a0f1e', border: 'none', borderRadius: 8 }} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex items-start gap-2 mt-4 p-2 rounded-lg bg-red-500/5 text-red-500 text-[10px] italic">
                                <span>*</span>
                                La ruta Pasto muestra desviación severa (+30% vs histórico). Recomendada revisión de carga.
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="rounded-3xl border bg-sidebar/40 backdrop-blur-xl border-white/5 p-6 shadow-xl relative overflow-hidden">
                            <h4 className="text-xs font-bold text-sidebar-foreground/40 uppercase tracking-widest mb-6 flex items-center gap-3">
                                <TrendingUp className="w-4 h-4 text-gold/60" /> Proyección CAPEX (6m)
                            </h4>
                            <div className="space-y-4">
                                {[
                                    { label: "Marzo 2026", val: "$1,250", type: "minor" },
                                    { label: "Mayo 2026 (Major Service)", val: "$4,800", type: "major" },
                                    { label: "Julio 2026", val: "$900", type: "minor" },
                                ].map((row, i) => (
                                    <div key={i} className={`flex justify-between items-center p-3 rounded-xl border transition-all ${row.type === 'major' ? 'bg-gold/10 border-gold/20' : 'bg-white/[0.02] border-white/5'}`}>
                                        <span className={`text-[11px] font-bold ${row.type === 'major' ? 'text-gold' : 'text-sidebar-foreground/60'}`}>{row.label}</span>
                                        <span className={`text-xs font-bold ${row.type === 'major' ? 'text-gold' : 'text-sidebar-foreground'}`}>{row.val}</span>
                                    </div>
                                ))}

                                <div className="pt-4 border-t border-white/5 mt-4 flex items-center justify-between">
                                    <div>
                                        <div className="text-[10px] text-sidebar-foreground/30 uppercase font-bold tracking-tighter">Budget Proyectado S1</div>
                                        <div className="text-2xl font-bold font-heading text-sidebar-foreground">$7,450.00</div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-sidebar-foreground/5 flex items-center justify-center">
                                        <ShieldCheck className="w-5 h-5 text-sidebar-foreground/20" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default DashboardPredictive;

