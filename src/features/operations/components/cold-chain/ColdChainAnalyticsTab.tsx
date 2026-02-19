import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Gauge, Award, ShieldAlert, TrendingUp, Signal, Battery,
} from "lucide-react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { TabsContent } from "@/components/ui/tabs";
import type { ColdChainUnit } from "@/lib/coldChainData";
import type { TabView } from "@/features/operations/hooks/useColdChain";
import { statusConfig, itemVariants } from "./coldChainConfig";

// ── Props ─────────────────────────────────────────────────────────────

interface ColdChainAnalyticsTabProps {
  statusDistribution: Array<{ name: string; value: number; fill: string }>;
  complianceByStandard: Array<{ standard: string; score: number; count: number }>;
  deviationsPerUnit: Array<{ plate: string; deviations: number; compliance: number }>;
  filteredUnits: ColdChainUnit[];
  setSelectedUnit: (unit: ColdChainUnit) => void;
  setActiveTab: (tab: TabView) => void;
}

// ── Component ─────────────────────────────────────────────────────────

const ColdChainAnalyticsTab = React.memo<ColdChainAnalyticsTabProps>(({
  statusDistribution,
  complianceByStandard,
  deviationsPerUnit,
  filteredUnits,
  setSelectedUnit,
  setActiveTab,
}) => {
  const { t } = useTranslation();

  return (
    <TabsContent value="analytics" className="mt-5 space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Status Distribution Pie */}
        <motion.div variants={itemVariants} className="rounded-3xl border bg-sidebar/40 border-white/5 p-5 shadow-2xl">
          <h4 className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Gauge className="w-3.5 h-3.5" /> {t("coldChain.fleetStatusDistribution")}
          </h4>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} animationDuration={1200}>
                  {statusDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "rgba(10,15,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 10 }}
                  itemStyle={{ color: "white" }}
                />
                <Legend
                  formatter={(value) => <span className="text-[10px] text-sidebar-foreground/50">{value}</span>}
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Compliance by Standard */}
        <motion.div variants={itemVariants} className="rounded-3xl border bg-sidebar/40 border-white/5 p-5 shadow-2xl">
          <h4 className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Award className="w-3.5 h-3.5" /> {t("coldChain.complianceByStandard")}
          </h4>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complianceByStandard} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="standard" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)", fontWeight: "bold" }} axisLine={false} tickLine={false} width={60} />
                <Tooltip
                  contentStyle={{ background: "rgba(10,15,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 10 }}
                  itemStyle={{ color: "white" }}
                  formatter={(value: number) => [`${value}%`, "Score"]}
                />
                <Bar dataKey="score" fill="#a855f7" radius={[0, 6, 6, 0]} animationDuration={1200} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Deviations per Unit */}
        <motion.div variants={itemVariants} className="rounded-3xl border bg-sidebar/40 border-white/5 p-5 shadow-2xl">
          <h4 className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest mb-4 flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5" /> {t("coldChain.deviationsPerVehicle")}
          </h4>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deviationsPerUnit}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="plate" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "rgba(10,15,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 10 }}
                  itemStyle={{ color: "white" }}
                />
                <Bar dataKey="deviations" name={t("coldChain.deviations")} fill="#ef4444" radius={[6, 6, 0, 0]} animationDuration={1200} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Compliance Score per Unit */}
        <motion.div variants={itemVariants} className="rounded-3xl border bg-sidebar/40 border-white/5 p-5 shadow-2xl">
          <h4 className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest mb-4 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5" /> {t("coldChain.compliancePerVehicle")}
          </h4>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deviationsPerUnit}>
                <defs>
                  <linearGradient id="ccCompGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="plate" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "rgba(10,15,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 10 }}
                  itemStyle={{ color: "white" }}
                  formatter={(value: number) => [`${value}%`, "Compliance"]}
                />
                <ReferenceLine y={90} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={1}
                  label={{ value: t("coldChain.targetGoal", { value: 90 }), fill: "#22c55e", fontSize: 8, fontWeight: "bold", position: "insideTopLeft" }}
                />
                <Bar dataKey="compliance" name="Compliance" fill="url(#ccCompGrad)" radius={[6, 6, 0, 0]} animationDuration={1200} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Sensor health overview */}
      <motion.div variants={itemVariants} className="rounded-3xl border bg-sidebar/40 border-white/5 p-5 shadow-2xl">
        <h4 className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Signal className="w-3.5 h-3.5" /> {t("coldChain.sensorHealth")}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {filteredUnits.map(unit => {
            const unitCfg = statusConfig[unit.status];
            return (
              <button
                key={unit.id}
                onClick={() => { setSelectedUnit(unit); setActiveTab("overview"); }}
                className="flex flex-col items-center p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl ${unitCfg.bg} flex items-center justify-center mb-2 border ${unitCfg.border} group-hover:scale-110 transition-transform`}>
                  <span className="text-[10px] font-bold text-sidebar-foreground">{unit.vehiclePlate.substring(0, 3)}</span>
                </div>
                <span className="text-[8px] font-bold text-sidebar-foreground/50">{unit.vehiclePlate}</span>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex items-center gap-0.5">
                    <Battery className={`w-2.5 h-2.5 ${unit.sensorBattery > 50 ? "text-green-500" : unit.sensorBattery > 25 ? "text-yellow-500" : "text-red-500"}`} />
                    <span className="text-[7px] text-sidebar-foreground/30">{unit.sensorBattery}%</span>
                  </div>
                </div>
                <span className={`text-[7px] font-bold mt-1 ${unitCfg.color}`}>{unit.sensorType}</span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </TabsContent>
  );
});

ColdChainAnalyticsTab.displayName = "ColdChainAnalyticsTab";

export default ColdChainAnalyticsTab;
