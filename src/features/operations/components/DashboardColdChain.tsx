import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { coldChainUnits, generateTempHistory } from "@/lib/coldChainData";
import { Thermometer, Droplets, AlertTriangle, CheckCircle, XCircle, TrendingUp, Download, FileCheck, ShieldCheck, Activity, MapPin, Gauge } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from "recharts";
import { Button } from "@/components/ui/button";

const statusConfig = {
  normal: { color: "text-green-500", bg: "bg-green-500/10", icon: CheckCircle, label: "Normal" },
  warning: { color: "text-yellow-500", bg: "bg-yellow-500/10", icon: AlertTriangle, label: "Advertencia" },
  critical: { color: "text-red-500", bg: "bg-red-500/10", icon: XCircle, label: "Crítico" },
};

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

const DashboardColdChain = () => {
  const { t } = useTranslation();
  const [selectedUnit, setSelectedUnit] = useState(coldChainUnits[0]);
  const tempHistory = generateTempHistory(selectedUnit);

  const chartData = tempHistory.map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
    temp: r.temp,
    humidity: r.humidity,
    doorOpen: r.doorOpen ? selectedUnit.targetTempMax + 2 : null,
  }));

  const normalCount = coldChainUnits.filter((u) => u.status === "normal").length;
  const warningCount = coldChainUnits.filter((u) => u.status === "warning").length;

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
          <h2 className="font-heading font-bold text-sidebar-foreground text-2xl flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10">
              <Thermometer className="w-7 h-7 text-blue-400" />
            </div>
            Cadena de Frío: Pharma & Food
          </h2>
          <p className="text-sm text-sidebar-foreground/50 mt-1">Monitoreo térmico de alta precisión con certificación de grado farmacéutico.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" className="text-[10px] h-10 bg-gold/5 border-gold/20 text-gold hover:bg-gold/20 rounded-xl px-4">
            <Download className="w-3.5 h-3.5 mr-2" /> Reporte de Cumplimiento RNDC
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Activity, label: "Unidades Activas", value: coldChainUnits.length, color: "text-blue-400" },
          { icon: CheckCircle, label: "Dentro de Rango", value: normalCount, color: "text-green-500" },
          { icon: AlertTriangle, label: "En Advertencia", value: warningCount, color: "text-orange-500" },
          { icon: ShieldCheck, label: "SLA Fulfillment", value: "99.2%", color: "text-gold" },
        ].map((kpi, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            whileHover={{ y: -5 }}
            className="rounded-2xl p-5 border bg-sidebar/40 backdrop-blur-xl border-white/5 group transition-all duration-300 shadow-xl"
          >
            <div className="flex justify-between items-start mb-3">
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              <div className="w-2 h-2 rounded-full bg-sidebar-foreground/10" />
            </div>
            <div className={`text-3xl font-bold font-heading ${kpi.color} tracking-tighter`}>{kpi.value}</div>
            <div className="text-[10px] text-sidebar-foreground/30 uppercase tracking-widest font-bold mt-1">{kpi.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Unit list */}
        <motion.div variants={itemVariants} className="rounded-3xl border bg-sidebar/40 border-white/5 p-5 shadow-2xl">
          <h3 className="font-heading font-bold text-sidebar-foreground/40 text-[10px] uppercase tracking-widest mb-5 flex items-center justify-between">
            Unidades en Tránsito
            <span className="text-[9px] bg-sidebar-foreground/5 px-2 py-0.5 rounded-full text-sidebar-foreground/30 font-bold">TOTAL: {coldChainUnits.length}</span>
          </h3>
          <div className="space-y-3 overflow-y-auto max-h-[550px] pr-2 custom-scrollbar">
            <AnimatePresence>
              {coldChainUnits.map((unit) => {
                const cfg = statusConfig[unit.status];
                const Icon = cfg.icon;
                return (
                  <motion.button
                    key={unit.id}
                    layout
                    onClick={() => setSelectedUnit(unit)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-500 ${selectedUnit.id === unit.id ? "border-gold/50 bg-gold/5 shadow-lg shadow-gold/5" : "border-white/5 bg-white/[0.01] hover:border-white/20"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-heading font-bold text-sidebar-foreground text-sm tracking-tight">{unit.vehiclePlate}</span>
                      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${cfg.bg} ${cfg.color} border border-current/10`}>
                        <Icon className="w-2.5 h-2.5" /> {cfg.label}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-sidebar-foreground/40 mb-4">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{unit.origin} → {unit.destination}</span>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className={`text-lg font-bold font-heading tracking-tighter ${cfg.color}`}>{unit.currentTemp}°C</span>
                          <span className="text-[8px] text-sidebar-foreground/30 uppercase font-bold tracking-widest">TEMP</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-lg font-bold font-heading tracking-tighter text-cyan-400">{unit.humidity}%</span>
                          <span className="text-[8px] text-sidebar-foreground/30 uppercase font-bold tracking-widest">HUM</span>
                        </div>
                      </div>
                      <div className="w-16 h-8 bg-sidebar-foreground/5 rounded-xl overflow-hidden relative border border-white/5">
                        <div className={`absolute bottom-0 left-0 right-0 ${cfg.bg} ${cfg.color} opacity-20`} style={{ height: '70%', width: '100%' }} />
                        <Gauge className={`absolute inset-0 m-auto w-4 h-4 ${cfg.color} opacity-40`} />
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Chart + details */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div variants={itemVariants} className="rounded-3xl border bg-sidebar/40 backdrop-blur-xl border-white/5 p-6 relative overflow-hidden shadow-2xl">
            {/* Visual background element */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full -mr-40 -mt-40 blur-3xl opacity-50" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-sidebar-foreground/5 flex items-center justify-center font-bold text-xl text-gold border border-gold/10 shadow-lg shadow-gold/5">
                  {selectedUnit.vehiclePlate.substring(0, 3)}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sidebar-foreground text-xl tracking-tight">{selectedUnit.vehiclePlate} — {selectedUnit.cargoType}</h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-500 bg-green-500/5 px-2 py-0.5 rounded-lg border border-green-500/10">
                      <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" /> SENSOR ACTIVADO
                    </span>
                    <span className="text-[10px] text-sidebar-foreground/40 font-medium">ID: {selectedUnit.sensorId}</span>
                    <span className="text-[10px] text-sidebar-foreground/40 font-medium whitespace-nowrap">Trip: {selectedUnit.tripId}</span>
                  </div>
                </div>
              </div>
              <div className={`hidden md:flex flex-col items-end`}>
                <div className="text-[10px] text-sidebar-foreground/30 font-bold uppercase tracking-widest mb-1">Rango Objetivo</div>
                <div className="text-sm font-bold text-sidebar-foreground px-3 py-1 bg-white/5 rounded-xl border border-white/5">
                  {selectedUnit.targetTempMin}°C — {selectedUnit.targetTempMax}°C
                </div>
              </div>
            </div>

            <div className="h-[380px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} interval={7} axisLine={false} tickLine={false} tickMargin={15} />
                  <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} domain={[selectedUnit.targetTempMin - 4, selectedUnit.targetTempMax + 4]} axisLine={false} tickLine={false} tickMargin={10} />
                  <Tooltip
                    contentStyle={{ background: "rgba(10,15,30,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, backdropFilter: 'blur(10px)', fontSize: 11 }}
                    itemStyle={{ color: 'white' }}
                  />
                  <ReferenceLine y={selectedUnit.targetTempMax} stroke="#ef4444" strokeDasharray="6 6" strokeWidth={1} label={{ value: `UPLIMIT +${selectedUnit.targetTempMax}°C`, fill: "#ef4444", fontSize: 9, fontWeight: 'bold', position: 'insideTopLeft' }} />
                  <ReferenceLine y={selectedUnit.targetTempMin} stroke="#3b82f6" strokeDasharray="6 6" strokeWidth={1} label={{ value: `LOWLIMIT ${selectedUnit.targetTempMin}°C`, fill: "#3b82f6", fontSize: 9, fontWeight: 'bold', position: 'insideBottomLeft' }} />
                  <Area type="monotone" dataKey="temp" stroke="#3b82f6" strokeWidth={3} fill="url(#tempGrad)" animationDuration={2000} />
                  <Line type="step" dataKey="humidity" stroke="rgba(255,255,255,0.2)" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Detailed Compliance Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="rounded-3xl border bg-sidebar/40 border-white/5 p-6 flex items-center justify-between shadow-xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center border border-gold/10">
                  <FileCheck className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <div className="text-[10px] text-sidebar-foreground/30 font-bold uppercase tracking-widest">Sello de Calidad</div>
                  <div className="text-sm font-bold text-sidebar-foreground tracking-tight">CERTIFICADO PHARMA-GRADE</div>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="text-[10px] text-gold hover:text-gold hover:bg-gold/10 font-bold uppercase p-0 px-3 h-8">
                Ver Sello <TrendingUp className="w-3.5 h-3.5 ml-2" />
              </Button>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="rounded-3xl border bg-sidebar/40 border-white/5 p-6 flex items-center justify-between shadow-xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/10 shadow-lg shadow-red-500/5">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] text-sidebar-foreground/30 font-bold uppercase tracking-widest">Auditoría de Ruta</div>
                  <div className="text-sm font-bold text-sidebar-foreground">
                    {tempHistory.filter((r) => r.temp > selectedUnit.targetTempMax || r.temp < selectedUnit.targetTempMin).length} Desviaciones
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-red-400 font-bold bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-xl uppercase tracking-tighter shadow-sm">Riesgo: CRÍTICO</div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardColdChain;
